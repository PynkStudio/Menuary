package it.menuary.sunmiprintagent;

import android.content.Context;
import android.content.SharedPreferences;

final class AgentPrefs {
    private static final String NAME = "menuary_print_agent";

    private AgentPrefs() {}

    static SharedPreferences get(Context context) {
        return context.getSharedPreferences(NAME, Context.MODE_PRIVATE);
    }

    static boolean isConfigured(Context context) {
        SharedPreferences prefs = get(context);
        return !prefs.getString("apiBase", "").isEmpty()
            && !prefs.getString("tenantId", "").isEmpty()
            && !prefs.getString("accessToken", "").isEmpty();
    }
}
