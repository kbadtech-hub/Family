import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder-since-user-will-provide-real-one',
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Image Moderation
    if (body.imageUrl) {
      const { imageUrl } = body;

      if (!process.env.OPENAI_API_KEY) {
        // Fallback simulated check: reject if URL or filename contains keywords
        const lowerUrl = imageUrl.toLowerCase();
        const isUnsafeImage = lowerUrl.includes('cartoon') || 
                            lowerUrl.includes('landscape') || 
                            lowerUrl.includes('celebrity') || 
                            lowerUrl.includes('drawing') || 
                            lowerUrl.includes('anime') || 
                            lowerUrl.includes('sketch') || 
                            lowerUrl.includes('fake');
        if (isUnsafeImage) {
          return NextResponse.json({
            approved: false,
            reason: "Image violates profile photo guidelines (detected cartoon, landscape, drawing, or celebrity)."
          });
        }
        return NextResponse.json({ approved: true });
      }

      // Real OpenAI GPT-4o Multimodal Image Call
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a strict profile photo moderator for a premium marriage matching platform.
            Analyze the provided image. You must determine if this image is suitable as a single-person profile picture.
            It must be a real photograph of a single human being.
            Reject the image if it is:
            1. A cartoon, anime, drawing, sketch, 3D rendering, or illustration.
            2. A landscape, nature, object, animal, or abstract pattern.
            3. A celebrity photo, generic internet picture, stock image, or meme.
            4. Contains multiple people.
            
            Output JSON ONLY in this format: { "approved": boolean, "reason": "short explanation in English if rejected" }`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image for profile photo compliance."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"approved": true}');
      return NextResponse.json(result);
    }

    // 2. Text Moderation
    const { content } = body;
    if (!content) {
      return NextResponse.json({ approved: true });
    }

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
