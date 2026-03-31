"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import { useSession } from "next-auth/react";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001");

export default function ChatBox({ receiverId }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!receiverId) return;

    fetch(`/api/messages?userId=${receiverId}`)
      .then(res => res.json())
      .then(setMessages);
  }, [receiverId]);

  useEffect(() => {
    if (session?.user?.id) {
      socket.emit("join", session.user.id);
    }
  }, [session]);

  useEffect(() => {
    socket.on("receive_message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId, text }),
    });

    socket.emit("send_message", {
      senderId: session.user.id,
      receiverId,
      text,
    });

    setMessages(prev => [...prev, { text }]);
    setText("");
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="bg-gray-200 p-2 rounded-lg w-fit">
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-2 rounded"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}