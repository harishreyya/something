"use client";
import { useEffect, useState } from "react";

export default function FriendList() {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetch("/api/friends")
      .then(res => res.json())
      .then(setFriends);
  }, []);

  return (
    <div className="grid gap-4">
      {friends.map(f => (
        <div key={f.id} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow">
          <img src={f.image} className="w-10 h-10 rounded-full" />
          <p>{f.name}</p>
        </div>
      ))}
    </div>
  );
}