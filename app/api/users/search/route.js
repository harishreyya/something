import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json([], { status: 401 });

  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) return Response.json([]);

  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        { NOT: { id: userId } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
    },
  });

  const friendIds = new Set(
    friendships.map(f =>
      f.user1Id === userId ? f.user2Id : f.user1Id
    )
  );

  const requests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    },
  });

  const result = users.map(user => {
    let status = "NONE";

    if (friendIds.has(user.id)) {
      status = "FRIENDS";
    } else {
      const req = requests.find(
        r =>
          (r.senderId === userId && r.receiverId === user.id) ||
          (r.senderId === user.id && r.receiverId === userId)
      );

      if (req) {
        if (req.status === "PENDING") {
          status = "PENDING";
        }
      }
    }

    return {
      ...user,
      status,
    };
  });

  return Response.json(result);
}