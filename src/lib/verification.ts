/**
 * BETESEB IDENTITY VERIFICATION HELPER
 * This logic simulates OCR (Optical Character Recognition) and Face Matching.
 * It enforces strict matching of Full Name, Birth Date, and Face Comparison.
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
  // Simulate network delay (AI processing time)
  await new Promise(resolve => setTimeout(resolve, 4000));

  if (!idPhotoUrl || !selfiePhotoUrl) {
    return { isMatch: false, score: 0, reason: 'Missing images' };
  }

  // SIMULATION LOGIC:
  // We randomly choose a result to demonstrate different scenarios to the user.
  // In a production environment, this would be the output of an AI model.
  
  const rand = Math.random();

  // 85% chance of perfect match
  if (rand < 0.85) {
    return {
      isMatch: true,
      score: 0.98,
      extractedData: {
        full_name: profileData.full_name,
        birth_date: profileData.birth_date
      }
    };
  } 
  
  // 5% chance of Name Mismatch
  if (rand < 0.90) {
    return {
      isMatch: false,
      score: 0.80,
      reason: 'የስም አለመገጣጠም፦ በመታወቂያው ላይ ያለው ስም ከፕሮፋይሉ ጋር አይመሳሰልም። (Name Mismatch)',
      extractedData: {
        full_name: "Unknown Name",
        birth_date: profileData.birth_date
      }
    };
  }

  // 5% chance of Birth Date Mismatch
  if (rand < 0.95) {
    return {
      isMatch: false,
      score: 0.85,
      reason: 'የልደት ቀን አለመገጣጠም፦ በመታወቂያው ላይ ያለው የልደት ቀን ከፕሮፋይሉ ጋር አይመሳሰልም። (Birth Date Mismatch)',
      extractedData: {
        full_name: profileData.full_name,
        birth_date: "1900-01-01"
      }
    };
  }

  // 5% chance of Face Match failure
  return {
    isMatch: false,
    score: 0.32,
    reason: 'የፎቶ አለመገጣጠም፦ የሰልፊ ፎቶው በመታወቂያው ላይ ካለው ፎቶ ጋር አይመሳሰልም። (Face Match Failed)',
  };
}
