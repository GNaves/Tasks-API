import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

beforeAll(async () => {
  // Limpar banco de dados antes dos testes
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Função helper para criar usuário de teste
export const createTestUser = async (userData?: {
  name?: string;
  email?: string;
  password?: string;
  role?: "admin" | "member";
}) => {
  const defaultData = {
    name: "Test User",
    email: "test@example.com",
    password: "123456",
    role: "member" as const,
  };

  const data = { ...defaultData, ...userData };
  const hashedPassword = await hash(data.password, 8);

  return await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });
};

// Função helper para criar equipe de teste
export const createTestTeam = async (teamData?: {
  name?: string;
  description?: string;
}) => {
  const defaultData = {
    name: "Test Team",
    description: "Test team description",
  };

  const data = { ...defaultData, ...teamData };

  return await prisma.team.create({
    data,
  });
};

// Função helper para criar tarefa de teste
export const createTestTask = async (taskData?: {
  title?: string;
  description?: string;
  assignedTo?: string;
  teamId?: string;
}) => {
  const defaultData = {
    title: "Test Task",
    description: "Test task description",
  };

  const data = { ...defaultData, ...taskData };

  return await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      assignedTo: data.assignedTo!,
      teamId: data.teamId!,
    },
  });
};
