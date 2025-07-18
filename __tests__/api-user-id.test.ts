import { NextRequest } from "next/server";
import { GET } from "@/app/api/user/[id]/route";
import { executeQuery } from "@/lib/database";
import { authMiddleware } from "@/lib/jwt";

// Mock dependencies
jest.mock("@/lib/database");
jest.mock("@/lib/jwt");

const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;
const mockAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

describe("User API Route [id] - Complete Coverage", () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "time").mockImplementation();
    jest.spyOn(console, "timeEnd").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();

    // Mock authMiddleware to return a function that calls the handler
    mockAuthMiddleware.mockImplementation((handler) => {
      return async (request: Request) => {
        const requestWithUser = {
          ...request,
          user: { userId: "auth-user-id" },
        } as any;
        return handler(requestWithUser);
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("GET /api/user/[id]", () => {
    it("should return user data successfully", async () => {
      const mockUserData = {
        id: "123",
        username: "testuser",
        full_name: "Test User",
        email: "test@example.com",
        birth_date: "1990-01-01",
        bio: "Test bio",
        long_bio: "Test long bio",
        profile_json: '{"data": "test"}',
        address: "Test address",
        phone_number: "1234567890",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        role: "user",
        division_name: "Engineering",
      };

      mockExecuteQuery.mockResolvedValueOnce({
        rows: [mockUserData],
      } as any);

      mockRequest = {
        url: "http://localhost:3000/api/user/123",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.user.id).toBe("123");
      expect(result.user.username).toBe("testuser");
      expect(result.user.fullName).toBe("Test User");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user.birthDate).toBe("1990-01-01");
      expect(result.user.bio).toBe("Test bio");
      expect(result.user.longBio).toBe("Test long bio");
      expect(result.user.profileJson).toBe('{"data": "test"}');
      expect(result.user.address).toBe("Test address");
      expect(result.user.phoneNumber).toBe("1234567890");
      expect(result.user.createdAt).toBe("2024-01-01T00:00:00.000Z");
      expect(result.user.updatedAt).toBe("2024-01-01T00:00:00.000Z");
      expect(result.user.role).toBe("user");
      expect(result.user.division).toBe("Engineering");
      expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
    });

    it("should return 400 for invalid user ID (non-numeric)", async () => {
      mockRequest = {
        url: "http://localhost:3000/api/user/invalid",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe("Invalid user ID.");
      expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
    });

    it("should return 400 for empty user ID", async () => {
      mockRequest = {
        url: "http://localhost:3000/api/user/",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe("Invalid user ID.");
      expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
    });

    it("should return 404 if user not found", async () => {
      mockExecuteQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      mockRequest = {
        url: "http://localhost:3000/api/user/999",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.message).toBe("User not found.");
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["999"]
      );
      expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
    });

    it("should handle database errors", async () => {
      mockExecuteQuery.mockRejectedValueOnce(new Error("Database connection failed"));

      mockRequest = {
        url: "http://localhost:3000/api/user/123",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.message).toBe("Internal server error.");
      expect(console.error).toHaveBeenCalledWith("Get user by ID error:", expect.any(Error));
      expect(console.timeEnd).toHaveBeenCalledWith("Get User by ID Execution");
    });

    it("should handle user with null values", async () => {
      const mockUserData = {
        id: "123",
        username: "testuser",
        full_name: "Test User",
        email: "test@example.com",
        birth_date: null,
        bio: null,
        long_bio: null,
        profile_json: null,
        address: null,
        phone_number: null,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        role: null,
        division_name: null,
      };

      mockExecuteQuery.mockResolvedValueOnce({
        rows: [mockUserData],
      } as any);

      mockRequest = {
        url: "http://localhost:3000/api/user/123",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.user.id).toBe("123");
      expect(result.user.birthDate).toBeNull();
      expect(result.user.bio).toBeNull();
      expect(result.user.longBio).toBeNull();
      expect(result.user.profileJson).toBeNull();
      expect(result.user.address).toBeNull();
      expect(result.user.phoneNumber).toBeNull();
      expect(result.user.role).toBeNull();
      expect(result.user.division).toBeNull();
    });

    it("should handle zero as valid user ID", async () => {
      const mockUserData = {
        id: "0",
        username: "testuser",
        full_name: "Test User",
        email: "test@example.com",
        birth_date: "1990-01-01",
        bio: "Test bio",
        long_bio: "Test long bio",
        profile_json: null,
        address: "Test address",
        phone_number: "1234567890",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        role: "user",
        division_name: "Engineering",
      };

      mockExecuteQuery.mockResolvedValueOnce({
        rows: [mockUserData],
      } as any);

      mockRequest = {
        url: "http://localhost:3000/api/user/0",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.user.id).toBe("0");
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["0"]
      );
    });

    it("should handle large user ID", async () => {
      const mockUserData = {
        id: "999999999",
        username: "testuser",
        full_name: "Test User",
        email: "test@example.com",
        birth_date: "1990-01-01",
        bio: "Test bio",
        long_bio: "Test long bio",
        profile_json: null,
        address: "Test address",
        phone_number: "1234567890",
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        role: "admin",
        division_name: "IT",
      };

      mockExecuteQuery.mockResolvedValueOnce({
        rows: [mockUserData],
      } as any);

      mockRequest = {
        url: "http://localhost:3000/api/user/999999999",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.user.id).toBe("999999999");
      expect(result.user.role).toBe("admin");
      expect(result.user.division).toBe("IT");
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["999999999"]
      );
    });

    it("should handle negative user ID as invalid", async () => {
      mockRequest = {
        url: "http://localhost:3000/api/user/-1",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      // Since parseInt("-1") is not NaN, it should proceed with the query
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        ["-1"]
      );
    });

    it("should handle mixed alphanumeric ID as invalid", async () => {
      mockRequest = {
        url: "http://localhost:3000/api/user/123abc",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.message).toBe("Invalid user ID.");
    });

    it("should handle URL parsing errors", async () => {
      mockRequest = {
        url: "invalid-url",
      } as Partial<NextRequest>;

      const response = await GET(mockRequest as NextRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.message).toBe("Internal server error.");
      expect(console.error).toHaveBeenCalledWith("Get user by ID error:", expect.any(Error));
    });
  });
});
