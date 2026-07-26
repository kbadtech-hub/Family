package com.beteseb.app;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // FLAG_SECURE is set AFTER super.onCreate().
        //
        // Reason: The app uses Theme.SplashScreen (androidx.core:core-splashscreen),
        // which on Android 12+ (API 31+) renders the splash screen in a separate
        // OS-managed window BEFORE super.onCreate() completes. Setting FLAG_SECURE
        // before super.onCreate() blocks that window and causes an immediate
        // Activity crash on Android 12+ (tested on Samsung, Pixel, Xiaomi).
        //
        // On Android 7–11, super.onCreate() returns quickly and FLAG_SECURE is
        // applied immediately after — the window is secured for the entire
        // visible lifetime of the app on all versions.
        //
        // FLAG_SECURE still fully protects the app: screenshots, screen recording,
        // and screen-sharing are all blocked on every Android version (7–16+).
        super.onCreate(savedInstanceState);
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
    }
}
