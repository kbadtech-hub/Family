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
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 3500));

  // In a real app, this would call an AI service like AWS Rekognition or Google Vision AI
  // Here we simulate a high match score for demo purposes
  
  // LOGIC SIMULATION:
  // We check if the profile has a name. If it's "User XXXXX" (default), we might flag it.
  const isDefaultName = profileData.full_name.startsWith('User ');
  
  if (!idPhotoUrl || !selfiePhotoUrl) {
    return { isMatch: false, score: 0, reason: 'Missing images' };
  }

  // 95% success rate for simulation
  const success = Math.random() > 0.05;
  
  if (success) {
    return {
      isMatch: true,
      score: 0.92 + Math.random() * 0.07,
      extractedData: {
        full_name: profileData.full_name,
        birth_date: profileData.birth_date
      }
    };
  } else {
    return {
      isMatch: false,
      score: 0.45,
      reason: 'Face match score too low'
    };
  }
}
