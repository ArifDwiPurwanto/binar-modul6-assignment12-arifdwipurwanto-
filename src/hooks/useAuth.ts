"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Bad practice: checking token on every render without memoization
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Bad practice: decoding JWT without proper verification
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser({
            userId: payload.userId,
            username: payload.username,
            email: payload.email,
            fullName: payload.fullName,
          });
        } catch (error) {
          console.error("Token decode error:", error);
          localStorage.removeItem("token");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Bad practice: storing token in localStorage without handling errors properly
  // Best practice: use a more secure storage method or handle token expiration properly
  const login = (token: string, userData: any) => {
    try {
      localStorage.setItem("token", token);
    } catch (error) {
      console.error("Failed to store token:", error);
    }
    setUser({
      userId: userData.id,
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
    });
  };

  // Bad practice: removing token in localStorage without handling errors properly
  // Best practice: ensure token removal is handled gracefully
  const logout = () => {
    try {
      localStorage.removeItem("token");
    } catch (error) {
      console.error("Failed to remove token:", error);
    }
    setUser(null);
    router.push("/login");
  };

  const requireAuth = (redirectTo = "/login") => {
    if (!loading && !user) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  const requireGuest = (redirectTo = "/users") => {
    if (!loading && user) {
      router.push(redirectTo);
      return false;
    }
    return true;
  };

  return {
    user,
    loading,
    login,
    logout,
    requireAuth,
    requireGuest,
  };
}
