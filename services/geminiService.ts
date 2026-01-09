
import { GoogleGenAI, Type } from "@google/genai";
import { RecognitionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFace = async (imageBase64: string): Promise<RecognitionResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64.split(',')[1],
            },
          },
          {
            text: "Analyze this face for a biometric authentication system. Check if a human face is clearly visible, evaluate lighting, and determine if it looks like a real person (liveness detection). Return JSON format.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            message: { type: Type.STRING },
            analysis: {
              type: Type.OBJECT,
              properties: {
                liveness: { type: Type.BOOLEAN },
                lighting: { type: Type.STRING },
                focus: { type: Type.STRING },
              },
              required: ["liveness", "lighting", "focus"],
            },
          },
          required: ["match", "confidence", "message", "analysis"],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      match: false,
      confidence: 0,
      message: "Security analysis failed. Please try again.",
    };
  }
};

export const verifyIdentity = async (enrolledBase64: string, currentBase64: string): Promise<RecognitionResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: enrolledBase64.split(',')[1],
            },
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: currentBase64.split(',')[1],
            },
          },
          {
            text: "Compare these two images. Are they the same person? The first image is the enrolled biometric record, and the second is the current verification attempt. Be strict. Return JSON with 'match' (boolean), 'confidence' (0-1), and 'message'.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            message: { type: Type.STRING },
          },
          required: ["match", "confidence", "message"],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Verification Error:", error);
    return {
      match: false,
      confidence: 0,
      message: "Identity verification error.",
    };
  }
};
