import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

class TeamController {
  async index(request: Request, response: Response, next: NextFunction) {
    const task = await prisma.team.findMany({});

    return response.json(task);
  }

  async create(request: Request, response: Response, next: NextFunction) {
    const bodySchema = z.object({
      name: z.string().min(3),
      description: z.string().min(6),
    });

    const { name, description } = bodySchema.parse(request.body);

    const team = await prisma.team.create({ data: { name, description } });

    return response.json(team);
  }

  async delete(request: Request, response: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    // Check if team exists
    const team = await prisma.team.findUnique({ where: { id } });

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    const hasTask = await prisma.task.findFirst({ where: { teamId: id } });

    if (hasTask) {
      throw new AppError(
        "You have open tasks for this team. Complete the tasks before deleting the team.",
        401
      );
    }

    await prisma.team.delete({ where: { id } });

    return response.json();
  }
}

export { TeamController };
