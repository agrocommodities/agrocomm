import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getConversations } from "@/actions/messages";
import MessagesClient from "@/components/MessagesClient";

export const metadata = {
  title: "Mensagens | AgroComm",
  description: "Suas conversas no AgroComm",
};

export default async function MensagensPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/mensagens");
  }

  const conversations = await getConversations();

  return (
    <main className="max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-6">
      <MessagesClient
        initialConversations={conversations}
        userId={session.userId}
      />
    </main>
  );
}
