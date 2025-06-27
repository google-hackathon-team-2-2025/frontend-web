"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { GeminiApiResponse } from "@/types/api";

interface FactCheckContextType {
  results: GeminiApiResponse | null;
  setResults: (results: GeminiApiResponse) => void;
  clearResults: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const FactCheckContext = createContext<FactCheckContextType | undefined>(
  undefined
);

export function FactCheckProvider({ children }: { children: ReactNode }) {
  const [results, setResultsState] = useState<GeminiApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setResults = (results: GeminiApiResponse) => {
    setResultsState(results);
  };

  const clearResults = () => {
    setResultsState(null);
  };

  return (
    <FactCheckContext.Provider
      value={{
        results,
        setResults,
        clearResults,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </FactCheckContext.Provider>
  );
}

export function useFactCheck() {
  const context = useContext(FactCheckContext);
  if (context === undefined) {
    throw new Error("useFactCheck must be used within a FactCheckProvider");
  }
  return context;
}
