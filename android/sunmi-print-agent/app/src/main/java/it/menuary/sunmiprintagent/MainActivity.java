package it.menuary.sunmiprintagent;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.List;

public class MainActivity extends android.app.Activity {
    private static final int BG = 0xfff6f1e8;
    private static final int INK = 0xff17130f;
    private static final int MUTED = 0xff776d61;
    private static final int BRAND = 0xff8f2d20;
    private static final int CARD = 0xffffffff;

    private EditText email;
    private EditText password;
    private TextView status;
    private Button primaryButton;
    private final SunmiPrinter printer = new SunmiPrinter();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestNotificationPermission();
        printer.bind(this);

        if (AgentPrefs.isConfigured(this)) showDashboard();
        else showLogin();
    }

    @Override
    protected void onDestroy() {
        printer.unbind(this);
        super.onDestroy();
    }

    private void showLogin() {
        LinearLayout root = page();
        root.setGravity(Gravity.CENTER_VERTICAL);

        TextView brand = text("Menuary", 32, INK, true);
        TextView subtitle = text("Print Agent", 18, BRAND, true);
        TextView copy = text("Accedi con le credenziali del ristorante. Il tenant viene rilevato automaticamente.", 15, MUTED, false);
        copy.setPadding(0, dp(10), 0, dp(22));

        email = input("Email");
        password = input("Password");
        password.setInputType(0x00000081);
        status = text("", 14, MUTED, false);
        status.setPadding(0, dp(12), 0, 0);

        primaryButton = primary("Accedi");
        primaryButton.setOnClickListener(v -> login());

        root.addView(brand);
        root.addView(subtitle);
        root.addView(copy);
        root.addView(email);
        root.addView(space(10));
        root.addView(password);
        root.addView(space(16));
        root.addView(primaryButton);
        root.addView(status);

        setContentView(wrap(root));
    }

    private void login() {
        setBusy(true, "Accesso in corso...");
        new Thread(() -> {
            try {
                String apiBase = BuildConfig.MENUARY_API_BASE;
                ApiClient client = new ApiClient(apiBase, BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY);
                ApiClient.Session session = client.login(email.getText().toString().trim(), password.getText().toString());
                ApiClient.Bootstrap bootstrap = client.bootstrap(session.accessToken);
                if (bootstrap.tenants.isEmpty()) throw new IllegalStateException("Nessun tenant abilitato per questo utente.");

                SharedPreferences.Editor edit = AgentPrefs.get(this).edit()
                    .putString("apiBase", apiBase)
                    .putString("email", email.getText().toString().trim())
                    .putString("accessToken", session.accessToken)
                    .putString("refreshToken", session.refreshToken)
                    .putLong("expiresAt", System.currentTimeMillis() + (session.expiresInSeconds * 1000L));

                if (bootstrap.tenants.size() == 1) {
                    ApiClient.Tenant tenant = bootstrap.tenants.get(0);
                    edit.putString("tenantId", tenant.id).putString("tenantName", tenant.name).apply();
                    startAgent();
                    runOnUiThread(this::showDashboard);
                } else {
                    edit.apply();
                    runOnUiThread(() -> showTenantPicker(bootstrap.tenants));
                }
            } catch (Exception e) {
                runOnUiThread(() -> setBusy(false, e.getMessage() == null ? "Accesso fallito." : e.getMessage()));
            }
        }).start();
    }

    private void showTenantPicker(List<ApiClient.Tenant> tenants) {
        LinearLayout root = page();
        root.addView(text("Scegli locale", 28, INK, true));
        TextView copy = text("Questo account puo gestire piu tenant. Seleziona dove deve stampare questo POS.", 15, MUTED, false);
        copy.setPadding(0, dp(8), 0, dp(18));
        root.addView(copy);

        for (ApiClient.Tenant tenant : tenants) {
            Button b = secondary(tenant.name + "\n" + tenant.id);
            b.setGravity(Gravity.CENTER_VERTICAL | Gravity.LEFT);
            b.setOnClickListener(v -> {
                AgentPrefs.get(this).edit()
                    .putString("tenantId", tenant.id)
                    .putString("tenantName", tenant.name)
                    .apply();
                startAgent();
                showDashboard();
            });
            root.addView(b);
            root.addView(space(10));
        }

        setContentView(wrap(root));
    }

    private void showDashboard() {
        SharedPreferences prefs = AgentPrefs.get(this);
        LinearLayout root = page();

        LinearLayout header = card();
        header.addView(text(prefs.getString("tenantName", prefs.getString("tenantId", "Locale")), 26, INK, true));
        TextView sub = text("Stampa automatica attiva in background", 15, MUTED, false);
        sub.setPadding(0, dp(6), 0, dp(14));
        header.addView(sub);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        Button refresh = secondary("Aggiorna ordini");
        refresh.setOnClickListener(v -> loadOrders());
        Button stop = danger("Disconnetti");
        stop.setOnClickListener(v -> logout());
        row.addView(refresh, new LinearLayout.LayoutParams(0, dp(52), 1));
        row.addView(space(10));
        row.addView(stop, new LinearLayout.LayoutParams(0, dp(52), 1));
        header.addView(row);
        root.addView(header);

        status = text("Carico ordini...", 14, MUTED, false);
        status.setPadding(0, dp(16), 0, dp(10));
        root.addView(status);

        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);
        list.setTag("ordersList");
        root.addView(list);

        setContentView(wrap(root));
        startAgent();
        loadOrders();
    }

    private void loadOrders() {
        status.setText("Aggiorno ordini...");
        new Thread(() -> {
            try {
                SharedPreferences prefs = AgentPrefs.get(this);
                ApiClient client = new ApiClient(prefs.getString("apiBase", BuildConfig.MENUARY_API_BASE), BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_ANON_KEY);
                String token = refreshSessionIfNeeded(client, prefs);
                ApiClient.OrdersSnapshot snapshot = client.fetchOrdersSnapshot(
                    prefs.getString("tenantId", ""),
                    prefs.getString("locationId", ""),
                    token
                );
                runOnUiThread(() -> renderOrders(snapshot));
            } catch (Exception e) {
                runOnUiThread(() -> status.setText(e.getMessage() == null ? "Errore aggiornamento ordini." : e.getMessage()));
            }
        }).start();
    }

    private void renderOrders(ApiClient.OrdersSnapshot snapshot) {
        LinearLayout list = findTaggedList((View) status.getParent(), "ordersList");
        if (list == null) return;
        list.removeAllViews();
        if ("sunmi_pos_not_configured".equals(snapshot.warning)) {
            status.setText("Configura in Gestione la stampante come POS SUNMI locale.");
        } else {
            status.setText("Ordini recenti: " + snapshot.recent.size() + " | Storico: " + snapshot.history.size());
        }

        list.addView(section("Ordini recenti"));
        if (snapshot.recent.isEmpty()) list.addView(empty("Nessun ordine recente."));
        for (ApiClient.OrderSummary order : snapshot.recent) list.addView(orderCard(order));

        list.addView(section("Storico"));
        if (snapshot.history.isEmpty()) list.addView(empty("Lo storico apparira qui dopo i primi ordini."));
        for (ApiClient.OrderSummary order : snapshot.history) list.addView(orderCard(order));
    }

    private LinearLayout findTaggedList(View root, String tag) {
        if (root == null) return null;
        if (tag.equals(root.getTag()) && root instanceof LinearLayout) return (LinearLayout) root;
        if (!(root instanceof ViewGroup)) return null;
        ViewGroup group = (ViewGroup) root;
        for (int i = 0; i < group.getChildCount(); i++) {
            LinearLayout found = findTaggedList(group.getChildAt(i), tag);
            if (found != null) return found;
        }
        return null;
    }

    private View orderCard(ApiClient.OrderSummary order) {
        LinearLayout c = card();
        c.setPadding(dp(16), dp(14), dp(16), dp(14));
        TextView title = text("#" + order.code + "  " + cents(order.total), 19, INK, true);
        c.addView(title);
        String customer = order.customerName == null || order.customerName.isEmpty() ? "Cliente non indicato" : order.customerName;
        c.addView(text(customer + " · " + order.status + " · " + (order.printed ? "stampato" : "non stampato"), 14, MUTED, false));
        Button reprint = secondary("Ristampa comanda");
        reprint.setOnClickListener(v -> reprint(order));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(48));
        lp.setMargins(0, dp(12), 0, 0);
        c.addView(reprint, lp);
        return c;
    }

    private void reprint(ApiClient.OrderSummary order) {
        if (order.data.length == 0) {
            status.setText("Comanda non disponibile per #" + order.code);
            return;
        }
        try {
            if (!printer.isReady()) printer.bind(this);
            if (!printer.isReady()) {
                status.setText("Stampante SUNMI non ancora pronta. Riprova tra pochi secondi.");
                return;
            }
            printer.print(order.data, 1);
            status.setText("Ristampa inviata per #" + order.code);
        } catch (Exception e) {
            status.setText(e.getMessage() == null ? "Ristampa fallita." : e.getMessage());
        }
    }

    private void startAgent() {
        Intent service = new Intent(this, PrintPollService.class);
        service.setAction(PrintPollService.ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(service);
        else startService(service);
    }

    private void logout() {
        Intent service = new Intent(this, PrintPollService.class);
        service.setAction(PrintPollService.ACTION_STOP);
        startService(service);
        AgentPrefs.get(this).edit().clear().apply();
        showLogin();
    }

    private String refreshSessionIfNeeded(ApiClient client, SharedPreferences prefs) throws Exception {
        String token = prefs.getString("accessToken", "");
        long expiresAt = prefs.getLong("expiresAt", 0);
        if (expiresAt > System.currentTimeMillis() + 120_000) return token;
        String refreshToken = prefs.getString("refreshToken", "");
        if (refreshToken == null || refreshToken.isEmpty()) return token;
        ApiClient.Session session = client.refresh(refreshToken);
        prefs.edit()
            .putString("accessToken", session.accessToken)
            .putString("refreshToken", session.refreshToken)
            .putLong("expiresAt", System.currentTimeMillis() + (session.expiresInSeconds * 1000L))
            .apply();
        return session.accessToken;
    }

    private LinearLayout page() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(22), dp(28), dp(22), dp(28));
        root.setBackgroundColor(BG);
        return root;
    }

    private ScrollView wrap(LinearLayout root) {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BG);
        scroll.addView(root);
        return scroll;
    }

    private LinearLayout card() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding(dp(18), dp(18), dp(18), dp(18));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(CARD);
        bg.setCornerRadius(dp(18));
        bg.setStroke(1, 0x1f17130f);
        c.setBackground(bg);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.setMargins(0, 0, 0, dp(14));
        c.setLayoutParams(lp);
        return c;
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(size);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return t;
    }

    private TextView section(String value) {
        TextView t = text(value, 18, INK, true);
        t.setPadding(0, dp(18), 0, dp(10));
        return t;
    }

    private TextView empty(String value) {
        TextView t = text(value, 14, MUTED, false);
        t.setPadding(0, dp(10), 0, dp(12));
        return t;
    }

    private EditText input(String hint) {
        EditText edit = new EditText(this);
        edit.setHint(hint);
        edit.setSingleLine(true);
        edit.setTextSize(17);
        edit.setPadding(dp(14), 0, dp(14), 0);
        edit.setBackground(rounded(0xffffffff, 0x2417130f, 14));
        edit.setTextColor(INK);
        edit.setHintTextColor(0xff9b9288);
        edit.setMinHeight(dp(56));
        return edit;
    }

    private Button primary(String label) {
        Button b = button(label);
        b.setTextColor(0xffffffff);
        b.setBackground(rounded(BRAND, BRAND, 16));
        return b;
    }

    private Button secondary(String label) {
        Button b = button(label);
        b.setTextColor(INK);
        b.setBackground(rounded(0xffffffff, 0x3317130f, 14));
        return b;
    }

    private Button danger(String label) {
        Button b = button(label);
        b.setTextColor(0xff8f2d20);
        b.setBackground(rounded(0xfffffbf8, 0x448f2d20, 14));
        return b;
    }

    private Button button(String label) {
        Button b = new Button(this);
        b.setAllCaps(false);
        b.setText(label);
        b.setTextSize(15);
        b.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        b.setMinHeight(dp(54));
        return b;
    }

    private GradientDrawable rounded(int fill, int stroke, int radius) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(dp(radius));
        d.setStroke(1, stroke);
        return d;
    }

    private View space(int h) {
        View v = new View(this);
        v.setLayoutParams(new LinearLayout.LayoutParams(dp(h), dp(h)));
        return v;
    }

    private String cents(int value) {
        return String.format("EUR %.2f", value / 100.0);
    }

    private void setBusy(boolean busy, String text) {
        primaryButton.setEnabled(!busy);
        status.setText(text);
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT < 33) return;
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return;
        requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, 20);
    }
}
