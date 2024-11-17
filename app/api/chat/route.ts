import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { chats, messages as _messages, userSystemEnum } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getContext } from "@/lib/context";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId } = await getAuth(request);

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { messages, chatId } = body;

    // Validate that chat exists and belongs to user
    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));

    if (_chats.length !== 1) {
      return new Response("Chat not found", { status: 404 });
    }
    const chat = _chats[0];

    if (chat.userId !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // If this is the first load (no messages), get previous messages from db
    if (!messages || messages.length === 0) {
      const previousMessages = await db
        .select()
        .from(_messages)
        .where(eq(_messages.chatId, chatId))
        .orderBy(_messages.createdAt);

      const formattedMessages = previousMessages.map((msg) => ({
        id: msg.id.toString(),
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      return new Response(JSON.stringify({ messages: formattedMessages }));
    }

    const lastMessage = messages[messages.length - 1];

    const context = await getContext(lastMessage.content, chat.fileKey);

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are an AI assistant that helps users understand documents. 
    Use the following context to answer the user's question. 
    Be specific and quote the relevant parts from the document when possible.
    If you cannot find the answer in the context, say "I cannot find the answer to that question in the document."
    
    Context from document:
    ${context}
    
    User's question: ${lastMessage.content}`;

    try {
      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      const text = response.text();

      // Save user message to db
      await db.insert(_messages).values({
        chatId,
        content: lastMessage.content,
        role: userSystemEnum.enumValues[0], // "user"
      });

      // Save AI response to db
      const aiMessage = await db
        .insert(_messages)
        .values({
          chatId,
          content: text,
          role: userSystemEnum.enumValues[1], // "system"
        })
        .returning();

      // Create a stream from the text response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // Send the complete message object first
          const message = {
            id: aiMessage[0].id.toString(),
            role: "system",
            content: text,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
          );
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (geminiError) {
      return new Response(JSON.stringify({ error: geminiError }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
