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
    <div className="w-full h-full overflow-y-auto bg-[#0f172a] text-white">

      {/* HEADER */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold">Chats</h2>
      </div>

      {/* FRIEND LIST */}
      <div className="flex flex-col">
        {friends.map((f) => {
          const isActive = selectedId === f.id;

          return (
            <div
              key={f.id}
              onClick={() => onSelect(f)}
              className={`
                flex items-center gap-3 px-4 py-3 cursor-pointer transition
                ${isActive ? "bg-gray-800" : "hover:bg-gray-800/70"}
              `}
            >
              {/* AVATAR */}
              <img
                src={f.image}
                className="w-10 h-10 rounded-full object-cover"
              />

              {/* INFO */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {f.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {f.email}
                </p>
              </div>

              {/* ACTIVE DOT */}
              {isActive && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          );
        })}

        {friends.length === 0 && (
          <p className="text-center text-gray-400 mt-6 text-sm">
            No chats yet
          </p>
        )}
      </div>
    </div>
  );
}