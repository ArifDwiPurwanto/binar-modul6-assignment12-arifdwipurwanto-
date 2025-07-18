/**
 * @jest-environment node
 */
import { GET } from "@/app/api/users/route";
import { executeQuery } from "@/lib/database";
import { NextResponse } from "next/server";

// Ensure Response is available
if (typeof global.Response === 'undefined') {
  const { Response } = require('undici');
  global.Response = Response;
}

// Mock dependencies
jest.mock("@/lib/database");
jest.mock("next/server");

const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;
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
});

describe("Users API Route - Consolidated Tests", () => {
  const mockUserData = {
    id: "1",
    username: "user1",
    full_name: "User One",
    email: "user1@example.com",
    birth_date: "1990-01-01",
    bio: "Bio 1",
    long_bio: "Long bio 1",
    profile_json: null,
    address: "Address 1",
    phone_number: "1234567890",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-06-01T00:00:00Z",
    role: "user",
    division_name: "Engineering",
    display_name: "User One (user)",
    bio_display: "Bio 1",
    instagram_handle: "No profile data",
    total_users: 10,
    newer_users: 5,
    log_count: 8,
    role_count: 1,
    division_count: 1,
    login_count: 3,
    update_count: 2,
    recent_logs: 1,
  };

  describe("GET /api/users", () => {
    describe("Successful user retrieval scenarios", () => {
      it("should return users with correct structure", async () => {
        const mockDbResult = {
          rows: [mockUserData],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({
                id: "1",
                username: "user1",
                fullName: "User One",
                email: "user1@example.com",
              }),
            ]),
            total: expect.any(Number),
            activeUsers: expect.any(Number),
            seniorUsers: expect.any(Number),
            usersWithCompleteProfiles: expect.any(Number),
            usersByDivision: expect.any(Object),
            filteredBy: "all",
            message: "Users retrieved successfully",
          })
        );
      });

      it("should return properly formatted user list with statistics", async () => {
        const mockDbResult = {
          rows: [
            mockUserData,
            {
              ...mockUserData,
              id: "2",
              username: "user2",
              full_name: "User Two",
              email: "user2@example.com",
              division_name: "Marketing",
            }
          ],
          rowCount: 2,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.stringContaining("SELECT"),
          expect.any(Array)
        );
        expect(console.time).toHaveBeenCalledWith("Users API Execution");
        expect(console.timeEnd).toHaveBeenCalledWith("Users API Execution");
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({
                id: "1",
                username: "user1",
                fullName: "User One",
              }),
              expect.objectContaining({
                id: "2",
                username: "user2",
                fullName: "User Two",
              }),
            ]),
            total: expect.any(Number),
            message: "Users retrieved successfully",
          })
        );
      });

      it("should handle division filtering", async () => {
        const mockDbResult = {
          rows: [mockUserData],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users?division=Engineering");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            filteredBy: "Engineering",
            message: "Users retrieved successfully",
          })
        );
      });

      it("should handle role filtering", async () => {
        const mockDbResult = {
          rows: [mockUserData],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users?role=admin");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            filteredBy: "admin",
            message: "Users retrieved successfully",
          })
        );
      });

      it("should return empty users list when no users found", async () => {
        const mockDbResult = {
          rows: [],
          rowCount: 0,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            users: [],
            total: 0,
            message: "Users retrieved successfully",
          })
        );
      });

      it("should calculate statistics correctly", async () => {
        const mockUsersWithStats = [
          {
            ...mockUserData,
            id: "1",
            username: "user1",
            full_name: "User One",
            bio: "Complete bio",
            long_bio: "Complete long bio",
            profile_json: '{"social":"data"}',
            address: "Complete address",
            phone_number: "1234567890",
            birth_date: "1990-01-01",
            division_name: "Engineering",
            total_users: 3,
            newer_users: 2,
            log_count: 10,
          },
          {
            ...mockUserData,
            id: "2",
            username: "user2",
            full_name: "User Two",
            bio: null,
            long_bio: null,
            profile_json: null,
            address: null,
            phone_number: null,
            birth_date: null,
            division_name: "Marketing",
          },
          {
            ...mockUserData,
            id: "3",
            username: "user3",
            full_name: "User Three",
            bio: "Partial bio",
            division_name: "Engineering",
          }
        ];

        const mockDbResult = {
          rows: mockUsersWithStats,
          rowCount: 3,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({ id: "1", username: "user1" }),
              expect.objectContaining({ id: "2", username: "user2" }),
              expect.objectContaining({ id: "3", username: "user3" }),
            ]),
            total: 3,
            activeUsers: expect.any(Number),
            seniorUsers: expect.any(Number),
            usersWithCompleteProfiles: expect.any(Number),
            usersByDivision: expect.objectContaining({
              Engineering: expect.any(Number),
              Marketing: expect.any(Number),
            }),
            message: "Users retrieved successfully",
          })
        );
      });
    });

    describe("Error handling scenarios", () => {
      it("should handle database errors", async () => {
        const error = new Error("Database error");
        mockExecuteQuery.mockRejectedValue(error);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          { message: "Internal server error." },
          { status: 500 }
        );
        expect(console.error).toHaveBeenCalledWith("Users API error:", error);
        expect(console.timeEnd).toHaveBeenCalledWith("Users API Execution");
      });

      it("should handle database connection timeout", async () => {
        const timeoutError = new Error("Connection timeout");
        mockExecuteQuery.mockRejectedValue(timeoutError);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          { message: "Internal server error." },
          { status: 500 }
        );
        expect(console.error).toHaveBeenCalledWith("Users API error:", timeoutError);
      });

      it("should handle malformed database response", async () => {
        const malformedResult = {
          rows: null, // Invalid rows
          rowCount: 0,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(malformedResult as any);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        // Should handle gracefully and not crash
        expect(console.error).toHaveBeenCalled();
      });
    });

    describe("Query parameter handling", () => {
      it("should handle multiple query parameters", async () => {
        const mockDbResult = {
          rows: [mockUserData],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users?division=Engineering&role=user&limit=10");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Users retrieved successfully",
          })
        );
      });

      it("should handle invalid query parameters gracefully", async () => {
        const mockDbResult = {
          rows: [mockUserData],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users?invalid=param&another=bad");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: "Users retrieved successfully",
          })
        );
      });

      it("should handle empty query parameters", async () => {
        const mockDbResult = {
          rows: [mockUserData],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users?");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            filteredBy: "all",
            message: "Users retrieved successfully",
          })
        );
      });
    });

    describe("Data transformation scenarios", () => {
      it("should properly transform user data with null values", async () => {
        const userWithNulls = {
          ...mockUserData,
          bio: null,
          long_bio: null,
          profile_json: null,
          address: null,
          phone_number: null,
          birth_date: null,
          instagram_handle: null,
        };

        const mockDbResult = {
          rows: [userWithNulls],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({
                id: "1",
                username: "user1",
                fullName: "User One",
                email: "user1@example.com",
                bio: null,
                longBio: null,
                profileJson: null,
                address: null,
                phoneNumber: null,
                birthDate: null,
              }),
            ]),
          })
        );
      });

      it("should handle profile_json parsing", async () => {
        const userWithJson = {
          ...mockUserData,
          profile_json: '{"instagram":"@user1","twitter":"@user1_tw"}',
        };

        const mockDbResult = {
          rows: [userWithJson],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({
                profileJson: {
                  instagram: "@user1",
                  twitter: "@user1_tw"
                },
              }),
            ]),
          })
        );
      });

      it("should handle invalid profile_json gracefully", async () => {
        const userWithInvalidJson = {
          ...mockUserData,
          profile_json: 'invalid json string',
        };

        const mockDbResult = {
          rows: [userWithInvalidJson],
          rowCount: 1,
          command: "SELECT",
          oid: 0,
          fields: [],
        };
        
        mockExecuteQuery.mockResolvedValue(mockDbResult);
        const mockRequest = new Request("http://localhost:3000/api/users");
        
        await GET(mockRequest);
        
        // Should handle invalid JSON gracefully
        expect(mockNextResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            users: expect.arrayContaining([
              expect.objectContaining({
                id: "1",
                username: "user1",
              }),
            ]),
          })
        );
      });
    });
  });
});
