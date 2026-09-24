import { redirect } from "next/navigation";
import { ChatApp } from "@/components/chat/chat-app";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  const { id } = await params;
  return (
    <ChatApp
      user={{ name: user.name, email: user.email, plan: user.plan }}
      initialConversationId={id}
    />
  );
}
