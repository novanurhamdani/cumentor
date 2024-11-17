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

    const systemPrompt = `You are an expert AI assistant specializing in document analysis and explanation. Your responses should be:

1. Comprehensive yet concise
2. Well-structured with clear sections when needed
3. Rich in relevant examples and references from the document
4. Technical when appropriate, but always clear and accessible

When analyzing the document:
- Identify and explain key concepts thoroughly
- Make connections between different parts of the document
- Provide practical examples to illustrate points
- If you find technical terms, explain them in simpler terms
- If you spot potential issues or improvements, mention them
- When relevant, suggest best practices or alternative approaches

If you cannot find the answer in the context:
1. Clearly state that the information is not in the document
2. Suggest related topics that ARE in the document
3. Recommend what additional information would be helpful

Here's the context from the document:
${context}

Question: ${lastMessage.content}

Remember to:
- Be confident and authoritative in your expertise
- Stay focused on the document content
- Provide actionable insights when possible
- Use markdown formatting for better readability
`;

    try {
      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      const text = response.text();

      // Save messages to database
      await db.insert(_messages).values({
        chatId,
        content: lastMessage.content,
        role: userSystemEnum.enumValues[0], // "user"
      });

      const aiMessage = await db
        .insert(_messages)
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
