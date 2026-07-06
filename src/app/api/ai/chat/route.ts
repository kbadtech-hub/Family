import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { message, locale, userId } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ text: "Message cannot be empty." });
    }

    const msg = message.toLowerCase().trim();

    // 1. Check if user requests human support or escalates explicitly
    const humanKeywords = [
      'human', 'agent', 'support', 'ticket', 'complaint', 'escalate', 'representative', 'helpdesk',
      'ሰው', 'ረዳት', 'ቅሬታ', 'ችግር', 'አድሚን', 'ትኬት', 'ማገዝ', 'gargaarsa', 'caawinaad', 'مساعدة', 'عملاء',
      'ምላሽ', 'አስታራቂ'
    ];

    const isHumanRequest = humanKeywords.some(kw => msg.includes(kw));

    if (isHumanRequest) {
      const ticketNumber = `BTS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      
      // Insert support ticket
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId || null,
          message: message,
          status: 'pending',
          ticket_number: ticketNumber
        });

      if (ticketError) {
        console.error("Ticket insertion failed:", ticketError);
      }

      let responseText = "";
      switch (locale) {
        case 'am':
          responseText = `ይቅርታ፥ ለጥያቄዎ በእኔ የዕውቀት መዝገብ ውስጥ ምላሽ አላገኘሁም። ነገር ግን የእርስዎን ቅሬታ/ጥያቄ በትኬት ቁጥር **${ticketNumber}** መዝግቤዋለሁ። የአገልግሎት አስተዳዳሪው በቅርቡ ያነጋግርዎታል።`;
          break;
        case 'ti':
          responseText = `ይቅሬታ፥ ንሕቶኹም አብ ናይ ፍልጠት መዝገበይ መልሲ ኣይረኸብኩን። ግን ናይ መማረጺ ሕቶኹም ብትኬት ቁጽሪ **${ticketNumber}** መዝጊበዮ ኣለኹ። በዓል መዚ አብ ቀረባ ግዜ ክረኽበኩም እዩ።`;
          break;
        case 'om':
          responseText = `Dhiifama, gaaffii keessaniif deebii kuusaa beekumsa koo keessaa hin arganne. Haa ta'u malee, gaaffii keessan lakkoofsa tikkeettii **${ticketNumber}** jalatti galmeesseera. Gargaaran tajaajilaa dhiheenyatti isin qunnama.`;
          break;
        case 'so':
          responseText = `Waan ka xumahay, jawaab uma helin su'aashaada. Si kastaba ha ahaatee, waxaan u diiwaangeliyay cabashadaada lambarka tigidhada **${ticketNumber}**. Wakiil ka tirsan adeegga macaamiisha ayaa dhowaan kula soo xiriiri doona.`;
          break;
        case 'ar':
          responseText = `عذرًا، لم أتمكن من العثور على إجابة لسؤالك في قاعدة المعارف الخاصة بي. ومع ذلك، فقد قمت بتسجيل طلبك تحت رقم تذكرة **${ticketNumber}**. سيتصل بك وكيل الدعم الفني قريبًا.`;
          break;
        default:
          responseText = `I'm sorry, I couldn't find an answer to your question in my knowledge base. I have successfully created a support ticket for you. Ticket Number: **${ticketNumber}**. A support agent will contact you shortly.`;
      }
      return NextResponse.json({ text: responseText });
    }

    // 2. Query resolved tickets for automatic self-learning match
    const { data: resolvedTickets } = await supabase
      .from('support_tickets')
      .select('*, support_replies(*)')
      .eq('status', 'resolved');

    if (resolvedTickets && resolvedTickets.length > 0) {
      const queryWords = msg.split(/\s+/).filter((w: string) => w.length > 2);
      let bestTicket = null;
      let maxMatches = 0;

      for (const ticket of resolvedTickets) {
        const ticketWords = ticket.message.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
        let matchCount = 0;
        for (const qw of queryWords) {
          if (ticketWords.some((tw: string) => tw.includes(qw) || qw.includes(tw))) {
            matchCount++;
          }
        }

        if (matchCount > maxMatches && matchCount >= 1) {
          maxMatches = matchCount;
          bestTicket = ticket;
        }
      }

      if (bestTicket && bestTicket.support_replies && bestTicket.support_replies.length > 0) {
        const resolution = bestTicket.support_replies[0].message;
        const prefix = locale === 'am' ? '[ራስ-ትምህርት ምላሽ]፦' : '[Learned Solution] -';
        return NextResponse.json({ text: `${prefix} ${resolution}` });
      }
    }

    // 3. Multilingual greetings detection
    const greetingKeywords = ['hi', 'hello', 'hey', 'ሰላም', 'ሃይ', 'hallo', 'marhaba', 'akkam', 'haye', 'health', 'ጤና'];
    const isGreeting = greetingKeywords.some(kw => msg.includes(kw));

    if (isGreeting) {
      let welcomeText = "";
      switch (locale) {
        case 'am':
          welcomeText = "ሰላም! እኔ የቤተሰብ ረዳት ነኝ። በንድፍ ሰነዳችን መሠረት ስለ ምዝገባ፣ ደህንነት፣ ክፍያዎች፣ የWali ቪዲዮ ጥሪዎች፣ የስጦታ አቅርቦቶች ወይም ስለ ሲስተሙ አሰራር ማንኛውንም ጥያቄ መጠየቅ ይችላሉ። እንዴት ልርዳዎት?";
          break;
        case 'ti':
          welcomeText = "ሰላም! አነ ናይ ቤተሰብ ረዳኢ እየ። ብዛዕባ ምዝገባ፣ ድሕንነት፣ ክፍሊት፣ ናይ Wali ቪዲዮ ጻውዒት፣ ውህብቶታት ወይ ብዛዕባ ሲስተም ዝኾነ ሕቶ ክትሓትቱ ትኽእሉ ኢኹም። ከመይ ገይረ ክሕግዘኩም?";
          break;
        case 'om':
          welcomeText = "Akkam! Ani gargaaraa Beteseb ti. Waa'ee galmee, nagummaa, kaffaltii, bilbila viidiyoo Wali, dhiheessa kennaa ykn waayee sirna keenyaa gaaffii qabdan gaafachuu dandeessu. Akkamitti isin gargaaruu danda'a?";
          break;
        case 'so':
          welcomeText = "Haye! Waxaan ahay caawiyaha Beteseb. Waxaad weydiin kartaa su'aalo ku saabsan diiwaangelinta, ammaanka, lacag bixinta, wicitaanka fiidiyowga Wali, bixinta hadiyadaha ama nidaamka. Sideen kuu caawin karaa?";
          break;
        case 'ar':
          welcomeText = "مرحباً! أنا مساعد عملاء منصة بيتيسيب (Beteseb). يمكنني مساعدتك في الإجابة على أي سؤال بخصوص التسجيل، الأمان، الأسعار، مكالمات الـ Wali، أو نظام الهدايا وتوصيلها. كيف يمكنني مساعدتك اليوم؟";
          break;
        default:
          welcomeText = "Hello! I am the Beteseb Customer Assistant. I can help you with registration, security, pricing, matching, Wali group calls, gift deliveries, or any general questions about our platform. How can I assist you?";
      }
      return NextResponse.json({ text: welcomeText });
    }

    // 4. Keyword matches for Blueprint Knowledge Base
    const matchers = {
      register: ['register', 'signup', 'join', 'መመዝገብ', 'ምዝገባ', 'galmaa', 'تسجيل', 'isqor', 'አካውንት', 'ለመመዝገብ'],
      security: ['security', 'safe', 'verify', 'ደህንነት', 'ማረጋገጫ', 'nagummaa', 'أمان', 'ድሕንነት', 'ammaan', 'መታወቂያ', 'ሰልፊ', 'fake', 'እውነተኛ', 'face', 'selfie'],
      pricing: ['pricing', 'coin', 'payment', 'charge', 'subscription', 'ክፍያ', 'ሳንቲም', 'ኮይን', 'ብር', 'kaffaltii', 'telebirr', 'chapa', 'stripe', 'money', 'ገንዘብ'],
      abushakir: ['abushakir', 'compatibility', 'ልደት', 'ተኳኋኝነት', 'አቡሻኽር', 'ቀን', 'ኮምፓት', 'matching'],
      wali: ['wali', 'guardian', 'call', 'ጥሪ', 'ቪዲዮ', 'አስጠኚ', 'ወላጅ', 'ሽማግሌ', 'meeting', 'video'],
      gifts: ['gift', 'delivery', 'marketplace', 'ስጦታ', 'አቅርቦት', 'አበባ', 'ልብስ', 'ኩፖን', 'ውሻ', 'ድመት', 'pet', 'flower', 'order', 'ትዕዛዝ']
    };

    let matchedCategory = "";
    for (const [category, keywords] of Object.entries(matchers)) {
      if (keywords.some(kw => msg.includes(kw))) {
        matchedCategory = category;
        break;
      }
    }

    if (matchedCategory === 'register') {
      let text = "";
      if (locale === 'am') {
        text = "ለመመዝገብ መጀመሪያ የሀገር ምርጫዎን (ሀገር ውስጥ ወይም ዲያስፖራ) ይመርጣሉ፣ ከዚያ በኢሜል ወይም በስልክ ቁጥር አካውንት ይፈጥራሉ። አካውንት እንደከፈቱ ወዲያውኑ ዳሽቦርድ መግባት ይችላሉ። በመቀጠል መገለጫዎን (Profile) እና 5 ፎቶዎችን በመጫን ምዝገባዎን ያጠናቅቃሉ። በመጨረሻም የደህንነት ማረጋገጫ (Selfie እና የመንግስት መታወቂያ) ያቀርባሉ።";
      } else if (locale === 'ti') {
        text = "አብ ቤተሰብ ንምዝገባ መጀመሪያ ናይ ሃገር ምርጫኹም (ውሽጢ ሃገር ወይ ዲያስፖራ) ትመርጹ፣ ድሕሪኡ ብኢሜል ወይ ብስልኪ ቁጽሪ አካውንት ትፈጥሩ። አካውንት ምስ ኸፈትኩም ብቀጥታ ናብ ዳሽቦርድ ክትአትዉ ትኽእሉ ኢኹም። ቀጺሉ ፕሮፋይልኩምን 5 ፎቶታትን ብምጽዓን ምዝገባኹም ትውድኡ። ኣብ መወዳእታ ናይ ድሕንነት መረጋገጺ (Selfie ን መታወቂያን) ተቕርቡ።";
      } else {
        text = "To register: 1. Choose location (Ethiopia or Diaspora). 2. Create account (Email/Phone). 3. Access dashboard immediately. 4. Complete profile and upload 5 lifestyle photos. 5. Perform ID Verification and take a live 3-second Selfie.";
      }
      return NextResponse.json({ text });
    }

    if (matchedCategory === 'security') {
      let text = "";
      if (locale === 'am') {
        text = "ቤተሰብ እጅግ አስተማማኝ መድረክ ነው። እያንዳንዱ ተጠቃሚ የውሸት አካውንት እንዳይፈጥር የመንግስት መታወቂያ እና የ 3 ሰከንድ የቀጥታ የፊት ሰልፊ (AI Face Matching) ማረጋገጫ ማቅረብ አለበት። ያልተረጋገጡ መገለጫዎች መልእክት መላክም ሆነ መደወል አይችሉም።";
      } else {
        text = "Beteseb ensures maximum safety. Every user undergoes mandatory Government ID Verification and AI Face Matching (3-second live selfie) to eliminate fake profiles. Unverified users cannot send messages or make calls.";
      }
      return NextResponse.json({ text });
    }

    if (matchedCategory === 'pricing') {
      let text = "";
      if (locale === 'am') {
        text = "አፑን ማውረድና መመዝገብ ሙሉ በሙሉ ነጻ ነው። ባህሪያትን ለመጠቀም ግን የታማኝነት ደረጃዎችን ማሳደግ ወይም የቤተሰብ ሳንቲሞችን (Beteseb Coins) መጠቀም ይቻላል። ሳንቲሞችን ተጠቅመው የትምህርት ኮርሶችን መክፈት (100 ኮይኖች)፣ ተጨማሪ መልዕክት መላክ (10 ኮይኖች)፣ ተጨማሪ ጥሪ ማድረግ (50 ኮይኖች) ወይም ማህበረሰብ ፊድ ላይ ፖስት ማድረግ (20 ኮይኖች) ይችላሉ።";
      } else {
        text = "Downloading and signing up is 100% free. Users can upgrade their trust tiers or use Beteseb Coins to access advanced features (unlocking courses = 100 coins, extra texts = 10 coins, extra call minutes = 50 coins, community posting = 20 coins).";
      }
      return NextResponse.json({ text });
    }

    if (matchedCategory === 'abushakir') {
      let text = "";
      if (locale === 'am') {
        text = "የአቡሻኽር ተኳኋኝነት መመርመሪያ የልደት ሰዓትን ሳይጠቀም ተጠቃሚዎች የሞሉትን የትዳር እሴትና ዝግጁነት መቶኛን በመተንተን ጠንካራ ጎኖቻቸውን እና ቀደም ብለው ሊወያዩባቸው የሚገቡ ጉዳዮችን ያሳያል።";
      } else {
        text = "The Abushakir Compatibility Engine calculates match compatibility based on marriage values and readiness criteria without requiring or collecting birth hours.";
      }
      return NextResponse.json({ text });
    }

    if (matchedCategory === 'wali') {
      let text = "";
      if (locale === 'am') {
        text = "የWali ቪዲዮ ጥሪ የቤተሰብ አስጠኚዎች (Wali) የተጋቢዎችን የትዳር ተኳኋኝነት በጋራ ቪዲዮ ጥሪ የሚከታተሉበት ሲሆን፣ ስክሪን ሾት መነሳትን ለመከላከል በስክሪኑ ላይ ስም እና መለያን የሚያሳዩ ስውር የውሃ ምልክቶች (watermarks) አሉት።";
      } else {
        text = "Wali Video Call is a secure group call for candidates and family guardians with anti-capture visual watermarks and screenshot prevention to maintain privacy.";
      }
      return NextResponse.json({ text });
    }

    if (matchedCategory === 'gifts') {
      let text = "";
      if (locale === 'am') {
        text = "የስጦታ ማርኬትፕሌስ አባላት በኮይኖች የገዟቸውን ምናባዊ ስጦታዎች (አበቦች፣ ባህል ልብሶች፣ የቤት እንስሳት፣ የእራት ኩፖኖች) ወደ አካላዊ እውነተኛ ስጦታ ቀይረው በቤት ማድረስ አገልግሎት እንዲቀበሉ ያስችላል። አድሚኖች አቅርቦቱን በማስረጃ ፎቶ ያረጋግጣሉ።";
      } else {
        text = "The Gift Marketplace allows users to claim physical delivery of virtual gifts (flowers, pets, traditional wear, date vouchers) straight to their homes, which admins fulfill and verify with proof screenshots.";
      }
      return NextResponse.json({ text });
    }

    // 5. Fallback Default - Auto Create Ticket
    const ticketNumber = `BTS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const { error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId || null,
        message: message,
        status: 'pending',
        ticket_number: ticketNumber
      });

    if (ticketError) {
      console.error("Default ticket insertion failed:", ticketError);
    }

    let defaultText = "";
    switch (locale) {
      case 'am':
        defaultText = `ይቅርታ፥ ለጥያቄዎ በእኔ የዕውቀት መዝገብ ውስጥ ምላሽ አላገኘሁም። ነገር ግን የእርስዎን ቅሬታ/ጥያቄ በትኬት ቁጥር **${ticketNumber}** መዝግቤዋለሁ። የአገልግሎት አስተዳዳሪው በቅርቡ ያነጋግርዎታል።`;
        break;
      case 'ti':
        defaultText = `ይቅሬታ፥ ንሕቶኹም አብ ናይ ፍልጠት መዝገበይ መልሲ ኣይረኸብኩን። ግን ናይ መማረጺ ሕቶኹም ብትኬት ቁጽሪ **${ticketNumber}** መዝጊበዮ ኣለኹ። በዓል መዚ አብ ቀረባ ግዜ ክረኽበኩም እዩ።`;
        break;
      default:
        defaultText = `I'm sorry, I couldn't find an answer to your question in my knowledge base. I have successfully created a support ticket for you. Ticket Number: **${ticketNumber}**. A support agent will contact you shortly.`;
    }
    return NextResponse.json({ text: defaultText });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
