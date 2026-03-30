"use client"; 

import { useSession } from "next-auth/react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-gray-900 text-white">
      <h1>SocialApp</h1>

      <div className="flex gap-4 items-center">
        <NotificationBell />

        {session?.user && (
          <div className="flex items-center gap-2">
            <img src={session.user.image} className="w-8 h-8 rounded-full" />
            <span>{session.user.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}