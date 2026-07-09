package it.menuary.sunmiprintagent;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends android.app.Activity {
    private EditText apiBase;
    private EditText tenantId;
    private EditText locationId;
    private EditText email;
    private EditText password;
    private TextView status;
    private Button startButton;
    private Button stopButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestNotificationPermission();

        SharedPreferences prefs = AgentPrefs.get(this);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(32, 32, 32, 32);
        root.setBackgroundColor(0xfff7f7f7);

        TextView title = new TextView(this);
        title.setText("Menuary Print Agent");
        title.setTextSize(24);
        title.setTextColor(0xff111111);
        title.setPadding(0, 0, 0, 20);
        root.addView(title);

        TextView note = new TextView(this);
        note.setText("Per demo/test puoi accedere con hello@menuary.it e inserire manualmente il Tenant ID da usare.");
        note.setTextSize(14);
        note.setTextColor(0xff555555);
        note.setPadding(0, 0, 0, 18);
        root.addView(note);

        apiBase = input("Server Menuary", defaultString(prefs, "apiBase", BuildConfig.MENUARY_API_BASE));
        tenantId = input("Tenant ID manuale", prefs.getString("tenantId", ""));
        locationId = input("Location ID opzionale", prefs.getString("locationId", ""));
        email = input("Email ristorante", prefs.getString("email", ""));
        password = input("Password", "");
        password.setInputType(0x00000081);
        status = new TextView(this);
        status.setText(AgentPrefs.isConfigured(this) ? "Abbinato. Servizio pronto." : "Non abbinato.");
        status.setPadding(0, 18, 0, 18);

        startButton = button("Accedi e avvia");
        stopButton = button("Ferma servizio");

        root.addView(apiBase);
        root.addView(tenantId);
        root.addView(locationId);
        root.addView(email);
        root.addView(password);
        root.addView(startButton);
        root.addView(stopButton);
        root.addView(status);
        setContentView(root);

        startButton.setOnClickListener(v -> loginAndStart());
        stopButton.setOnClickListener(v -> stopAgent());
    }

    private EditText input(String hint, String value) {
        EditText edit = new EditText(this);
        edit.setHint(hint);
        edit.setText(value == null ? "" : value);
        edit.setSingleLine(true);
        edit.setTextSize(16);
        edit.setPadding(0, 14, 0, 14);
        return edit;
    }

    private Button button(String text) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setText(text);
        button.setPadding(0, 12, 0, 12);
        return button;
    }

    private void loginAndStart() {
        setBusy(true, "Accesso in corso...");
        new Thread(() -> {
            try {
                ApiClient client = new ApiClient(
                    apiBase.getText().toString().trim(),
                    BuildConfig.SUPABASE_URL,
                    BuildConfig.SUPABASE_ANON_KEY
                );
                ApiClient.Session session = client.login(
                    email.getText().toString().trim(),
                    password.getText().toString()
                );
                AgentPrefs.get(this).edit()
                    .putString("apiBase", apiBase.getText().toString().trim())
                    .putString("tenantId", tenantId.getText().toString().trim())
                    .putString("locationId", locationId.getText().toString().trim())
                    .putString("email", email.getText().toString().trim())
                    .putString("accessToken", session.accessToken)
                    .putString("refreshToken", session.refreshToken)
                    .putLong("expiresAt", System.currentTimeMillis() + (session.expiresInSeconds * 1000L))
                    .apply();
                startAgent();
                runOnUiThread(() -> setBusy(false, "Abbinato. Polling attivo in background."));
            } catch (Exception e) {
                runOnUiThread(() -> setBusy(false, e.getMessage() == null ? "Accesso fallito." : e.getMessage()));
            }
        }).start();
    }

    private void startAgent() {
        Intent service = new Intent(this, PrintPollService.class);
        service.setAction(PrintPollService.ACTION_START);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(service);
        else startService(service);
    }

    private void stopAgent() {
        Intent service = new Intent(this, PrintPollService.class);
        service.setAction(PrintPollService.ACTION_STOP);
        startService(service);
        AgentPrefs.get(this).edit().remove("accessToken").apply();
        status.setText("Servizio fermato.");
    }

    private void setBusy(boolean busy, String text) {
        startButton.setEnabled(!busy);
        status.setText(text);
    }

    private String defaultString(SharedPreferences prefs, String key, String fallback) {
        String value = prefs.getString(key, "");
        return value == null || value.isEmpty() ? fallback : value;
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT < 33) return;
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return;
        requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, 20);
    }
}
