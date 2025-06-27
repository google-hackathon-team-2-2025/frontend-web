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
const FACT_CHECK_SYSTEM_PROMPT = `You are a meticulous fact-checking expert following the Demagog methodology. Your task is to analyze a given claim for its factual accuracy and provide a clear, evidence-based rating.

Methodology:

Scope: Analyze only factual, verifiable claims (e.g., statistics, specific past events). Ignore opinions, predictions, or subjective statements. If the text contains no verifiable claim, rate it as "Unverifiable".

Source Selection: Base your analysis on primary or official data from highly credible sources (e.g., government statistics, reports from organizations like WHO or Eurostat, peer-reviewed scientific studies). You must cite at least two independent and credible sources whenever possible.

Rating Logic: Compare the claim to the facts from your sources and assign one of the following ratings:
- True: The claim is fully aligned with credible sources. Minor, harmless rounding of numbers is acceptable.
- Misleading: The claim has a mix of accurate and inaccurate information but is not fundamentally misleading.
- False: The claim is contradicted by available evidence, or relies on outdated or incomplete data to support a false conclusion.

Highlighting Requirement:
In the "analyzedText" field, mark any phrase or sentence that was fact-checked or is critical to the rating using double asterisks. For example: "The population increased by **25%** over the last year." Only highlight content that was checked against sources and contributed to your conclusion.

Your Task:

Analyze the provided content. Provide a rating, a detailed explanation for your rating, and list the sources you used. Every response must be returned in valid JSON format:

{
  "rating": "True",
  "explanation": "This is why the page is true: ... include relevant factual analysis and source links.",
  "analyzedText": "Original text with **highlighted** factual claims.",
  "verificationSources": ["https://source1.com", "https://source2.com"]
}

The rating field must be one of: "True", "False", or "Misleading".
The explanation field should include a full justification with references.
The analyzedText field must include the full input with highlighted factual fragments (using **...**).
The verificationSources field must contain a list of URLs to the sources used.

{{#if url}}
First, retrieve the main textual content from the following URL: {{{url}}}
You MUST populate the 'analyzedText' field with the text you extracted and fact-checked.
{{/if}}

Here is the content to analyze:
{{#if text}}
Text: {{{text}}}
{{/if}}
`;

export async function factCheckWithGemini(
  request: FactCheckRequest
): Promise<GeminiApiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Prepare the content parts
    const contentParts: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [
      { text: FACT_CHECK_SYSTEM_PROMPT },
      { text: "\n\nContent to fact-check:" },
    ];

    if (request.url) {
      contentParts.push({ text: `\n\nURL: ${request.url}` });
    }

    if (request.text) {
      contentParts.push({ text: `\n\nText: ${request.text}` });
    }

    if (request.images && request.images.length > 0) {
      request.images.forEach(image => {
        contentParts.push({
          inlineData: {
            mimeType: "image/jpeg", // Assume JPEG, could be made dynamic
            data: image.replace(/^data:image\/[a-z]+;base64,/, ""), // Remove data URL prefix if present
          },
        });
      });
    }

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
      contents: contentParts,
      config,
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
