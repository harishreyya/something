import ChatLayout from "../components/ChatLayout";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatLayout />
    </Suspense>
  );
}