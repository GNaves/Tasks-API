import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

class TaskPriorityController {
  async update(request: Request, response: Response, next: NextFunction) {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      priority: z.enum(["low", "medium", "high"]),
    });

    const { id } = paramsSchema.parse(request.params);
    const { priority } = bodySchema.parse(request.body);

    const taskPriority = await prisma.task.update({
      data: { priority },
      where: { id },
    });

    return response.json(taskPriority);
  }
}

export { TaskPriorityController };
