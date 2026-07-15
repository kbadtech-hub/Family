package com.beteseb.app;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // FLAG_SECURE must be set BEFORE super.onCreate() so the window
        // is secured before the Capacitor Bridge and WebView initialize.
        // Setting it after causes OEM-specific crashes on Samsung/Xiaomi devices.
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );
        super.onCreate(savedInstanceState);
    }
}
