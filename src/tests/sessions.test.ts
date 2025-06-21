import request from "supertest";
import { app } from "../app";
import { prisma } from "../database/prisma";
import { createTestUser } from "./setup";

describe("Sessions Controller", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe("POST /sessions", () => {
    it("should authenticate user with valid credentials", async () => {
      // Criar usuário primeiro
      const user = await createTestUser({
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      });

      const loginData = {
        email: "john@example.com",
        password: "123456",
      };

      const response = await request(app)
        .post("/sessions")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user).not.toHaveProperty("password");
      expect(typeof response.body.token).toBe("string");
    });

    it("should not authenticate with invalid email", async () => {
      // Criar usuário primeiro
      await createTestUser({
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      });

      const loginData = {
        email: "nonexistent@example.com",
        password: "123456",
      };

      const response = await request(app)
        .post("/sessions")
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe("email ou senha errada!");
    });

    it("should not authenticate with wrong password", async () => {
      // Criar usuário primeiro
      await createTestUser({
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      });

      const loginData = {
        email: "john@example.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/sessions")
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBe("email ou senha errada!");
    });

    it("should not authenticate with invalid email format", async () => {
      const loginData = {
        email: "invalid-email",
        password: "123456",
      };

      const response = await request(app)
        .post("/sessions")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not authenticate with short password", async () => {
      const loginData = {
        email: "john@example.com",
        password: "123",
      };

      const response = await request(app)
        .post("/sessions")
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should return user role in token", async () => {
      // Criar usuário admin
      const user = await createTestUser({
        name: "Admin User",
        email: "admin@example.com",
        password: "123456",
        role: "admin",
      });

      const loginData = {
        email: "admin@example.com",
        password: "123456",
      };

      const response = await request(app)
        .post("/sessions")
        .send(loginData)
        .expect(200);

      expect(response.body.user.role).toBe("admin");
    });

    it("should return member role for default user", async () => {
      // Criar usuário sem especificar role (deve ser member por padrão)
      const user = await createTestUser({
        name: "Member User",
        email: "member@example.com",
        password: "123456",
      });

      const loginData = {
        email: "member@example.com",
        password: "123456",
      };

      const response = await request(app)
        .post("/sessions")
        .send(loginData)
        .expect(200);

      expect(response.body.user.role).toBe("member");
    });
  });
});
