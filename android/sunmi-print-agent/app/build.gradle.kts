import java.util.Properties

plugins {
    id("com.android.application")
}

val localProps = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use(::load)
}

fun prop(name: String): String =
    (project.findProperty(name) as String?)
        ?: localProps.getProperty(name)
        ?: ""

android {
    namespace = "it.menuary.sunmiprintagent"
    compileSdk = 35

    buildFeatures {
        aidl = true
        buildConfig = true
    }

    defaultConfig {
        applicationId = "it.menuary.sunmiprintagent"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        buildConfigField("String", "MENUARY_API_BASE", "\"${prop("MENUARY_API_BASE")}\"")
        buildConfigField("String", "SUPABASE_URL", "\"${prop("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${prop("SUPABASE_ANON_KEY")}\"")
    }
}
