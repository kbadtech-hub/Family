# FLAG_SECURE Integration for Beteseb Android App

To prevent screenshots and screen recordings in the Android app during private chats, profiles, and video calls, follow these simple integration steps:

## Step 1: Open MainActivity.java
Path: `android/app/src/main/java/com/beteseb/app/MainActivity.java` (or matching package path)

## Step 2: Add Imports
At the top of the file, add:
```java
import android.os.Bundle;
import android.view.WindowManager;
```

## Step 3: Implement onCreate and Add FLAG_SECURE
Inside the `MainActivity` class body, add or modify the `onCreate` method:

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // BETESEB SECURITY PRECAUTION: Prevent screenshots and screen recording
    // globally throughout the entire application lifecycle.
    getWindow().setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    );
}
```

This enforces strict secure window flags which:
1. Prevents taking screenshots (blocked with alert "Can't take screenshot due to security policy").
2. Blocks screen recording tools (yields black screen output).
3. Hides content preview in the Android system Task Switcher.
