/**
 * BETESEB IDENTITY VERIFICATION HELPER
 * Coordinates OCR and face matching verification checks.
 */

export interface VerificationResult {
  isMatch: boolean;
  score: number;
  reason?: string;
  /** Localized Amharic message for direct display in UI popups */
  displayMessage?: string;
  /** 'doc_only' | 'full' — indicates which verification mode was used */
  mode?: 'doc_only' | 'full';
  extractedData?: {
    full_name?: string;
    birth_date?: string;
  };
}

/**
 * Validates an ID document BEFORE the selfie step.
 * Checks: valid government ID type, face photo present, name match, DOB match.
 * Call this immediately after the ID photo is uploaded (Step 4).
 */
export async function validateIdDocument(
  userId: string,
  idPhotoUrl: string,
  profileData: {
    full_name: string;
    birth_date: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
    };
  }
): Promise<VerificationResult> {
  if (!idPhotoUrl) {
    return {
      isMatch: false,
      score: 0,
      reason: 'No ID photo provided',
      displayMessage:
        'እባክዎን መጀመሪያ የመታወቂያዎን ፎቶ ያስገቡ።',
      mode: 'doc_only',
    };
  }

  try {
    const response = await fetch('/api/ai/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        idPhotoUrl,
        // Signal to the API that this is a document-only pre-screen
        selfiePhotoUrl: 'doc_only',
        profileData,
      }),
    });

    const data = await response.json();
    return { ...data, mode: 'doc_only' };
  } catch (error: any) {
    console.error('ID document validation API call failed:', error);
    return {
      isMatch: false,
      score: 0,
      reason: 'Failed to contact verification server: ' + error.message,
      displayMessage:
        'የሰርቨር ስህተት ተከስቷል። እባክዎ እንደገና ይሞክሩ።',
      mode: 'doc_only',
    };
  }
}

/**
 * Full verification (ID + live selfie).
 * Called after the 3-second live selfie recording completes (Step 5).
 */
export async function simulateIdentityVerification(
  userId: string,
  idPhotoUrl: string,
  selfiePhotoUrl: string,
  profileData: {
    full_name: string;
    birth_date: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
    };
  },
  mockOcrData?: {
    full_name?: string;
    birth_date?: string;
  }
): Promise<VerificationResult> {
  if (!idPhotoUrl || !selfiePhotoUrl) {
    return { isMatch: false, score: 0, reason: 'Missing images' };
  }

  try {
    const response = await fetch('/api/ai/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        idPhotoUrl,
        selfiePhotoUrl,
        profileData,
        mockOcrData,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Verification API call failed:', error);
    return {
      isMatch: false,
      score: 0,
      reason: 'Failed to contact verification server: ' + error.message,
    };
  }
}
