
import { GoogleGenAI, Type } from "@google/genai";
import { RecognitionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Perform deep biometric analysis for enrollment.
 */
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
            text: `Act as a high-security biometric validator. 
            Perform 'Liveness Detection' and 'Landmark Consistency' check.
            1. Is this a live human being (not a picture of a picture, or a video playing on a screen)?
            2. Are eyes, nose, and mouth clearly visible for hashing?
            3. Is the lighting adequate for biometric extraction?
            4. Assign a risk score (0-100) where 0 is perfect and 100 is likely spoof.
            Return a JSON object with 'match', 'confidence', 'message', and 'analysis'.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN, description: "True if face is valid for enrollment" },
            confidence: { type: Type.NUMBER, description: "Quality confidence 0 to 1" },
            message: { type: Type.STRING },
            analysis: {
              type: Type.OBJECT,
              properties: {
                liveness: { type: Type.BOOLEAN },
                lighting: { type: Type.STRING },
                focus: { type: Type.STRING },
                landmarks_detected: { type: Type.BOOLEAN },
                risk_score: { type: Type.NUMBER },
              },
              required: ["liveness", "lighting", "focus", "landmarks_detected", "risk_score"],
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
      message: "SYSTEM_ERROR: BIOMETRIC_EXTRACTION_FAILED",
    };
  }
};

/**
 * Compare two faces with strict identity verification.
 */
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
            text: `Task: Biometric Identity Matching.
            Image 1: SECURE_VAULT_RECORD (Enrollment).
            Image 2: LIVE_VERIFICATION_ATTEMPT.
            Are these the SAME human being? 
            Strictly analyze: Inter-pupillary distance, facial geometry, nose-to-lip ratio, and specific unique feature identifiers.
            Ignore lighting or background differences. 
            If similarity is > 90%, mark as match.
            Return JSON with 'match', 'confidence' (0-1), and 'message'.`,
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
      message: "PROTOCOL_ERROR: IDENTITY_LINK_FAILURE",
    };
  }
};
