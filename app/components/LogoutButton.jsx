"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="mt-6 bg-red-500 px-6 py-2 rounded-lg hover:bg-red-600 transition"
    >
      Logout
    </button>
  );
}