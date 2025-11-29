import { GoogleGenAI } from "@google/genai";
import type { FormState } from '../types';

// A custom error class to handle specific API key related issues
class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

const systemInstruction = `
You are an expert assistant for drafting official correspondence for a major construction company. Your task is to generate a professional reply letter based on the provided information.

Your response MUST STRICTLY follow a standard professional letter format. The letter should be complete and ready to be used. Do not add any extra explanations, comments, or text outside of the letter format itself.

The format should include these sections in order:
- Header: The letter MUST start with a 'Ref. No:' on the far left and the 'Date:' on the far right, on the same line. Generate a plausible new reference number for this reply letter that follows a pattern like 'LTC/MAHSR/Pkg-C4/CAM/[YEAR]/[SEQUENTIAL_NUMBER]'. Use the "Current Date for Reply" provided by the user for the date.
- Recipient's details (extract from the incoming letter).
- Subject Line (start with "SUB: " followed by the original subject from the incoming letter).
- 'Reg.' line if present in the original letter.
- Reference section ('Ref:'): This is critical. You must first list *all* existing numbered references from the 'Ref:' section of the incoming letter. Then, you must find the reference number of the incoming letter within its content and add it as the next numbered reference.
- Salutation (e.g., "Dear Sir,").
- Body of the letter:
  - Acknowledge receipt of their letter, referencing it by its number from the 'Ref:' section you just created.
  - Address the issues using the "Points to Consider for Reply".
  - Support arguments with the "Relevant Contract Clauses" where applicable.
  - Maintain a formal, polite, and assertive tone throughout.
- Closing paragraph (e.g., "Thanking you and assuring you of our best services at all times.").
- Sign-off ("Yours faithfully,").

CRITICAL: DO NOT include any sender's address block, sign-off placeholders (like 'For [Company Name]', '[Your Name]', '[Your Title]'), or any footer details (Tel, Fax, Website, etc.). The output must be clean.

Analyze the user-provided data below and generate the complete letter.
`;

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
};

const getCurrentDateFormatted = (): string => {
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
};

const buildUserPrompt = (data: FormState, currentDate: string): string => {
  const { incomingLetter, pointsToConsider, contractClauses } = data;
  return `
**Current Date for Reply:**
${currentDate}

---
**Incoming Letter Content:**
\`\`\`
${incomingLetter}
\`\`\`

---
**Points to Consider for Reply:**
\`\`\`
${pointsToConsider}
\`\`\`

---
**Relevant Contract Clauses:**
\`\`\`
${contractClauses || 'N/A'}
\`\`\`
  `;
}

const callApi = async (prompt: string, instruction: string): Promise<string> => {
  // Create a new instance for every call to ensure the latest key is used.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: instruction,
      }
    });

    const text = response.text.trim();
    if (!text) {
      throw new Error("Received an empty response from the AI. The content may be blocked.");
    }
    return text;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    const message = error?.message || (error instanceof Error ? error.message : '');

    // Handle specific error for invalid/missing API key from the environment
    if (message.includes('API key not valid') || message.includes('Requested entity was not found')) {
        throw new ApiKeyError("The selected API key is not valid or has been revoked. Please select a different key.");
    }
    if (message.includes('token count exceeds')) {
        throw new Error("The provided text is too long. Please shorten it.");
    }
    throw new Error("Failed to communicate with the AI model. The key may be invalid or there might be a network issue.");
  }
};

export const generateReply = async (data: FormState): Promise<string> => {
  const currentDate = getCurrentDateFormatted();
  const userPrompt = buildUserPrompt(data, currentDate);
  return callApi(userPrompt, systemInstruction);
};

export const refineReply = async (originalReply: string, suggestions: string): Promise<string> => {
  const refineInstruction = `
You are an expert assistant revising a draft letter. Your task is to apply the user's suggestions to the provided draft.
- Maintain the original professional tone and letter format.
- Integrate the suggestions seamlessly.
- Only output the final, revised letter. Do not add any extra comments, explanations, or text outside of the letter itself.
  `;
  const refinePrompt = `
**Original Draft Letter:**
\`\`\`
${originalReply}
\`\`\`

---
**User's Suggestions for Refinement:**
\`\`\`
${suggestions}
\`\`\`
  `;
  return callApi(refinePrompt, refineInstruction);
};
