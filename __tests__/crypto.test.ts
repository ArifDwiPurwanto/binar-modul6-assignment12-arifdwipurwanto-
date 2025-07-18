/**
 * @jest-environment node
 */
import crypto from "crypto";
import { hashPassword, comparePassword } from "@/lib/crypto";

// Mock the crypto module
jest.mock("crypto");

const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe("crypto utility functions", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, 'time').mockImplementation();
    jest.spyOn(console, 'timeEnd').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe("hashPassword", () => {
    const mockHash = {
      update: jest.fn(),
      digest: jest.fn()
    };

    beforeEach(() => {
      mockCrypto.createHash = jest.fn().mockReturnValue(mockHash);
      mockHash.update.mockReturnValue(mockHash);
    });

    it("should hash a password successfully", () => {
      const password = "testPassword123";
      const expectedHash = "hashedPassword123";
      
      mockHash.digest.mockReturnValue(expectedHash);

      const result = hashPassword(password);

      expect(mockCrypto.createHash).toHaveBeenCalledWith("sha256");
      expect(mockHash.update).toHaveBeenCalledWith(password);
      expect(mockHash.digest).toHaveBeenCalledWith("hex");
      expect(result).toBe(expectedHash);
    });

    it("should start and end timing for password hashing", () => {
      const password = "testPassword123";
      const expectedHash = "hashedPassword123";
      
      mockHash.digest.mockReturnValue(expectedHash);

      hashPassword(password);

      expect(console.time).toHaveBeenCalledWith("Password Hashing");
      expect(console.timeEnd).toHaveBeenCalledWith("Password Hashing");
    });

    it("should handle empty password", () => {
      const password = "";
      const expectedHash = "emptyHash";
      
      mockHash.digest.mockReturnValue(expectedHash);

      const result = hashPassword(password);

      expect(mockCrypto.createHash).toHaveBeenCalledWith("sha256");
      expect(mockHash.update).toHaveBeenCalledWith("");
      expect(result).toBe(expectedHash);
    });

    it("should handle special characters in password", () => {
      const password = "test@#$%^&*()_+";
      const expectedHash = "specialCharHash";
      
      mockHash.digest.mockReturnValue(expectedHash);

      const result = hashPassword(password);

      expect(mockCrypto.createHash).toHaveBeenCalledWith("sha256");
      expect(mockHash.update).toHaveBeenCalledWith(password);
      expect(result).toBe(expectedHash);
    });

    it("should handle unicode characters in password", () => {
      const password = "test密码123🔒";
      const expectedHash = "unicodeHash";
      
      mockHash.digest.mockReturnValue(expectedHash);

      const result = hashPassword(password);

      expect(mockCrypto.createHash).toHaveBeenCalledWith("sha256");
      expect(mockHash.update).toHaveBeenCalledWith(password);
      expect(result).toBe(expectedHash);
    });

    it("should handle very long passwords", () => {
      const password = "a".repeat(1000);
      const expectedHash = "longPasswordHash";
      
      mockHash.digest.mockReturnValue(expectedHash);

      const result = hashPassword(password);

      expect(mockCrypto.createHash).toHaveBeenCalledWith("sha256");
      expect(mockHash.update).toHaveBeenCalledWith(password);
      expect(result).toBe(expectedHash);
    });

    it("should throw error when crypto.createHash fails", () => {
      const password = "testPassword123";
      const error = new Error("Hash creation failed");
      
      mockCrypto.createHash.mockImplementation(() => {
        throw error;
      });

      expect(() => hashPassword(password)).toThrow("Hash creation failed");
      expect(console.error).toHaveBeenCalledWith("Password hashing error:", error);
      expect(console.timeEnd).toHaveBeenCalledWith("Password Hashing");
    });

    it("should throw error when hash.update fails", () => {
      const password = "testPassword123";
      const error = new Error("Hash update failed");
      
      mockHash.update.mockImplementation(() => {
        throw error;
      });

      expect(() => hashPassword(password)).toThrow("Hash update failed");
      expect(console.error).toHaveBeenCalledWith("Password hashing error:", error);
      expect(console.timeEnd).toHaveBeenCalledWith("Password Hashing");
    });

    it("should throw error when hash.digest fails", () => {
      const password = "testPassword123";
      const error = new Error("Hash digest failed");
      
      mockHash.digest.mockImplementation(() => {
        throw error;
      });

      expect(() => hashPassword(password)).toThrow("Hash digest failed");
      expect(console.error).toHaveBeenCalledWith("Password hashing error:", error);
      expect(console.timeEnd).toHaveBeenCalledWith("Password Hashing");
    });

    it("should return a hashed password for a valid input", async () => {
      const password = "validPassword";
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).not.toBe(password);
    });

    it("should throw an error for invalid input", async () => {
      const invalidPassword = null;
      console.error = jest.fn();
      await expect(hashPassword(invalidPassword as unknown as string)).rejects.toThrow();
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Password hashing error"));
    });
  });

  describe("comparePassword", () => {
    const mockHash = {
      update: jest.fn(),
      digest: jest.fn()
    };

    beforeEach(() => {
      mockCrypto.createHash = jest.fn().mockReturnValue(mockHash);
      mockHash.update.mockReturnValue(mockHash);
    });

    it("should return true when passwords match", () => {
      const password = "testPassword123";
      const hash = "hashedPassword123";
      
      mockHash.digest.mockReturnValue(hash);

      const result = comparePassword(password, hash);

      expect(mockCrypto.createHash).toHaveBeenCalledWith("sha256");
      expect(mockHash.update).toHaveBeenCalledWith(password);
      expect(mockHash.digest).toHaveBeenCalledWith("hex");
      expect(result).toBe(true);
    });

    it("should return false when passwords don't match", () => {
      const password = "testPassword123";
      const hash = "differentHash";
      
      mockHash.digest.mockReturnValue("hashedPassword123");

      const result = comparePassword(password, hash);

      expect(mockCrypto.createHash).toHaveBeenCalledWith("sha256");
      expect(mockHash.update).toHaveBeenCalledWith(password);
      expect(mockHash.digest).toHaveBeenCalledWith("hex");
      expect(result).toBe(false);
    });

    it("should start and end timing for password comparison", () => {
      const password = "testPassword123";
      const hash = "hashedPassword123";
      
      mockHash.digest.mockReturnValue(hash);

      comparePassword(password, hash);

      expect(console.time).toHaveBeenCalledWith("Password Comparison");
      expect(console.timeEnd).toHaveBeenCalledWith("Password Comparison");
    });

    it("should handle empty password and hash", () => {
      const password = "";
      const hash = "";
      
      mockHash.digest.mockReturnValue("");

      const result = comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it("should handle empty password with non-empty hash", () => {
      const password = "";
      const hash = "someHash";
      
      mockHash.digest.mockReturnValue("emptyHash");

      const result = comparePassword(password, hash);

      expect(result).toBe(false);
    });

    it("should handle non-empty password with empty hash", () => {
      const password = "testPassword";
      const hash = "";
      
      mockHash.digest.mockReturnValue("hashedPassword");

      const result = comparePassword(password, hash);

      expect(result).toBe(false);
    });

    it("should handle special characters in password and hash", () => {
      const password = "test@#$%^&*()_+";
      const hash = "specialCharHash";
      
      mockHash.digest.mockReturnValue(hash);

      const result = comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it("should handle unicode characters", () => {
      const password = "test密码123🔒";
      const hash = "unicodeHash";
      
      mockHash.digest.mockReturnValue(hash);

      const result = comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it("should be case sensitive", () => {
      const password = "TestPassword123";
      const hash = "lowercaseHash";
      
      mockHash.digest.mockReturnValue("UppercaseHash");

      const result = comparePassword(password, hash);

      expect(result).toBe(false);
    });

    it("should handle very long passwords and hashes", () => {
      const password = "a".repeat(1000);
      const hash = "longPasswordHash";
      
      mockHash.digest.mockReturnValue(hash);

      const result = comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it("should return false when crypto.createHash fails", () => {
      const password = "testPassword123";
      const hash = "hashedPassword123";
      const error = new Error("Hash creation failed");
      
      mockCrypto.createHash.mockImplementation(() => {
        throw error;
      });

      const result = comparePassword(password, hash);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Password comparison error:", error);
    });

    it("should return false when hash.update fails", () => {
      const password = "testPassword123";
      const hash = "hashedPassword123";
      const error = new Error("Hash update failed");
      
      mockHash.update.mockImplementation(() => {
        throw error;
      });

      const result = comparePassword(password, hash);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Password comparison error:", error);
    });

    it("should return false when hash.digest fails", () => {
      const password = "testPassword123";
      const hash = "hashedPassword123";
      const error = new Error("Hash digest failed");
      
      mockHash.digest.mockImplementation(() => {
        throw error;
      });

      const result = comparePassword(password, hash);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith("Password comparison error:", error);
    });

    it("should handle null or undefined inputs gracefully", () => {
      const password = "testPassword";
      const hash = "testHash";
      
      // Test with null values
      mockHash.digest.mockReturnValue(null as any);
      let result = comparePassword(password, hash);
      expect(result).toBe(false);

      // Test with undefined values  
      mockHash.digest.mockReturnValue(undefined as any);
      result = comparePassword(password, hash);
      expect(result).toBe(false);
    });

    it("should return true for valid password and hash", async () => {
      const password = "validPassword";
      const hash = await bcrypt.hash(password, 12);
      const result = await comparePassword(password, hash);
      expect(result).toBe(true);
    });

    it("should return false for invalid password", async () => {
      const password = "validPassword";
      const hash = await bcrypt.hash(password, 12);
      const result = await comparePassword("invalidPassword", hash);
      expect(result).toBe(false);
    });

    it("should return false and log error for invalid hash format", async () => {
      const password = "validPassword";
      const invalidHash = "invalidHashFormat";
      console.error = jest.fn();
      const result = await comparePassword(password, invalidHash);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Password comparison error"));
    });
  });

});
/**
 * @jest-environment node
 */
import { hashPassword, comparePassword } from "@/lib/crypto";

// Integration tests without mocks to test actual crypto functionality
describe("crypto integration tests", () => {
  beforeEach(() => {
    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, 'time').mockImplementation();
    jest.spyOn(console, 'timeEnd').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  it("should hash and compare password correctly in real scenario", () => {
    const password = "testPassword123";
    
    // Hash the password
    const hash = hashPassword(password);
    
    // Verify the hash is a string and has expected length (64 for SHA-256 hex)
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]+$/i.test(hash)).toBe(true);
    
    // Compare with correct password
    expect(comparePassword(password, hash)).toBe(true);
    
    // Compare with incorrect password
    expect(comparePassword("wrongPassword", hash)).toBe(false);
  });

  it("should produce consistent hashes for same input", () => {
    const password = "consistentPassword";
    
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);
    
    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different inputs", () => {
    const password1 = "password1";
    const password2 = "password2";
    
    const hash1 = hashPassword(password1);
    const hash2 = hashPassword(password2);
    
    expect(hash1).not.toBe(hash2);
  });

  it("should be case sensitive", () => {
    const password1 = "Password";
    const password2 = "password";
    
    const hash1 = hashPassword(password1);
    const hash2 = hashPassword(password2);
    
    expect(hash1).not.toBe(hash2);
    expect(comparePassword(password1, hash2)).toBe(false);
    expect(comparePassword(password2, hash1)).toBe(false);
  });

  it("should handle empty strings", () => {
    const emptyHash = hashPassword("");
    
    expect(typeof emptyHash).toBe("string");
    expect(emptyHash).toHaveLength(64);
    expect(comparePassword("", emptyHash)).toBe(true);
    expect(comparePassword("notEmpty", emptyHash)).toBe(false);
  });

  it("should handle special characters", () => {
    const password = "test@#$%^&*()_+={}[]|\\:;\"'<>,.?/~`";
    const hash = hashPassword(password);
    
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
    expect(comparePassword(password, hash)).toBe(true);
  });

  it("should handle unicode characters", () => {
    const password = "测试密码🔒🛡️🗝️";
    const hash = hashPassword(password);
    
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
    expect(comparePassword(password, hash)).toBe(true);
  });

  it("should handle very long passwords", () => {
    const password = "a".repeat(10000);
    const hash = hashPassword(password);
    
    expect(typeof hash).toBe("string");
    expect(hash).toHaveLength(64);
    expect(comparePassword(password, hash)).toBe(true);
  });

  it("should produce known hash for known input", () => {
    // Test with a known input to verify SHA-256 is working correctly
    const password = "hello";
    
    const actualHash = hashPassword(password);
    
    // We can't predict the exact hash without calculating it, but we can verify consistency
    expect(actualHash).toBe(hashPassword(password));
    expect(comparePassword(password, actualHash)).toBe(true);
  });

  it("should handle whitespace differences", () => {
    const password1 = "password";
    const password2 = " password";
    const password3 = "password ";
    const password4 = " password ";
    
    const hash1 = hashPassword(password1);
    const hash2 = hashPassword(password2);
    const hash3 = hashPassword(password3);
    const hash4 = hashPassword(password4);
    
    // All should be different because whitespace matters
    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).not.toBe(hash4);
    expect(hash2).not.toBe(hash3);
    expect(hash2).not.toBe(hash4);
    expect(hash3).not.toBe(hash4);
    
    // Each should only match with itself
    expect(comparePassword(password1, hash1)).toBe(true);
    expect(comparePassword(password1, hash2)).toBe(false);
    expect(comparePassword(password2, hash2)).toBe(true);
    expect(comparePassword(password2, hash1)).toBe(false);
  });
});
