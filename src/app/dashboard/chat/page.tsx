import { requireStore } from "@/lib/auth";
import { effectivePlan } from "@/lib/plans";
import { safeJson } from "@/lib/utils";
import { ChatDesk } from "./chat-desk";

export default async function ChatPage() {
  const { store } = await requireStore();
  return <ChatDesk quickReplies={safeJson<string[]>(store.quickReplies, [])} canBroadcast={effectivePlan(store).id !== "starter"} />;
}
