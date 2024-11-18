"use client";
import { DrizzleChat } from "@/lib/db/schema";
import Link from "next/link";
import React, { useState } from "react";
import { PlusCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import axios from "axios";
import SubscriptionButton from "./SubscriptionButton";

type Props = {
  chats: DrizzleChat[];
  chatId: number;
  isPro: boolean;
};

const ChatSidebar = ({ chats, chatId, isPro }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="h-screen p-4 text-muted-foreground bg-muted flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mb-4">
          <Link
            href="/"
            className="text-2xl font-bold hover:text-slate-200 transition-colors"
          >
            Cumentor
          </Link>
        </div>

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
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <div
                className={cn("rounded-lg p-3 text-slate-200 flex items-center", {
                  "bg-primary/10": chat.id === chatId,
                  "hover:bg-primary/10": chat.id !== chatId,
                })}
              >
                <div className="flex gap-2 items-center max-w-[230px]">
                  <div className="relative w-2 h-2 rounded-full bg-sky-600"></div>
                  <span className="truncate flex-1 text-sm">
                    {chat.pdfName}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-muted py-4">
        <div className="flex gap-2 text-sm text-slate-200 flex-wrap">
          <Link href="/">Home</Link>
          <Link href="/source">Source</Link>
        </div>

        <div className="mt-4">
          <SubscriptionButton isPro={isPro} />
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
