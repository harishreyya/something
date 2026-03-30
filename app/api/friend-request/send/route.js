import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId } = await req.json();
  const senderId = session.user.id;

  if (receiverId === senderId) {
    return Response.json({ error: "Cannot send to yourself" }, { status: 400 });
  }

  const existingFriend = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: senderId, user2Id: receiverId },
        { user1Id: receiverId, user2Id: senderId },
      ],
    },
  });

  if (existingFriend) {
    return Response.json({ error: "Already friends" }, { status: 400 });
  }

  const existingRequest = await prisma.friendRequest.findFirst({
    where: {
      senderId,
      receiverId,
    },
  });

  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      return Response.json({ error: "Request already sent" }, { status: 400 });
    }

    const updated = await prisma.friendRequest.update({
      where: { id: existingRequest.id },
      data: { status: "PENDING" },
    });

    return Response.json(updated);
  }

  const request = await prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
    },
  });

  return Response.json(request);
}