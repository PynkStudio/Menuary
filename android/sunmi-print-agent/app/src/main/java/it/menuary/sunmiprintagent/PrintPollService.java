package it.menuary.sunmiprintagent;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;

import java.util.ArrayList;
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
        try {
            SharedPreferences prefs = AgentPrefs.get(this);
            String apiBase = prefs.getString("apiBase", "");
            String tenantId = prefs.getString("tenantId", "");
            String locationId = prefs.getString("locationId", "");
            String token = prefs.getString("accessToken", "");

            ApiClient client = new ApiClient(apiBase, BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY);
            token = refreshSessionIfNeeded(client, prefs, token);
            if (!printer.isReady()) {
                update("Stampante non pronta", "Riprovo il collegamento al servizio SUNMI");
                printer.bind(this);
                return;
            }

            List<ApiClient.PrintJob> jobs = client.fetchJobs(tenantId, locationId, token);
            if (jobs.isEmpty()) {
                update("Attivo", "Nessuna comanda in coda");
                return;
            }

            List<String> printed = new ArrayList<>();
            for (ApiClient.PrintJob job : jobs) {
                update("Stampa in corso", job.code.isEmpty() ? job.orderId : "#" + job.code);
                printer.print(job.data, job.copies);
                printed.add(job.orderId);
            }
            client.ack(tenantId, printed, token);
            update("Attivo", "Stampate " + printed.size() + " comande");
        } catch (Exception e) {
            update("Errore", e.getMessage() == null ? "Polling fallito" : e.getMessage());
        } finally {
            polling = false;
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
}
