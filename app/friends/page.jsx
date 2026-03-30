import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import FriendList from "../components/FriendList";
import Navbar from "../components/Navbar";

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar /> 

      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your Friends</h1>
        <FriendList />
      </div>
    </div>
  );
}