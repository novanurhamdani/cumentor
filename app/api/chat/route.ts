import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { chats, messages, userSystemEnum } from "@/lib/db/schema";
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
    const { messages: incomingMessages, chatId } = body;

    // Validate that chat exists and belongs to user
    const existingChats = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));

    if (existingChats.length !== 1) {
      return new Response("Chat not found", { status: 404 });
    }
    const chat = existingChats[0];

    if (chat.userId !== userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // If this is the first load (no messages), get previous messages from db
    if (!incomingMessages || incomingMessages.length === 0) {
      const previousMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(messages.createdAt);

      const formattedMessages = previousMessages.map((msg) => ({
        id: msg.id.toString(),
        role: msg.role as "user" | "assistant",
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      }));

      return new Response(JSON.stringify({ messages: formattedMessages }));
    }

    const lastMessage = incomingMessages[incomingMessages.length - 1];
    const context = await getContext(lastMessage.content, chat.fileKey);
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error("Google API key is not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are an expert AI assistant specializing in document analysis and explanation.

    Rules for your responses:
    1. If the question is simple and can be answered directly (like asking for a location, date, or specific fact), provide ONLY the direct answer without any additional context or explanation.

    2. For complex questions that require analysis:
      - Start with a brief overview
      - Use markdown formatting for better readability
      - Break down complex topics into sections
      - Use bullet points for lists
      - Add examples when helpful

    Here's the context from the document:
    ${context}

    Question: ${lastMessage.content}`;

    try {
      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      const text = response.text();

      // Save messages to database
      await db.insert(messages).values({
        chatId,
        content: lastMessage.content,
        role: userSystemEnum.enumValues[0], // "user"
      });

      const aiMessage = await db
        .insert(messages)
        .values({
          chatId,
          content: text,
          role: userSystemEnum.enumValues[1], // "system"
        })
        .returning();

      // Create a stream for the response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send the AI response immediately
            const message = {
              id: aiMessage[0].id.toString(),
              role: "system",
              content: text,
              createdAt: aiMessage[0].createdAt.toISOString(),
            };

            // Send the message
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
            );

            // Send the completion signal
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Error in stream processing:", error);
            controller.error(error);
          }
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
