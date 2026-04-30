import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, locale } = await req.json();

    // System Prompt for Beteseb Support
    // System Prompt for Beteseb Support (Persona & Knowledge Base)
    const systemPrompt = `
      Persona: You are the "Beteseb Customer Assistant". You are polite, helpful, and respectful of traditional values.
      Languages: You speak Amharic, Oromo, Arabic, English, Tigrinya, and Somali.
      
      Core Knowledge:
      - Purpose: Beteseb blends traditional Ethiopian matchmaking with modern technology. It's for serious marriage seekers.
      - Security: Every user undergoes mandatory ID Verification and AI Face Matching. Fake accounts are not allowed.
      - Key Pages: 
        * "About Us": Explains our vision and mission.
        * "Classes" (Academy): Courses on marriage and family building (Soulmate Selection, Heart Language).
        * "Community Hub": A digital room for discussing marriage and family.
      - Registration Flow:
        1. Select Location (Inside Ethiopia or Diaspora).
        2. Create Account (Email or Phone).
        3. Access Dashboard (Direct access immediately after signup).
        4. Complete Onboarding (Profile details & 5 lifestyle photos).
        5. Identity Verification (Upload Government ID and take a Live Selfie).
      - Contact Information:
        * Email: betesebhub@gmail.com
        * London (HQ): +44 7347 663219
        * Harar (Branch): +251 946 414018
        * Working Hours: Mon - Sat, 08:00 AM - 06:00 PM.
    `;

    // Language Detection & Response Logic
    const msg = message.toLowerCase();
    let response = "";

    // Multilingual Greetings & Help keywords
    const isRegister = msg.includes('register') || msg.includes('signup') || msg.includes('መመዝገብ') || msg.includes('ምዝገባ') || msg.includes('galmaa') || msg.includes('تسجيل') || msg.includes('ምዝገባ') || msg.includes('isqոր');
    const isSecurity = msg.includes('security') || msg.includes('safe') || msg.includes('verify') || msg.includes('ደህንነት') || msg.includes('ማረጋገጫ') || msg.includes('nagummaa') || msg.includes('أمان') || msg.includes('ድሕንነት') || msg.includes('ammaan');
    const isContact = msg.includes('contact') || msg.includes('phone') || msg.includes('office') || msg.includes('ያግኙን') || msg.includes('ስልክ') || msg.includes('qunnam') || msg.includes('اتصال') || msg.includes('ርክብ') || msg.includes('la xiriir');

    if (isRegister) {
      if (locale === 'am') {
        response = "ለመመዝገብ መጀመሪያ ሀገርዎን ይምረጡ፣ ከዚያ በኢሜል ወይም በስልክ አካውንት ይክፈቱ። አካውንት እንደከፈቱ ወዲያውኑ ወደ ዳሽቦርድ ይገባሉ። በመቀጠል ፕሮፋይልዎን በመሙላት እና ፎቶ በመጫን ምዝገባዎን መጨረስ ይችላሉ።";
      } else if (locale === 'ti') {
        response = "ንምዝገባ መጀመሪያ ሃገርኩም ምረጹ፣ ድሕሪኡ ብኢሜል ወይ ብስልኪ አካውንት ክፈቱ። አካውንት ምስ ኸፈትኩም ብቀጥታ ናብ ዳሽቦርድ ክትአትዉ ኢኹም። ቀጺሉ ፕሮፋይልኩም ብምምላእን ፎቶ ብምጽዓንን ምዝገባኹም ክትወድኡ ትኽእሉ ኢኹም።";
      } else {
        response = "To register: 1. Select your location. 2. Create an account with email/phone. 3. Access your Dashboard immediately. 4. Complete your profile and upload photos. 5. Verify your ID and Selfie.";
      }
    } else if (isSecurity) {
      if (locale === 'am') {
        response = "የቤተሰብ ሲስተም እጅግ አስተማማኝ ነው። እያንዳንዱ ተጠቃሚ በመታወቂያ እና በ AI የፊት ማረጋገጫ (Face Verification) ስለሚመረመር ከአጭበርባሪዎች የጸዳ ነው።";
      } else if (locale === 'ti') {
        response = "ሲስተም ቤተሰብ ኣዝዩ እሙን እዩ። ነፍሲ ወከፍ ተጠቃሚ ብመታወቂያን ብ AI ገጽ ምርግጋጽን (Face Verification) ስለ ዝምርመር ካብ መስለጥቲ ነጻ እዩ።";
      } else {
        response = "Beteseb is highly secure. Every user is verified using Government ID and AI Face Matching to ensure a safe community free from fake accounts.";
      }
    } else if (isContact) {
      if (locale === 'am') {
        response = "በማንኛውም ጊዜ እኛን ማግኘት ይችላሉ፦ ለንደን (HQ)፦ +44 7347 663219፣ ሀረር (ቅርንጫፍ)፦ +251 946 414018። በኢሜል ደግሞ betesebhub@gmail.com ላይ ይጻፉልን።";
      } else {
        response = "Contact us anytime: London (HQ): +44 7347 663219, Harar (Branch): +251 946 414018. Email: betesebhub@gmail.com.";
      }
    } else {
      if (locale === 'am') {
        response = "ሰላም! እኔ የቤተሰብ ረዳት ነኝ። ስለ ምዝገባ፣ ደህንነት ወይም ስለ ሲስተሙ ማንኛውንም ጥያቄ መጠየቅ ይችላሉ።";
      } else if (locale === 'ti') {
        response = "ሰላም! አነ ናይ ቤተሰብ ረዳኢ እየ። ብዛዕባ ምዝገባ፣ ድሕንነት ወይ ብዛዕባ ሲስተም ዝኾነ ሕቶ ክትሓትቱ ትኽእሉ ኢኹም።";
      } else {
        response = "Hello! I am the Beteseb Customer Assistant. I can help you with registration, security, or any general questions about our platform.";
      }
    }

    return NextResponse.json({ text: response });

    return NextResponse.json({ text: response });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
