import request from "supertest";
import { app } from "../app";
import { prisma } from "../database/prisma";
import { createTestTeam, createTestUser, createTestTask } from "./setup";

describe("Teams Controller", () => {
  beforeEach(async () => {
    await prisma.taskHistory.deleteMany();
    await prisma.task.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("GET /team", () => {
    it("should list all teams", async () => {
      // Criar algumas equipes
      const team1 = await createTestTeam({
        name: "Frontend Team",
        description: "Frontend development team",
      });

      const team2 = await createTestTeam({
        name: "Backend Team",
        description: "Backend development team",
      });

      const response = await request(app).get("/team").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe(team1.name);
      expect(response.body[1].name).toBe(team2.name);
    });

    it("should return empty array when no teams exist", async () => {
      const response = await request(app).get("/team").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe("POST /team", () => {
    it("should create a new team successfully", async () => {
      const teamData = {
        name: "Frontend Team",
        description: "Team responsible for frontend development",
      };

      const response = await request(app)
        .post("/team")
        .send(teamData)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe(teamData.name);
      expect(response.body.description).toBe(teamData.description);
      expect(response.body).toHaveProperty("createdAt");
    });

    it("should not create team with short name", async () => {
      const teamData = {
        name: "FT",
        description: "Team description",
      };

      const response = await request(app)
        .post("/team")
        .send(teamData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not create team with short description", async () => {
      const teamData = {
        name: "Frontend Team",
        description: "Short",
      };

      const response = await request(app)
        .post("/team")
        .send(teamData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not create team without required fields", async () => {
      const teamData = {
        name: "Frontend Team",
        // description missing
      };

      const response = await request(app)
        .post("/team")
        .send(teamData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("DELETE /team/:id", () => {
    it("should delete team successfully", async () => {
      const team = await createTestTeam({
        name: "Frontend Team",
        description: "Frontend development team",
      });

      const response = await request(app)
        .delete(`/team/${team.id}`)
        .expect(200);

      // Verificar se a equipe foi realmente deletada
      const deletedTeam = await prisma.team.findUnique({
        where: { id: team.id },
      });

      expect(deletedTeam).toBeNull();
    });

    it("should not delete team with invalid ID", async () => {
      const invalidId = "invalid-uuid";

      const response = await request(app)
        .delete(`/team/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not delete team that does not exist", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .delete(`/team/${nonExistentId}`)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });

    it("should not delete team with open tasks", async () => {
      // Criar equipe
      const team = await createTestTeam({
        name: "Frontend Team",
        description: "Frontend development team",
      });

      // Criar usuário
      const user = await createTestUser({
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      });

      // Criar tarefa associada à equipe
      await createTestTask({
        title: "Implement login",
        description: "Create login functionality",
        assignedTo: user.id,
        teamId: team.id,
      });

      const response = await request(app)
        .delete(`/team/${team.id}`)
        .expect(401);

      expect(response.body.message).toBe(
        "You have open tasks for this team. Complete the tasks before deleting the team."
      );

      // Verificar se a equipe ainda existe
      const teamStillExists = await prisma.team.findUnique({
        where: { id: team.id },
      });

      expect(teamStillExists).toBeTruthy();
    });
  });

  describe("POST /team/:teamId/members", () => {
    it("should add member to team successfully", async () => {
      const team = await createTestTeam({
        name: "Frontend Team",
        description: "Frontend development team",
      });

      const user = await createTestUser({
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      });

      const response = await request(app)
        .post(`/team/${team.id}/members`)
        .send({ userId: user.id })
        .expect(200);

      // Verificar se o membro foi adicionado
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: team.id,
          userId: user.id,
        },
      });

      expect(teamMember).toBeTruthy();
    });

    it("should not add member with invalid team ID", async () => {
      const user = await createTestUser({
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      });

      const invalidTeamId = "invalid-uuid";

      const response = await request(app)
        .post(`/team/${invalidTeamId}/members`)
        .send({ userId: user.id })
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not add member with invalid user ID", async () => {
      const team = await createTestTeam({
        name: "Frontend Team",
        description: "Frontend development team",
      });

      const invalidUserId = "invalid-uuid";

      const response = await request(app)
        .post(`/team/${team.id}/members`)
        .send({ userId: invalidUserId })
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not add member to non-existent team", async () => {
      const user = await createTestUser({
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      });

      const nonExistentTeamId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .post(`/team/${nonExistentTeamId}/members`)
        .send({ userId: user.id })
        .expect(401);

      expect(response.body.message).toBe("Team not found");
    });

    it("should not add non-existent user to team", async () => {
      const team = await createTestTeam({
        name: "Frontend Team",
        description: "Frontend development team",
      });

      const nonExistentUserId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .post(`/team/${team.id}/members`)
        .send({ userId: nonExistentUserId })
        .expect(401);

      expect(response.body.message).toBe("User not found");
    });
  });
});
