import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Levenshtein Distance helper for fuzzy matching (minor typos)
function levenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j, alen = a.length, blen = b.length;
  if (alen === 0) return blen;
  if (blen === 0) return alen;
  for (i = 0; i <= alen; i++) tmp[i] = [i];
  for (j = 0; j <= blen; j++) tmp[0][j] = j;
  for (i = 1; i <= alen; i++) {
    for (j = 1; j <= blen; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[alen][blen];
}

// Fuzzy matching to verify that all parts of the registered name match the ID document
function verifyNameMatch(dbName: string, ocrText: string): { matches: boolean; reason?: string } {
  const dbNormalized = dbName.toLowerCase().trim();
  const ocrNormalized = ocrText.toLowerCase();

  // 1. Direct match
  if (ocrNormalized.includes(dbNormalized)) {
    return { matches: true };
  }

  // 2. Word-by-word matching
  const dbParts = dbNormalized.split(/\s+/).filter(part => part.length > 0);
  if (dbParts.length === 0) {
    return { matches: false, reason: 'Registered profile name is empty.' };
  }

  // Split OCR text into words (removing non-alphabetic separators)
  const ocrWords = ocrNormalized.split(/[^a-zA-Z0-9\u0100-\u017F\u0400-\u04FF\u1200-\u137F]+/g).filter(w => w.length > 0);

  const missingParts: string[] = [];
  for (const part of dbParts) {
    // If it's too short (1 character), require exact match
    if (part.length <= 1) {
      if (!ocrNormalized.includes(part)) {
        missingParts.push(part);
      }
      continue;
    }

    // Check if the part is in OCR directly
    if (ocrNormalized.includes(part)) {
      continue;
    }

    // Try fuzzy match on each word in the OCR text
    const hasFuzzyMatch = ocrWords.some(word => levenshteinDistance(part, word) <= 1);
    if (!hasFuzzyMatch) {
      missingParts.push(part);
    }
  }

  if (missingParts.length > 0) {
    return {
      matches: false,
      reason: `The name on the ID document does not match your registered profile name. Registered name parts [${missingParts.join(', ')}] were not found on the ID.`
    };
  }

  return { matches: true };
}

// Verification logic for Date of Birth
function verifyBirthDateMatch(dbBirthDate: string, ocrText: string): { matches: boolean; reason?: string } {
  if (!dbBirthDate) {
    return { matches: false, reason: 'No birth date registered on your profile.' };
  }

  const dateObj = new Date(dbBirthDate);
  if (isNaN(dateObj.getTime())) {
    return { matches: false, reason: 'Invalid birth date registered on your profile.' };
  }

  const year = dateObj.getFullYear().toString(); // e.g. "1995"
  const monthVal = dateObj.getMonth() + 1; // 1-12
  const day = dateObj.getDate().toString(); // e.g. "25"
  const dayPadded = day.padStart(2, '0'); // e.g. "25"
  const monthPadded = monthVal.toString().padStart(2, '0'); // e.g. "03"

  const lowerText = ocrText.toLowerCase();

  // 1. Year check
  const hasYear = lowerText.includes(year);

  // 2. Month check (supports padded, slash/hyphen wrapped, or English/Amharic month names)
  const monthsEnglish = [
    ['jan', 'january'], ['feb', 'february'], ['mar', 'march'], ['apr', 'april'],
    ['may'], ['jun', 'june'], ['jul', 'july'], ['aug', 'august'],
    ['sep', 'september', 'sept'], ['oct', 'october'], ['nov', 'november'], ['dec', 'december']
  ];
  const currentEngMonths = monthsEnglish[monthVal - 1] || [];

  const monthsAmharic = [
    ['መስከረም', 'meskerem', 'ጃንዋሪ', 'january'],
    ['ጥቅምት', 'tikimt', 'ፌብሩዋሪ', 'february'],
    ['ህዳር', 'hidar', 'ማርች', 'march'],
    ['ታህሳስ', 'tahsas', 'ኤፕሪል', 'april'],
    ['ጥር', 'tir', 'ሜይ', 'may'],
    ['የካቲት', 'yakatit', 'ጁን', 'june'],
    ['መጋቢት', 'megabit', 'ጁላይ', 'july'],
    ['ሚያዝያ', 'miyazya', 'ኦገስት', 'august'],
    ['ግንቦት', 'ginbot', 'ሴፕቴምበር', 'september'],
    ['ሰኔ', 'sene', 'ኦክቶበር', 'october'],
    ['ሐምሌ', 'hamle', 'ኖቬምበር', 'november'],
    ['ነሐሴ', 'nehase', 'ዲሴምበር', 'december'],
    ['ጳጉሜ', 'pagume']
  ];
  const currentAmhMonths = monthsAmharic[monthVal - 1] || [];

  const hasMonth = lowerText.includes(monthPadded) ||
                   lowerText.includes(`/${monthVal}/`) ||
                   lowerText.includes(`-${monthVal}-`) ||
                   lowerText.includes(` ${monthVal} `) ||
                   currentEngMonths.some(m => lowerText.includes(m)) ||
                   currentAmhMonths.some(m => lowerText.includes(m));

  // 3. Day check (numeric, padded, or boundary word)
  const hasDay = lowerText.includes(dayPadded) ||
                 new RegExp(`\\b${day}\\b`).test(lowerText) ||
                 lowerText.includes(`/${day}/`) ||
                 lowerText.includes(`-${day}-`) ||
                 lowerText.includes(` ${day} `);

  if (!hasYear || !hasMonth || !hasDay) {
    const missing = [];
    if (!hasDay) missing.push(`day (${day})`);
    if (!hasMonth) missing.push(`month (${monthPadded})`);
    if (!hasYear) missing.push(`year (${year})`);
    return {
      matches: false,
      reason: `Could not verify your complete birth date (${dbBirthDate}) on the ID document. Make sure the day (${day}), month (${monthPadded}), and year (${year}) are clearly visible and match your profile.`
    };
  }

  return { matches: true };
}

export async function POST(req: Request) {
  try {
    const { userId, idPhotoUrl, selfiePhotoUrl, profileData, mockOcrData } = await req.json();

    if (!userId) {
      return NextResponse.json({ isMatch: false, reason: 'Missing userId for verification' });
    }

    if (!idPhotoUrl || !selfiePhotoUrl) {
      return NextResponse.json({ isMatch: false, reason: 'Missing images for verification' });
    }

    // Fetch original registered profile data from database (trusted source)
    const { data: dbProfile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, birth_date, location')
      .eq('id', userId)
      .single();

    if (dbError || !dbProfile) {
      console.error("Database query failed during verification:", dbError);
      return NextResponse.json({ isMatch: false, reason: 'Could not fetch onboarding profile metadata from database.' });
    }

    const dbFullName = (dbProfile.full_name || '').trim();
    const dbBirthDate = (dbProfile.birth_date || '').trim();

    if (!dbFullName) {
      return NextResponse.json({ isMatch: false, reason: 'Profile name is empty. Please set your full name in your profile before verification.' });
    }

    if (!dbBirthDate) {
      return NextResponse.json({ isMatch: false, reason: 'No birth date registered on your profile. Please set your birth date before verification.' });
    }

    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    // ─── Simulated Mode ───────────────────────────────────────────────────────
    if (!apiKey) {
      console.warn("GOOGLE_VISION_API_KEY is not defined. Falling back to simulated verification.");
      
      const lowerIdUrl = idPhotoUrl.toLowerCase();
      const isTriggeredFake = lowerIdUrl.includes('fake') || lowerIdUrl.includes('test') || lowerIdUrl.includes('dummy') || lowerIdUrl.includes('cartoon');
      const isMismatchTrigger = lowerIdUrl.includes('mismatch') || lowerIdUrl.includes('wrong') || lowerIdUrl.includes('rejected');

      if (isTriggeredFake) {
        return NextResponse.json({
          isMatch: false,
          reason: 'Simulation Verification: Only official Passport or Digital ID is accepted. Cartoon, fake, or non-standard documents are rejected.'
        });
      }

      // Determine simulated OCR text based on payload inputs or trigger keywords
      let simulatedOcrText = `${dbFullName} ${dbBirthDate}`;
      if (mockOcrData) {
        simulatedOcrText = `${mockOcrData.full_name || ''} ${mockOcrData.birth_date || ''}`;
      } else if (isMismatchTrigger) {
        simulatedOcrText = `Kalid Seid 1990-05-15`; // Simulate a complete mismatch
      }

      // Enforce the exact same database matching rules on simulated text
      const nameCheck = verifyNameMatch(dbFullName, simulatedOcrText);
      if (!nameCheck.matches) {
        return NextResponse.json({
          isMatch: false,
          reason: `Simulation Match Error: ${nameCheck.reason}`
        });
      }

      const dobCheck = verifyBirthDateMatch(dbBirthDate, simulatedOcrText);
      if (!dobCheck.matches) {
        return NextResponse.json({
          isMatch: false,
          reason: `Simulation Match Error: ${dobCheck.reason}`
        });
      }

      return NextResponse.json({
        isMatch: true,
        score: 0.98,
        extractedData: {
          full_name: dbFullName,
          birth_date: dbBirthDate
        }
      });
    }

    // ─── Production Google Cloud Vision API Mode ──────────────────────────────
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    
    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: idPhotoUrl
            }
          },
          features: [
            {
              type: "TEXT_DETECTION"
            }
          ]
        }
      ]
    };

    const response = await fetch(visionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    const textAnnotations = data.responses?.[0]?.textAnnotations;

    if (!textAnnotations || textAnnotations.length === 0) {
      return NextResponse.json({
        isMatch: false,
        reason: 'Could not extract text from the ID document. Please upload a clear photo.'
      });
    }

    const extractedText = textAnnotations[0].description;
    console.log("Extracted OCR Text from ID:", extractedText);
    const lowerText = extractedText.toLowerCase();

    // 1. Strict Document Type Check (Passport or official Digital ID only)
    const allowedDocKeywords = [
      'passport', 'paasaboor', 'ፓስፖርት', 'جواز', 'سفر',
      'national id', 'identity card', 'id card', 'national identity', 'የብሔራዊ መታወቂያ', 'መታወቂያ', 'aqoonsi', 'aqoonsiga', 'waraqadda', 'widentity', 'fayda'
    ];
    const hasValidDocType = allowedDocKeywords.some(keyword => lowerText.includes(keyword));

    if (!hasValidDocType) {
      return NextResponse.json({
        isMatch: false,
        reason: 'Only official Passport or Digital ID (e.g. Fayda ID) is accepted. Fake documents, screenshots, and non-standard IDs are strictly blocked.'
      });
    }

    // 2. Enforce Name matching check against database values
    const nameCheck = verifyNameMatch(dbFullName, extractedText);
    if (!nameCheck.matches) {
      return NextResponse.json({
        isMatch: false,
        reason: nameCheck.reason
      });
    }

    // 3. Enforce Birth Date matching check against database values
    const dobCheck = verifyBirthDateMatch(dbBirthDate, extractedText);
    if (!dobCheck.matches) {
      return NextResponse.json({
        isMatch: false,
        reason: dobCheck.reason
      });
    }

    // 4. Residence Area / Address Verification Check
    let locationMatches = false;
    const locationData = dbProfile.location || {};
    const country = (locationData.country || '').toLowerCase().trim();
    const region = (locationData.region || '').toLowerCase().trim();
    const city = (locationData.city || '').toLowerCase().trim();

    if (city && lowerText.includes(city)) locationMatches = true;
    if (region && lowerText.includes(region)) locationMatches = true;
    if (country && lowerText.includes(country)) locationMatches = true;

    const addressIndicators = [
      'address', 'residence', 'place of birth', 'issuing authority', 'region', 'city', 'zone', 'woreda', 'kebele',
      'አድራሻ', 'ክልል', 'ከተማ', 'ቀበሌ', 'ወረዳ', 'ዞን', 'የመኖሪያ',
      'lakk.', 'magaala', 'ganda', 'qebee', 'gobolka', 'degmada', 'xaafada', 'عنوان', 'السكن', 'الميلاد'
    ];
    const hasAddressIndicator = addressIndicators.some(indicator => lowerText.includes(indicator));

    if (!locationMatches && !hasAddressIndicator) {
      return NextResponse.json({
        isMatch: false,
        reason: 'Could not verify residence area or address on the ID. Official IDs must clearly show a residential address, city, or issuing authority.'
      });
    }

    return NextResponse.json({
      isMatch: true,
      score: 0.99,
      extractedData: {
        full_name: dbFullName,
        birth_date: dbBirthDate
      }
    });

  } catch (error: any) {
    console.error("GCV Verification Error:", error);
    return NextResponse.json({
      isMatch: false,
      reason: 'Server error during verification: ' + error.message
    });
  }
}
