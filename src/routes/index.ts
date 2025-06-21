import { Router } from "express";
import { userRoutes } from "./user-routes";
import { sessionsRoutes } from "./sessions-routes";
import { taskRoutes } from "./task-routes";
import { teamRoutes } from "./team-routes";

const routes = Router();

routes.use("/users", userRoutes);
routes.use("/sessions", sessionsRoutes);
routes.use("/task", taskRoutes);
routes.use("/team", teamRoutes);

export { routes };
