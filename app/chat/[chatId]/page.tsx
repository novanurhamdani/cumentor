import ChatComponent from "@/components/ChatComponent";
import ChatSidebar from "@/components/ChatSidebar";
import PdfViewer from "@/components/PdfViewer";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { checkSubscription } from "@/lib/subscription";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const { userId } = await auth();
  const isPro = await checkSubscription();

  if (!userId) {
    return redirect("/sign-in");
  }

  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));
  if (!_chats.length) {
    return redirect("/");
  }

  const currentChat = _chats.find((chat) => chat.id === parseInt(chatId));
  if (!currentChat) {
    return redirect("/");
  }

  return (
    <div className="flex h-screen">
      <div className="flex w-full">
        {/* Chat sidebar */}
        <div className="flex-[1] max-w-xs">
          <ChatSidebar chats={_chats} chatId={parseInt(chatId)} isPro={isPro} />
        </div>
        {/* PDF Viewer */}
        <div className="flex-[5] h-screen overflow-y-auto p-4">
          <PdfViewer pdfUrl={currentChat.pdfUrl || ""} />
        </div>
        {/* Chat component */}
        <div className="flex-[3] border-l-4 border-l-secondary">
          <ChatComponent chatId={parseInt(chatId)} />
        </div>
      </div>
    </div>
  );
}
