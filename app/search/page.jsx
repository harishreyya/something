import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import SearchUsers from "../components/SearchUsers";

export default async function SearchPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Find Friends</h1>

        <SearchUsers/>
      </div>
    </div>
  );
}