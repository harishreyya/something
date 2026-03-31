"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { useSession } from "next-auth/react";

export default function ChatBox({ receiver , onBack}) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const bottomRef = useRef();


  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    setSocket(s);
    return () => s.disconnect();
  }, []);


  useEffect(() => {
    if (socket && session?.user?.id) {
      socket.emit("join", String(session.user.id));
    }
  }, [socket, session]);

  
  useEffect(() => {
    if (!socket) return;

    socket.on("receive_message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off("receive_message");
  }, [socket]);

  useEffect(() => {
  if (!socket) return;

  socket.on("online_users", (users) => {
    setOnlineUsers(users);
  });

  return () => socket.off("online_users");
}, [socket]);

 
  useEffect(() => {
    if (!receiver?.id) return;

      fetch(`/api/messages?userId=${receiver.id}`)
  .then(res => res.json())
  .then(data => {
    setMessages(data);
  });
  }, [receiver]);

useEffect(() => {
  if (!socket || !receiver?.id || !session?.user?.id) return;

  const timeout = setTimeout(() => {
    socket.emit("mark_seen", { senderId: receiver.id });

    fetch("/api/messages/seen", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ senderId: receiver.id }),
});
  }, 500);

  return () => clearTimeout(timeout);
}, [receiver, socket, session]);

useEffect(() => {
  if (!socket || !session?.user?.id) return;

  socket.on("message_seen", () => {
    setMessages(prev =>
      prev.map(m =>
        m.senderId?.toString() === session.user.id
          ? { ...m, seen: true }
          : m
      )
    );
  });

  return () => socket.off("message_seen");
}, [socket, session]);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    await fetch("/api/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ receiverId: receiver.id, text }),
});

    socket.emit("send_message", {
      senderId: session.user.id,
      receiverId: receiver.id,
      text,
    });

    setMessages(prev => [
      ...prev,
      {
        text,
        senderId: session.user.id,
        createdAt: new Date(),
      },
    ]);

    setText("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      
    
      <div className="p-4 bg-white shadow flex items-center gap-3">
        <img src={receiver.image} className="w-10 h-10 rounded-full" />
        <div>
          <p className="font-semibold">{receiver.name}</p>
          <p className="text-xs text-gray-500">
  {onlineUsers.includes(String(receiver.id)) ? "🟢 Online" : "⚫ Offline"}
</p>
        </div>
      </div>

    
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => {
         const isMe = String(m.senderId) === String(session?.user?.id);

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-gray-300 text-gray-800 rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                <p>{m.text}</p>

                <p className="text-[10px] mt-1 opacity-70 text-right">
                  {new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {isMe && (
  <p
    className={`text-[10px] text-right ${
      m.seen ? "text-blue-700" : "text-white"
    }`}
  >
    ✓✓
  </p>
)}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

     
      <div className="p-3 bg-white flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-full px-4 py-2"
          placeholder="Type a message..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-5 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
}