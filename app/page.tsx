import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LogIn } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  const isAuthenticated = !!userId;

  return (
    <div className="w-screen h-screen bg-gradient-to-tl from-teal-300 to-cyan-600">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with PDF</h1>
            <UserButton afterSwitchSessionUrl="/" />
          </div>

          <div className="flex mt-2">
            {isAuthenticated ? <Button>Go to Chats</Button> : null}
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
                <Button>
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
