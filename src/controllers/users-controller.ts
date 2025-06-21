import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { hash } from "bcrypt";
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

class UsersController {
  async create(request: Request, response: Response, next: NextFunction) {
    const bodySchema = z.object({
      name: z.string().min(6),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["admin", "member"]).optional(),
    });

    const { name, email, password, role } = bodySchema.parse(request.body);

    const userWithEmail = await prisma.user.findFirst({ where: { email } });

    if (userWithEmail) {
      throw new AppError("Email is already use");
    }

    const hashedPassword = await hash(password, 8);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "member",
      },
    });

    const { password: _, ...userWithNoPassword } = user;

    return response.json(userWithNoPassword);
  }
}

export { UsersController };
