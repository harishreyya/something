import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId } = await req.json();

  if (!receiverId) {
    return Response.json({ error: "Receiver required" }, { status: 400 });
  }

  if (receiverId === session.user.id) {
    return Response.json({ error: "Cannot send to yourself" }, { status: 400 });
  }


  const existingFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: session.user.id, user2Id: receiverId },
        { user1Id: receiverId, user2Id: session.user.id },
      ],
    },
  });

  if (existingFriend) {
    return Response.json({ error: "Already friends" }, { status: 400 });
  }

  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      senderId: session.user.id,
      receiverId,
    },
  });

  if (existingRequest) {
    return Response.json({ error: "Request already sent" }, { status: 400 });
  }

  const request = await prisma.friendRequest.create({
    data: {
      senderId: session.user.id,
      receiverId,
    },
  });

  return Response.json(request);
}