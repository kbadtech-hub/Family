import { supabase } from './supabase';

export type SupportedLocale = 'en' | 'am' | 'om' | 'ar' | 'ti' | 'so';

/**
 * Universal Translator Utility
 * This utility handles system-wide translations using a Smart Logic approach.
 * It is designed to be hooked into Google Cloud Translation or DeepL API.
 */
export const translator = {
  /**
   * Translates text to a target language.
   * Currently uses a simulation/mock logic for development.
   * REPLACE with real API call in production.
   */
  async translate(text: string, targetLocale: SupportedLocale): Promise<string> {
    if (!text) return '';
    
    // In a real scenario, we would call an edge function or external API here.
    // Example: 
    // const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=YOUR_API_KEY`, {
    //   method: 'POST',
    //   body: JSON.stringify({ q: text, target: targetLocale })
    // });
    
    console.log(`[Smart Translation] Translating to ${targetLocale}: "${text.substring(0, 20)}..."`);
    
    // MOCK: For now, we return the original text with a [Locale] prefix to simulate translation.
    // In a real implementation, this would return the actual translated string.
    return `[${targetLocale.toUpperCase()}] ${text}`;
  },

  /**
   * Auto-translates content for all system languages.
   * Used by Admin Portal for "Smart Content Sync".
   */
  async translateAll(text: string): Promise<Record<SupportedLocale, string>> {
    const locales: SupportedLocale[] = ['en', 'am', 'om', 'ar', 'ti', 'so'];
    const translations: any = {};

    await Promise.all(
      locales.map(async (locale) => {
        translations[locale] = await this.translate(text, locale);
      })
    );

    return translations;
  },

  /**
   * Caches a translation in the database to avoid redundant API calls.
   */
  async getOrTranslate(
    table: 'community_posts' | 'post_comments' | 'lessons',
    id: string,
    originalText: string,
    targetLocale: SupportedLocale
  ): Promise<string> {
    // 1. Check if translation already exists in DB
    const { data, error } = await supabase
      .from(table)
      .select('translations')
      .eq('id', id)
      .single();

    if (!error && data?.translations && data.translations[targetLocale]) {
      return data.translations[targetLocale];
    }

    // 2. If not, translate it
    const translatedText = await this.translate(originalText, targetLocale);

    // 3. Update the DB cache
    const newTranslations = { ...(data?.translations || {}), [targetLocale]: translatedText };
    await supabase
      .from(table)
      .update({ translations: newTranslations })
      .eq('id', id);

    return translatedText;
  }
};
