import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiExplanation = async (word: string): Promise<string> => {
  try {
    const prompt = `You are an English language teacher. A student asks about the word or phrase: "${word}"

Respond EXACTLY in this format (as plain text, no markdown, no asterisks, no bolding):

${word} - Clear explanation of the meaning in English.

PRONUNCIATION: [phonetic transcription]

1. Example sentence showing natural usage
2. Another example in a different context
3. Third example demonstrating the word/phrase

SYNONYMS: word1, word2, word3
ANTONYMS: word1, word2, word3

Перевод: accurate Russian translation

ИДИОМЫ: Related idioms or phrases using this word (if applicable)

Important:
- Keep the explanation concise but clear
- Make examples practical and memorable
- Provide accurate synonyms and antonyms
- Include phonetic pronunciation
- Do not use any markdown formatting (no **, no ##)
- Respond only with the format above`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No content received from Gemini");
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};