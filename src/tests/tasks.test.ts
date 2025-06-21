import request from "supertest";
import { app } from "../app";
import { prisma } from "../database/prisma";
import { createTestTeam, createTestUser, createTestTask } from "./setup";
import { sign } from "jsonwebtoken";
import { authConfig } from "../config/auth";

describe("Tasks Controller", () => {
  let testUser: any;
  let testTeam: any;
  let authToken: string;

  beforeEach(async () => {
    await prisma.taskHistory.deleteMany();
    await prisma.task.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();

    // Criar usuário e equipe para os testes
    testUser = await createTestUser({
      name: "John Doe",
      email: "john@example.com",
      password: "123456",
    });

    testTeam = await createTestTeam({
      name: "Frontend Team",
      description: "Frontend development team",
    });

    // Gerar token de autenticação
    authToken = sign(
      { role: testUser.role, sub: testUser.id },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.expiresIn }
    );
  });

  describe("GET /task", () => {
    it("should list all tasks", async () => {
      // Criar algumas tarefas
      const task1 = await createTestTask({
        title: "Implement login",
        description: "Create login functionality",
        assignedTo: testUser.id,
        teamId: testTeam.id,
      });

      const task2 = await createTestTask({
        title: "Create dashboard",
        description: "Build user dashboard",
        assignedTo: testUser.id,
        teamId: testTeam.id,
      });

      const response = await request(app).get("/task").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe(task1.title);
      expect(response.body[1].title).toBe(task2.title);
    });

    it("should return empty array when no tasks exist", async () => {
      const response = await request(app).get("/task").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it("should include task history and team information", async () => {
      const task = await createTestTask({
        title: "Implement login",
        description: "Create login functionality",
        assignedTo: testUser.id,
        teamId: testTeam.id,
      });

      const response = await request(app).get("/task").expect(200);

      expect(response.body[0]).toHaveProperty("taskHistory");
      expect(response.body[0]).toHaveProperty("team");
      expect(Array.isArray(response.body[0].taskHistory)).toBe(true);
    });
  });

  describe("POST /task", () => {
    it("should create a new task successfully", async () => {
      const taskData = {
        title: "Implement login",
        description: "Create login functionality",
        assigned_to: testUser.id,
        team_id: testTeam.id,
      };

      const response = await request(app)
        .post("/task")
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
      expect(response.body.assignedTo).toBe(taskData.assigned_to);
      expect(response.body.teamId).toBe(taskData.team_id);
      expect(response.body.status).toBe("pending");
      expect(response.body.priority).toBe("low");
    });

    it("should not create task with short title", async () => {
      const taskData = {
        title: "Short",
        description: "Create login functionality",
        assigned_to: testUser.id,
        team_id: testTeam.id,
      };

      const response = await request(app)
        .post("/task")
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not create task with short description", async () => {
      const taskData = {
        title: "Implement login",
        description: "Short",
        assigned_to: testUser.id,
        team_id: testTeam.id,
      };

      const response = await request(app)
        .post("/task")
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not create task with invalid user ID", async () => {
      const taskData = {
        title: "Implement login",
        description: "Create login functionality",
        assigned_to: "invalid-uuid",
        team_id: testTeam.id,
      };

      const response = await request(app)
        .post("/task")
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not create task with invalid team ID", async () => {
      const taskData = {
        title: "Implement login",
        description: "Create login functionality",
        assigned_to: testUser.id,
        team_id: "invalid-uuid",
      };

      const response = await request(app)
        .post("/task")
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not create task with non-existent user", async () => {
      const nonExistentUserId = "00000000-0000-0000-0000-000000000000";

      const taskData = {
        title: "Implement login",
        description: "Create login functionality",
        assigned_to: nonExistentUserId,
        team_id: testTeam.id,
      };

      const response = await request(app)
        .post("/task")
        .send(taskData)
        .expect(404);

      expect(response.body.message).toBe("User not found");
    });

    it("should not create task with non-existent team", async () => {
      const nonExistentTeamId = "00000000-0000-0000-0000-000000000000";

      const taskData = {
        title: "Implement login",
        description: "Create login functionality",
        assigned_to: testUser.id,
        team_id: nonExistentTeamId,
      };

      const response = await request(app)
        .post("/task")
        .send(taskData)
        .expect(404);

      expect(response.body.message).toBe("Team not found");
    });
  });

  describe("PATCH /task/:id/updateByUser", () => {
    it("should update task successfully", async () => {
      const task = await createTestTask({
        title: "Implement login",
        description: "Create login functionality",
        assignedTo: testUser.id,
        teamId: testTeam.id,
      });

      const updateData = {
        title: "Updated login implementation",
        description: "Updated description",
        status: "inProgress",
        priority: "high",
      };

      const response = await request(app)
        .patch(`/task/${task.id}/updateByUser`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.priority).toBe(updateData.priority);
    });

    it("should not update task without authentication", async () => {
      const task = await createTestTask({
        title: "Implement login",
        description: "Create login functionality",
        assignedTo: testUser.id,
        teamId: testTeam.id,
      });

      const updateData = {
        title: "Updated title",
        description: "Updated description",
        status: "inProgress",
        priority: "high",
      };

      const response = await request(app)
        .patch(`/task/${task.id}/updateByUser`)
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe("Invalid JWT Token");
    });

    it("should not update task assigned to another user", async () => {
      // Criar outro usuário
      const otherUser = await createTestUser({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "123456",
      });

      // Criar tarefa atribuída ao outro usuário
      const task = await createTestTask({
        title: "Implement login",
        description: "Create login functionality",
        assignedTo: otherUser.id,
        teamId: testTeam.id,
      });

      const updateData = {
        title: "Updated title",
        description: "Updated description",
        status: "inProgress",
        priority: "high",
      };

      const response = await request(app)
        .patch(`/task/${task.id}/updateByUser`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toBe("You can only modify your own task");
    });

    it("should not update task that does not exist", async () => {
      const nonExistentTaskId = "00000000-0000-0000-0000-000000000000";

      const updateData = {
        title: "Updated title",
        description: "Updated description",
        status: "inProgress",
        priority: "high",
      };

      const response = await request(app)
        .patch(`/task/${nonExistentTaskId}/updateByUser`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe("Task not found");
    });

    it("should not update task with invalid status", async () => {
      const task = await createTestTask({
        title: "Implement login",
        description: "Create login functionality",
        assignedTo: testUser.id,
        teamId: testTeam.id,
      });

      const updateData = {
        title: "Updated title",
        description: "Updated description",
        status: "invalid-status",
        priority: "high",
      };

      const response = await request(app)
        .patch(`/task/${task.id}/updateByUser`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not update task with invalid priority", async () => {
      const task = await createTestTask({
        title: "Implement login",
        description: "Create login functionality",
        assignedTo: testUser.id,
        teamId: testTeam.id,
      });

      const updateData = {
        title: "Updated title",
        description: "Updated description",
        status: "inProgress",
        priority: "invalid-priority",
      };

      const response = await request(app)
        .patch(`/task/${task.id}/updateByUser`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("DELETE /task/:id", () => {
    it("should delete task successfully", async () => {
      const task = await createTestTask({
        title: "Implement login",
        description: "Create login functionality",
        assignedTo: testUser.id,
        teamId: testTeam.id,
      });

      const response = await request(app)
        .delete(`/task/${task.id}`)
        .expect(200);

      // Verificar se a tarefa foi realmente deletada
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id },
      });

      expect(deletedTask).toBeNull();
    });

    it("should not delete task with invalid ID", async () => {
      const invalidId = "invalid-uuid";

      const response = await request(app)
        .delete(`/task/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not delete task that does not exist", async () => {
      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      const response = await request(app)
        .delete(`/task/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toBe("Task not found");
    });
  });
});
