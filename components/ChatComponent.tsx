"use client";
import React, { useEffect, useState, useRef } from "react";
import { Input } from "./ui/input";
import { useChat, UseChatOptions } from "ai/react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";
import { Message } from "ai";

interface ChatComponentProps {
  chatId: number;
}

interface ExtendedChatOptions extends UseChatOptions {
  onMutate?: (data: any) => void;
}

const ChatComponent = ({ chatId }: ChatComponentProps) => {
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [chatId]);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
    initialMessages,
    onMutate: () => {
      setIsLoading(true);
      // Scroll to bottom when starting to type
      setTimeout(scrollToBottom, 100);
    },
    onResponse: (response) => {
      if (!response.ok) {
        console.error("Error in chat response");
        setIsLoading(false);
        return;
      }
      // Keep loading state true while streaming
      setIsLoading(true);
      // Scroll while receiving new content
      setTimeout(scrollToBottom, 100);
    },
    onFinish: () => {
      setIsLoading(false);
      // Final scroll after message is complete
      setTimeout(scrollToBottom, 100);
    },
  } as ExtendedChatOptions);

  // Auto scroll when messages change or loading state changes
  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [messages, isLoading]);

  return (
    <div className="relative max-h-screen overflow-scroll">
      {/* Header */}
      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      {/* Message List */}
      <div className="space-y-4 w-full">
        <MessageList messages={messages} isLoading={isLoading} />
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
            className="w-full"
            disabled={isLoading}
          />
          <Button className="ml-2 bg-blue-600" disabled={isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
