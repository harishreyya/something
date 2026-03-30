import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json([], { status: 401 });

  const requests = await prisma.friendRequest.findMany({
    where: {
      receiverId: session.user.id,
      status: "PENDING",
    },
    include: {
      sender: true,
    },
  });

  return Response.json(requests);
}