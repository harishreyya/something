"use client";

import { useEffect, useState } from "react";

export default function FriendList() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/friends")
      .then(res => res.json())
      .then(data => {
        setFriends(data);
        setLoading(false);
      });
  }, []);

  const unfriend = async (friendId) => {
    const confirm = window.confirm("Are you sure you want to unfriend?");
    if (!confirm) return;

    await fetch("/api/friends/unfriend", {
      method: "POST",
      body: JSON.stringify({ friendId }),
    });

    setFriends(prev => prev.filter(f => f.id !== friendId));
  };

  if (loading) {
    return <p className="text-gray-500">Loading friends...</p>;
  }

  if (friends.length === 0) {
    return <p className="text-gray-500">No friends yet 😢</p>;
  }

  return (
    <div className="grid gap-4">
      {friends.map((f) => (
        <div
          key={f.id}
          className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center gap-4">
            <img
              src={f.image}
              className="w-12 h-12 rounded-full object-cover"
            />

            <div>
              <p className="font-semibold text-gray-800">{f.name}</p>
              <p className="text-sm text-gray-500">{f.email}</p>

              <span className="text-xs text-green-600 font-medium">
                Friends
              </span>
            </div>
          </div>

          <button
            onClick={() => unfriend(f.id)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
          >
            Unfriend
          </button>
        </div>
      ))}
    </div>
  );
}