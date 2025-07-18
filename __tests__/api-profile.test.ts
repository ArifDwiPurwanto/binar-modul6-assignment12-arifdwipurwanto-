/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";
import { GET, PUT, ProfileData } from "@/app/api/profile/route";
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

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  time: jest.fn(),
  timeEnd: jest.fn(),
};

// Mock NextResponse for simpler tests
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      ...data,
      json: () => Promise.resolve(data),
      status: options?.status,
    })),
  },
}));

const getValidProfileData = () => ({
  username: "validuser",
  fullName: "Valid User",
  email: "valid@email.com",
  phone: "1234567890",
  birthDate: "1990-01-01",
  bio: "Short bio",
  longBio: "Long bio content",
  address: "Test address",
  profileJson: { social: "data" },
});

const mockRequest = (data: Partial<ProfileData>) => {
  return {
    json: async () => data,
  } as Request;
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(console, mockConsole);
  
  // Mock authMiddleware to return a function that calls the handler
  mockAuthMiddleware.mockImplementation((handler) => {
    return async (request: Request) => {
      const requestWithUser = {
        ...request,
        user: { userId: "test-user-id" },
      } as any;
      return handler(requestWithUser);
    };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Profile API Route - Consolidated Tests", () => {
  const mockUser = {
    userId: "123",
    username: "testuser",
  };

  const mockUserData = {
    id: "123",
    auth_id: "auth123",
    username: "testuser",
    full_name: "Test User",
    email: "test@example.com",
    bio: "Test bio",
    long_bio: "Long test bio",
    profile_json: '{"social": "data"}',
    address: "Test address",
    phone_number: "1234567890",
    birth_date: "1990-01-01",
    role: "user",
    division_name: "Engineering",
    log_count: 5,
    role_count: 1,
    division_count: 1,
  };

  describe("GET /api/profile", () => {
    describe("Successful profile retrieval scenarios", () => {
      it("should return user profile successfully", async () => {
        const mockRequest = {
          json: jest.fn(),
        } as Partial<NextRequest>;

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [mockUserData],
        } as any);

        const response = await GET(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(result.user.id).toBe("123");
        expect(result.user.username).toBe("testuser");
        expect(result.user.fullName).toBe("Test User");
        expect(result.user.email).toBe("test@example.com");
        expect(console.timeEnd).toHaveBeenCalledWith("Profile Get Execution");
      });

      it("should return properly formatted user data with all fields", async () => {
        const mockRequest = {
          user: mockUser,
        } as any;

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [mockUserData],
          rowCount: 1,
        } as any);

        await GET(mockRequest);

        expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.stringContaining("SELECT"),
          [mockUser.userId]
        );
        expect(console.time).toHaveBeenCalledWith("Profile Get Execution");
        expect(console.timeEnd).toHaveBeenCalledWith("Profile Get Execution");
      });
    });

    describe("Error scenarios for GET", () => {
      it("should return 404 if user not found", async () => {
        const mockRequest = {
          json: jest.fn(),
        } as Partial<NextRequest>;

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [],
        } as any);

        const response = await GET(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(404);
        expect(result.message).toBe("User not found.");
        expect(console.timeEnd).toHaveBeenCalledWith("Profile Get Execution");
      });

      it("should handle database errors during profile retrieval", async () => {
        const mockRequest = {
          json: jest.fn(),
        } as Partial<NextRequest>;

        mockExecuteQuery.mockRejectedValueOnce(new Error("Database error"));

        const response = await GET(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.message).toBe("Internal server error.");
        expect(console.error).toHaveBeenCalledWith("Profile get error:", expect.any(Error));
        expect(console.timeEnd).toHaveBeenCalledWith("Profile Get Execution");
      });
    });
  });

  describe("PUT /api/profile", () => {
    const validProfileData = getValidProfileData();

    describe("Successful profile update scenarios", () => {
      it("should return 200 on valid data", async () => {
        const validData = getValidProfileData();
        const req = {
          json: () => Promise.resolve(validData),
        } as Request;
        
        await PUT(req);
        
        expect(NextResponse.json).toHaveBeenCalledWith({
          success: true,
        });
      });

      it("should update profile successfully with complete data", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue(validProfileData),
        } as Partial<NextRequest>;

        const mockUpdatedUser = {
          id: "test-user-id",
          auth_id: "auth-123",
          username: "validuser",
          full_name: "Valid User",
          bio: "Short bio",
          long_bio: "Long bio content",
          profile_json: '{"social":"data"}',
          address: "Test address",
          phone_number: "1234567890",
          birth_date: "1990-01-01",
          role: "user",
          division_name: "Engineering",
          log_count: 5,
          role_count: 1,
        };

        mockExecuteQuery.mockResolvedValueOnce({ rows: [] } as any); // Update query
        mockExecuteQuery.mockResolvedValueOnce({ rows: [mockUpdatedUser] } as any); // Select query
        mockExecuteQuery.mockResolvedValueOnce({ rows: [] } as any); // Log insert

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(result.user.username).toBe("validuser");
        expect(result.user.fullName).toBe("Valid User");
        expect(console.timeEnd).toHaveBeenCalledWith("Profile Update Execution");
      });

      it("should accept profile update without optional fields", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            username: "testuser",
            fullName: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            birthDate: "1990-01-01",
          }),
        } as Partial<NextRequest>;

        const mockUpdatedUser = {
          id: "test-user-id",
          auth_id: "auth-123",
          username: "testuser",
          full_name: "Test User",
          bio: null,
          long_bio: null,
          profile_json: null,
          address: null,
          phone_number: "1234567890",
          birth_date: "1990-01-01",
          role: "user",
          division_name: "Engineering",
          log_count: 5,
          role_count: 1,
        };

        mockExecuteQuery.mockResolvedValueOnce({ rows: [] } as any);
        mockExecuteQuery.mockResolvedValueOnce({ rows: [mockUpdatedUser] } as any);
        mockExecuteQuery.mockResolvedValueOnce({ rows: [] } as any);

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
      });

      it("should accept valid phone with 15 digits", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            ...validProfileData,
            phone: "123456789012345", // Exactly 15 digits
          }),
        } as Partial<NextRequest>;

        const mockUpdatedUser = {
          id: "test-user-id",
          auth_id: "auth-123",
          username: "validuser",
          full_name: "Valid User",
          bio: "Short bio",
          long_bio: "Long bio content",
          profile_json: '{"social":"data"}',
          address: "Test address",
          phone_number: "123456789012345",
          birth_date: "1990-01-01",
          role: "user",
          division_name: "Engineering",
          log_count: 5,
          role_count: 1,
        };

        mockExecuteQuery.mockResolvedValueOnce({ rows: [] } as any);
        mockExecuteQuery.mockResolvedValueOnce({ rows: [mockUpdatedUser] } as any);
        mockExecuteQuery.mockResolvedValueOnce({ rows: [] } as any);

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
      });
    });

    describe("Validation error scenarios", () => {
      it("should return 400 if username is too short", async () => {
        const invalidData = { ...getValidProfileData(), username: "short" };
        const req = {
          json: () => Promise.resolve(invalidData),
        } as Request;
        
        await PUT(req);
        
        expect(NextResponse.json).toHaveBeenCalledWith(
          {
            message: "Validation failed",
            errors: { username: "Username must be at least 6 characters." },
          },
          { status: 400 }
        );
      });

      it("should return 400 if fullName is missing", async () => {
        const invalidData = { ...getValidProfileData(), fullName: "" };
        const req = {
          json: () => Promise.resolve(invalidData),
        } as Request;
        
        await PUT(req);
        
        expect(NextResponse.json).toHaveBeenCalledWith(
          {
            message: "Validation failed",
            errors: { fullName: "Full name is required." },
          },
          { status: 400 }
        );
      });

      it("should return 400 if email format is invalid", async () => {
        const invalidData = { ...getValidProfileData(), email: "invalid-email" };
        const req = {
          json: () => Promise.resolve(invalidData),
        } as Request;
        
        await PUT(req);
        
        expect(NextResponse.json).toHaveBeenCalledWith(
          {
            message: "Validation failed",
          },
          { status: 400 }
        );
      });

      it("should return an error if bio exceeds 160 characters", async () => {
        const request = mockRequest({
          username: "testuser",
          fullName: "Test User",
          email: "test@example.com",
          phone: "1234567890",
          birthDate: "2000-01-01",
          bio: "a".repeat(161),
        });

        const response = await PUT(request);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.errors.bio).toBe("Bio must be 160 characters or less.");
      });

      it("should return 400 for username validation error", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            ...validProfileData,
            username: "short", // Less than 6 characters
          }),
        } as Partial<NextRequest>;

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.message).toBe("Validation failed");
        expect(result.errors.username).toBe("Username must be at least 6 characters.");
        expect(console.timeEnd).toHaveBeenCalledWith("Profile Update Execution");
      });

      it("should return 400 for missing fullName", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            ...validProfileData,
            fullName: "",
          }),
        } as Partial<NextRequest>;

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.message).toBe("Validation failed");
        expect(result.errors.fullName).toBe("Full name is required.");
      });

      it("should return 400 for invalid email", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            ...validProfileData,
            email: "invalid-email",
          }),
        } as Partial<NextRequest>;

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.message).toBe("Validation failed");
        expect(result.errors.email).toBe("Must be a valid email format.");
      });

      it("should return 400 for invalid phone", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            ...validProfileData,
            phone: "123", // Too short
          }),
        } as Partial<NextRequest>;

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.message).toBe("Validation failed");
        expect(result.errors.phone).toBe("Phone must be 10-15 digits.");
      });

      it("should return 400 for future birth date", async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            ...validProfileData,
            birthDate: futureDate.toISOString().split('T')[0],
          }),
        } as Partial<NextRequest>;

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.message).toBe("Validation failed");
        expect(result.errors.birthDate).toBe("Birth date cannot be in the future.");
      });

      it("should return 400 for bio too long", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            ...validProfileData,
            bio: "a".repeat(161), // More than 160 characters
          }),
        } as Partial<NextRequest>;

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.message).toBe("Validation failed");
        expect(result.errors.bio).toBe("Bio must be 160 characters or less.");
      });

      it("should return 400 for long bio too long", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            ...validProfileData,
            longBio: "a".repeat(2001), // More than 2000 characters
          }),
        } as Partial<NextRequest>;

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.message).toBe("Validation failed");
        expect(result.errors.longBio).toBe("Long bio must be 2000 characters or less.");
      });

      it("should handle multiple validation errors", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue({
            username: "short",
            fullName: "",
            email: "invalid",
            phone: "123",
            birthDate: "2025-01-01",
            bio: "a".repeat(161),
            longBio: "a".repeat(2001),
          }),
        } as Partial<NextRequest>;

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(400);
        expect(result.message).toBe("Validation failed");
        expect(Object.keys(result.errors)).toHaveLength(6);
        expect(result.errors.username).toBe("Username must be at least 6 characters.");
        expect(result.errors.fullName).toBe("Full name is required.");
        expect(result.errors.email).toBe("Must be a valid email format.");
        expect(result.errors.phone).toBe("Phone must be 10-15 digits.");
        expect(result.errors.birthDate).toBe("Birth date cannot be in the future.");
        expect(result.errors.bio).toBe("Bio must be 160 characters or less.");
      });
    });

    describe("Error handling scenarios", () => {
      it("should handle database errors during update", async () => {
        const mockRequest = {
          json: jest.fn().mockResolvedValue(validProfileData),
        } as Partial<NextRequest>;

        mockExecuteQuery.mockRejectedValueOnce(new Error("Update failed"));

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.message).toBe("Internal server error.");
        expect(console.error).toHaveBeenCalledWith("Profile update error:", expect.any(Error));
        expect(console.timeEnd).toHaveBeenCalledWith("Profile Update Execution");
      });

      it("should handle JSON parsing errors", async () => {
        const mockRequest = {
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        } as Partial<NextRequest>;

        const response = await PUT(mockRequest as NextRequest);
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.message).toBe("Internal server error.");
        expect(console.error).toHaveBeenCalledWith("Profile update error:", expect.any(Error));
        expect(console.timeEnd).toHaveBeenCalledWith("Profile Update Execution");
      });
    });

    describe("Edge cases and specific scenarios", () => {
      it("should return 200 if profile is updated successfully", async () => {
        const validData = getValidProfileData();
        const req = {
          json: () => Promise.resolve(validData),
        } as Request;
        
        await PUT(req);
        
        expect(NextResponse.json).toHaveBeenCalledWith(
          {
            message: "Profile updated successfully.",
          },
          { status: 200 }
        );
      });
    });
  });
});