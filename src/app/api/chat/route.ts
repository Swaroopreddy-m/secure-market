import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// We'll use a simple fetch to Google Gemini API (Free tier)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(request: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        role: "assistant", 
        content: "I'm sorry, I'm not fully configured yet. Please add a GEMINI_API_KEY to the environment variables." 
      });
    }

    const { messages } = await request.json();
    const lastMessage = messages[messages.length - 1].content;

    // Fetch products to give context to the AI
    const products = await prisma.storeProduct.findMany({
      where: { inStock: true },
      select: { name: true, price: true, unit: true, category: true }
    });

    const productsContext = products.map(p => `- ${p.name}: ₹${p.price} per ${p.unit} (${p.category})`).join("\n");

    const systemPrompt = `You are the Secure Market AI Assistant. Your goal is to help users find products and answer questions about the store.
Here are the currently available products:
${productsContext}

Guidelines:
1. Be polite and helpful.
2. If a user asks for a product we have, mention its price and unit.
3. If we don't have it, suggest something similar or apologize.
4. Keep responses concise.
5. Use markdown for formatting.`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser: ${lastMessage}` }]
          }
        ]
      })
    });

    const data = await response.json();
    const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I'm having trouble thinking right now. Please try again later.";

    return NextResponse.json({ role: "assistant", content: aiContent });
  } catch (error) {
    console.error("[CHAT_ERROR]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
