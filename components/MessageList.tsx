import { cn } from "@/lib/utils";
import { Message } from "ai/react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";

type Props = {
  messages: Message[];
  isLoading?: boolean;
};

const MessageList = ({ messages, isLoading }: Props) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-4 bg-popover min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-4 bg-popover min-h-screen">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex", {
            "justify-end pl-10": message.role === "user",
            "justify-start pr-10": message.role === "system",
          })}
        >
          <div
            className={cn(
              "rounded-lg px-3 py-2 shadow-sm ring-1 ring-gray-900/10 max-w-3xl prose prose-sm",
              {
                "bg-primary text-primary-foreground prose-invert":
                  message.role === "user",
                "bg-secondary text-white prose-slate":
                  message.role === "system",
              }
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-lg font-bold mb-2" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-base font-semibold mb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-sm font-medium mb-1" {...props} />
                ),
                p: ({ node, ...props }) => <p className="mb-1" {...props} />,
                ul: ({ node, ...props }) => (
                  <ul className="list-disc ml-4 mb-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal ml-4 mb-1" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="mb-0.5" {...props} />
                ),
                // @ts-ignore
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code
                      className="bg-black/10 rounded px-1 py-0.5"
                      {...props}
                    />
                  ) : (
                    <code
                      className="block bg-black/10 rounded p-2 my-1 whitespace-pre-wrap"
                      {...props}
                    />
                  ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-2 border-current pl-2 italic"
                    {...props}
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start pr-10">
          <div className="bg-secondary text-white rounded-lg px-3 text-sm py-1 shadow-sm ring-1 ring-gray-900/10">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
