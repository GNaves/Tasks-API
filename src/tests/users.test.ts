import request from "supertest";
import { app } from "../app";
import { prisma } from "../database/prisma";
import { createTestUser } from "./setup";

describe("Users Controller", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe("POST /users", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      };

      const response = await request(app)
        .post("/users")
        .send(userData)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty("password");
      expect(response.body.role).toBe("member");
    });

    it("should not create user with invalid email", async () => {
      const userData = {
        name: "John Doe",
        email: "invalid-email",
        password: "123456",
      };

      const response = await request(app)
        .post("/users")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not create user with short name", async () => {
      const userData = {
        name: "John",
        email: "john@example.com",
        password: "123456",
      };

      const response = await request(app)
        .post("/users")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not create user with short password", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "123",
      };

      const response = await request(app)
        .post("/users")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should not create user with existing email", async () => {
      // Criar primeiro usuário
      await createTestUser({
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      });

      // Tentar criar segundo usuário com mesmo email
      const userData = {
        name: "Jane Doe",
        email: "john@example.com",
        password: "123456",
      };

      const response = await request(app)
        .post("/users")
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe("Email is already use");
    });

    it("should hash password before saving", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "123456",
      };

      await request(app).post("/users").send(userData).expect(200);

      const userInDb = await prisma.user.findFirst({
        where: { email: userData.email },
      });

      expect(userInDb).toBeTruthy();
      expect(userInDb?.password).not.toBe(userData.password);
      expect(userInDb?.password).toHaveLength(60); // bcrypt hash length
    });
  });
});
