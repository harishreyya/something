import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { requestId } = await req.json();

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request || request.receiverId !== session.user.id) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED" },
  });

  await prisma.friendship.create({
    data: {
      user1Id: request.senderId,
      user2Id: request.receiverId,
    },
  });

  return Response.json({ success: true });
}