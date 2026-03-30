import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({}, { status: 401 });

  const { receiverId, text } = await req.json();

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      text,
    },
  });

  return Response.json(message);
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        {
          senderId: session.user.id,
          receiverId: userId,
        },
        {
          senderId: userId,
          receiverId: session.user.id,
        },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(messages);
}