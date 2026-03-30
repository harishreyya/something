"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Search", href: "/search" },
    { name: "Friends", href: "/friends" },
  ];

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-gray-900 text-white shadow-md">
      
      <h1 className="text-xl font-bold">SocialApp</h1>

      <div className="flex gap-6 items-center">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition ${
              pathname === link.href
                ? "text-blue-400"
                : "text-gray-300 hover:text-white"
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="flex gap-4 items-center">
        <NotificationBell />

        {session?.user && (
          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg">
            <img
              src={session.user.image}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm">{session.user.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}