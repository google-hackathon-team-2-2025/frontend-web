"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFactCheck } from "@/contexts/FactCheckContext";

function ResultsDisplay() {
  const { results: response, clearResults } = useFactCheck();
  const router = useRouter();

  useEffect(() => {
    // If no results, redirect to home
    if (!response) {
      router.push("/");
    }
  }, [response, router]);

  const getStatusColor = (rating: string) => {
    switch (rating) {
      case "True":
        return "text-green-500";
      case "Misleading":
        return "text-yellow-500";
      case "False":
        return "text-red-500";
      case "Unverifiable":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const handleCheckAnother = () => {
    clearResults();
    router.push("/");
  };

  if (!response) {
    return (
      <div className="text-center text-gray-400">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header with Logo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">FactLens</h1>
        <p className="text-gray-400">Analysis Results</p>
      </div>

      <Card className="w-full border-gray-800 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-xl text-white font-medium">
            Fact-Check Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Rating</h3>
            <p
              className={`text-xl font-bold ${getStatusColor(response.rating)}`}
            >
              {response.rating}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Explanation</h3>
            <p className="text-gray-300">{response.explanation}</p>
          </div>
          {response.analyzedText && (
            <div>
              <h3 className="text-lg font-semibold text-white">
                Analyzed Text
              </h3>
              <div className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: response.analyzedText
                      .replace(
                        /\*\*([\s\S]*?)\*\*/g,
                        '<strong class="text-yellow-300 font-bold">$1</strong>'
                      )
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              </div>
            </div>
          )}
          {response.verificationSources &&
            response.verificationSources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Verification Sources
                </h3>
                <ul className="space-y-3">
                  {response.verificationSources.map((link, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline break-all transition-colors duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          <div className="block pt-4">
            <Button
              onClick={handleCheckAnother}
              className="w-full bg-gray-200 hover:bg-gray-300 text-black font-medium"
            >
              Check Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-black text-gray-300 p-4">
      <div className="flex items-center justify-center min-h-screen">
        <ResultsDisplay />
      </div>
    </div>
  );
}
