import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const { requestId } = await req.json();

  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  return Response.json({ success: true });
}