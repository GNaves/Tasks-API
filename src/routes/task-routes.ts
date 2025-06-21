import { TaskController } from "@/controllers/task-controller";
import { TaskStatusController } from "@/controllers/task-status-controller";
import { TaskPriorityController } from "@/controllers/task-priority-controller";
import { EnsureAuthenticator } from "@/middlewares/ensure-authenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";
import { Router } from "express";

const taskRoutes = Router();
const taskController = new TaskController();
const taskStatusController = new TaskStatusController();
const taskPriorityController = new TaskPriorityController();

taskRoutes.post("/", taskController.create);
taskRoutes.get("/", taskController.index);
taskRoutes.patch(
  "/:id/status",
  EnsureAuthenticator,
  verifyUserAuthorization(["admin"]),
  taskStatusController.update
);
taskRoutes.patch(
  "/:id/priority",
  EnsureAuthenticator,
  verifyUserAuthorization(["admin"]),
  taskPriorityController.update
);
taskRoutes.patch(
  "/:id/updateByUser",
  EnsureAuthenticator,
  taskController.update
);
taskRoutes.delete("/:id", taskController.delete);

export { taskRoutes };
