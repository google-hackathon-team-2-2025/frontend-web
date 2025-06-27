import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { GeminiApiResponse } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND || "http://localhost:3000";

/**
 * Custom fetch wrapper with error handling
 */
export async function fetcher<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  // Handle non-success responses
  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
}

/**
 * GET request
 */
export async function get<T>(url: string, options?: RequestInit): Promise<T> {
  return fetcher<T>(url, { method: "GET", ...options });
}

/**
 * POST request
 */
export async function post<T, D = unknown>(
  url: string,
  data: D,
  options?: RequestInit
): Promise<T> {
  return fetcher<T>(url, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * PUT request
 */
export async function put<T, D = unknown>(
  url: string,
  data: D,
  options?: RequestInit
): Promise<T> {
  return fetcher<T>(url, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * DELETE request
 */
export async function del<T>(url: string, options?: RequestInit): Promise<T> {
  return fetcher<T>(url, { method: "DELETE", ...options });
}

export interface FactCheckRequest {
  text?: string;
  images?: string[]; // base64 encoded images
  url?: string; // URL to analyze
}

// Server-side secure prompt - not exposed to client
const FACT_CHECK_SYSTEM_PROMPT = `You are an AI Fact-Checker. Your goal is to analyze content, verify it against high-quality sources using your search tool, and return a single, valid JSON response.

### 1. Input Handling
- **Content Source**: The content for analysis can be from **plain text**, a **URL** (retrieve main text), or an **image** (perform OCR to extract text).
- **User Focus**: If the user provides a 'focus' text, your entire analysis must center on that specific claim. Otherwise, analyze all verifiable claims in the content.

### 2. Workflow
1.  **Identify Content & Focus**: Determine the input type and if a user 'focus' is present.
2.  **Deconstruct Claim(s)**: Isolate the verifiable factual statements. Prioritize the 'focus' if provided.
3.  **Search for Evidence**: Use your web search tool to find at least two independent, high-quality sources (e.g., government data, international organizations, peer-reviewed studies).
4.  **Synthesize, Rate & Highlight**: Compare the claims to the evidence. Assign a rating and highlight the text according to the logic in Section 3.
5.  **Construct JSON Response**: Build the final JSON object. Your entire output must be only this JSON.

### 3. Rating & Highlighting Logic
- **Rating Definitions**:
    - **True**: The claim is fully aligned with credible sources.
    - **False**: The claim is directly contradicted by credible sources.
    - **Misleading**: The claim uses technically correct data to create a false narrative, omits crucial context, or cherry-picks information.
    - **Unverifiable**: The claim is an opinion, prediction, or cannot be verified.
- **Highlighting Rule**: In the \`analyzedText\` field, you must return the **entire original text**. Within that text, enclose the specific claim(s) you fact-checked inside double asterisks (\`**...**\`).
    - **Example**: If the input is "It is a fact that bananas grow on trees that are over 100 meters tall.", the \`analyzedText\` should be: "It is a fact that **bananas grow on trees that are over 100 meters tall.**"
- **Multiple Claims**: If there is no user 'focus' and the text contains a mix of true and false claims, the overall \`rating\` should be **Misleading**, and you must highlight all claims that you verified.

### 4. JSON Output Structure
Your entire response MUST be a single, valid JSON object matching this structure. Do not include any text or markdown before or after the JSON block.
\`\`\`json
{
  "rating": "True" | "False" | "Misleading" | "Unverifiable",
  "explanation": "A detailed justification for your rating, explaining what the sources say and how the claim aligns or deviates from them.",
  "analyzedText": "The full original text with the specific fact-checked phrases highlighted using **...**.",
  "verificationSources": ["https://source1.url", "https://source2.url"]
}
\`\`\`

IMPORTANT: The user will provide the content to analyze in the following message. If a URL is provided, you should retrieve and analyze the main textual content from that URL. Ensure you populate the 'analyzedText' field with the actual content you analyzed.`;

export async function factCheckWithGemini(
  request: FactCheckRequest
): Promise<GeminiApiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Prepare user content parts (excluding system prompt)
    const userContentParts: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [{ text: "Content to fact-check:" }];

    if (request.url) {
      userContentParts.push({ text: `\n\nURL: ${request.url}` });
    }

    if (request.text) {
      userContentParts.push({ text: `\n\nText: ${request.text}` });
    }

    if (request.images && request.images.length > 0) {
      request.images.forEach(image => {
        userContentParts.push({
          inlineData: {
            mimeType: "image/jpeg", // Assume JPEG, could be made dynamic
            data: image.replace(/^data:image\/[a-z]+;base64,/, ""), // Remove data URL prefix if present
          },
        });
      });
    }

    // Prepare the contents array with proper Content structure including system instruction
    const contents = [
      {
        role: "user",
        parts: [{ text: FACT_CHECK_SYSTEM_PROMPT }, ...userContentParts],
      },
    ];

    // Make the API call with Google Search grounding and URL context
    const config: {
      tools: Array<
        | { googleSearch: Record<string, never> }
        | { urlContext: { url: string } }
      >;
      safetySettings: Array<{
        category: HarmCategory;
        threshold: HarmBlockThreshold;
      }>;
    } = {
      tools: [{ googleSearch: {} as Record<string, never> }], // Enable Google Search grounding for internet access
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    };

    // Add URL context if provided
    if (request.url) {
      config.tools.push({ urlContext: { url: request.url } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001",
      contents: contents,
      ...config,
    });

    // Extract and parse the response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (
        candidate.content &&
        candidate.content.parts &&
        candidate.content.parts.length > 0
      ) {
        const textResponse = candidate.content.parts[0].text;

        if (!textResponse) {
          throw new Error("No text response received from Gemini API");
        }

        console.log("Raw Gemini response:", textResponse); // Debug logging

        try {
          // Clean the response - sometimes models add extra text around JSON
          let cleanedResponse = textResponse.trim();

          // Extract JSON if it's wrapped in markdown code blocks
          const jsonMatch = cleanedResponse.match(
            /```(?:json)?\s*(\{[\s\S]*\})\s*```/
          );
          if (jsonMatch) {
            cleanedResponse = jsonMatch[1];
          }

          // Find JSON object boundaries
          const startIndex = cleanedResponse.indexOf("{");
          const lastIndex = cleanedResponse.lastIndexOf("}");

          if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
            cleanedResponse = cleanedResponse.substring(
              startIndex,
              lastIndex + 1
            );
          }

          // If still no valid JSON found, create fallback response
          if (!cleanedResponse.startsWith("{")) {
            console.warn("No JSON found in response, creating fallback");
            return {
              rating: "Unverifiable" as const,
              explanation:
                "Unable to process the request. The AI model did not return a valid response format.",
              analyzedText:
                request.text || request.url || "Content could not be analyzed",
              verificationSources: [],
            };
          }

          const parsedResponse = JSON.parse(
            cleanedResponse
          ) as GeminiApiResponse;

          // Validate the response structure
          if (
            !parsedResponse.rating ||
            !parsedResponse.explanation ||
            !parsedResponse.analyzedText
          ) {
            throw new Error("Invalid response structure from Gemini");
          }

          // Ensure verificationSources is an array
          if (!Array.isArray(parsedResponse.verificationSources)) {
            parsedResponse.verificationSources = [];
          }

          return parsedResponse;
        } catch (parseError) {
          console.error("Failed to parse Gemini response as JSON:", parseError);
          console.error("Raw response was:", textResponse);

          // Return fallback response instead of throwing error
          return {
            rating: "Unverifiable" as const,
            explanation:
              "Unable to process the request due to response format issues.",
            analyzedText:
              request.text || request.url || "Content could not be analyzed",
            verificationSources: [],
          };
        }
      }
    }

    throw new Error("No valid response received from Gemini API");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(
      `Failed to fact-check content: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
