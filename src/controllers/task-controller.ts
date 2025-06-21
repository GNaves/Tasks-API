import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

class TaskController {
  async index(request: Request, response: Response, next: NextFunction) {
    const task = await prisma.task.findMany({
      include: { taskHistory: true, team: true },
    });

    return response.json(task);
  }

  async create(request: Request, response: Response, next: NextFunction) {
    const bodySchema = z.object({
      title: z.string().min(6),
      description: z.string().min(6),
      assigned_to: z.string().uuid(),
      team_id: z.string().uuid(),
    });

    const { title, description, assigned_to, team_id } = bodySchema.parse(
      request.body
    );

    // Check if user exists first
    const userId = await prisma.user.findFirst({ where: { id: assigned_to } });
    if (!userId) {
      throw new AppError("User not found", 404);
    }

    // Check if team exists
    const team = await prisma.team.findFirst({ where: { id: team_id } });
    if (!team) {
      throw new AppError("Team not found", 404);
    }

    const task = await prisma.task.create({
      data: { title, description, assignedTo: assigned_to, teamId: team_id },
    });

    return response.status(201).json(task);
  }

  async update(request: Request, response: Response, next: NextFunction) {
    const bodySchema = z.object({
      title: z.string(),
      description: z.string(),
      status: z.enum(["pending", "inProgress", "completed"]),
      priority: z.enum(["low", "medium", "high"]),
    });

    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const { title, description, status, priority } = bodySchema.parse(
      request.body
    );

    if (!request.user?.id) {
      throw new AppError("User not authenticated", 401);
    }

    const task = await prisma.task.findFirst({
      where: { id },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    if (task.assignedTo !== request.user.id) {
      throw new AppError("You can only modify your own task", 403);
    }

    const taskUpdateByUser = await prisma.task.update({
      data: { title, description, status, priority },
      where: { id },
    });

    return response.json(taskUpdateByUser);
  }

  async delete(request: Request, response: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const task = await prisma.task.findFirst({
      where: { id },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    await prisma.task.delete({ where: { id } });

    return response.json();
  }
}

export { TaskController };
