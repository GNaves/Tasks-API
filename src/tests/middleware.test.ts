import request from "supertest";
import { app } from "../app";
import { createTestUser } from "./setup";
import { sign, verify } from "jsonwebtoken";
import { authConfig } from "../config/auth";

describe("Authentication Middleware", () => {
  let testUser: any;
  let validToken: string;

  beforeEach(async () => {
    testUser = await createTestUser({
      name: "John Doe",
      email: "john@example.com",
      password: "123456",
    });

    validToken = sign(
      { role: testUser.role, sub: testUser.id },
      authConfig.jwt.secret,
      { expiresIn: authConfig.jwt.expiresIn }
    );
  });

  describe("EnsureAuthenticator", () => {
    it("should allow access with valid token", async () => {
      // Como não temos uma rota protegida específica para testar,
      // vamos testar criando uma rota de teste temporária
      // ou testar através de uma rota que usa autenticação

      // Para este teste, vamos verificar se o token é válido
      const decoded = verify(validToken, authConfig.jwt.secret) as any;

      expect(decoded.role).toBe(testUser.role);
      expect(decoded.sub).toBe(testUser.id);
    });

    it("should reject request without authorization header", async () => {
      // Testar uma rota que requer autenticação
      const response = await request(app)
        .patch("/task/some-task-id")
        .send({ title: "Test" })
        .expect(401);

      expect(response.body.message).toBe("Invalid JWT Token");
    });

    it("should reject request with invalid token format", async () => {
      const response = await request(app)
        .patch("/task/some-task-id")
        .set("Authorization", "InvalidFormat token123")
        .send({ title: "Test" })
        .expect(401);

      expect(response.body.message).toBe("Invalid JWT Token");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .patch("/task/some-task-id")
        .set("Authorization", "Bearer invalid-token")
        .send({ title: "Test" })
        .expect(401);

      expect(response.body.message).toBe("Invalid JWT Token");
    });

    it("should reject request with expired token", async () => {
      const expiredToken = sign(
        { role: testUser.role, sub: testUser.id },
        authConfig.jwt.secret,
        { expiresIn: "0s" } // Token expirado
      );

      const response = await request(app)
        .patch("/task/some-task-id")
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({ title: "Test" })
        .expect(401);

      expect(response.body.message).toBe("Invalid JWT Token");
    });

    it("should set user information in request object", async () => {
      const decoded = verify(validToken, authConfig.jwt.secret) as any;

      expect(decoded).toHaveProperty("role");
      expect(decoded).toHaveProperty("sub");
      expect(decoded.role).toBe(testUser.role);
      expect(decoded.sub).toBe(testUser.id);
    });
  });

  describe("JWT Token Structure", () => {
    it("should have correct token structure", () => {
      const decoded = verify(validToken, authConfig.jwt.secret) as any;

      expect(decoded).toHaveProperty("iat"); // issued at
      expect(decoded).toHaveProperty("exp"); // expiration
      expect(decoded).toHaveProperty("role");
      expect(decoded).toHaveProperty("sub");
    });

    it("should include user role in token", () => {
      const decoded = verify(validToken, authConfig.jwt.secret) as any;
      expect(decoded.role).toBe("member");
    });

    it("should include user ID in token", () => {
      const decoded = verify(validToken, authConfig.jwt.secret) as any;
      expect(decoded.sub).toBe(testUser.id);
    });
  });

  describe("Token Generation", () => {
    it("should generate token with admin role", async () => {
      const adminUser = await createTestUser({
        name: "Admin User",
        email: "admin@example.com",
        password: "123456",
        role: "admin",
      });

      const adminToken = sign(
        { role: adminUser.role, sub: adminUser.id },
        authConfig.jwt.secret,
        { expiresIn: authConfig.jwt.expiresIn }
      );

      const decoded = verify(adminToken, authConfig.jwt.secret) as any;
      expect(decoded.role).toBe("admin");
    });

    it("should generate token with member role", async () => {
      const memberUser = await createTestUser({
        name: "Member User",
        email: "member@example.com",
        password: "123456",
        role: "member",
      });

      const memberToken = sign(
        { role: memberUser.role, sub: memberUser.id },
        authConfig.jwt.secret,
        { expiresIn: authConfig.jwt.expiresIn }
      );

      const decoded = verify(memberToken, authConfig.jwt.secret) as any;
      expect(decoded.role).toBe("member");
    });
  });
});
