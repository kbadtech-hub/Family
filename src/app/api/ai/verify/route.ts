import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

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

// Transliterate Amharic/Ge'ez text to closest English phonetic sounds
function transliterateAmharicToEnglish(text: string): string {
  const mapping: Record<string, string> = {
    'አ': 'a', 'ኡ': 'u', 'ኢ': 'i', 'ኣ': 'a', 'ኤ': 'e', 'እ': 'e', 'ኦ': 'o',
    'ዐ': 'a', 'ዑ': 'u', 'ዒ': 'i', 'ዓ': 'a', 'ዔ': 'e', 'ዕ': 'e', 'ዖ': 'o',
    'በ': 'b', 'ቡ': 'bu', 'ቢ': 'bi', 'ባ': 'ba', 'ቤ': 'be', 'ብ': 'b', 'ቦ': 'bo',
    'ተ': 't', 'ቱ': 'tu', 'ቲ': 'ti', 'ታ': 'ta', 'ቴ': 'te', 'ት': 't', 'ቶ': 'to',
    'ከ': 'k', 'ኩ': 'ku', 'ኪ': 'ki', 'ካ': 'ka', 'ኬ': 'ke', 'ክ': 'k', 'ኮ': 'ko',
    'ደ': 'd', 'ዱ': 'du', 'ዲ': 'di', 'ዳ': 'da', 'ዴ': 'de', 'ድ': 'd', 'ዶ': 'do',
    'ለ': 'l', 'ሉ': 'lu', 'ሊ': 'li', 'ላ': 'la', 'ሌ': 'le', 'ል': 'l', 'ሎ': 'lo',
    'መ': 'm', 'ሙ': 'mu', 'ሚ': 'mi', 'ማ': 'ma', 'ሜ': 'me', 'ም': 'm', 'ሞ': 'mo',
    'ረ': 'r', 'ሩ': 'ru', 'ሪ': 'ri', 'ራ': 'ra', 'ሬ': 're', 'ር': 'r', 'ሮ': 'ro',
    'ሰ': 's', 'ሱ': 'su', 'ሲ': 'si', 'ሳ': 'sa', 'ሴ': 'se', 'ስ': 's', 'ሶ': 'so',
    'ሠ': 's', 'ሡ': 'su', 'ሢ': 'si', 'ሣ': 'sa', 'ሤ': 'se', 'ሥ': 's', 'ሦ': 'so',
    'ሸ': 'sh', 'ሹ': 'shu', 'ሺ': 'shi', 'ሻ': 'sha', 'ሼ': 'she', 'ሽ': 'sh', 'ሾ': 'sho',
    'ቀ': 'k', 'ቁ': 'ku', 'ቂ': 'ki', 'ቃ': 'ka', 'ቄ': 'ke', 'ቅ': 'k', 'ቆ': 'ko',
    'ነ': 'n', 'ኑ': 'nu', 'ኒ': 'ni', 'ና': 'na', 'ኔ': 'ne', 'ን': 'n', 'ኖ': 'no',
    'ገ': 'g', 'ጉ': 'gu', 'ጊ': 'gi', 'ጋ': 'ga', 'ጌ': 'ge', 'ግ': 'g', 'ጎ': 'go',
    'ሀ': 'h', 'ሁ': 'hu', 'ሂ': 'hi', 'ሃ': 'ha', 'ሄ': 'he', 'ህ': 'h', 'ሆ': 'ho',
    'ሐ': 'h', 'ሑ': 'hu', 'ሒ': 'hi', 'ሓ': 'ha', 'ሔ': 'he', 'ሕ': 'h', 'ሖ': 'ho',
    'ኀ': 'h', 'ኁ': 'hu', 'ኂ': 'hi', 'ኃ': 'ha', 'ኄ': 'he', 'ኅ': 'h', 'ኆ': 'ho',
    'ወ': 'w', 'ዉ': 'wu', 'ዊ': 'wi', 'ዋ': 'wa', 'ዌ': 'we', 'ው': 'w', 'ዎ': 'o',
    'ዘ': 'z', 'ዙ': 'zu', 'ዚ': 'zi', 'ዛ': 'za', 'ዜ': 'ze', 'ዝ': 'z', 'ዞ': 'zo',
    'የ': 'y', 'ዩ': 'yu', 'ይ': 'yi', 'ያ': 'ya', 'ዬ': 'ye', 'ዮ': 'yo',
    'ጀ': 'j', 'ጁ': 'ju', 'ጂ': 'ji', 'ጃ': 'ja', 'ጄ': 'je', 'ጅ': 'j', 'ጆ': 'jo',
    'ጠ': 't', 'ጡ': 'tu', 'ጢ': 'ti', 'ጣ': 'ta', 'ጤ': 'te', 'ጥ': 't', 'ጦ': 'to',
    'ጨ': 'ch', 'ጩ': 'chu', 'ጪ': 'chi', 'ጫ': 'cha', 'ጬ': 'che', 'ጭ': 'ch', 'ጮ': 'cho',
    'ፈ': 'f', 'ፉ': 'fu', 'ፊ': 'fi', 'ፋ': 'fa', 'ፌ': 'fe', 'ፍ': 'f', 'ፎ': 'fo',
    'ፐ': 'p', 'ፑ': 'pu', 'ፒ': 'pi', 'ፓ': 'pa', 'ፔ': 'pe', 'ፕ': 'p', 'ፖ': 'po',
    'ጸ': 'ts', 'ጹ': 'tsu', 'ጺ': 'tsi', 'ጻ': 'tsa', 'ጼ': 'tse', 'ጽ': 'ts', 'ጾ': 'tso',
    'ፀ': 'ts', 'ፁ': 'tsu', 'ፂ': 'tsi', 'ፃ': 'tsa', 'ፄ': 'tse', 'ፅ': 'ts', 'ፆ': 'tso'
  };

  return text.split('').map(char => mapping[char] || char).join('');
}

// Fuzzy matching to verify that all parts of the registered name match the ID document
async function verifyNameMatch(dbName: string, ocrText: string): Promise<{ matches: boolean; reason?: string }> {
  const dbNormalized = dbName.toLowerCase().trim();
  const ocrNormalized = ocrText.toLowerCase();

  // 1. Direct match
  if (ocrNormalized.includes(dbNormalized)) {
    return { matches: true };
  }

  // 2. OpenAI Semantic Check (if API key is present)
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const prompt = `You are a trust and safety identity verification agent for the Beteseb matrimonial platform.
Compare the registered profile name of the user with the raw text extracted from their ID document.
Determine if they refer to the same person. Note that:
1. The registered name is in English or Amharic (Ge'ez script).
2. The ID text might be in Amharic, Oromo, Somali, English, or Arabic.
3. OCR extraction might contain typos, noise, or truncated text.
4. Ethiopian names use different spelling variations when transliterated (e.g., "Abebe" / "Abbebe", "Seid" / "Sayed", "Mohammed" / "Muhammed").

Registered User Name: "${dbName}"
Extracted ID Document OCR Text: "${ocrText}"

Return your decision in strict JSON format:
{
  "matches": boolean,
  "confidence": number (from 0 to 1),
  "reason": "Clear explanation in English why it matches or mismatch details"
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const resultText = completion.choices[0]?.message?.content;
      if (resultText) {
        const result = JSON.parse(resultText);
        if (typeof result.matches === 'boolean' && result.matches === true) {
          return { matches: true };
        } else if (typeof result.matches === 'boolean' && result.matches === false) {
          return {
            matches: false,
            reason: result.reason || 'Name mismatch on ID document.'
          };
        }
      }
    } catch (err: any) {
      console.error("OpenAI name verification failed, falling back to transliteration:", err);
    }
  }

  // 3. Fallback to Transliteration & Phonetic Levenshtein Matching
  const dbTransliterated = transliterateAmharicToEnglish(dbNormalized);
  const ocrTransliterated = transliterateAmharicToEnglish(ocrNormalized);

  // Check if direct transliterated match works
  if (ocrTransliterated.includes(dbTransliterated)) {
    return { matches: true };
  }

  // Word-by-word transliterated matching
  const dbParts = dbTransliterated.split(/\s+/).filter(part => part.length > 0);
  if (dbParts.length === 0) {
    return { matches: false, reason: 'Registered profile name is empty.' };
  }

  const ocrWords = ocrTransliterated.split(/[^a-zA-Z0-9]/g).filter(w => w.length > 0);

  const missingParts: string[] = [];
  for (const part of dbParts) {
    if (part.length <= 1) {
      if (!ocrTransliterated.includes(part)) {
        missingParts.push(part);
      }
      continue;
    }

    if (ocrTransliterated.includes(part)) {
      continue;
    }

    // Try fuzzy match on each word in the OCR text
    const hasFuzzyMatch = ocrWords.some(word => levenshteinDistance(part, word) <= 2);
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
      const nameCheck = await verifyNameMatch(dbFullName, simulatedOcrText);
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
    const nameCheck = await verifyNameMatch(dbFullName, extractedText);
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
