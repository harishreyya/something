"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FriendsSidebar from "./FriendsSidebar";
import ChatBox from "./ChatBox";
import Navbar from "./Navbar";

export default function ChatLayout() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

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
    .catch(() => {
      setLoadingUser(false);
    });
}, [userIdFromURL]);

  return (
    <><Navbar/>
    <div className="flex h-screen">
      <div className="hidden md:block md:w-1/4">
    <FriendsSidebar
      onSelect={setSelectedUser}
      selectedId={selectedUser?.id}
    />
  </div>

      <div className="flex-1">
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