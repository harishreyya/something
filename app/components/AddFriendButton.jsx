"use client";
import { useState } from "react";

export default function AddFriendButton({ userId, status }) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const sendRequest = async () => {
    setLoading(true);

    const res = await fetch("/api/friend-request/send", {
      method: "POST",
      body: JSON.stringify({ receiverId: userId }),
    });

    if (res.ok) {
      setCurrentStatus("PENDING");
    }

    setLoading(false);
  };

  if (currentStatus === "FRIENDS") {
    return (
      <button className="px-4 py-2 bg-green-500 text-white rounded-lg cursor-default">
        Friends ✓
      </button>
    );
  }

  if (currentStatus === "PENDING") {
    return (
      <button className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed">
        Pending
      </button>
    );
  }

  return (
    <button
      onClick={sendRequest}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
    >
      {loading ? "Sending..." : "Add Friend"}
    </button>
  );
}