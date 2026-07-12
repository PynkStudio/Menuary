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

    signingConfigs {
        create("localRelease") {
            storeFile = rootProject.file("menuary-local-release.keystore")
            storePassword = "menuarylocal"
            keyAlias = "menuaryprintagent"
            keyPassword = "menuarylocal"
        }
    }

    buildFeatures {
        aidl = true
        buildConfig = true
    }

    defaultConfig {
        applicationId = "it.menuary.sunmiprintagent"
        minSdk = 23
        targetSdk = 28
        versionCode = 2
        versionName = "0.1.1"

        buildConfigField("String", "MENUARY_API_BASE", "\"${prop("MENUARY_API_BASE")}\"")
        buildConfigField("String", "SUPABASE_URL", "\"${prop("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${prop("SUPABASE_ANON_KEY")}\"")
    }

    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("localRelease")
            isMinifyEnabled = false
        }
    }

    lint {
        disable += "ExpiredTargetSdkVersion"
    }
}
