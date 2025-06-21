import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

class TaskStatusController {
  async update(request: Request, response: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      status: z.enum(["pending", "inProgress", "completed"]),
    });

    const { id } = paramsSchema.parse(request.params);
    const { status } = bodySchema.parse(request.body);

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new AppError("task not found", 404);
    }

    if (!request.user?.id) {
      throw new AppError("User not authenticated", 401);
    }

    const oldStatus = task?.status;

    if (task.status === "completed") {
      throw new AppError("Task is already completed");
    }

    await prisma.taskHistory.create({
      data: {
        newStatus: status,
        oldStatus,
        taskId: id,
        changedBy: request.user?.id,
      },
    });

    const taskStatus = await prisma.task.update({
      data: { status },
      where: { id },
    });

    return response.json(taskStatus);
  }
}

export { TaskStatusController };
