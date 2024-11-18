"use client";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React, { useState } from "react";
import { PlusCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "./ui/button";
import axios from "axios";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
};

const ChatSidebar = ({ chats, chatId }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubsciption = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/stripe");
      const { url } = await response.data;

      window.location.href = url;
    } catch (error) {
      console.error("Error in subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-muted p-4 text-muted-foreground relative">
      <div className="mb-4">
        <Link
          href="/"
          className="w-full flex items-center justify-center border-dashed border-primary border px-4 py-2 bg-transparent text-primary rounded-lg hover:bg-primary/90 hover:text-white transition-colors"
        >
          <PlusCircleIcon className="w-4 h-4 mr-2" />
          New Chat
        </Link>
      </div>

      <div className="space-y-2">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className={cn(
              "block px-4 py-2 rounded-lg hover:bg-primary/80 text-white transition-colors",
              {
                "bg-primary": chat.id === chatId,
              }
            )}
          >
            <div className="text-sm font-semibold truncate">
              {chat.pdfName || "Untitled Chat"}
            </div>
            <div className="text-xs opacity-60 truncate">
              {format(new Date(chat.createdAt), "d MMMM yyyy")}
            </div>
          </Link>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 left-4">
        <div className="flex gap-2 text-sm text-slate-200 flex-wrap">
          <Link href="/">Home</Link>
          <Link href="/source">Source</Link>
        </div>

        <Button
          className="w-full mt-2 text-white bg-primary hover:bg-primary/90 py-6 font-semibold text-md"
          onClick={handleSubsciption}
          disabled={isLoading}
        >
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
};

export default ChatSidebar;
