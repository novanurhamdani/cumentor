import { cn } from "@/lib/utils";
import { Message } from "ai/react";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Props = {
  messages: Message[];
  isLoading?: boolean;
  isFetching?: boolean;
};

const MessageList = ({ messages, isLoading, isFetching }: Props) => {
  // Show loading spinner during initial fetch
  if (isFetching) {
    return (
      <div className="flex flex-col gap-2 px-4 bg-popover min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading messages...</p>
      </div>
    );
  }

  // Show empty state when no messages and not loading
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-4 bg-popover min-h-screen items-center justify-center">
        <p className="text-primary text-sm">
          No messages yet. Start a conversation!
        </p>
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
            <div className="flex items-center gap-2">
              <span
                className={cn("text-sm font-semibold", {
                  "text-secondary": message.role === "user",
                  "text-primary": message.role === "system",
                })}
              >
                {message.role === "user" ? "You" : "Cumentor AI"}
              </span>
              <span
                className={cn("text-xs opacity-70", {
                  "text-white": message.role === "user",
                  "text-white/80": message.role === "system",
                })}
              >
                {message.createdAt
                  ? formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                    })
                  : "just now"}
              </span>
            </div>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ ...props }) => <p className="mb-4" {...props} />,
                h1: ({ ...props }) => (
                  <h1 className="text-2xl font-bold mb-4" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-xl font-bold mb-4" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-lg font-bold mb-4" {...props} />
                ),
                h4: ({ ...props }) => (
                  <h4 className="text-base font-bold mb-4" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc ml-4 mb-4" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal ml-4 mb-1" {...props} />
                ),
                li: ({ ...props }) => <li className="mb-0.5" {...props} />,
                // @ts-expect-error - ReactMarkdown types don't match exactly with our component props
                code: ({ inline, ...props }) =>
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
                blockquote: ({ ...props }) => (
                  <blockquote
                    className="border-l-2 border-current pl-2 italic"
                    {...props}
                  />
                ),
              }}
              className={cn("prose", {
                "text-white": message.role === "user",
                "text-foreground": message.role === "system",
              })}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}
      {/* Show typing indicator only when waiting for chat response */}
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
