import { prisma } from "../../lib/prisma.js";

export async function create(data) {
  return prisma.attachment.create({ data });
}

export async function findById(id) {
  return prisma.attachment.findUnique({ where: { id } });
}
