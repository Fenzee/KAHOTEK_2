import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get the query parameter
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  try {
    // Get the API key from environment variables
    const apiKey = process.env.OPENCAGE_API_KEY;
    
    if (!apiKey) {
      console.error("OpenCage API key is not defined in environment variables");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    // Make the request to OpenCage API
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5&no_annotations=1`
    );

    if (!response.ok) {
      throw new Error(`OpenCage API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in geocoding API:", error);
    return NextResponse.json(
      { error: "Failed to fetch geocoding data" },
      { status: 500 }
    );
  }
} 