import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, locale } = await req.json();

    // System Prompt for Beteseb Support
    const systemPrompt = `
      You are the official Beteseb Support AI. 
      Beteseb is a premium Ethiopian family-building platform.
      Rules:
      1. Be polite and helpful in ${locale}.
      2. If asked about pricing: 1 Month is 500 ETB / $50 USD. 3 Months is 1200 ETB / $120 USD. 1 Year is 3500 ETB / $350 USD. Lifetime is 9999 ETB / $999 USD.
      3. If asked about payments: We use Manual Bank Transfers. Users must upload a screenshot for approval.
      4. If asked about verification: Every user must upload a Government ID and a Live Selfie.
      5. If the user is angry or needs human help, tell them to click "Speak to Human".
      6. Languages: Amharic, Oromo, Arabic, English.
    `;

    // Simulated AI Response logic (to avoid needing an immediate external API key for the demo)
    // In production, this would call OpenAI/Anthropic.
    let response = "";
    const msg = message.toLowerCase();

    if (msg.includes('ሰላም') || msg.includes('hello')) {
       response = locale === 'am' ? "ሰላም! እንዴት ልረዳዎት እችላለሁ?" : "Hello! How can I help you today?";
    } else if (msg.includes('ክፍያ') || msg.includes('price') || msg.includes('payment')) {
       response = locale === 'am' ? "ክፍያዎችን በባንክ ዝውውር መፈጸም ይችላሉ። የከፈሉበትን ስክሪንሾት መጫን እንዳይረሱ።" : "Payments are made via Bank Transfer. Don't forget to upload your receipt screenshot.";
    } else if (msg.includes('ማረጋገጫ') || msg.includes('verify')) {
       response = locale === 'am' ? "ማንነትዎን ለማረጋገጥ መታወቂያ እና የቀጥታ ፎቶ (Selfie) መጫን አለብዎት።" : "To verify, you need to upload an ID and a live selfie.";
    } else {
       response = locale === 'am' 
          ? "ይቅርታ፣ ጥያቄዎን አልተረዳሁትም። ለአድሚን ለመላክ 'Speak to Human' የሚለውን ይጫኑ።" 
          : "I'm sorry, I didn't quite catch that. Please click 'Speak to Human' to talk to an admin.";
    }

    return NextResponse.json({ text: response });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
