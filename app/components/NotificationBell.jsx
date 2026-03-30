"use client";
import { useEffect, useState } from "react";

export default function NotificationBell() {
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/friend-request/list")
      .then(res => res.json())
      .then(setRequests);
  }, []);

  const accept = async (id) => {
    await fetch("/api/friend-request/accept", {
      method: "POST",
      body: JSON.stringify({ requestId: id }),
    });

    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const reject = async (id) => {
    await fetch("/api/friend-request/reject", {
      method: "POST",
      body: JSON.stringify({ requestId: id }),
    });

    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative">
        🔔
        {requests.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-xs px-2 rounded-full">
            {requests.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded-xl shadow-lg p-4">
          <h3 className="font-semibold mb-2">Notifications</h3>

          {requests.length === 0 && <p>No requests</p>}

          {requests.map(r => (
            <div key={r.id} className="flex items-center gap-3 mb-3">
              <img src={r.sender.image} className="w-8 h-8 rounded-full" />
              
              <div className="flex-1">
                <p className="text-sm">{r.sender.name}</p>

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => accept(r.id)}
                    className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => reject(r.id)}
                    className="bg-gray-300 px-2 py-1 rounded text-xs"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}