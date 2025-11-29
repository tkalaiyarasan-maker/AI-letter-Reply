import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, systemInstruction } = req.body;

    // Get API key from environment variable
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const text = response.text.trim();
    
    if (!text) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }

    return res.status(200).json({ text });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate response' 
    });
  }
}
