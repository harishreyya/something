import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "./components/LogoutButton";
import Navbar from "./components/Navbar";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
    <Navbar/>
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      
      
      <img
        src={session.user.image}
        className="w-24 h-24 rounded-full mb-4 border-4 border-white"
      />

      <h1 className="text-3xl font-bold">
        Hello, {session.user.name}
      </h1>

      <LogoutButton />
    </div>
    </>
  );
}