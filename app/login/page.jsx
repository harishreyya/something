"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white">
      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-2xl shadow-2xl w-[350px] text-center">
        
        <h1 className="text-3xl font-bold mb-6">Welcome Back</h1>

        <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-200 shadow-md"
        >
          Continue with Google
        </button>

        <p className="text-sm mt-6 text-gray-300">
          Secure login powered by OAuth
        </p>
      </div>
    </div>
  );
}