import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const { senderId } = await req.json();

  await prisma.message.updateMany({
    where: {
      senderId,
      receiverId: session.user.id,
      seen: false,
    },
    data: {
      seen: true,
    },
  });

  return Response.json({ success: true });
}