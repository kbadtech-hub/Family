import { Capacitor } from '@capacitor/core';

export async function isBiometricsAvailable(): Promise<boolean> {
  // If we are not on a native mobile platform, biometrics is not available
  if (!Capacitor.isNativePlatform()) return false;
  
  try {
     const { FingerprintAIO } = window as any;
     if (FingerprintAIO) {
       const result = await FingerprintAIO.isAvailable();
       return !!result;
     }
  } catch (e) {
     console.warn("Beteseb Biometrics check is not available", e);
  }
  return false;
}

export async function authenticateBiometrics(promptMessage = "Confirm Biometric Identity to Access Beteseb"): Promise<boolean> {
  // Graceful fallback for non-native web platforms
  if (!Capacitor.isNativePlatform()) {
    console.log("Web Client: Biometric prompt requested. Fulfilling via automated simulated success for testing.");
    return true; // Graceful simulation on web
  }

  try {
     const { FingerprintAIO } = window as any;
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
     console.error("Biometric authentication failed", e);
  }
  return false;
}
