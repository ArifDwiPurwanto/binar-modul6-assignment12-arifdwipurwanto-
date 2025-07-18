/**
 * @jest-environment node
 */
import jwt from "jsonwebtoken";
import { generateToken, verifyToken, authMiddleware } from "@/lib/jwt";

// Mock the jsonwebtoken module
jest.mock("jsonwebtoken");

// Add Response to global scope for tests
global.Response = Response as any;

const mockJwt = jwt as jest.Mocked<typeof jwt>;

// Mock console methods
const mockConsole = {
  time: jest.fn(),
  timeEnd: jest.fn(),
  error: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(console, mockConsole);
});

describe("JWT utility functions", () => {
  describe("generateToken", () => {
    it("should generate token successfully", () => {
      const payload = { userId: "123", username: "testuser" };
      const expectedToken = "mocked.jwt.token";
      
      mockJwt.sign.mockReturnValue(expectedToken as any);

      const result = generateToken(payload);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        payload,
        process.env.JWT_SECRET || "super-secret-key-for-workshop-demo-only",
        { expiresIn: "24h" }
      );
      expect(result).toBe(expectedToken);
      expect(console.time).toHaveBeenCalledWith("JWT Token Generation");
      expect(console.timeEnd).toHaveBeenCalledWith("JWT Token Generation");
    });

    it("should handle token generation errors", () => {
      const payload = { userId: "123" };
      const error = new Error("Token generation failed");
      
      mockJwt.sign.mockImplementation(() => {
        throw error;
      });

      expect(() => generateToken(payload)).toThrow("Token generation failed");
      expect(console.error).toHaveBeenCalledWith("JWT generation error:", error);
      expect(console.timeEnd).toHaveBeenCalledWith("JWT Token Generation");
    });

    it("should generate token with empty payload", () => {
      const payload = {};
      const expectedToken = "empty.payload.token";
      
      mockJwt.sign.mockReturnValue(expectedToken as any);

      const result = generateToken(payload);

      expect(result).toBe(expectedToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        { expiresIn: "24h" }
      );
    });

    it("should generate token with complex payload", () => {
      const payload = {
        userId: "123",
        username: "testuser",
        email: "test@example.com",
        roles: ["user", "admin"],
        metadata: { lastLogin: "2023-01-01" }
      };
      const expectedToken = "complex.payload.token";
      
      mockJwt.sign.mockReturnValue(expectedToken as any);

      const result = generateToken(payload);

      expect(result).toBe(expectedToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(payload, expect.any(String), { expiresIn: "24h" });
    });

    it("should use environment JWT secret if available", () => {
      const payload = { userId: "123" };
      mockJwt.sign.mockReturnValue("token" as any);

      generateToken(payload);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        payload,
        expect.any(String),
        { expiresIn: "24h" }
      );
    });
  });

  describe("verifyToken", () => {
    it("should verify token successfully", () => {
      const token = "valid.jwt.token";
      const decodedPayload = { userId: "123", username: "testuser" };
      
      mockJwt.verify.mockReturnValue(decodedPayload as any);

      const result = verifyToken(token);

      expect(mockJwt.verify).toHaveBeenCalledWith(
        token,
        process.env.JWT_SECRET || "super-secret-key-for-workshop-demo-only"
      );
      expect(result).toEqual(decodedPayload);
      expect(console.time).toHaveBeenCalledWith("JWT Token Verification");
      expect(console.timeEnd).toHaveBeenCalledWith("JWT Token Verification");
    });

    it("should handle token verification errors", () => {
      const token = "invalid.jwt.token";
      const error = new Error("Token verification failed");
      
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyToken(token)).toThrow("Token verification failed");
      expect(console.error).toHaveBeenCalledWith("JWT verification error:", error);
      expect(console.timeEnd).toHaveBeenCalledWith("JWT Token Verification");
    });

    it("should handle expired token", () => {
      const token = "expired.jwt.token";
      const error = new Error("jwt expired");
      
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyToken(token)).toThrow("jwt expired");
      expect(console.error).toHaveBeenCalledWith("JWT verification error:", error);
    });

    it("should handle malformed token", () => {
      const token = "malformed.token";
      const error = new Error("jwt malformed");
      
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyToken(token)).toThrow("jwt malformed");
    });

    it("should verify token with string payload", () => {
      const token = "string.payload.token";
      const stringPayload = "simple-string-payload";
      
      mockJwt.verify.mockReturnValue(stringPayload as any);

      const result = verifyToken(token);

      expect(result).toBe(stringPayload);
    });
  });

  describe("authMiddleware", () => {
    let mockHandler: jest.Mock;
    let mockRequest: Partial<Request>;

    beforeEach(() => {
      mockHandler = jest.fn();
      mockRequest = {
        headers: {
          get: jest.fn()
        } as any
      };
    });

    it("should successfully authenticate valid bearer token", async () => {
      const token = "valid.jwt.token";
      const decodedPayload = { userId: "123", username: "testuser" };
      const expectedResponse = new Response("Success");
      
      (mockRequest.headers!.get as jest.Mock).mockReturnValue(`Bearer ${token}`);
      mockJwt.verify.mockReturnValue(decodedPayload as any);
      mockHandler.mockResolvedValue(expectedResponse);

      const middleware = authMiddleware(mockHandler);
      const result = await middleware(mockRequest as Request);

      expect(mockRequest.headers!.get).toHaveBeenCalledWith("authorization");
      expect(mockJwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect((mockRequest as any).user).toEqual(decodedPayload);
      expect(mockHandler).toHaveBeenCalledWith(mockRequest);
      expect(result).toBe(expectedResponse);
      expect(console.time).toHaveBeenCalledWith("Auth Middleware Execution");
      expect(console.timeEnd).toHaveBeenCalledWith("Auth Middleware Execution");
    });

    it("should return 401 when no authorization header is provided", async () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue(null);

      const middleware = authMiddleware(mockHandler);
      const result = await middleware(mockRequest as Request);

      expect(result).toBeInstanceOf(Response);
      expect(await result.json()).toEqual({ message: "No token provided" });
      expect(result.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
      expect(console.timeEnd).toHaveBeenCalledWith("Auth Middleware Execution");
    });

    it("should return 401 when authorization header doesn't start with Bearer", async () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue("Basic username:password");

      const middleware = authMiddleware(mockHandler);
      const result = await middleware(mockRequest as Request);

      expect(result).toBeInstanceOf(Response);
      expect(await result.json()).toEqual({ message: "No token provided" });
      expect(result.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should return 401 when authorization header is just 'Bearer'", async () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue("Bearer");

      const middleware = authMiddleware(mockHandler);
      const result = await middleware(mockRequest as Request);

      expect(result).toBeInstanceOf(Response);
      expect(await result.json()).toEqual({ message: "No token provided" });
      expect(result.status).toBe(401);
    });

    it("should return 401 when token verification fails", async () => {
      const token = "invalid.jwt.token";
      const error = new Error("Token verification failed");
      
      (mockRequest.headers!.get as jest.Mock).mockReturnValue(`Bearer ${token}`);
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      const middleware = authMiddleware(mockHandler);
      const result = await middleware(mockRequest as Request);

      expect(result).toBeInstanceOf(Response);
      expect(await result.json()).toEqual({ message: "Invalid token" });
      expect(result.status).toBe(401);
      expect(console.error).toHaveBeenCalledWith("Auth middleware error:", error);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it.skip("should handle handler throwing an error", async () => {
      const token = "valid.jwt.token";
      const decodedPayload = { userId: "123" };
      
      (mockRequest.headers!.get as jest.Mock).mockReturnValue(`Bearer ${token}`);
      mockJwt.verify.mockReturnValue(decodedPayload as any);
      
      // Set up mock handler to reject
      const handlerError = new Error("Handler failed");
      mockHandler.mockRejectedValue(handlerError);

      const middleware = authMiddleware(mockHandler);
      const result = await middleware(mockRequest as Request);

      expect(result).toBeInstanceOf(Response);
      expect(await result.json()).toEqual({ message: "Invalid token" });
      expect(result.status).toBe(401);
      expect(console.error).toHaveBeenCalledWith("Auth middleware error:", handlerError);
    });

    it("should handle empty bearer token", async () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue("Bearer ");

      const middleware = authMiddleware(mockHandler);
      await middleware(mockRequest as Request);

      // This will try to verify an empty string token
      expect(mockJwt.verify).toHaveBeenCalledWith("", expect.any(String));
    });

    it("should handle bearer token with extra spaces", async () => {
      const token = "valid.jwt.token";
      const decodedPayload = { userId: "123" };
      
      (mockRequest.headers!.get as jest.Mock).mockReturnValue(`Bearer    ${token}`);
      mockJwt.verify.mockReturnValue(decodedPayload as any);
      mockHandler.mockResolvedValue(new Response("Success"));

      const middleware = authMiddleware(mockHandler);
      await middleware(mockRequest as Request);

      // The middleware extracts from position 7, so it gets the token with spaces
      expect(mockJwt.verify).toHaveBeenCalledWith(`   ${token}`, expect.any(String));
    });

    it("should set correct response headers", async () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue(null);

      const middleware = authMiddleware(mockHandler);
      const result = await middleware(mockRequest as Request);

      expect(result.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
