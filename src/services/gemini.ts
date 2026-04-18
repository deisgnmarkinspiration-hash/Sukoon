import { GoogleGenAI } from "@google/genai";
import { Language, ChatMessage } from '@/src/types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is missing. AI features will not work.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface GeminiResponse {
  text: string;
  error?: string;
}

const SYSTEM_INSTRUCTION = `
You are Sukoon AI, a compassionate and empathetic mental health companion. 
Your goal is to provide a safe space for people to express their feelings.
You understand English, Hindi, and Urdu.
Rules:
- Be brief (2-4 sentences max unless asked for more).
- Use a deeply supportive, non-judgmental tone.
- Reflect back the user's emotion (validation).
- Never give medical advice, but offer gentle action items (breathing, grounding).
- If the user is in serious crisis, encourage them to seek professional help immediately.
- For non-mental health questions, gently pivot back to their emotional state.
`;

export class GeminiService {
  private abortController: AbortController | null = null;

  private abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Specialized method for reassurance messages
   */
  async getReassurance(mood: string, reflection: string, lang: Language): Promise<GeminiResponse> {
    if (!reflection.trim()) return { text: '', error: 'Reflection cannot be empty' };

    this.abort();
    this.abortController = new AbortController();

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `The user feels ${mood}. Their reflection: "${reflection}". Respond in ${this.getLangName(lang)}.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      return { text: response.text || '' };
    } catch (error: any) {
      if (error.name === 'AbortError') return { text: '' };
      console.error('Gemini Reassurance Error:', error);
      return { text: '', error: 'I am here for you, even if the connection is slow. Take a deep breath.' };
    }
  }

  /**
   * General chat with real streaming
   */
  async sendMessage(
    history: ChatMessage[],
    message: string,
    onToken?: (token: string) => void
  ): Promise<GeminiResponse> {
    if (!message.trim()) return { text: '', error: 'Message cannot be empty' };

    this.abort();
    this.abortController = new AbortController();

    const chatHistory = history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    try {
      // Create chat with system instruction
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        history: chatHistory,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });

      const result = await chat.sendMessageStream({ message });
      
      let fullText = '';
      for await (const chunk of result) {
        if (this.abortController?.signal.aborted) break;
        const text = chunk.text;
        if (text) {
          fullText += text;
          onToken?.(text);
        }
      }

      return { text: fullText };
    } catch (error: any) {
      if (error.name === 'AbortError') return { text: '', error: 'Request cancelled' };
      console.error('Gemini Chat Error:', error);
      return { 
        text: '', 
        error: 'I lost connection for a moment. Please try sending that again.' 
      };
    } finally {
      this.abortController = null;
    }
  }

  private getLangName(lang: Language): string {
    switch (lang) {
      case 'hi': return 'Hindi';
      case 'ur': return 'Urdu';
      default: return 'English';
    }
  }
}

export const aiService = new GeminiService();
