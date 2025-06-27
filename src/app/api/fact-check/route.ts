import { NextRequest, NextResponse } from "next/server";
import { factCheckWithGemini, FactCheckRequest } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const body: FactCheckRequest = await request.json();

    // Validate that we have something to fact-check
    if (!body.text && !body.url && (!body.images || body.images.length === 0)) {
      return NextResponse.json(
        {
          error:
            "Either text, URL, or images must be provided for fact-checking",
        },
        { status: 400 }
      );
    }

    const result = await factCheckWithGemini(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fact-check API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to process fact-check request",
      },
      { status: 500 }
    );
  }
}
