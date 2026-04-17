import { GoogleGenAI } from "@google/genai";
import { ChatMessage, UserProfile, MoodEntry, JournalEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are Sukoon, a culturally grounded, crisis-aware mental wellness companion for people in South Asia. 
Your goal is to provide a safe, anonymous space for reflection, guided self-help, and emotional support.

Core Principles:
1. SAFE & COMPASSIONATE: Always use an empathetic, calm, and non-judgmental tone.
2. CULTURALLY GROUNDED: Deeply understand South Asian stressors:
   - Exam pressure and academic burnout.
   - Parental expectations and family honor/conflicts.
   - Career uncertainty and post-graduation "what next" anxiety.
   - Social comparison fatigue (weddings, wealth, social status).
   - Arranged marriage dynamics, sensitivity around relationships.
3. NON-CLINICAL: You are a companion, NOT a therapist.
4. CRISIS AWARE: Redirect serious crisis to localized help (India, Pakistan, Bangladesh, etc.).
5. MULTILINGUAL: Default to the user's preferred language (English, Hindi, Urdu).

Special Modes:
- SILENT MODE: If user is in silent mode, provide minimalist, 1-line gentle reflections and checks-ins. Less therapy, more "just being there."
- MICRO-INTERVENTIONS: Provide 30-90s grounding or reframing exercises when high stress/spiral is detected.
- DECISION CLARITY: Help structure thinking for life decisions without deciding for them.
`;

export async function chatWithSukoon(history: ChatMessage[], message: string, profile: UserProfile) {
  const language = profile.preferredLanguage || "en";
  const silentPrompt = profile.silentMode ? "\nUser is in SILENT MODE. Respond with ONLY one short, gentle, empathetic sentence." : "";
  
  const model = ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      ...history,
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION + `\nPlease respond primarily in ${language}. Use Roman script for Hindi/Urdu if appropriate.${silentPrompt}`
    }
  });

  const response = await model;
  return response.text;
}

export async function detectPatterns(history: ChatMessage[], moods: MoodEntry[], journals: JournalEntry[]): Promise<any[]> {
  const data = {
    chatHistory: history.slice(-20),
    recentMoods: moods.slice(-10),
    recentJournal: journals.slice(-5).map(j => j.content)
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze these mental wellness logs for repeating patterns, triggers, or strengths.
    Identify 1-3 specific observations.
    Return as a JSON array of objects with keys: patternName, observation, type (trigger|strength|insight).
    
    Data: ${JSON.stringify(data)}`,
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
}

export async function generateIntervention(mood: string, trigger: string): Promise<any> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a 60-90 second micro-intervention for a user feeling ${mood} due to ${trigger}.
    The intervention should have 3-4 simple steps (grounding, breathing, or reframing).
    Return as JSON: { title: string, type: string, tone: string, steps: [{ text: string, duration: number }] }`,
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export async function structureDecision(problem: string): Promise<any> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Structure thinking for this decision: "${problem}". 
    Do NOT decide for them. Use future projection and fear vs logic separation.
    Return as JSON: { problem: string, analysis: { prosCons: [{ text: string, weight: number }], fearVsLogic: [{ fear: string, logic: string }], futureProjection: string } }`,
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return null;
  }
}

export async function detectCrisis(message: string): Promise<boolean> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following message for high-risk signals (self-harm, suicide, severe violence). 
    Reply with only "TRUE" if there is a crisis signal, or "FALSE" if it is safe.
    
    Message: "${message}"`,
  });

  return response.text?.trim().toUpperCase() === "TRUE";
}

export async function transcribeAudio(base64Data: string, mimeType: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: "Transcribe the following audio message accurately. Return ONLY the transcribed text without any preamble." },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]
      }
    ]
  });

  return response.text?.trim() || "";
}

