import { Router } from "express";
import { UsersController } from "@/controllers/users-controller";

const userRoutes = Router();
const userController = new UsersController();

userRoutes.post("/", userController.create);

export { userRoutes };
