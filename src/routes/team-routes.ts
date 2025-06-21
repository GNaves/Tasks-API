import { TeamController } from "@/controllers/team-controller";
import { EnsureAuthenticator } from "@/middlewares/ensure-authenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";
import { Router } from "express";

const teamRoutes = Router();
const teamController = new TeamController();

teamRoutes.use(EnsureAuthenticator);

teamRoutes.post("/", verifyUserAuthorization(["admin"]), teamController.create);
teamRoutes.get(
  "/",
  verifyUserAuthorization(["admin", "member"]),
  teamController.index
);
teamRoutes.delete(
  "/:id",
  verifyUserAuthorization(["admin"]),
  teamController.delete
);

export { teamRoutes };
