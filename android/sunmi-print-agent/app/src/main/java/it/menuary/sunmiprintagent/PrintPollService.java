package it.menuary.sunmiprintagent;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class PrintPollService extends Service {
    public static final String ACTION_START = "it.menuary.sunmiprintagent.START";
    public static final String ACTION_STOP = "it.menuary.sunmiprintagent.STOP";

    private static final String CHANNEL_ID = "menuary_print_agent";
    private static final int NOTIFICATION_ID = 9001;
    private static final long POLL_SECONDS = 10;

    private final SunmiPrinter printer = new SunmiPrinter();
    private ScheduledExecutorService executor;
    private volatile boolean polling;
    private String lastStatus = "In attesa";

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        printer.bind(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!AgentPrefs.isConfigured(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        startForeground(NOTIFICATION_ID, notification("Attivo", lastStatus));
        startPolling();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (executor != null) executor.shutdownNow();
        printer.unbind(this);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void startPolling() {
        if (executor != null && !executor.isShutdown()) return;
        executor = Executors.newSingleThreadScheduledExecutor();
        executor.scheduleWithFixedDelay(this::pollOnce, 1, POLL_SECONDS, TimeUnit.SECONDS);
    }

    private void pollOnce() {
        if (polling) return;
        polling = true;
        PowerManager.WakeLock wakeLock = acquireWakeLock();
        try {
            SharedPreferences prefs = AgentPrefs.get(this);
            String apiBase = prefs.getString("apiBase", "");
            String tenantId = prefs.getString("tenantId", "");
            String locationId = prefs.getString("locationId", "");
            String token = prefs.getString("accessToken", "");

            ApiClient client = new ApiClient(apiBase, BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY);
            LocalPrintQueue queue = new LocalPrintQueue(this);
            token = refreshSessionIfNeeded(client, prefs, token);

            List<String> pendingAck = queue.pendingAckIds();
            if (!pendingAck.isEmpty()) {
                client.ack(tenantId, pendingAck, token);
                queue.removeAcked(pendingAck);
            }

            List<ApiClient.PrintJob> jobs = client.fetchJobs(tenantId, locationId, token);
            queue.addFetched(jobs);

            if (!printer.isReady()) {
                update("Stampante non pronta", "Comande in coda: " + queue.size());
                printer.bind(this);
                return;
            }

            int printedNow = drainQueue(client, queue, tenantId, token);
            int remaining = queue.size();
            if (printedNow == 0 && remaining == 0) {
                update("Attivo", "Nessuna comanda in coda");
                return;
            }
            update("Attivo", "Stampate " + printedNow + ", in coda " + remaining);
        } catch (Exception e) {
            update("Errore", e.getMessage() == null ? "Polling fallito" : e.getMessage());
        } finally {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
            polling = false;
        }
    }

    private int drainQueue(ApiClient client, LocalPrintQueue queue, String tenantId, String token) throws Exception {
        int printedNow = 0;
        while (true) {
            LocalPrintQueue.Item item = queue.nextUnprinted();
            if (item == null) return printedNow;
            update("Stampa in corso", item.code.isEmpty() ? item.orderId : "#" + item.code);
            try {
                playChimeIfEnabled();
                printer.print(item.data, item.copies);
                queue.markPrinted(item.orderId);
                List<String> printed = Collections.singletonList(item.orderId);
                client.ack(tenantId, printed, token);
                queue.removeAcked(printed);
                printedNow++;
            } catch (Exception e) {
                update("Stampante occupata", "Comanda in coda " + (item.code.isEmpty() ? item.orderId : "#" + item.code));
                return printedNow;
            }
        }
    }

    private void playChimeIfEnabled() {
        if (!AgentPrefs.isChimeEnabled(this)) return;
        try {
            ToneGenerator tone = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 90);
            tone.startTone(ToneGenerator.TONE_PROP_ACK, 250);
            new Thread(() -> {
                try {
                    Thread.sleep(350);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                tone.release();
            }).start();
        } catch (RuntimeException ignored) {
        }
    }

    private String refreshSessionIfNeeded(ApiClient client, SharedPreferences prefs, String currentToken) throws Exception {
        long expiresAt = prefs.getLong("expiresAt", 0);
        if (expiresAt > System.currentTimeMillis() + 120_000) return currentToken;
        String refreshToken = prefs.getString("refreshToken", "");
        if (refreshToken == null || refreshToken.isEmpty()) return currentToken;
        ApiClient.Session session = client.refresh(refreshToken);
        prefs.edit()
            .putString("accessToken", session.accessToken)
            .putString("refreshToken", session.refreshToken)
            .putLong("expiresAt", System.currentTimeMillis() + (session.expiresInSeconds * 1000L))
            .apply();
        return session.accessToken;
    }

    private void update(String title, String text) {
        lastStatus = text;
        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.notify(NOTIFICATION_ID, notification(title, text));
    }

    private Notification notification(String title, String text) {
        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);
        return builder
            .setContentTitle("Menuary Print Agent")
            .setContentText(title + " - " + text)
            .setSmallIcon(android.R.drawable.stat_sys_upload_done)
            .setOngoing(true)
            .build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Menuary Print Agent",
            NotificationManager.IMPORTANCE_LOW
        );
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    private PowerManager.WakeLock acquireWakeLock() {
        PowerManager powerManager = getSystemService(PowerManager.class);
        if (powerManager == null) return null;
        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "MenuaryPrintAgent:poll"
        );
        wakeLock.acquire(TimeUnit.SECONDS.toMillis(45));
        return wakeLock;
    }
}
