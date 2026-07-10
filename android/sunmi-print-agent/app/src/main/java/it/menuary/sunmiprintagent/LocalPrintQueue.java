package it.menuary.sunmiprintagent;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

final class LocalPrintQueue {
    private static final String KEY = "printQueue";

    static final class Item {
        final String orderId;
        final String code;
        final byte[] data;
        final int copies;
        final boolean printed;

        Item(String orderId, String code, byte[] data, int copies, boolean printed) {
            this.orderId = orderId;
            this.code = code;
            this.data = data;
            this.copies = Math.max(1, copies);
            this.printed = printed;
        }
    }

    private final SharedPreferences prefs;

    LocalPrintQueue(Context context) {
        this.prefs = AgentPrefs.get(context);
    }

    synchronized void addFetched(List<ApiClient.PrintJob> jobs) throws Exception {
        List<Item> items = load();
        boolean changed = false;
        for (ApiClient.PrintJob job : jobs) {
            if (find(items, job.orderId) >= 0) continue;
            items.add(new Item(job.orderId, job.code, job.data, job.copies, false));
            changed = true;
        }
        if (changed) save(items);
    }

    synchronized Item nextUnprinted() throws Exception {
        for (Item item : load()) {
            if (!item.printed) return item;
        }
        return null;
    }

    synchronized List<String> pendingAckIds() throws Exception {
        List<String> ids = new ArrayList<>();
        for (Item item : load()) {
            if (item.printed) ids.add(item.orderId);
        }
        return ids;
    }

    synchronized void markPrinted(String orderId) throws Exception {
        List<Item> items = load();
        int index = find(items, orderId);
        if (index < 0) return;
        Item item = items.get(index);
        items.set(index, new Item(item.orderId, item.code, item.data, item.copies, true));
        save(items);
    }

    synchronized void removeAcked(List<String> orderIds) throws Exception {
        if (orderIds.isEmpty()) return;
        List<Item> kept = new ArrayList<>();
        for (Item item : load()) {
            if (!orderIds.contains(item.orderId)) kept.add(item);
        }
        save(kept);
    }

    synchronized int size() throws Exception {
        return load().size();
    }

    synchronized void clear() {
        prefs.edit().remove(KEY).apply();
    }

    private List<Item> load() throws Exception {
        JSONArray array = new JSONArray(prefs.getString(KEY, "[]"));
        List<Item> items = new ArrayList<>();
        for (int i = 0; i < array.length(); i++) {
            JSONObject row = array.getJSONObject(i);
            items.add(new Item(
                row.getString("orderId"),
                row.optString("code", ""),
                Base64.decode(row.getString("data"), Base64.DEFAULT),
                row.optInt("copies", 1),
                row.optBoolean("printed", false)
            ));
        }
        return items;
    }

    private void save(List<Item> items) throws Exception {
        JSONArray array = new JSONArray();
        for (Item item : items) {
            JSONObject row = new JSONObject();
            row.put("orderId", item.orderId);
            row.put("code", item.code);
            row.put("data", Base64.encodeToString(item.data, Base64.NO_WRAP));
            row.put("copies", item.copies);
            row.put("printed", item.printed);
            array.put(row);
        }
        prefs.edit().putString(KEY, array.toString()).apply();
    }

    private int find(List<Item> items, String orderId) {
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i).orderId.equals(orderId)) return i;
        }
        return -1;
    }
}
