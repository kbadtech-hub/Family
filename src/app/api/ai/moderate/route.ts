import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder-since-user-will-provide-real-one',
});

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      // Fallback/Simulated AI Moderation Logic for Demo if no key provided
      const forbiddenPatterns = [
        /ፖለቲካ/i, /መንግስት/i, /ምርጫ/i, // Amharic politics
        /politics/i, /government/i, /election/i, /racist/i, /hate/i, // English
        /سياسة/i, /حكومة/i, /انتخابات/i, // Arabic
        /siyaasadda/i, /doorasho/i, // Somali
        /siyaasa/i, /mootummaa/i, // Oromiffa
        /ፖለቲካ/i, /መንግስቲ/i // Tigrinya
      ];

      const isUnsafe = forbiddenPatterns.some(pattern => pattern.test(content));
      
      if (isUnsafe) {
        return NextResponse.json({
          approved: false,
          reason: "Content contains prohibited topics (politics, hate speech, or non-family values)."
        });
      }

      return NextResponse.json({ approved: true });
    }

    // Real AI Moderation Call
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a strict family-oriented content moderator for the Beteseb platform.
          The platform is dedicated to Marriage, Parenting, and Family Finance.
          Reject any content related to politics, racism, hate speech, or anything that violates family values.
          Support multiple languages: Amharic, English, Oromiffa, Arabic, Tigrinya, and Somali.
          Output JSON ONLY: { "approved": boolean, "reason": "short explanation in English" }`
        },
        {
          role: "user",
          content: content
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"approved": true}');
    return NextResponse.json(result);

  } catch (error) {
    console.error("Moderation Error:", error);
    return NextResponse.json({ approved: true }); // Fallback to avoid blocking if AI fails
  }
}
