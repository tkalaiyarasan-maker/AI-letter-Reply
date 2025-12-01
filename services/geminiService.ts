
import { GoogleGenAI } from "@google/genai";
import type { FormState } from '../types';

const SYSTEM_INSTRUCTION = `
You are an expert legal and corporate communications consultant.

**ROLE & DIRECTION ANALYSIS (CRITICAL):**
1. **Identify the SENDER** of the provided "Incoming Letter" (Let's call them "Party A"). Look for the letterhead or the **Signatory** at the bottom.
2. **Identify the RECIPIENT** of the provided "Incoming Letter" (Let's call them "Party B").
3. **YOUR TASK**: Draft a reply **FROM Party B** addressed **TO Party A**.

**RECIPIENT & KIND ATTENTION RULES (STRICT):**
- You MUST address the reply to **Party A** (the organization/entity that sent the incoming letter).
- **Kind Attn**: You MUST identify the specific person who **SIGNED** the incoming letter (usually found at the bottom right of the text/PDF).
- The "Kind Attn" line must name that specific signatory. Do NOT use a generic name or the name of the person who was cc'd.
- If the signatory's name is not found, use their Designation/Title.

**GUIDELINES:**
1. **Language & Tone**: Use strictly contractual and formal language. Avoid casual phrasing. Be precise, firm, and authoritative. Use legal terminology where appropriate to strengthen the position.
2. **Reference Management**:
   - Identify the "Incoming Reference Number" and date from the provided letter/file.
   - Identify any other references cited in the text (e.g., Contract numbers, previous letters, purchase orders).
   - **ORDERING**: List all other references FIRST. The "Incoming Reference Number" MUST be the **LAST** item in the list.
   - **LAYOUT**: **VERTICAL LIST**. Place each reference on a NEW LINE.
   - **FORMAT**:
     REF:
     (1) [Other Ref 1]
     (2) [Other Ref 2]
     ...
     (n) Your letter no. [Incoming Ref] dated [Date]
   - **PROHIBITED**: Do NOT combine references into a single paragraph or single line.
   - Generate a new outgoing Reference Number (e.g., REF/[CurrentYear]/[Random3Digits]) at the top.
3. **Structure**:
   - **Header**: Reference Number and Date.
   - **To Address**: Name/Department of Party A (Sender of incoming).
   - **Kind Attn**: [Name of Incoming Signatory].
   - **Subject**: "SUB: Reply to [Incoming Subject] - [Contract/Project Name if available]" (Do NOT use bolding).
   - **Ref Line**: (See Reference Management above - VERTICAL LIST).
   - **Salutation**: Formal (e.g., "Dear Sir/Madam,").
   - **Opening**: Acknowledge receipt of the incoming letter/document explicitly referencing its number and date.
   - **Body**: Address the "Points to Cover" logically. State the facts/arguments clearly and strictly. Use "Contract Clauses" to substantiate arguments if provided, quoting specific clause numbers.
   - **Closing**: Formal legal closing (e.g., "We reserve all our rights and remedies under the contract and applicable law.").
   - **Sign-off**: "Yours faithfully," followed by placeholder [Party B Name/Title].

**FORMATTING RESTRICTIONS:**
- **NO MARKDOWN**: Do NOT use asterisks (*) for bolding or bullet points. Do NOT use hash signs (#) for headers.
- Output **CLEAN PLAIN TEXT** only.
- Maintain standard business letter spacing.

Do NOT include any conversational filler before or after the letter. Output ONLY the letter content.
`;

const getApiKey = (): string => {
  // STRICTLY use process.env.API_KEY.
  // We use a safe check to prevent ReferenceError if 'process' is undefined in some browser environments
  const key = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
  
  if (!key) {
    throw new Error("API Key is missing. The application requires process.env.API_KEY to be set in the server environment.");
  }
  return key;
};

const createClient = () => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

export const generateReplyStream = async (data: FormState) => {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // Define verbosity instruction based on selection
  const verbosityInstruction = data.verbosity === 'elaborated'
    ? "**STYLE/LENGTH:** WRITE A DETAILED, ELABORATED REPLY. Provide comprehensive explanations, detailed reasoning for each point, and full context. Do not cut corners; be thorough."
    : "**STYLE/LENGTH:** WRITE A SIMPLE, CONCISE REPLY. Keep the letter short, reasonable, and strictly to the point. Focus only on the essentials and avoid over-explanation.";

  // Construct the prompt context
  const context = `
**CONTEXT:**
Current Date: ${currentDate}
${verbosityInstruction}

**POINTS TO COVER IN REPLY:**
${data.pointsToConsider}

**CONTRACT CLAUSES (IF ANY):**
${data.contractClauses || "None provided."}

**INSTRUCTION:**
Draft the reply letter now based on the Incoming Letter provided. 
- **CRITICAL**: Address the letter TO the sender (Signatory) of the incoming letter.
- **KIND ATTN**: Use the name of the person who signed the incoming letter.
- Extract all reference numbers from the incoming text/file and include them in the 'Ref' line.
- **LAYOUT**: Put each reference on a NEW LINE (Vertical List).
- Do NOT use stars (*) or bolding in the output.
`;

  let contentPart: any;

  if (data.incomingFile) {
    // If a file is uploaded, send it as inlineData along with text prompt
    contentPart = {
      parts: [
        {
          inlineData: {
            mimeType: data.incomingFile.mimeType,
            data: data.incomingFile.data
          }
        },
        { text: `**INCOMING LETTER:** (See attached PDF)\n\n${context}` }
      ]
    };
  } else {
    // Standard text prompt
    const fullPrompt = `
${context}

**INCOMING LETTER:**
${data.incomingLetter}
`;
    contentPart = fullPrompt;
  }

  try {
    const ai = createClient();
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contentPart,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5, 
      }
    });

    return response;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API Key is missing")) {
        throw error;
    }
    throw new Error("Failed to contact AI service. " + (error.message || "Unknown error"));
  }
};

export const refineReplyStream = async (originalReply: string, suggestions: string) => {
  const prompt = `
**ORIGINAL DRAFT:**
${originalReply}

**USER SUGGESTIONS FOR REVISION:**
${suggestions}

**INSTRUCTION:**
Rewrite the letter above to incorporate the user's suggestions. 
- Maintain the strict contractual/legal tone.
- **REFERENCE LAYOUT**: Ensure each reference is on a SEPARATE LINE (Vertical List). Do not run them into a paragraph.
- **KIND ATTN**: Ensure the "Kind Attn" is the person who sent/signed the original incoming letter, not the recipient.
- **NO MARKDOWN**: Do NOT use asterisks (*) or bolding.
- Output ONLY the revised letter.
  `;

  try {
    const ai = createClient();
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert legal editor. Revise the provided business letter based on the user's feedback while maintaining legal precision, clean plain text formatting.",
      }
    });
    
    return response;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API Key is missing")) {
        throw error;
    }
    throw new Error("Failed to refine reply. " + (error.message || "Unknown error"));
  }
};
