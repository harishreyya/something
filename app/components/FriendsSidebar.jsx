"use client";

import { useEffect, useState } from "react";

export default function FriendsSidebar({ onSelect, selectedId }) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetch("/api/friends")
      .then(res => res.json())
      .then(setFriends);
  }, []);

  return (
    <div className="w-1/4 border-r h-screen overflow-y-auto bg-gray-900 text-white">
      <h2 className="p-4 font-bold text-lg">Chats</h2>

      {friends.map(f => (
        <div
          key={f.id}
          onClick={() => onSelect(f)}
          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-800 ${
            selectedId === f.id ? "bg-gray-800" : ""
          }`}
        >
          <img src={f.image} className="w-10 h-10 rounded-full" />
          <div>
            <p className="text-sm font-medium">{f.name}</p>
            <p className="text-xs text-gray-400">{f.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}