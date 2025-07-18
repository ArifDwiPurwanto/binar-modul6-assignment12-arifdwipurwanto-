import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

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

describe("Navbar Component", () => {
  const validToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3R1c2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZnVsbE5hbWUiOiJUZXN0IFVzZXIifQ.test";

  it("should not render when user is not logged in", () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(<Navbar />);

    expect(screen.queryByText(/Workshop App/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hi,/i)).not.toBeInTheDocument();
  });

  it("should render when user is logged in with valid token", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    expect(screen.getByText("Workshop App")).toBeInTheDocument();
    expect(screen.getByText(/Hi, testuser/i)).toBeInTheDocument();
  });

  it("should decode and display user information from token", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    expect(screen.getByText("Hi, testuser")).toBeInTheDocument();
    expect(screen.getByText("Workshop App")).toBeInTheDocument();
  });

  it("should handle malformed token by redirecting to login", () => {
    const malformedToken = "invalid.token.here";
    mockLocalStorage.getItem.mockReturnValue(malformedToken);

    render(<Navbar />);

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
    expect(mockPush).toHaveBeenCalledWith("/login");
    expect(console.error).toHaveBeenCalled();
  });

  it("should show dropdown when user button is clicked", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    fireEvent.click(userButton);

    expect(screen.getByText("Update Profile")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("should hide dropdown when user button is clicked again", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    
    // Open dropdown
    fireEvent.click(userButton);
    expect(screen.getByText("Update Profile")).toBeInTheDocument();

    // Close dropdown
    fireEvent.click(userButton);
    expect(screen.queryByText("Update Profile")).not.toBeInTheDocument();
  });

  it("should rotate dropdown arrow when dropdown is open", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    const arrow = userButton.querySelector("svg");

    expect(arrow).not.toHaveClass("rotate-180");

    fireEvent.click(userButton);

    expect(arrow).toHaveClass("rotate-180");
  });

  it("should close dropdown when Update Profile link is clicked", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    fireEvent.click(userButton);

    const profileLink = screen.getByText("Update Profile");
    fireEvent.click(profileLink);

    expect(screen.queryByText("Update Profile")).not.toBeInTheDocument();
  });

  it("should call setShowDropdown(false) when Update Profile link onClick is triggered", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    // Open dropdown first
    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    fireEvent.click(userButton);

    // Verify dropdown is open
    expect(screen.getByText("Update Profile")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();

    // Click the Update Profile link to trigger the onClick handler (line 112)
    const profileLink = screen.getByText("Update Profile");
    fireEvent.click(profileLink);

    // Verify dropdown is closed (setShowDropdown(false) was called)
    expect(screen.queryByText("Update Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();

    // Verify the click-outside overlay is also removed
    const clickOutsideOverlay = document.querySelector('.fixed.inset-0.z-40');
    expect(clickOutsideOverlay).not.toBeInTheDocument();
  });

  it("should handle logout correctly", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    fireEvent.click(userButton);

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("should clear user state on logout", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    const { rerender } = render(<Navbar />);

    // Trigger logout
    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    fireEvent.click(userButton);

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    // Mock localStorage to return null after logout
    mockLocalStorage.getItem.mockReturnValue(null);

    // Re-render component
    rerender(<Navbar />);

    expect(screen.queryByText(/Workshop App/i)).not.toBeInTheDocument();
  });

  it("should handle token decode errors gracefully", () => {
    // Create a token with invalid base64 encoding
    const invalidToken = "header.invalid-base64.signature";
    mockLocalStorage.getItem.mockReturnValue(invalidToken);

    render(<Navbar />);

    expect(console.error).toHaveBeenCalledWith("Token decode error:", expect.any(Error));
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("should handle token with missing payload parts", () => {
    const incompleteToken = "header.signature"; // Missing payload
    mockLocalStorage.getItem.mockReturnValue(incompleteToken);

    render(<Navbar />);

    expect(console.error).toHaveBeenCalled();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("should render Workshop App link correctly", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const workshopLink = screen.getByRole("link", { name: "Workshop App" });
    expect(workshopLink).toHaveAttribute("href", "/users");
  });

  it("should render Update Profile link correctly", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    fireEvent.click(userButton);

    const profileLink = screen.getByRole("link", { name: "Update Profile" });
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  it("should handle empty token gracefully", () => {
    mockLocalStorage.getItem.mockReturnValue("");

    render(<Navbar />);

    expect(screen.queryByText(/Workshop App/i)).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should handle null user data in token", () => {
    // Create a token with null payload
    const nullPayloadToken = "header." + btoa("null") + ".signature";
    mockLocalStorage.getItem.mockReturnValue(nullPayloadToken);

    render(<Navbar />);

    expect(console.error).toHaveBeenCalled();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("should handle token with incomplete user data", () => {
    // Create a token with incomplete user data
    const incompleteUserToken = "header." + btoa(JSON.stringify({ userId: "123" })) + ".signature";
    mockLocalStorage.getItem.mockReturnValue(incompleteUserToken);

    render(<Navbar />);

    expect(screen.getByText(/Hi,/i)).toBeInTheDocument();
  });

  it("should render svg arrow with correct attributes", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    const svg = userButton.querySelector("svg");

    expect(svg).toHaveAttribute("fill", "none");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
  });

  it("should have correct CSS classes on navigation elements", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("bg-white", "shadow-lg", "border-b");

    const workshopLink = screen.getByRole("link", { name: "Workshop App" });
    expect(workshopLink).toHaveClass("text-xl", "font-bold", "text-gray-800");
  });

  it("should close dropdown when clicking outside (click overlay)", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    // Open dropdown
    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    fireEvent.click(userButton);

    // Verify dropdown is open
    expect(screen.getByText("Update Profile")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();

    // Find and click the click-outside overlay
    const clickOutsideOverlay = document.querySelector('.fixed.inset-0.z-40');
    expect(clickOutsideOverlay).toBeInTheDocument();
    
    fireEvent.click(clickOutsideOverlay!);

    // Verify dropdown is closed (setShowDropdown(false) was called)
    expect(screen.queryByText("Update Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
    
    // Verify the click-outside overlay is also removed
    expect(document.querySelector('.fixed.inset-0.z-40')).not.toBeInTheDocument();
  });

  it("should handle dropdown positioning correctly", () => {
    mockLocalStorage.getItem.mockReturnValue(validToken);

    render(<Navbar />);

    const userButton = screen.getByRole("button", { name: /Hi, testuser/i });
    fireEvent.click(userButton);

    const dropdown = screen.getByText("Update Profile").closest("div");
    expect(dropdown).toHaveClass("absolute", "right-0", "mt-2", "w-48", "bg-white", "rounded-md", "shadow-lg", "py-1", "z-50");
  });
});
