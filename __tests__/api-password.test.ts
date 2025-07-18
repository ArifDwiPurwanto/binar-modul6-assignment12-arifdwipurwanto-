/**
 * @jest-environment node
 */
// Mock dependencies first
jest.mock("@/lib/database");
jest.mock("@/lib/crypto"); 
jest.mock("@/lib/jwt");

import { executeQuery } from "@/lib/database";
import { comparePassword, hashPassword } from "@/lib/crypto";
import { authMiddleware } from "@/lib/jwt";

const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockAuthMiddleware = authMiddleware as jest.MockedFunction<typeof authMiddleware>;

// Make authMiddleware return the handler function itself for testing
mockAuthMiddleware.mockImplementation((handler) => handler);

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

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Password API Route Tests", () => {
  let POST: any;

  beforeAll(async () => {
    const route = await import("@/app/api/password/route");
    POST = route.POST;
  });

  describe("Successful scenarios", () => {
    it("should update password successfully", async () => {
      // Mock successful database responses
      mockExecuteQuery.mockResolvedValueOnce({
        rows: [{ password_hash: "hashedOldPassword" }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: []
      });
      mockComparePassword.mockReturnValue(true);
      mockHashPassword.mockReturnValue("hashedNewPassword");
      mockExecuteQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: "UPDATE",
        oid: 0,
        fields: []
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          currentPassword: "oldPassword123",
          newPassword: "newPassword456"
        }),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        message: "Password updated successfully!"
      });

      expect(mockExecuteQuery).toHaveBeenCalledTimes(2);
      expect(mockComparePassword).toHaveBeenCalledWith("oldPassword123", "hashedOldPassword");
      expect(mockHashPassword).toHaveBeenCalledWith("newPassword456");
      expect(mockConsole.time).toHaveBeenCalledWith("Password Update Execution");
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });
  });

  describe("Validation errors", () => {
    it("should return 400 when currentPassword is missing", async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          newPassword: "newPassword456"
        }),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        message: "Current password and new password are required."
      });
      expect(mockExecuteQuery).not.toHaveBeenCalled();
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });

    it("should return 400 when newPassword is missing", async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          currentPassword: "oldPassword123"
        }),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        message: "Current password and new password are required."
      });
      expect(mockExecuteQuery).not.toHaveBeenCalled();
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });

    it("should return 400 when both passwords are missing", async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({}),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        message: "Current password and new password are required."
      });
      expect(mockExecuteQuery).not.toHaveBeenCalled();
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });

    it("should return 400 when newPassword is too short", async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          currentPassword: "oldPassword123",
          newPassword: "12345"
        }),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        message: "New password must be at least 6 characters."
      });
      expect(mockExecuteQuery).not.toHaveBeenCalled();
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });
  });

  describe("Authentication errors", () => {
    it("should return 404 when user not found", async () => {
      mockExecuteQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: "SELECT",
        oid: 0,
        fields: []
      });

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          currentPassword: "oldPassword123",
          newPassword: "newPassword456"
        }),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData).toEqual({
        message: "User not found."
      });
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });

    it("should return 401 when current password is incorrect", async () => {
      mockExecuteQuery.mockResolvedValueOnce({
        rows: [{ password_hash: "hashedOldPassword" }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: []
      });
      mockComparePassword.mockReturnValue(false);

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          currentPassword: "wrongPassword",
          newPassword: "newPassword456"
        }),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData).toEqual({
        message: "Current password is incorrect."
      });
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });
  });

  describe("Error handling", () => {
    it("should return 500 when database error occurs during user lookup", async () => {
      mockExecuteQuery.mockRejectedValue(new Error("Database error"));

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          currentPassword: "oldPassword123",
          newPassword: "newPassword456"
        }),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        message: "Internal server error."
      });
      expect(mockConsole.error).toHaveBeenCalledWith("Password update error:", expect.any(Error));
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });

    it("should return 500 when database error occurs during password update", async () => {
      mockExecuteQuery.mockResolvedValueOnce({
        rows: [{ password_hash: "hashedOldPassword" }],
        rowCount: 1,
        command: "SELECT",
        oid: 0,
        fields: []
      });
      mockComparePassword.mockReturnValue(true);
      mockHashPassword.mockReturnValue("hashedNewPassword");
      mockExecuteQuery.mockRejectedValueOnce(new Error("Update error"));

      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          currentPassword: "oldPassword123",
          newPassword: "newPassword456"
        }),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        message: "Internal server error."
      });
      expect(mockConsole.error).toHaveBeenCalledWith("Password update error:", expect.any(Error));
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });

    it("should return 500 when JSON parsing fails", async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
        user: { userId: "user123" }
      } as any;

      const response = await POST(mockRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        message: "Internal server error."
      });
      expect(mockConsole.error).toHaveBeenCalledWith("Password update error:", expect.any(Error));
      expect(mockConsole.timeEnd).toHaveBeenCalledWith("Password Update Execution");
    });
  });
});
