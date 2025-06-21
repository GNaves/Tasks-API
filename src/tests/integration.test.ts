import request from "supertest";
import { app } from "../app";
import { prisma } from "../database/prisma";
import { createTestTeam, createTestUser, createTestTask } from "./setup";

describe("Integration Tests", () => {
  beforeEach(async () => {
    await prisma.taskHistory.deleteMany();
    await prisma.task.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("Complete User Workflow", () => {
    it("should complete full user registration and login flow", async () => {
      // 1. Criar usuário admin
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
        role: "admin",
      };

      const createUserResponse = await request(app)
        .post("/users")
        .send(userData)
        .expect(200);

      expect(createUserResponse.body).toHaveProperty("id");
      expect(createUserResponse.body.email).toBe(userData.email);
      expect(createUserResponse.body).not.toHaveProperty("password");

      // 2. Fazer login
      const loginResponse = await request(app)
        .post("/sessions")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty("token");
      expect(loginResponse.body).toHaveProperty("user");
      expect(loginResponse.body.user.id).toBe(createUserResponse.body.id);

      const token = loginResponse.body.token;

      // 3. Criar equipe (com autenticação)
      const teamData = {
        name: "Frontend Team",
        description: "Frontend development team",
      };

      const createTeamResponse = await request(app)
        .post("/team")
        .set("Authorization", `Bearer ${token}`)
        .send(teamData)
        .expect(200);

      expect(createTeamResponse.body).toHaveProperty("id");
      expect(createTeamResponse.body.name).toBe(teamData.name);

      // 4. Adicionar usuário à equipe
      const addMemberResponse = await request(app)
        .post(`/team/${createTeamResponse.body.id}/members`)
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: createUserResponse.body.id })
        .expect(200);

      // 5. Criar tarefa
      const taskData = {
        title: "Implement login",
        description: "Create login functionality",
        assigned_to: createUserResponse.body.id,
        team_id: createTeamResponse.body.id,
      };

      const createTaskResponse = await request(app)
        .post("/task")
        .send(taskData)
        .expect(201);

      expect(createTaskResponse.body).toHaveProperty("id");
      expect(createTaskResponse.body.title).toBe(taskData.title);
      expect(createTaskResponse.body.status).toBe("pending");

      // 6. Atualizar status da tarefa
      const updateStatusResponse = await request(app)
        .patch(`/task/${createTaskResponse.body.id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "inProgress" })
        .expect(200);

      expect(updateStatusResponse.body.status).toBe("inProgress");

      // 7. Atualizar prioridade da tarefa
      const updatePriorityResponse = await request(app)
        .patch(`/task/${createTaskResponse.body.id}/priority`)
        .set("Authorization", `Bearer ${token}`)
        .send({ priority: "high" })
        .expect(200);

      expect(updatePriorityResponse.body.priority).toBe("high");

      // 8. Listar tarefas
      const listTasksResponse = await request(app).get("/task").expect(200);

      expect(Array.isArray(listTasksResponse.body)).toBe(true);
      expect(listTasksResponse.body).toHaveLength(1);
      expect(listTasksResponse.body[0].id).toBe(createTaskResponse.body.id);

      // 9. Listar equipes (com autenticação)
      const listTeamsResponse = await request(app)
        .get("/team")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(listTeamsResponse.body)).toBe(true);
      expect(listTeamsResponse.body).toHaveLength(1);
      expect(listTeamsResponse.body[0].id).toBe(createTeamResponse.body.id);
    });
  });

  describe("Team Management Workflow", () => {
    it("should handle complete team lifecycle", async () => {
      // 1. Criar usuário admin e fazer login primeiro
      const user = await request(app)
        .post("/users")
        .send({
          name: "Admin User",
          email: "admin@example.com",
          password: "123456",
          role: "admin",
        })
        .expect(200);

      const loginResponse = await request(app)
        .post("/sessions")
        .send({
          email: "admin@example.com",
          password: "123456",
        })
        .expect(200);

      const token = loginResponse.body.token;

      // 2. Criar múltiplas equipes (com autenticação)
      const team1 = await request(app)
        .post("/team")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Frontend Team",
          description: "Frontend development team",
        })
        .expect(200);

      const team2 = await request(app)
        .post("/team")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Backend Team",
          description: "Backend development team",
        })
        .expect(200);

      // 3. Criar usuários membros
      const user1 = await request(app)
        .post("/users")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "123456",
        })
        .expect(200);

      const user2 = await request(app)
        .post("/users")
        .send({
          name: "Jane Smith",
          email: "jane@example.com",
          password: "123456",
        })
        .expect(200);

      // 4. Adicionar usuários às equipes (com autenticação)
      await request(app)
        .post(`/team/${team1.body.id}/members`)
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: user1.body.id })
        .expect(200);

      await request(app)
        .post(`/team/${team2.body.id}/members`)
        .set("Authorization", `Bearer ${token}`)
        .send({ userId: user2.body.id })
        .expect(200);

      // 5. Listar equipes e verificar se existem (com autenticação)
      const listTeamsResponse = await request(app)
        .get("/team")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(listTeamsResponse.body).toHaveLength(2);

      // 6. Tentar deletar equipe com tarefas (deve falhar)
      const task = await request(app)
        .post("/task")
        .send({
          title: "Test task",
          description: "Test description",
          assigned_to: user1.body.id,
          team_id: team1.body.id,
        })
        .expect(201);

      const deleteTeamResponse = await request(app)
        .delete(`/team/${team1.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(401);

      expect(deleteTeamResponse.body.message).toContain("open tasks");

      // 7. Deletar tarefa primeiro
      await request(app).delete(`/task/${task.body.id}`).expect(200);

      // 8. Agora deletar equipe (deve funcionar)
      await request(app)
        .delete(`/team/${team1.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // 9. Verificar se equipe foi deletada
      const finalListResponse = await request(app)
        .get("/team")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(finalListResponse.body).toHaveLength(1);
      expect(finalListResponse.body[0].id).toBe(team2.body.id);
    });
  });

  describe("Task Management Workflow", () => {
    it("should handle complete task lifecycle", async () => {
      // 1. Setup inicial
      const user = await createTestUser({
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      });

      const team = await createTestTeam({
        name: "Development Team",
        description: "Development team",
      });

      const loginResponse = await request(app)
        .post("/sessions")
        .send({
          email: "john@example.com",
          password: "123456",
        })
        .expect(200);

      const token = loginResponse.body.token;

      // 2. Criar múltiplas tarefas
      const task1 = await request(app)
        .post("/task")
        .send({
          title: "Implement login",
          description: "Create login functionality",
          assigned_to: user.id,
          team_id: team.id,
        })
        .expect(201);

      const task2 = await request(app)
        .post("/task")
        .send({
          title: "Create dashboard",
          description: "Build user dashboard",
          assigned_to: user.id,
          team_id: team.id,
        })
        .expect(201);

      // 3. Verificar status inicial
      expect(task1.body.status).toBe("pending");
      expect(task1.body.priority).toBe("low");

      // 4. Atualizar status e prioridade
      const updatedTask1 = await request(app)
        .patch(`/task/${task1.body.id}/updateByUser`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Updated login implementation",
          description: "Updated description",
          status: "inProgress",
          priority: "high",
        })
        .expect(200);

      expect(updatedTask1.body.status).toBe("inProgress");
      expect(updatedTask1.body.priority).toBe("high");

      // 5. Completar tarefa
      const completedTask1 = await request(app)
        .patch(`/task/${task1.body.id}/updateByUser`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: updatedTask1.body.title,
          description: updatedTask1.body.description,
          status: "completed",
          priority: updatedTask1.body.priority,
        })
        .expect(200);

      expect(completedTask1.body.status).toBe("completed");

      // 6. Listar tarefas e verificar
      const listTasksResponse = await request(app).get("/task").expect(200);

      expect(listTasksResponse.body).toHaveLength(2);

      const completedTask = listTasksResponse.body.find(
        (t: any) => t.id === task1.body.id
      );
      const pendingTask = listTasksResponse.body.find(
        (t: any) => t.id === task2.body.id
      );

      expect(completedTask.status).toBe("completed");
      expect(pendingTask.status).toBe("pending");

      // 7. Deletar tarefas
      await request(app).delete(`/task/${task1.body.id}`).expect(200);

      await request(app).delete(`/task/${task2.body.id}`).expect(200);

      // 8. Verificar se foram deletadas
      const finalListResponse = await request(app).get("/task").expect(200);

      expect(finalListResponse.body).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors properly", async () => {
      // Testar criação de usuário com dados inválidos
      const invalidUserData = {
        name: "Jo", // Muito curto
        email: "invalid-email",
        password: "123", // Muito curto
      };

      const response = await request(app)
        .post("/users")
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should handle authentication errors properly", async () => {
      // Tentar acessar rota protegida sem token
      const response = await request(app)
        .patch("/task/some-id/updateByUser")
        .send({ title: "Test" })
        .expect(401);

      expect(response.body.message).toBe("Invalid JWT Token");
    });

    it("should handle not found errors properly", async () => {
      // Criar usuário admin e fazer login primeiro
      const user = await request(app)
        .post("/users")
        .send({
          name: "Admin User",
          email: "admin@example.com",
          password: "123456",
          role: "admin",
        })
        .expect(200);

      const loginResponse = await request(app)
        .post("/sessions")
        .send({
          email: "admin@example.com",
          password: "123456",
        })
        .expect(200);

      const token = loginResponse.body.token;

      const nonExistentId = "00000000-0000-0000-0000-000000000000";

      // Testar com um ID válido mas que não existe
      const response = await request(app)
        .delete(`/team/${nonExistentId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe("Team not found");
    });
  });
});
