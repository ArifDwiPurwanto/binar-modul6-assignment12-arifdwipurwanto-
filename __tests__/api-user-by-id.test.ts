/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/user/[id]/route";
import { executeQuery } from "@/lib/database";
import { authMiddleware } from "@/lib/jwt";

// Ensure Response is available
if (typeof global.Response === 'undefined') {
  const { Response } = require('undici');
  global.Response = Response;
}

// Mock dependencies
jest.mock("@/lib/database");
jest.mock("@/lib/jwt");
jest.mock("next/server");

const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;
const mockAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;
const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  time: jest.fn(),
  timeEnd: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(console, mockConsole);
  
  mockNextResponse.json = jest.fn((data, options) => ({
    ...data,
    json: () => Promise.resolve(data),
    status: options?.status,
  })) as any;

  // Mock authMiddleware to return a function that calls the handler
  mockAuthMiddleware.mockImplementation((handler) => {
    return async (request: Request) => {
      const requestWithUser = {
        ...request,
        user: { userId: "123" }
      };
      return handler(requestWithUser);
    };
  });
});

describe("User by ID API Route - Consolidated Tests", () => {
  const createMockRequest = (userId: string) => {
    return {
      url: `http://localhost:3000/api/user/${userId}`,
      json: jest.fn(),
    } as unknown as NextRequest;
  };

  describe("GET /api/user/[id]", () => {
    describe("Successful user retrieval scenarios", () => {
      it("should get user by ID successfully", async () => {
        const mockUser = {
          id: "123",
          username: "testuser",
          full_name: "Test User",
          email: "test@example.com",
          birth_date: "1990-01-01",
          bio: "Test bio",
          long_bio: "Test long bio",
          profile_json: '{"theme": "dark"}',
          address: "Test Address",
          phone_number: "+6281234567890",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
          role: "user",
          division_name: "Engineering"
        };

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [mockUser],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: []
        });

        const mockRequest = createMockRequest("123");
        await GET(mockRequest);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.stringContaining("SELECT"),
          ["123"]
        );
        expect(mockNextResponse.json).toHaveBeenCalledWith({
          user: {
            id: "123",
            username: "testuser",
            fullName: "Test User",
            email: "test@example.com",
            birthDate: "1990-01-01",
            bio: "Test bio",
            longBio: "Test long bio",
            profileJson: '{"theme": "dark"}',
            address: "Test Address",
            phoneNumber: "+6281234567890",
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
            role: "user",
            division: "Engineering"
          }
        });
        expect(console.time).toHaveBeenCalledWith("Get User by ID Execution");
        expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
      });

      it("should handle user with minimal data", async () => {
        const mockUser = {
          id: "456",
          username: "minimaluser",
          full_name: "Minimal User",
          email: "minimal@example.com",
          birth_date: null,
          bio: null,
          long_bio: null,
          profile_json: null,
          address: null,
          phone_number: null,
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
          role: null,
          division_name: null
        };

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [mockUser],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: []
        });

        const mockRequest = createMockRequest("456");
        await GET(mockRequest);

        expect(mockNextResponse.json).toHaveBeenCalledWith({
          user: {
            id: "456",
            username: "minimaluser",
            fullName: "Minimal User",
            email: "minimal@example.com",
            birthDate: null,
            bio: null,
            longBio: null,
            profileJson: null,
            address: null,
            phoneNumber: null,
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
            role: null,
            division: null
          }
        });
      });
    });

    describe("Error scenarios", () => {
      it("should return 400 for invalid user ID", async () => {
        const mockRequest = createMockRequest("invalid");
        await GET(mockRequest);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          { message: "Invalid user ID." },
          { status: 400 }
        );
        expect(console.time).toHaveBeenCalledWith("Get User by ID Execution");
        expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
      });

      it("should return 400 for empty user ID", async () => {
        const mockRequest = createMockRequest("");
        await GET(mockRequest);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          { message: "Invalid user ID." },
          { status: 400 }
        );
      });

      it("should return 404 when user not found", async () => {
        mockExecuteQuery.mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
          command: "SELECT",
          oid: 0,
          fields: []
        });

        const mockRequest = createMockRequest("999");
        await GET(mockRequest);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          { message: "User not found." },
          { status: 404 }
        );
        expect(console.time).toHaveBeenCalledWith("Get User by ID Execution");
        expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
      });

      it("should handle database errors", async () => {
        mockExecuteQuery.mockRejectedValueOnce(new Error("Database connection failed"));

        const mockRequest = createMockRequest("123");
        await GET(mockRequest);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          { message: "Internal server error." },
          { status: 500 }
        );
        expect(console.error).toHaveBeenCalledWith(
          "Get user by ID error:",
          expect.any(Error)
        );
        expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
      });
    });

    describe("URL parsing scenarios", () => {
      it("should handle numeric user ID correctly", async () => {
        const mockUser = {
          id: "789",
          username: "numericuser",
          full_name: "Numeric User",
          email: "numeric@example.com",
          birth_date: "1985-05-15",
          bio: "Numeric bio",
          long_bio: "Numeric long bio",
          profile_json: null,
          address: "Numeric Address",
          phone_number: "+6289876543210",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
          role: "admin",
          division_name: "Management"
        };

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [mockUser],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: []
        });

        const mockRequest = createMockRequest("789");
        await GET(mockRequest);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.stringContaining("WHERE u.id = $1"),
          ["789"]
        );
      });

      it("should handle complex URLs correctly", async () => {
        const mockRequest = {
          url: "http://localhost:3000/api/user/123?param=value",
          json: jest.fn(),
        } as unknown as NextRequest;

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
          command: "SELECT",
          oid: 0,
          fields: []
        });

        await GET(mockRequest);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.stringContaining("WHERE u.id = $1"),
          ["123"]
        );
      });
    });

    describe("Auth middleware integration", () => {
      it("should work with auth middleware", async () => {
        const mockUser = {
          id: "123",
          username: "authuser",
          full_name: "Auth User",
          email: "auth@example.com",
          birth_date: "1990-01-01",
          bio: "Auth bio",
          long_bio: "Auth long bio",
          profile_json: '{"authenticated": true}',
          address: "Auth Address",
          phone_number: "+6281234567890",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
          role: "user",
          division_name: "Engineering"
        };

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [mockUser],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: []
        });

        const mockRequest = createMockRequest("123");
        await GET(mockRequest);

        expect(mockAuthMiddleware).toHaveBeenCalledWith(expect.any(Function));
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            user: expect.objectContaining({
              id: "123",
              username: "authuser"
            })
          })
        );
      });
    });

    describe("Performance logging", () => {
      it("should log execution time for successful requests", async () => {
        const mockUser = {
          id: "123",
          username: "testuser",
          full_name: "Test User",
          email: "test@example.com",
          birth_date: "1990-01-01",
          bio: "Test bio",
          long_bio: "Test long bio",
          profile_json: null,
          address: "Test Address",
          phone_number: "+6281234567890",
          created_at: "2023-01-01T00:00:00Z",
          updated_at: "2023-01-01T00:00:00Z",
          role: "user",
          division_name: "Engineering"
        };

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [mockUser],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: []
        });

        const mockRequest = createMockRequest("123");
        await GET(mockRequest);

        expect(console.time).toHaveBeenCalledWith("Get User by ID Execution");
        expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
      });

      it("should log execution time for error scenarios", async () => {
        mockExecuteQuery.mockRejectedValueOnce(new Error("Test error"));

        const mockRequest = createMockRequest("123");
        await GET(mockRequest);

        expect(console.time).toHaveBeenCalledWith("Get User by ID Execution");
        expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
      });
    });
  });
});
