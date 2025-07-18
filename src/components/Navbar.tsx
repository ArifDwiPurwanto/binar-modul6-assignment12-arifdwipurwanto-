"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
}

// Best practice: Type safety for JWT payload
interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  fullName?: string;
  exp?: number; // Token expiration time
  iat?: number; // Token issued at time
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Bad practice: checking token on every render
    // Best practice: Secure JWT validation with proper error handling and type safety
    const validateAndDecodeToken = () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUser(null);
          return;
        }

        // Bad practice: decoding JWT without proper verification
        // Best practice: Check token format before processing
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
          throw new Error("Invalid JWT format");
        }

        // Best practice: Safely decode JWT payload with type checking
        const payload: JWTPayload = JSON.parse(atob(tokenParts[1]));
        
        // Best practice: Validate token expiration
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          throw new Error("Token has expired");
        }

        // Best practice: Validate required fields with type safety
        if (!payload.userId || !payload.username || !payload.email) {
          throw new Error("Invalid token payload - missing required fields");
        }

        // Best practice: Set user data with validated payload
        setUser({
          userId: payload.userId,
          username: payload.username,
          email: payload.email,
          fullName: payload.fullName || "", // Best practice: provide default value
        });
      } catch (error) {
        console.error("Token validation error:", error);
        // Best practice: Clean up invalid tokens and redirect
        try {
          localStorage.removeItem("token");
        } catch (storageError) {
          console.error("Failed to remove invalid token:", storageError);
        }
        setUser(null);
        router.push("/login");
      }
    };

    // Best practice: Use the secure validation function
    validateAndDecodeToken();
  }, [router]);

  const handleLogout = () => {
    // Bad practice: no proper cleanup
    localStorage.removeItem("token");
    setUser(null);
    setShowDropdown(false);
    router.push("/login");
  };

  // Best practice: Secure logout with proper error handling and cleanup
  const handleSecureLogout = () => {
    try {
      // Best practice: Clear all authentication data
      localStorage.removeItem("token");
      
      // Best practice: Clear other potential auth-related data
      sessionStorage.clear();
      
      // Best practice: Reset component state
      setUser(null);
      setShowDropdown(false);
      
      // Best practice: Navigate to login
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Best practice: Even if there's an error, still attempt cleanup
      setUser(null);
      setShowDropdown(false);
      router.push("/login");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/users" className="text-xl font-bold text-gray-800">
              Workshop App
            </Link>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
              >
                <span className="text-sm font-medium">Hi, {user.username}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Update Profile
                  </Link>
                  <button
                    onClick={handleLogout} // Using original implementation
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout (Original)
                  </button>
                  {/* Best practice: Alternative secure logout option */}
                  <button
                    onClick={handleSecureLogout} // Using best practice implementation
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-200"
                  >
                    Secure Logout (Best Practice)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bad practice example (commented out for reference):
          - No keyboard support
          - Non-semantic HTML element with click handler
          - No proper accessibility attributes
      */}

      {/* Best practice: Accessible click outside handler with keyboard support */}
      {showDropdown && (
        <button
          className="fixed inset-0 z-40 bg-transparent border-0 p-0 cursor-default"
          onClick={() => setShowDropdown(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
              setShowDropdown(false);
            }
          }}
          aria-label="Close dropdown menu"
          type="button"
        />
      )}
    </nav>
  );
}
