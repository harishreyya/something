import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { friendId } = await req.json();
  const userId = session.user.id;

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { user1Id: userId, user2Id: friendId },
        { user1Id: friendId, user2Id: userId },
      ],
    },
  });

  if (!friendship) {
    return Response.json({ error: "Not friends" }, { status: 400 });
  }

  await prisma.friendship.delete({
    where: { id: friendship.id },
  });

  return Response.json({ success: true });
}