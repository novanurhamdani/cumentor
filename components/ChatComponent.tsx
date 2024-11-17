"use client";
import React, { useEffect, useState, useRef } from "react";
import { Input } from "./ui/input";
import { useChat } from "ai/react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";
import { Message } from "ai";

interface ChatComponentProps {
  chatId: number;
}

const ChatComponent = ({ chatId }: ChatComponentProps) => {
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [allMessages, setAllMessages] = useState<Message[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Fetch initial messages when component mounts
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chatId, messages: [] }),
        });
        const data = await response.json();
        if (data.messages) {
          setInitialMessages(data.messages);
          setAllMessages(data.messages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [chatId]);

  const {
    messages: chatMessages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
  } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
    initialMessages,
    onResponse: (response) => {
      if (!response.ok) {
        console.error("Error in chat response");
        setIsLoading(false);
        return;
      }

      // Create a new ReadableStream from the response body
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") {
                    setIsLoading(false);
                  } else {
                    try {
                      const message = JSON.parse(data);
                      setAllMessages((prev) => {
                        // Find if we already have this message
                        const existingIndex = prev.findIndex(
                          (m) => m.id === message.id
                        );
                        if (existingIndex >= 0) {
                          // Update existing message
                          const newMessages = [...prev];
                          newMessages[existingIndex] = message;
                          return newMessages;
                        } else {
                          // Add new message
                          return [...prev, message];
                        }
                      });
                      setTimeout(scrollToBottom, 100);
                    } catch (e) {
                      console.error("Error parsing message:", e);
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error reading stream:", error);
            setIsLoading(false);
          }
        };

        readStream();
      }
    },
    onFinish: () => {
      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    },
  });

  // Wrap the original handleSubmit to set loading state immediately
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input.trim(),
        createdAt: new Date(),
      };
      setAllMessages((prev) => [...prev, userMessage]);

      await originalHandleSubmit(e);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  // Auto scroll when messages change or loading state changes
  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [allMessages, isLoading]);

  return (
    <div className="relative max-h-screen overflow-scroll">
      {/* Header */}
      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      {/* Message List */}
      <div className="space-y-4 w-full">
        <MessageList messages={allMessages} isLoading={isLoading} />
        <div ref={messagesEndRef} /> {/* Anchor element for scrolling */}
      </div>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white"
      >
        <div className="flex">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            className="w-full mr-2"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
