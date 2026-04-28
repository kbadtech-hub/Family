import { supabase } from './supabase';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `
You are the Beteseb AI Assistant, the official support agent for the Beteseb platform.
Your goal is to help users find their perfect match while preserving Ethiopian and Eritrean cultural heritage.

PLATFORM KNOWLEDGE:
1. Matching Engine: We use the "Abushakir Engine" which blends traditional matchmaking logic with modern AI.
2. Verification: Identity verification is mandatory for all members (Passport or ID + Selfie). No matching is allowed until verified.
3. Registration: Users first create an account (Email/Password), verify their email with a 6-digit OTP, and then complete their profile in the dashboard.
4. Payments: We have tiered pricing for members inside Ethiopia (ETB) and the Global Diaspora (USD). Premium unlocks matching, chat, and expert classes.
5. Community: A safe space for family counseling and traditional advice.
6. Academy: Expert-led classes on traditional values, Abushakir wisdom, and modern relationship dynamics.

COMMUNICATION STYLE:
- Warm, respectful, and family-oriented.
- Multilingual: Detect the user's language (Amharic, Oromo, Arabic, Tigrinya, Somali, or English) and respond in that SAME language.
- If you cannot answer a specific technical question about an account, suggest "Talking to a Human" (Escalation).

ESCALATION:
- If a user expresses frustration or asks for human help, tell them you can create a support ticket for the administrators.
`;

export const aiSupport = {
  /**
   * Simple AI simulation for the chatbot.
   * In production, replace with actual OpenAI/Gemini API calls.
   */
  async chat(messages: ChatMessage[], locale: string): Promise<string> {
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    
    // Simulate AI Language Detection & Response
    // (This is a simplified logic for the demonstration)
    
    if (lastMessage.includes('human') || lastMessage.includes('ሰው') || lastMessage.includes('person')) {
       return this.getEscalationMessage(locale);
    }

    // Mock Knowledge Base Response
    if (lastMessage.includes('verification') || lastMessage.includes('ቬሪፊኬሽን') || lastMessage.includes('ማረጋገጫ')) {
       return locale === 'am' 
         ? "የመለያ ማረጋገጫ (Verification) ግዴታ ነው። ፓስፖርትዎን ወይም መታወቂያዎን እና የራስዎን ፎቶ (Selfie) በመጫን ማጠናቀቅ ይችላሉ።"
         : "Verification is mandatory. You can complete it by uploading your Passport/ID and a selfie.";
    }

    // Default Fallback
    return locale === 'am'
      ? "እንዴት ልርዳዎት? ስለ ምዝገባ፣ ስለ ክፍያ ወይም ስለ ማረጋገጫ (Verification) ጥያቄ ካለዎት መጠየቅ ይችላሉ።"
      : "How can I help you? You can ask about registration, payments, or verification.";
  },

  getEscalationMessage(locale: string) {
    switch(locale) {
      case 'am': return "ከሰው ጋር መነጋገር ይፈልጋሉ? 'ከሰው ጋር ተገናኝ' የሚለውን በመጫን መልእክትዎን ለአስተዳዳሪዎቻችን መላክ ይችላሉ።";
      case 'om': return "Namoota gargaarsaa waliin dubbachuu barbaadduu? 'Talk to Human' cuqaasuun ergaa keessan erguu dandeessu.";
      case 'ti': return "ምስ ሰብ ክትዛረቡ ትደልዩ ዶ? 'Talk to Human' ብምጽቃጥ መልእኽትኹም ክትሰዱ ትኽእሉ ኢኹም፡፡";
      default: return "Would you like to talk to a human? Click 'Talk to Human' to send a direct message to our admins.";
    }
  },

  async createTicket(data: {
    user_id?: string;
    subject: string;
    message: string;
    language: string;
    guest_email?: string;
  }) {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert([{
        user_id: data.user_id,
        subject: data.subject,
        message: data.message,
        language: data.language,
        guest_email: data.guest_email,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return ticket;
  },

  async getUserTickets(userId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*, support_replies(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
