package it.menuary.sunmiprintagent;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

final class ApiClient {
    static final class Session {
        final String accessToken;
        final String refreshToken;
        final long expiresInSeconds;

        Session(String accessToken, String refreshToken, long expiresInSeconds) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.expiresInSeconds = expiresInSeconds;
        }
    }

    static final class PrintJob {
        final String orderId;
        final String code;
        final byte[] data;
        final int copies;

        PrintJob(String orderId, String code, byte[] data, int copies) {
            this.orderId = orderId;
            this.code = code;
            this.data = data;
            this.copies = copies;
        }
    }

    static final class Tenant {
        final String id;
        final String name;
        final String label;

        Tenant(String id, String name, String label) {
            this.id = id;
            this.name = name;
            this.label = label;
        }
    }

    static final class Bootstrap {
        final boolean isPlatformAdmin;
        final List<Tenant> tenants;

        Bootstrap(boolean isPlatformAdmin, List<Tenant> tenants) {
            this.isPlatformAdmin = isPlatformAdmin;
            this.tenants = tenants;
        }
    }

    static final class OrderSummary {
        final String id;
        final String code;
        final String customerName;
        final String status;
        final int total;
        final String createdAt;
        final boolean printed;
        final byte[] data;

        OrderSummary(String id, String code, String customerName, String status, int total, String createdAt, boolean printed, byte[] data) {
            this.id = id;
            this.code = code;
            this.customerName = customerName;
            this.status = status;
            this.total = total;
            this.createdAt = createdAt;
            this.printed = printed;
            this.data = data;
        }
    }

    static final class OrdersSnapshot {
        final List<OrderSummary> recent;
        final List<OrderSummary> history;
        final String warning;

        OrdersSnapshot(List<OrderSummary> recent, List<OrderSummary> history, String warning) {
            this.recent = recent;
            this.history = history;
            this.warning = warning;
        }
    }

    private final String apiBase;
    private final String supabaseUrl;
    private final String supabaseAnonKey;

    ApiClient(String apiBase, String supabaseUrl, String supabaseAnonKey) {
        this.apiBase = trimRight(apiBase);
        this.supabaseUrl = trimRight(supabaseUrl);
        this.supabaseAnonKey = supabaseAnonKey;
    }

    Session login(String email, String password) throws Exception {
        if (supabaseUrl.isEmpty() || supabaseAnonKey.isEmpty()) {
            throw new IllegalStateException("Configura SUPABASE_URL e SUPABASE_ANON_KEY nel build Android.");
        }
        JSONObject body = new JSONObject();
        body.put("email", email);
        body.put("password", password);

        HttpURLConnection conn = open(supabaseUrl + "/auth/v1/token?grant_type=password", "POST", null);
        conn.setRequestProperty("apikey", supabaseAnonKey);
        writeJson(conn, body);
        JSONObject json = readJson(conn);
        return new Session(
            json.getString("access_token"),
            json.getString("refresh_token"),
            json.optLong("expires_in", 3600)
        );
    }

    Session refresh(String refreshToken) throws Exception {
        if (supabaseUrl.isEmpty() || supabaseAnonKey.isEmpty()) {
            throw new IllegalStateException("Configura SUPABASE_URL e SUPABASE_ANON_KEY nel build Android.");
        }
        JSONObject body = new JSONObject();
        body.put("refresh_token", refreshToken);

        HttpURLConnection conn = open(supabaseUrl + "/auth/v1/token?grant_type=refresh_token", "POST", null);
        conn.setRequestProperty("apikey", supabaseAnonKey);
        writeJson(conn, body);
        JSONObject json = readJson(conn);
        return new Session(
            json.getString("access_token"),
            json.getString("refresh_token"),
            json.optLong("expires_in", 3600)
        );
    }

    Bootstrap bootstrap(String token) throws Exception {
        HttpURLConnection conn = open(apiBase + "/api/gestione/printers/agent/bootstrap", "GET", token);
        JSONObject json = readJson(conn);
        JSONObject user = json.optJSONObject("user");
        JSONArray rows = json.optJSONArray("tenants");
        List<Tenant> tenants = new ArrayList<>();
        if (rows != null) {
            for (int i = 0; i < rows.length(); i++) {
                JSONObject row = rows.getJSONObject(i);
                tenants.add(new Tenant(
                    row.getString("id"),
                    row.optString("name", row.getString("id")),
                    row.optString("label", "")
                ));
            }
        }
        return new Bootstrap(user != null && user.optBoolean("isPlatformAdmin", false), tenants);
    }

    List<PrintJob> fetchJobs(String tenantId, String locationId, String token) throws Exception {
        StringBuilder url = new StringBuilder(apiBase)
            .append("/api/gestione/printers/queue?format=escpos&tenantId=")
            .append(encode(tenantId));
        if (locationId != null && !locationId.isEmpty()) {
            url.append("&locationId=").append(encode(locationId));
        }

        HttpURLConnection conn = open(url.toString(), "GET", token);
        JSONObject json = readJson(conn);
        JSONArray jobs = json.optJSONArray("jobs");
        List<PrintJob> result = new ArrayList<>();
        if (jobs == null) return result;
        for (int i = 0; i < jobs.length(); i++) {
            JSONObject job = jobs.getJSONObject(i);
            result.add(new PrintJob(
                job.getString("orderId"),
                job.optString("code", ""),
                Base64.decode(job.getString("escposBase64"), Base64.DEFAULT),
                Math.max(1, job.optInt("copies", 1))
            ));
        }
        return result;
    }

    void ack(String tenantId, List<String> orderIds, String token) throws Exception {
        if (orderIds.isEmpty()) return;
        JSONObject body = new JSONObject();
        body.put("tenantId", tenantId);
        JSONArray ids = new JSONArray();
        for (String id : orderIds) ids.put(id);
        body.put("orderIds", ids);

        HttpURLConnection conn = open(apiBase + "/api/gestione/printers/queue", "POST", token);
        writeJson(conn, body);
        readJson(conn);
    }

    OrdersSnapshot fetchOrdersSnapshot(String tenantId, String locationId, String token) throws Exception {
        StringBuilder url = new StringBuilder(apiBase)
            .append("/api/gestione/printers/agent/orders?tenantId=")
            .append(encode(tenantId));
        if (locationId != null && !locationId.isEmpty()) {
            url.append("&locationId=").append(encode(locationId));
        }

        HttpURLConnection conn = open(url.toString(), "GET", token);
        JSONObject json = readJson(conn);
        return new OrdersSnapshot(
            parseOrderSummaries(json.optJSONArray("recent")),
            parseOrderSummaries(json.optJSONArray("history")),
            json.optString("warning", "")
        );
    }

    private List<OrderSummary> parseOrderSummaries(JSONArray rows) throws Exception {
        List<OrderSummary> result = new ArrayList<>();
        if (rows == null) return result;
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.getJSONObject(i);
            String payload = row.optString("escposBase64", "");
            result.add(new OrderSummary(
                row.getString("id"),
                row.optString("code", ""),
                row.optString("customerName", ""),
                row.optString("status", ""),
                row.optInt("total", 0),
                row.optString("createdAt", ""),
                row.optBoolean("printed", false),
                payload.isEmpty() ? new byte[0] : Base64.decode(payload, Base64.DEFAULT)
            ));
        }
        return result;
    }

    private HttpURLConnection open(String rawUrl, String method, String token) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL(rawUrl).openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(12_000);
        conn.setReadTimeout(30_000);
        conn.setRequestProperty("Accept", "application/json");
        if (token != null && !token.isEmpty()) conn.setRequestProperty("Authorization", "Bearer " + token);
        return conn;
    }

    private void writeJson(HttpURLConnection conn, JSONObject body) throws IOException {
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/json");
        byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
        conn.setFixedLengthStreamingMode(bytes.length);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(bytes);
        }
    }

    private JSONObject readJson(HttpURLConnection conn) throws Exception {
        int code = conn.getResponseCode();
        String text = readAll(code >= 400 ? conn.getErrorStream() : conn.getInputStream());
        if (code >= 400) throw new IOException("HTTP " + code + ": " + text);
        return text.isEmpty() ? new JSONObject() : new JSONObject(text);
    }

    private static String readAll(InputStream stream) throws IOException {
        if (stream == null) return "";
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            StringBuilder out = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) out.append(line);
            return out.toString();
        }
    }

    private static String trimRight(String value) {
        if (value == null) return "";
        return value.replaceAll("/+$", "");
    }

    private static String encode(String value) {
        try {
            return URLEncoder.encode(value, "UTF-8");
        } catch (Exception e) {
            return value;
        }
    }
}
