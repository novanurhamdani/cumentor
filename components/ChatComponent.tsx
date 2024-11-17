"use client";
import React from "react";
import { Input } from "./ui/input";
import { useChat } from "ai/react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import MessageList from "./MessageList";

interface ChatComponentProps {
  chatId: number;
}

const ChatComponent = ({ chatId }: ChatComponentProps) => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
  });

  return (
    <div className="relative max-h-screen overflow-scroll">
      {/* Header */}
      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      {/* Message Lists */}
      <MessageList messages={messages} />

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
          />
          <Button className="ml-2 bg-blue-600">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
