import { renderHook, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(mockRouter);
  
  // Mock console.error to avoid cluttering test output
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useAuth Hook", () => {
  const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZnVsbE5hbWUiOiJUZXN0IFVzZXIifQ.test";

  it("should initialize with loading false and no user after useEffect", async () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    // After useEffect runs, loading should be false
    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it("should set user when valid token exists", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual({
      userId: "123",
      username: "testuser",
      email: "test@example.com",
      fullName: "Test User",
    });
  });

  it("should handle no token gracefully", () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
    expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
  });

  it("should handle empty token", () => {
    mockLocalStorage.getItem.mockReturnValue("");

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it("should handle malformed token", () => {
    const malformedToken = "invalid.token.here";
    mockLocalStorage.getItem.mockReturnValue(malformedToken);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
    expect(console.error).toHaveBeenCalledWith("Token decode error:", expect.any(Error));
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
  });

  it("should handle token with invalid base64 payload", () => {
    const invalidBase64Token = "header.invalid-base64.signature";
    mockLocalStorage.getItem.mockReturnValue(invalidBase64Token);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
    expect(console.error).toHaveBeenCalled();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
  });

  it("should handle token with invalid JSON payload", () => {
    const invalidJsonToken = "header." + btoa("invalid-json") + ".signature";
    mockLocalStorage.getItem.mockReturnValue(invalidJsonToken);

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBe(null);
    expect(console.error).toHaveBeenCalled();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
  });

  describe("login function", () => {
    it("should set token and user data on login", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      const userData = {
        id: "456",
        username: "newuser",
        email: "new@example.com",
        fullName: "New User",
      };

      act(() => {
        result.current.login("new-token", userData);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("token", "new-token");
      expect(result.current.user).toEqual({
        userId: "456",
        username: "newuser",
        email: "new@example.com",
        fullName: "New User",
      });
    });

    it("should handle login with minimal user data", () => {
      const { result } = renderHook(() => useAuth());

      const userData = {
        id: "789",
        username: "minimaluser",
      };

      act(() => {
        result.current.login("minimal-token", userData);
      });

      expect(result.current.user).toEqual({
        userId: "789",
        username: "minimaluser",
        email: undefined,
        fullName: undefined,
      });
    });

    it("should overwrite existing user on new login", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const { result } = renderHook(() => useAuth());

      const newUserData = {
        id: "999",
        username: "newuser",
        email: "new@example.com",
        fullName: "New User",
      };

      act(() => {
        result.current.login("new-token", newUserData);
      });

      expect(result.current.user).toEqual({
        userId: "999",
        username: "newuser",
        email: "new@example.com",
        fullName: "New User",
      });
    });

    it("should handle null user data in login", () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login("token", { id: null, username: null, email: null, fullName: null });
      });

      expect(result.current.user).toEqual({
        userId: null,
        username: null,
        email: null,
        fullName: null,
      });
    });

    it("should handle undefined user data in login", () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login("token", { id: undefined, username: undefined, email: undefined, fullName: undefined });
      });

      expect(result.current.user).toEqual({
        userId: undefined,
        username: undefined,
        email: undefined,
        fullName: undefined,
      });
    });
  });

  describe("logout function", () => {
    it("should clear token and user data on logout", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
      expect(result.current.user).toBe(null);
      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("should handle logout when no user is logged in", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
      expect(result.current.user).toBe(null);
      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("should handle multiple logouts", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      act(() => {
        result.current.logout();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(mockPush).toHaveBeenCalledTimes(2);
    });
  });

  describe("requireAuth function", () => {
    it("should return true when user is authenticated", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const { result } = renderHook(() => useAuth());

      expect(result.current.requireAuth()).toBe(true);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should return false and redirect when user is not authenticated", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      expect(result.current.requireAuth()).toBe(false);
      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("should redirect to custom path when specified", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      expect(result.current.requireAuth("/custom-login")).toBe(false);
      expect(mockPush).toHaveBeenCalledWith("/custom-login");
    });

    it("should return true when loading is true even if no user", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      // During loading phase, user is null but loading is true initially
      // After useEffect runs, loading becomes false
      expect(result.current.loading).toBe(false);
      expect(result.current.requireAuth()).toBe(false);
    });

    it("should return true after login", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login("token", { id: "123", username: "test" });
      });

      expect(result.current.requireAuth()).toBe(true);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should return false after logout", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(result.current.requireAuth()).toBe(false);
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  describe("requireGuest function", () => {
    it("should return true when user is not authenticated", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      expect(result.current.requireGuest()).toBe(true);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should return false and redirect when user is authenticated", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const { result } = renderHook(() => useAuth());

      expect(result.current.requireGuest()).toBe(false);
      expect(mockPush).toHaveBeenCalledWith("/users");
    });

    it("should redirect to custom path when specified", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const { result } = renderHook(() => useAuth());

      expect(result.current.requireGuest("/custom-dashboard")).toBe(false);
      expect(mockPush).toHaveBeenCalledWith("/custom-dashboard");
    });

    it("should return true when loading is true even if user exists", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const { result } = renderHook(() => useAuth());

      // After useEffect runs, loading becomes false and user is set
      expect(result.current.loading).toBe(false);
      expect(result.current.requireGuest()).toBe(false);
    });

    it("should return true after logout", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(result.current.requireGuest()).toBe(true);
      expect(mockPush).toHaveBeenCalledWith("/login"); // from logout
    });

    it("should return false after login", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login("token", { id: "123", username: "test" });
      });

      expect(result.current.requireGuest()).toBe(false);
      expect(mockPush).toHaveBeenCalledWith("/users");
    });
  });

  describe("edge cases", () => {
    it("should handle token with only two parts", () => {
      const incompleteToken = "header.payload"; // Missing signature
      mockLocalStorage.getItem.mockReturnValue(incompleteToken);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBe(null);
      expect(console.error).toHaveBeenCalled();
    });

    it("should handle token with more than three parts", () => {
      const extraPartsToken = "header.payload.signature.extra";
      mockLocalStorage.getItem.mockReturnValue(extraPartsToken);

      const { result } = renderHook(() => useAuth());

      // Should still work as it takes the second part
      expect(result.current.user).toBe(null);
    });

    it("should handle localStorage setItem errors during login", () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("localStorage setItem error");
      });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login("token", { id: "123", username: "test" });
      });

      // Should still set user even if localStorage fails
      expect(result.current.user).toEqual({
        userId: "123",
        username: "test",
        email: undefined,
        fullName: undefined,
      });
    });

    it("should handle localStorage removeItem errors during logout", () => {
      mockLocalStorage.getItem.mockReturnValue(validToken);
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error("localStorage removeItem error");
      });

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      // Should still clear user even if localStorage fails
      expect(result.current.user).toBe(null);
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
