"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function HomeComponent() {
  const [textInput, setTextInput] = useState("");
  const [pastedImages, setPastedImages] = useState<string[]>([]);

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData.items;
    const imageItems = Array.from(items).filter(item =>
      item.type.includes("image")
    );

    if (imageItems.length > 0) {
      event.preventDefault();
      for (const imageItem of imageItems) {
        const blob = imageItem.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = e => {
            if (e.target?.result) {
              setPastedImages(prevImages => [
                ...prevImages,
                e.target!.result!.toString(),
              ]);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(event.target.value);
  };

  const removeImage = (index: number) => {
    setPastedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    // TODO: Implement fact-checking logic for textInput and/or pastedImages
    console.log("Analyzing content...", { textInput, pastedImages });
  };

  const hasContent = textInput.trim() || pastedImages.length > 0;

  return (
    <div className="min-h-screen bg-black text-gray-300 p-4">
      <div className="max-w-3xl mx-auto pt-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">FactLens</h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Verify information instantly
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="w-full border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-xl text-white font-medium">
              What would you like to fact-check?
            </CardTitle>
            <CardDescription className="text-gray-500 text-sm">
              Paste an image, URL, or text.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {pastedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {pastedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Pasted content ${index + 1}`}
                        className="h-40 w-full rounded-md object-cover bg-black/20"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1.5 right-1.5 bg-black bg-opacity-60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Textarea
                id="text-input"
                placeholder={
                  pastedImages.length > 0
                    ? "What about this image do you want to check? (e.g., 'Is this a real photo?')"
                    : "Paste text, a URL, or an image to verify..."
                }
                value={textInput}
                onChange={handleTextChange}
                onPaste={handlePaste}
                className="min-h-[150px] resize-none w-full bg-black/30 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:border-gray-600 focus:ring-0 focus:ring-offset-0"
              />
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!hasContent}
              className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-800 disabled:text-gray-500 text-black font-medium py-2.5 mt-4"
            >
              Analyze
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
