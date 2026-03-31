"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Search", href: "/search" },
    { name: "Friends", href: "/friends" },
    { name: "Chat", href: "/chat" },
  ];

  return (
    <div className="bg-gray-900 text-white shadow-md">
      
     
      <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4">
        
   
        <h1 className="text-lg md:text-xl font-bold">
          SocialApp
        </h1>

        <div className="hidden md:flex gap-6 items-center">
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

        <div className="flex items-center gap-3 md:gap-4">
          <NotificationBell />

          {session?.user && (
            <div className="hidden md:flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-lg">
              <img
                src={session.user.image}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm">
                {session.user.name}
              </span>
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-xl"
          >
            ☰
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 space-y-3 bg-gray-800">
          
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block text-sm font-medium ${
                pathname === link.href
                  ? "text-blue-400"
                  : "text-gray-300"
              }`}
            >
              {link.name}
            </Link>
          ))}

          {session?.user && (
            <div className="flex items-center gap-2 mt-3 border-t border-gray-700 pt-3">
              <img
                src={session.user.image}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm">
                {session.user.name}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}