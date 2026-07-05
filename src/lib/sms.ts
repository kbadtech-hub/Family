import { supabase } from './supabase';

/**
 * Queues an SMS notification task in the database.
 * In a production environment, a background worker or serverless cron
 * will poll the `sms_queue` table and dispatch messages via an SMS gateway (e.g. Twilio, Yenepay).
 */
export async function queueSMS(recipientPhone: string, messageContent: string) {
  try {
    const { data, error } = await supabase
      .from('sms_queue')
      .insert({
        recipient_phone: recipientPhone,
        message_content: messageContent,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Failed to queue SMS:', err.message);
    return null;
  }
}
