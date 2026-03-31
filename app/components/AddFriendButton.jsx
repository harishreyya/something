"use client";
import { useState } from "react";

export default function AddFriendButton({ userId, status }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [loading, setLoading] = useState(false);

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

  const unfriend = async () => {
    setLoading(true);

    await fetch("/api/friends/unfriend", {
      method: "POST",
      body: JSON.stringify({ friendId: userId }),
    });

    setCurrentStatus("NONE");
    setLoading(false);
  };

  
  if (currentStatus === "FRIENDS") {
    return (
      <button
        onClick={unfriend}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        Unfriend
      </button>
    );
  }

  if (currentStatus === "PENDING") {
    return (
      <button className="px-4 py-2 bg-gray-400 text-white rounded-lg">
        Pending
      </button>
    );
  }


  return (
    <button
      onClick={sendRequest}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      {loading ? "Sending..." : "Add Friend"}
    </button>
  );
}