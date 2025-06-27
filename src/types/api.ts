export interface GeminiApiResponse {
  rating: "True" | "False" | "Misleading" | "Unverifiable";
  explanation: string;
  analyzedText: string;
  verificationSources: string[];
}
