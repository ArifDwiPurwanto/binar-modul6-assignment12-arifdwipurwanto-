import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginPage from "@/app/login/page";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// Mock dependencies
jest.mock("@/hooks/useAuth");
jest.mock("next/navigation");
jest.mock("react-hot-toast");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockToast = toast as jest.MockedFunction<typeof toast>;

const mockPush = jest.fn();
const mockRequireGuest = jest.fn();
const mockLogin = jest.fn();

describe("LoginPage - Consolidated Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: mockLogin,
      requireGuest: mockRequireGuest,
      logout: jest.fn(),
      checkAuth: jest.fn(),
    } as any);

    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  describe("Rendering and UI Components", () => {
    it("should render the login form", () => {
      render(<LoginPage />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(document.querySelector('input[type="password"]') as HTMLInputElement).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    it("should render login form with all elements", () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(document.querySelector('input[type="password"]') as HTMLInputElement).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
      expect(screen.getByText(/show password/i)).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it("should call requireGuest on mount", () => {
      render(<LoginPage />);
      expect(mockRequireGuest).toHaveBeenCalled();
    });

    it("should toggle password visibility", () => {
      render(<LoginPage />);

      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const toggleButton = screen.getByText(/show password/i);

      expect(passwordInput).toHaveAttribute("type", "password");

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");
      expect(screen.getByText(/hide password/i)).toBeInTheDocument();

      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(screen.getByText(/show password/i)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error if email is empty", () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(submitButton);

      const errorMessage = screen.getByText(/email is required/i);
      expect(errorMessage).toBeInTheDocument();
    });

    it("should show validation error for empty email", async () => {
      render(<LoginPage />);

      const loginButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText("Email is required.")).toBeInTheDocument();
      });
    });

    it("should show validation error for short password", async () => {
      render(<LoginPage />);

      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(passwordInput, { target: { value: "12345" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText("Password must be at least 6 characters.")).toBeInTheDocument();
      });
    });

    it("should show validation errors for both email and password", async () => {
      render(<LoginPage />);

      const loginButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText("Email is required.")).toBeInTheDocument();
        expect(screen.getByText("Password must be at least 6 characters.")).toBeInTheDocument();
      });
    });

    it("should show error for invalid email format", async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
      });
    });

    it("should clear validation errors when input changes", async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const loginButton = screen.getByRole("button", { name: /login/i });

      // Trigger validation error
      fireEvent.click(loginButton);
      await waitFor(() => {
        expect(screen.getByText("Email is required.")).toBeInTheDocument();
      });

      // Clear error by typing
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      await waitFor(() => {
        expect(screen.queryByText("Email is required.")).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission and Authentication", () => {
    it("should call login with correct credentials on successful submission", async () => {
      mockLogin.mockResolvedValue(undefined);
      
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });

    it("should show success message and redirect on successful login", async () => {
      mockLogin.mockResolvedValue(undefined);
      
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith("Login successful!");
        expect(mockPush).toHaveBeenCalledWith("/profile");
      });
    });

    it("should show error message on login failure", async () => {
      const errorMessage = "Invalid credentials";
      mockLogin.mockRejectedValue(new Error(errorMessage));
      
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByRole("textbox", { name: /password/i }) || 
                           document.querySelector('input[type="password"]') as HTMLInputElement;
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
      });
    });

    it("should handle network errors during login", async () => {
      mockLogin.mockRejectedValue(new Error("Network error"));
      
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Network error");
      });
    });

    it("should disable submit button during login process", async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(loginButton);

      expect(loginButton).toBeDisabled();

      await waitFor(() => {
        expect(loginButton).not.toBeDisabled();
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading state when auth is loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        login: mockLogin,
        requireGuest: mockRequireGuest,
        logout: jest.fn(),
        checkAuth: jest.fn(),
      } as any);

      render(<LoginPage />);

      expect(screen.getByTestId(/loading/i)).toBeInTheDocument();
    });

    it("should show form when not loading", () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    });
  });

  describe("Navigation and Links", () => {
    it("should have registration link", () => {
      render(<LoginPage />);

      const registerLink = screen.getByText(/don't have an account/i);
      expect(registerLink).toBeInTheDocument();
    });

    it("should redirect if user is already authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "1", email: "test@example.com" },
        loading: false,
        login: mockLogin,
        requireGuest: mockRequireGuest,
        logout: jest.fn(),
        checkAuth: jest.fn(),
      } as any);

      render(<LoginPage />);

      expect(mockRequireGuest).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty form submission", async () => {
      render(<LoginPage />);

      const loginButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText("Email is required.")).toBeInTheDocument();
        expect(screen.getByText("Password must be at least 6 characters.")).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("should handle special characters in email and password", async () => {
      mockLogin.mockResolvedValue(undefined);
      
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "test+user@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "p@ssw0rd!123" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test+user@example.com", "p@ssw0rd!123");
      });
    });

    it("should trim whitespace from email input", async () => {
      mockLogin.mockResolvedValue(undefined);
      
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const loginButton = screen.getByRole("button", { name: /login/i });

      fireEvent.change(emailInput, { target: { value: "  test@example.com  " } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });
  });
});
