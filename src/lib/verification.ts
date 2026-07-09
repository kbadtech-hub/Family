/**
 * BETESEB IDENTITY VERIFICATION HELPER
 * Coordinates OCR and face matching verification checks.
 */

export interface VerificationResult {
  isMatch: boolean;
  score: number;
  reason?: string;
  extractedData?: {
    full_name?: string;
    birth_date?: string;
  };
}

export async function simulateIdentityVerification(
  idPhotoUrl: string,
  selfiePhotoUrl: string,
  profileData: { 
    full_name: string; 
    birth_date: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
    }
  }
): Promise<VerificationResult> {
  if (!idPhotoUrl || !selfiePhotoUrl) {
    return { isMatch: false, score: 0, reason: 'Missing images' };
  }

  try {
    const response = await fetch('/api/ai/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idPhotoUrl,
        selfiePhotoUrl,
        profileData
      })
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Verification API call failed:", error);
    return {
      isMatch: false,
      score: 0,
      reason: 'Failed to contact verification server: ' + error.message
    };
  }
}
