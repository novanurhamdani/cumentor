"use client";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";
import { MessageCircle, PlusCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
};

const ChatSidebar = ({ chats, chatId }: Props) => {
  return (
    <div className="h-screen bg-muted p-4 text-muted-foreground">
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
            <div className="text-sm font-medium truncate">
              {chat.pdfName || "Untitled Chat"}
            </div>
            <div className="text-xs opacity-70 truncate">
              {new Date(chat.createdAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>

      <div className="absolute bottom-4 left-4">
        <div className="flex gap-2 text-sm text-slate-200 flex-wrap">
          <Link href="/">Home</Link>
          <Link href="/source">Source</Link>
          {/* Stripe Button */}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
