import { GoogleGenerativeAI } from '@google/generative-ai';
import { Language } from '@/src/types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

export interface AIServiceResponse {
  text: string;
  error?: string;
}

/**
 * Production-grade Gemini service with retries and validation.
 */
export const geminiService = {
  /**
   * Generates a reassurance message based on mood and reflection.
   */
  getReassurance: async (
    mood: string, 
    reflection: string, 
    lang: Language, 
    retries = 1
  ): Promise<AIServiceResponse> => {
    const prompt = `
      Context: Mental health support app (South Asia focus, casual, warm)
      User feels: ${mood}
      What's happening: ${reflection}
      Respond in ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Urdu'}.
      Rules:
      - 2-3 short sentences
      - calm, human tone
      - no clinical language
      - validate feeling
      - provide one tiny, actionable suggestion (e.g., wash face, drink water, write one thing)
    `;

    return geminiService._callAI(prompt, retries);
  },

  /**
   * General chat handler for the "Talk it out" feature.
   */
  chat: async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    message: string,
    lang: Language,
    retries = 1
  ): Promise<AIServiceResponse> => {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    try {
      const result = await chat.sendMessage(message);
      const response = await result.response;
      return { text: response.text() };
    } catch (error: any) {
      if (retries > 0) {
        console.warn('AI Chat failed, retrying...', error);
        return geminiService.chat(history, message, lang, retries - 1);
      }
      return { 
        text: '', 
        error: error.message || 'Failed to connect to AI service. Please try again.' 
      };
    }
  },

  /**
   * Internal helper for AI calls with retry logic.
   */
  _callAI: async (prompt: string, retries: number): Promise<AIServiceResponse> => {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AI Request timeout')), 10000))
      ]);

      if ('response' in result) {
        const response = await result.response;
        return { text: response.text() };
      }
      throw new Error('Invalid AI response');
    } catch (error: any) {
      if (retries > 0) {
        return geminiService._callAI(prompt, retries - 1);
      }
      return { 
        text: '', 
        error: error.message || 'AI service error' 
      };
    }
  }
};
