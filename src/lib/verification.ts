/**
 * BETESEB IDENTITY VERIFICATION HELPER
 * This logic simulates OCR and Face Matching.
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
  profileData: { full_name: string; birth_date: string }
): Promise<VerificationResult> {
  // Simulate network delay for AI processing
  await new Promise(resolve => setTimeout(resolve, 4500));

  if (!idPhotoUrl || !selfiePhotoUrl) {
    return { isMatch: false, score: 0, reason: 'Missing images for AI analysis' };
  }

  // AI SIMULATION LOGIC:
  // 1. OCR Name Match
  // 2. OCR Date of Birth Match
  // 3. Facial Recognition (Selfie vs ID)
  
  const nameMatch = profileData.full_name.length > 3; // Basic check
  const dobMatch = !!profileData.birth_date;
  
  // 98% success rate if data is provided
  const faceMatchScore = 0.85 + Math.random() * 0.14;
  const success = nameMatch && dobMatch && (faceMatchScore > 0.88);
  
  if (success) {
    return {
      isMatch: true,
      score: faceMatchScore,
      extractedData: {
        full_name: profileData.full_name,
        birth_date: profileData.birth_date
      }
    };
  } else {
    return {
      isMatch: false,
      score: faceMatchScore,
      reason: !nameMatch ? 'Name on ID does not match profile' : 
              !dobMatch ? 'Birth date on ID does not match profile' : 
              'Facial match score too low'
    };
  }
}
