"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSwipeable } from "react-swipeable";

import FriendsSidebar from "./FriendsSidebar";
import ChatBox from "./ChatBox";
import Navbar from "./Navbar";

export default function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const searchParams = useSearchParams();
  const userIdFromURL = searchParams.get("userId");

  useEffect(() => {
    if (!userIdFromURL) {
      setLoadingUser(false);
      return;
    }

    fetch(`/api/users/${userIdFromURL}`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.error) {
          setLoadingUser(false);
          return;
        }

        setSelectedUser(data);
        setLoadingUser(false);
      })
      .catch(() => setLoadingUser(false));
  }, [userIdFromURL]);

  // 👉 Swipe gestures
  const handlers = useSwipeable({
    onSwipedRight: () => setSidebarOpen(true),
    onSwipedLeft: () => setSidebarOpen(false),
    trackMouse: true,
  });

  return (
    <>
      <Navbar />

      {/* MAIN LAYOUT */}
      <div {...handlers} className="flex h-[calc(100vh-64px)] relative overflow-hidden">

        {/* 💻 DESKTOP SIDEBAR */}
        <div className="hidden md:block md:w-[320px] border-r h-full">
          <FriendsSidebar
            onSelect={setSelectedUser}
            selectedId={selectedUser?.id}
          />
        </div>

        {/* 📱 MOBILE SIDEBAR */}
        <div
          className={`
            fixed top-[64px] left-0 h-[calc(100vh-64px)] w-3/4 bg-[#0f172a] z-50 shadow-lg
            transform transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:hidden
          `}
        >
          <FriendsSidebar
            onSelect={(user) => {
              setSelectedUser(user);
              setSidebarOpen(false); // close after select
            }}
            selectedId={selectedUser?.id}
          />
        </div>

        {/* 🔲 OVERLAY */}
        {sidebarOpen && (
          <div
            className="fixed top-[64px] left-0 w-full h-[calc(100vh-64px)] bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 💬 CHAT AREA */}
        <div className="flex-1 h-full overflow-hidden">
          {loadingUser ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading chat...
            </div>
          ) : selectedUser ? (
            <ChatBox receiver={selectedUser} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a friend to start chatting 💬
            </div>
          )}
        </div>
      </div>
    </>
  );
}