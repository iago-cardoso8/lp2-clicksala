import { prisma } from '../database/prismaClient.js';

export async function findByEmail(email: string) {
  return prisma.usuario.findUnique({ where: { email } });
}

export async function findById(id: number) {
  return prisma.usuario.findUnique({ where: { id } });
}

export async function createUser(data: { nome: string; email: string; senha: string }) {
  return prisma.usuario.create({ data });
}

export default { findByEmail, findById, createUser };
