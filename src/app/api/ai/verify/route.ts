import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import OpenAI from 'openai';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

  // 2. Fallback to Transliteration & Phonetic Levenshtein Matching
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
    return {
      matches: false,
      reason: `Could not verify your complete birth date (${dbBirthDate}) on the ID document. Make sure the day (${day}), month (${monthPadded}), and year (${year}) are clearly visible and match your profile.`
    };
  }

  return { matches: true };
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { userId, idPhotoUrl, selfiePhotoUrl } = await req.json();

    // Determine if this is a document-only pre-screen (Step 4) or full verification (Step 5)
    const isDocOnly = selfiePhotoUrl === 'doc_only';

    if (!userId) {
      return NextResponse.json({
        isMatch: false,
        reason: 'Missing userId for verification',
        displayMessage: 'ተጠቃሚው አልተገኘም። እባክዎ እንደገና ይግቡ።',
        mode: isDocOnly ? 'doc_only' : 'full',
      });
    }

    // Fetch original registered profile data from database (trusted source)
    const { data: dbProfile, error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, birth_date, location')
      .eq('id', userId)
      .single();

    if (dbError || !dbProfile) {
      console.error("Database query failed during verification:", dbError);
      return NextResponse.json({
        isMatch: false,
        reason: 'Could not fetch onboarding profile metadata from database.',
        displayMessage: 'የሰርቨር ስህተት ተከስቷል። እባክዎ እንደገና ይሞክሩ።',
        mode: isDocOnly ? 'doc_only' : 'full',
      });
    }

    const dbFullName = (dbProfile.full_name || '').trim();
    const dbBirthDate = (dbProfile.birth_date || '').trim();

    if (!dbFullName) {
      return NextResponse.json({
        isMatch: false,
        reason: 'Profile name is empty. Please set your full name in your profile before verification.',
        displayMessage: 'ሙሉ ስምዎ በፕሮፋይልዎ ላይ ያልተመዘገበ ነው። ወደ ደረጃ 1 ተመልሰው ስምዎን ያስገቡ።',
        mode: isDocOnly ? 'doc_only' : 'full',
      });
    }

    if (!dbBirthDate) {
      return NextResponse.json({
        isMatch: false,
        reason: 'No birth date registered on your profile. Please set your birth date before verification.',
        displayMessage: 'የልደት ቀንዎ በፕሮፋይልዎ ላይ ያልተመዘገበ ነው። ወደ ደረጃ 1 ተመልሰው የልደት ቀንዎን ያስገቡ።',
        mode: isDocOnly ? 'doc_only' : 'full',
      });
    }

    if (!idPhotoUrl || idPhotoUrl.trim() === '') {
      return NextResponse.json({
        isMatch: false,
        reason: 'No ID photo URL provided.',
        displayMessage: 'እባክዎን ትክክለኛ ዶክመንት ያስገቡ! (ብሔራዊ መታወቂያ፣ ፓስፖርት፣ መንጃ ፈቃድ)',
        mode: isDocOnly ? 'doc_only' : 'full',
      });
    }

    // ── Reject if selfie was uploaded as the ID document ──────────────────────
    if (!isDocOnly && selfiePhotoUrl && idPhotoUrl.trim() === selfiePhotoUrl.trim()) {
      return NextResponse.json({
        isMatch: false,
        reason: 'The ID image and selfie image are identical. Please attach a real ID photo.',
        displayMessage: 'የተያያዘው የመታወቂያ ምስል እና የሰልፊ ምስል ተመሳሳይ ናቸው። እባክዎ ትክክለኛ የመታወቂያ ፎቶ ያያይዙ።',
        mode: 'full',
      });
    }

    // ── URL-level heuristic: catch obvious non-ID filenames ───────────────────
    const lowerIdUrl = idPhotoUrl.toLowerCase();
    const isSuspiciousFilename =
      lowerIdUrl.includes('fake') ||
      lowerIdUrl.includes('test') ||
      lowerIdUrl.includes('dummy') ||
      lowerIdUrl.includes('cartoon') ||
      lowerIdUrl.includes('selfie') ||
      lowerIdUrl.includes('floor') ||
      lowerIdUrl.includes('blank') ||
      lowerIdUrl.includes('invalid');

    if (isSuspiciousFilename) {
      return NextResponse.json({
        isMatch: false,
        reason: 'Suspicious ID filename detected.',
        displayMessage:
          'ያስገቡት ፎቶ ትክክለኛ የመንግስት መታወቂያ አይደለም። እባክዎን ብሔራዊ መታወቂያ፣ ፓስፖርት ወይም መንጃ ፍቃድ ያቅርቡ።',
        mode: isDocOnly ? 'doc_only' : 'full',
      });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const googleApiKey = process.env.GOOGLE_VISION_API_KEY;

    // ──────────────────────────────────────────────────────────────────────────
    // METHOD A: OpenAI Vision (Multimodal Image Inspection & Data Extraction)
    // ──────────────────────────────────────────────────────────────────────────
    if (openaiApiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const visionPrompt = `You are an ultra-secure and precise Identity Verification Engine for the Beteseb Matrimonial Application.
Analyze the provided document image URL carefully.

User Registration Details:
- Registered Full Name: "${dbFullName}"
- Registered Date of Birth: "${dbBirthDate}"

Evaluate the image according to these mandatory rules without exception:

1. DOCUMENT VALIDATION & TYPE CHECKING:
   - Check if the image is a valid government-issued photo ID document (e.g., National ID / Fayda ID, Passport, Driver's License, Resident Permit).
   - REJECT immediately (isValidGovernmentId: false) if the upload is:
     * A personal selfie or face-only photo.
     * A blank paper, plain white sheet, paper with hand notes, table top, floor, empty background.
     * An unrelated image, scenery, landscape, object, animal, screenshot, cartoon, meme, or non-ID document.
     * Damaged, blurry, dark, or unreadable.

2. REQUIRED DATA EXTRACTION (OCR):
   - Check if a clear facial photograph of the cardholder is visible on the ID card itself (hasCardholderPhoto: boolean).
   - Locate and extract Full Legal Name from the ID card (extractedName: string).
   - Locate and extract Date of Birth from the ID card (extractedDOB: string).
   - If Name, DOB, or Facial Photo on the ID is missing/unreadable -> REJECT.

3. CROSS-MATCHING WITH REGISTERED DATA:
   - Compare extracted Full Name with registered name "${dbFullName}". Allow Ethiopian name transliteration variations (e.g., Abebe/Abbebe, Kebede/Kabada, Mohammed/Muhammed, Amharic/English).
   - Compare extracted DOB with registered DOB "${dbBirthDate}".
   - If Name or DOB does not match -> REJECT.

Return strict JSON format ONLY:
{
  "isValidGovernmentId": boolean,
  "hasCardholderPhoto": boolean,
  "extractedName": string,
  "extractedDOB": string,
  "nameMatches": boolean,
  "dobMatches": boolean,
  "isMatch": boolean,
  "rejectionReasonAmharic": string,
  "rejectionReasonEnglish": string
}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: visionPrompt },
                { type: 'image_url', image_url: { url: idPhotoUrl, detail: 'high' } }
              ]
            }
          ],
          response_format: { type: 'json_object' }
        });

        const resultText = response.choices[0]?.message?.content;
        if (resultText) {
          const res = JSON.parse(resultText);
          
          if (!res.isValidGovernmentId) {
            return NextResponse.json({
              isMatch: false,
              reason: res.rejectionReasonEnglish || 'Invalid document type.',
              displayMessage: res.rejectionReasonAmharic || 'ያስገቡት ፎቶ ትክክለኛ የመንግስት መታወቂያ አይደለም። እባክዎን ብሔራዊ መታወቂያ፣ ፓስፖርት ወይም መንጃ ፍቃድ ያቅርቡ።',
              mode: isDocOnly ? 'doc_only' : 'full',
            });
          }

          if (!res.hasCardholderPhoto) {
            return NextResponse.json({
              isMatch: false,
              reason: res.rejectionReasonEnglish || 'Missing facial photo on ID document.',
              displayMessage: res.rejectionReasonAmharic || 'ያስገቡት ሰነድ ላይ የመታወቂያ ፎቶ አልተገኘም። እባክዎን ፎቶ ያለበት ትክክለኛ የመንግስት መታወቂያ ያቅርቡ።',
              mode: isDocOnly ? 'doc_only' : 'full',
            });
          }

          if (!res.nameMatches) {
            return NextResponse.json({
              isMatch: false,
              reason: res.rejectionReasonEnglish || 'Name mismatch on ID document.',
              displayMessage: res.rejectionReasonAmharic || `ያስገቡት የፕሮፋይል ስም (${dbFullName}) በመታወቂያው ላይ ካለው ስም ጋር አይመሳሰልም። እባክዎን ትክክለኛ መታወቂያ ያቅርቡ ወይም ስምዎን ያስተካክሉ።`,
              mode: isDocOnly ? 'doc_only' : 'full',
            });
          }

          if (!res.dobMatches) {
            return NextResponse.json({
              isMatch: false,
              reason: res.rejectionReasonEnglish || 'DOB mismatch on ID document.',
              displayMessage: res.rejectionReasonAmharic || `ያስገቡት የልደት ቀን (${dbBirthDate}) በመታወቂያው ላይ ካለው ቀን ጋር አይመሳሰልም። እባክዎን ትክክለኛ መታወቂያ ያቅርቡ ወይም የልደት ቀንዎን ያስተካክሉ።`,
              mode: isDocOnly ? 'doc_only' : 'full',
            });
          }

          if (res.isMatch) {
            return NextResponse.json({
              isMatch: true,
              score: 0.99,
              mode: isDocOnly ? 'doc_only' : 'full',
              extractedData: {
                full_name: res.extractedName || dbFullName,
                birth_date: res.extractedDOB || dbBirthDate,
              },
            });
          }
        }
      } catch (openAiErr: any) {
        console.error("OpenAI Vision verification failed:", openAiErr);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // METHOD B: Google Cloud Vision API
    // ──────────────────────────────────────────────────────────────────────────
    if (googleApiKey) {
      const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`;
      
      // Download image binary directly via Supabase Admin Storage (bypasses RLS & public bucket restrictions)
      let base64Data: string | null = null;
      try {
        let filePath = idPhotoUrl;
        if (idPhotoUrl.includes('/user_photos/')) {
          filePath = idPhotoUrl.split('/user_photos/')[1];
        }

        if (filePath && !filePath.startsWith('http')) {
          const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
            .from('user_photos')
            .download(filePath);

          if (fileBlob && !downloadError) {
            const arrayBuffer = await fileBlob.arrayBuffer();
            base64Data = Buffer.from(arrayBuffer).toString('base64');
          }
        }

        if (!base64Data) {
          const imgRes = await fetch(idPhotoUrl);
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            base64Data = Buffer.from(arrayBuffer).toString('base64');
          }
        }
      } catch (fetchErr) {
        console.warn("Could not fetch/download image binary for Vision API:", fetchErr);
      }

      const imagePayload = base64Data
        ? { content: base64Data }
        : { source: { imageUri: idPhotoUrl } };

      const features: Array<{ type: string; maxResults?: number }> = [
        { type: 'DOCUMENT_TEXT_DETECTION' },
        { type: 'TEXT_DETECTION' },
      ];
      if (isDocOnly) {
        features.push({ type: 'FACE_DETECTION', maxResults: 5 });
      }

      const requestBody = {
        requests: [
          {
            image: imagePayload,
            features,
          },
        ],
      };

      const response = await fetch(visionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // Check for Google Cloud Vision API response level errors (e.g. 403 API Key restriction / Billing not enabled)
      if (data.error) {
        const apiErrMsg = data.error.message || 'Google Vision API Error';
        console.error("Google Cloud Vision API HTTP Error:", apiErrMsg);
        return NextResponse.json({
          isMatch: false,
          reason: `Google Cloud Vision API Error: ${apiErrMsg}`,
          displayMessage: `የ Google Cloud Vision API ፍተሻ አልተሳካም። ምክንያት፦ ${apiErrMsg}። (እባክዎን በ Google Cloud Console ላይ Billing መብራቱን እና Cloud Vision API መንቃቱን ያረጋግጡ)።`,
          mode: isDocOnly ? 'doc_only' : 'full',
        });
      }

      const visionResponse = data.responses?.[0];

      if (visionResponse?.error) {
        const apiErrMsg = visionResponse.error.message || 'Google Vision API Image Error';
        console.error("Google Cloud Vision API Image Error:", apiErrMsg);
        return NextResponse.json({
          isMatch: false,
          reason: `Google Cloud Vision API Image Error: ${apiErrMsg}`,
          displayMessage: `የተያያዘውን ምስል መመርመር አልተቻለም። ምክንያት፦ ${apiErrMsg}። እባክዎ እንደገና ፎቶ አንስተው ይጫኑ።`,
          mode: isDocOnly ? 'doc_only' : 'full',
        });
      }

      const textAnnotations = visionResponse?.textAnnotations;
      const faceAnnotations = visionResponse?.faceAnnotations;

      const extractedText = (
        visionResponse?.fullTextAnnotation?.text ||
        textAnnotations?.[0]?.description ||
        ''
      ).trim();

      // 1. OCR text must be present
      if (!extractedText) {
        return NextResponse.json({
          isMatch: false,
          reason: 'Could not extract text from the ID document.',
          displayMessage: 'ያስገቡት ምስል ላይ ምንም ጽሑፍ ሊነበብ አልቻለም። እባክዎ ጠርሶ የሚነበብ እና ብርሃናማ የመንግስት መታወቂያ ያቅርቡ።',
          mode: isDocOnly ? 'doc_only' : 'full',
        });
      }

      const lowerText = extractedText.toLowerCase();

      // 2. Face photo on ID
      if (isDocOnly && (!faceAnnotations || faceAnnotations.length === 0)) {
        return NextResponse.json({
          isMatch: false,
          reason: 'No face photo detected on the ID document.',
          displayMessage: 'ያስገቡት ሰነድ ላይ የመታወቂያ ፎቶ አልተገኘም። እባክዎን ፎቶ ያለበት ትክክለኛ የመንግስት መታወቂያ ያቅርቡ።',
          mode: 'doc_only',
        });
      }

      // 3. Document type keywords
      const allowedDocKeywords = [
        'passport', 'paasaboor', 'ፓስፖርት', 'جواز', 'سفر',
        'national id', 'identity card', 'id card', 'national identity', 'republic', 'ethiopia', 'ኢትዮጵያ', 'ፌደራላዊ', 'ዲሞክራሲያዊ',
        'የብሔራዊ መታወቂያ', 'መታወቂያ', 'aqoonsi', 'aqoonsiga', 'waraqadda', 'widentity', 'fayda', 'ፋይዳ',
        'driving license', "driver's license", 'መንጃ ፍቃድ', 'መንጃ ፈቃድ', 'መንጃ',
        'resident permit', 'residence permit', 'residency card', 'kebele', 'ቀበሌ', 'ወረዳ', 'ዞን', 'ከተማ', 'አድራሻ', 'ክልል',
        'birth', 'date of birth', 'dob', 'full name', ' sex ', ' gender ', 'የልደት'
      ];
      const hasValidDocType = allowedDocKeywords.some(keyword => lowerText.includes(keyword));

      if (!hasValidDocType) {
        return NextResponse.json({
          isMatch: false,
          reason: 'The uploaded image is not a recognized government-issued ID document.',
          displayMessage: 'ያስገቡት ፎቶ ትክክለኛ የመንግስት መታወቂያ አይደለም። እባክዎን ብሔራዊ መታወቂያ፣ ፓስፖርት ወይም መንጃ ፍቃድ ያቅርቡ።',
          mode: isDocOnly ? 'doc_only' : 'full',
        });
      }

      // 4. Name match
      const nameCheck = await verifyNameMatch(dbFullName, extractedText);
      if (!nameCheck.matches) {
        return NextResponse.json({
          isMatch: false,
          reason: nameCheck.reason || 'Name mismatch on ID document.',
          displayMessage: `ያስገቡት የፕሮፋይል ስም (${dbFullName}) በመታወቂያው ላይ ካለው ስም ጋር አይመሳሰልም። እባክዎን ትክክለኛ መታወቂያ ያቅርቡ ወይም ስምዎን ያስተካክሉ።`,
          mode: isDocOnly ? 'doc_only' : 'full',
        });
      }

      // 5. DOB match
      const dobCheck = verifyBirthDateMatch(dbBirthDate, extractedText);
      if (!dobCheck.matches) {
        return NextResponse.json({
          isMatch: false,
          reason: dobCheck.reason || 'Birth date mismatch on ID document.',
          displayMessage: `ያስገቡት የልደት ቀን (${dbBirthDate}) በመታወቂያው ላይ ካለው ቀን ጋር አይመሳሰልም። እባክዎን ትክክለኛ መታወቂያ ያቅርቡ ወይም የልደት ቀንዎን ያስተካክሉ።`,
          mode: isDocOnly ? 'doc_only' : 'full',
        });
      }

      return NextResponse.json({
        isMatch: true,
        score: isDocOnly ? 0.97 : 0.99,
        mode: isDocOnly ? 'doc_only' : 'full',
        extractedData: {
          full_name: dbFullName,
          birth_date: dbBirthDate,
        },
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STRICT FALLBACK WHEN NO VISION API KEYS (OPENAI / GCV) ARE CONFIGURED
    // ──────────────────────────────────────────────────────────────────────────
    // IMPORTANT: NEVER AUTO-APPROVE! Any upload when Vision API keys are missing
    // must be rejected to guarantee security.
    console.error("NO VISION API KEY CONFIGURED (Neither OPENAI_API_KEY nor GOOGLE_VISION_API_KEY is present).");
    return NextResponse.json({
      isMatch: false,
      reason: 'No Vision API Key (OPENAI_API_KEY or GOOGLE_VISION_API_KEY) configured on the server.',
      displayMessage: 'የማንነት ማረጋገጫ AI API (OPENAI_API_KEY ወይም GOOGLE_VISION_API_KEY) በሰርቨሩ ላይ አልተዋቀረም። እባክዎን በ .env.local ወይም በ Vercel Environment Variables ላይ የኤፒአይ ቁልፍ ያክሉ።',
      mode: isDocOnly ? 'doc_only' : 'full',
    });

  } catch (error: any) {
    console.error("Verification Server Error:", error);
    return NextResponse.json({
      isMatch: false,
      reason: 'Server error during verification: ' + error.message,
      displayMessage: 'የሰርቨር ስህተት ተከስቷል። እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ።',
      mode: 'full',
    });
  }
}
