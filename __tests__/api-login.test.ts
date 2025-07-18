/**
 * @jest-environment node
 */
import { POST } from "@/app/api/login/route";
import { NextRequest } from "next/server";
import { executeQuery } from "@/lib/database";
import { comparePassword } from "@/lib/crypto";
import { generateToken } from "@/lib/jwt";

// Mock external dependencies
jest.mock("@/lib/database");
jest.mock("@/lib/crypto");
jest.mock("@/lib/jwt");

const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;
const mockComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

describe("POST /api/login", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, 'time').mockImplementation();
    jest.spyOn(console, 'timeEnd').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods after each test
    jest.restoreAllMocks();
  });

  it("should return 400 if email is missing", async () => {
      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ password: "validPassword123" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ message: "Email and password are required." });
  });

  it("should return 400 if password is missing", async () => {
      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ message: "Email and password are required." });
  });

  it("should return 400 if password is less than 6 characters", async () => {
      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "123" }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ message: "Password must be at least 6 characters." });
  });

  // Unit test for lines 57-59: Testing when no user is found (result.rows.length === 0)
  it("should return 401 when user is not found in database (result.rows.length === 0)", async () => {
      // Mock database query to return empty result (no user found)
      mockExecuteQuery.mockResolvedValueOnce({
          rows: [], // Empty array simulates no user found
          rowCount: 0,
          command: 'SELECT',
          oid: 0,
          fields: []
      });

      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ 
              email: "nonexistent@example.com", 
              password: "validPassword123" 
          }),
      });

      const response = await POST(request);
      const body = await response.json();

      // Verify the response matches lines 57-59 behavior
      expect(response.status).toBe(401);
      expect(body).toEqual({ message: "Invalid credentials." });
      
      // Verify database query was called with correct parameters
      expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.stringContaining("SELECT"), 
          ["nonexistent@example.com"]
      );
      
      // Verify that password comparison and token generation were NOT called
      // since the user was not found
      expect(mockComparePassword).not.toHaveBeenCalled();
      expect(mockGenerateToken).not.toHaveBeenCalled();
  });

  // Additional test for the success case when user is found
  it("should return 200 and token when login is successful", async () => {
      // Mock database query to return a user
      const mockUser = {
          auth_id: 1,
          email: "test@example.com",
          password: "hashedPassword",
          user_id: 1,
          username: "testuser",
          full_name: "Test User",
          birth_date: "1990-01-01",
          bio: "Test bio",
          long_bio: "Test long bio",
          profile_json: null,
          address: "Test address",
          phone_number: "1234567890",
          role: "user",
          division_name: "IT",
          log_count: 5,
          role_count: 1
      };

      mockExecuteQuery
          .mockResolvedValueOnce({
              rows: [mockUser],
              rowCount: 1,
              command: 'SELECT',
              oid: 0,
              fields: []
          })
          .mockResolvedValueOnce({
              rows: [],
              rowCount: 1,
              command: 'INSERT',
              oid: 0,
              fields: []
          });

      mockComparePassword.mockReturnValue(true);
      mockGenerateToken.mockReturnValue("mock-jwt-token");

      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ 
              email: "test@example.com", 
              password: "validPassword123" 
          }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("message", "Login successful!");
      expect(body).toHaveProperty("token", "mock-jwt-token");
      expect(body).toHaveProperty("user");
      expect(body.user).toHaveProperty("email", "test@example.com");
  });

  // Test for invalid password case
  it("should return 401 when password is invalid", async () => {
      const mockUser = {
          auth_id: 1,
          email: "test@example.com",
          password: "hashedPassword",
          user_id: 1,
          username: "testuser",
          full_name: "Test User",
          role: "user"
      };

      mockExecuteQuery.mockResolvedValueOnce({
          rows: [mockUser],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
      });

      mockComparePassword.mockReturnValue(false); // Invalid password

      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ 
              email: "test@example.com", 
              password: "wrongPassword123" 
          }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toEqual({ message: "Invalid credentials." });
      expect(mockComparePassword).toHaveBeenCalledWith("wrongPassword123", "hashedPassword");
      expect(mockGenerateToken).not.toHaveBeenCalled();
  });

  // Test for database error handling
  it("should return 500 when database query fails", async () => {
      mockExecuteQuery.mockRejectedValueOnce(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ 
              email: "test@example.com", 
              password: "validPassword123" 
          }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body).toEqual({ message: "Internal server error." });
  });

  // Additional comprehensive tests for lines 57-59: No User Found Case
  describe("when result.rows.length === 0 (lines 57-59)", () => {
    it("should handle multiple email attempts that don't exist", async () => {
      const testEmails = [
        "user1@nonexistent.com",
        "user2@nonexistent.com", 
        "user3@nonexistent.com"
      ];

      for (const email of testEmails) {
        // Reset mocks for each iteration
        jest.clearAllMocks();
        jest.spyOn(console, 'time').mockImplementation();
        jest.spyOn(console, 'timeEnd').mockImplementation();

        // Mock empty result for each email
        mockExecuteQuery.mockResolvedValueOnce({
          rows: [], // Triggers lines 57-59
          rowCount: 0,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ 
            email: email, 
            password: "somePassword123" 
          }),
        });

        const response = await POST(request);
        const body = await response.json();

        // Each should return the same 401 response as per lines 57-59
        expect(response.status).toBe(401);
        expect(body).toEqual({ message: "Invalid credentials." });
        expect(mockExecuteQuery).toHaveBeenCalledWith(
          expect.stringContaining("WHERE a.email = $1"), 
          [email]
        );
      }
    });

    it("should properly execute lines 57-59 even with special characters in email", async () => {
      const specialEmail = "test+special.email@example-domain.co.uk";
      
      mockExecuteQuery.mockResolvedValueOnce({
        rows: [], // Empty result triggers lines 57-59
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: []
      });

      const request = new NextRequest("http://localhost/api/login", {
        method: "POST",
        body: JSON.stringify({ 
          email: specialEmail, 
          password: "validPassword123" 
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      // Lines 57-59 should execute normally regardless of email format
      expect(response.status).toBe(401);
      expect(body).toEqual({ message: "Invalid credentials." });
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE a.email = $1"), 
        [specialEmail]
      );
    });

    it("should return same response for empty rows as non-existent user (security best practice)", async () => {
      // Test both completely non-existent email and email that might exist but returns empty
      const testCases = [
        "definitely-not-exists@nowhere.com",
        "might-exist-but-returns-empty@somewhere.com"
      ];

      for (const email of testCases) {
        jest.clearAllMocks();
        jest.spyOn(console, 'time').mockImplementation();
        jest.spyOn(console, 'timeEnd').mockImplementation();

        mockExecuteQuery.mockResolvedValueOnce({
          rows: [], // Both cases trigger lines 57-59
          rowCount: 0,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const request = new NextRequest("http://localhost/api/login", {
          method: "POST",
          body: JSON.stringify({ 
            email: email, 
            password: "anyPassword123" 
          }),
        });

        const response = await POST(request);
        const body = await response.json();

        // Both should return identical responses to prevent email enumeration
        expect(response.status).toBe(401);
        expect(body).toEqual({ message: "Invalid credentials." });
      }
    });
  });
});
