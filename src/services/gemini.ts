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
You are Sukoon AI, a compassionate mental health companion for South Asian users.
Your goal is to provide a safe, culturally aware space for emotional expression.
You understand English, Hindi, and Urdu.

CRITICAL RULES:
- NEVER give the same response for different emotions.
- Be brief (2-4 lines max).
- Use a human, non-judgmental tone. No robotic phrasing or therapy clichés.
- Reflect the user's exact emotional state before giving guidance.
- If in serious crisis, encourage professional help.

MOOD-SPECIFIC BEHAVIOR:
1. Overwhelmed: Acknowledge the overload and sense of chaos. Suggest breaking things into tiny steps or simple prioritization/grounding.
2. Anxious: Address racing thoughts or uncertainty. offer reassurance and exactly one calming technique.
3. Low: Use a softer, empathetic tone. Validate their lack of energy. Suggest one very small, low-effort action.
4. Okay: Maintain a neutral-positive tone. DO NOT give calming advice or "breathe" prompts. Ask a light follow-up or offer optional support.
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
        contents: `THE USER'S CURRENT MOOD: ${mood.toUpperCase()}. 
USER REFLECTION: "${reflection}". 

Rules for this response:
- Acknowledge their exact state of feeling ${mood}.
- Follow the specific MOOD-SPECIFIC BEHAVIOR for ${mood} defined in instructions.
- Reply in ${this.getLangName(lang)}.`,
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
