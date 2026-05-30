export async function isBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const win = window as any;
  const isNative = win.Capacitor?.isNativePlatform?.();
  if (!isNative) return false;
  
  try {
    const FingerprintAIO = win.FingerprintAIO || win.Capacitor?.Plugins?.FingerprintAIO;
    if (FingerprintAIO) {
      const result = await FingerprintAIO.isAvailable();
      return !!result;
    }
  } catch (e) {
    console.warn("Biometrics are not available in this context:", e);
  }
  return false;
}

export async function authenticateBiometrics(promptMessage = "Confirm your biometric identity to access Beteseb"): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const win = window as any;
  const isNative = win.Capacitor?.isNativePlatform?.();
  if (!isNative) {
    console.log("Biometric authentication gracefully bypassed in Web platform.");
    return true; // Bypass or succeed gracefully on Web
  }

  try {
    const FingerprintAIO = win.FingerprintAIO || win.Capacitor?.Plugins?.FingerprintAIO;
    if (FingerprintAIO) {
      const result = await FingerprintAIO.show({
        clientId: "Beteseb-Family-App",
        clientSecret: "secure-key-2026",
        disableBackup: true,
        localizedFallbackTitle: "Use PIN",
        title: "Biometric Login",
        subtitle: promptMessage
      });
      return result === "Success" || result === "BIOMETRIC_AUTHENTICATED";
    }
  } catch (e) {
    console.error("Biometric authentication failed:", e);
  }
  return false;
}
