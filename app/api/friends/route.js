import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
    },
  });

  const friendIds = friendships.map(f =>
    f.user1Id === userId ? f.user2Id : f.user1Id
  );

  const friends = await prisma.user.findMany({
    where: {
      id: { in: friendIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  return Response.json(friends);
}