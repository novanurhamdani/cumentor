import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getContext } from "@/lib/context";

export async function POST(request: Request) {
  try {
    const { messages, chatId } = await request.json();
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" }, { status: 404 });
    }
    const fileKey = _chats[0].fileKey;
    const lastMessage = messages[messages.length - 1];
    const context = await getContext(lastMessage.content, fileKey);

    const model = new GoogleGenerativeAI(
      process.env.GOOGLE_API_KEY!
    ).getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are an AI assistant that helps users understand documents. 
    Use the following context to answer the user's question. 
    If you cannot find the answer in the context, say "I cannot find the answer to that question in the document."
    
    Context from document:
    ${context}
    
    User's question: ${lastMessage.content}`;

    const result = await model.generateContentStream(systemPrompt);

    // Save user message into db
    await db.insert(_messages).values({
      chatId,
      content: lastMessage.content,
      role: "user",
    });

    // Create a TransformStream for streaming the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process the stream
    const encoder = new TextEncoder();
    for await (const chunk of result.stream) {
      const text = chunk.text();
      await writer.write(encoder.encode(text));
    }
    writer.close();

    // Save AI message after stream completes
    const response = await result.response.text();
    await db.insert(_messages).values({
      chatId,
      content: response,
      role: "system",
    });

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
