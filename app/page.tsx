import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, LogIn } from "lucide-react";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  const firstChat = userId
    ? (await db.select().from(chats).where(eq(chats.userId, userId)))[0]
    : undefined;

  return (
    <div className="w-screen h-screen bg-gradient">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with PDF</h1>
            <UserButton afterSwitchSessionUrl="/" />
          </div>

          <div className="flex mt-2">
            {isAuthenticated && firstChat ? (
              <Link href={`/chat/${firstChat.id}`}>
                <Button className="bg-secondary">
                  Go to Chats <ArrowRight className="ml-2" />
                </Button>
              </Link>
            ) : null}
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            The AI-powered document assistant for students, researchers, and
            professionals. Scan, query, and explore PDFs effortlessly to uncover
            insights, streamline research, and boost productivity.
          </p>

          <div className="w-full mt-4">
            {isAuthenticated ? (
              <FileUpload />
            ) : (
              <Link href="/sign-in">
                <Button className="bg-secondary">
                  Login to get Started!
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
