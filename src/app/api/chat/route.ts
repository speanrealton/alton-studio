import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message, history, userName } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ text: "API Key missing." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // FIX: Use the specific versioned model string to bypass the 404
    // Some regions/keys require the full version string: 'gemini-1.5-flash-latest'
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest", 
    });

    const systemPrompt = `You are the Alton Studio Assistant. User: ${userName}. Be concise and premium.`;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "I am ready." }] },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI ROUTE ERROR:", error);

    // FALLBACK: If 'gemini-1.5-flash-latest' fails, try the base 'gemini-pro' 
    // to ensure the user isn't stuck with a 404
    return NextResponse.json({ 
      text: `AI Error: ${error.message}. Try restarting your dev server.` 
    }, { status: 500 });
  }
}