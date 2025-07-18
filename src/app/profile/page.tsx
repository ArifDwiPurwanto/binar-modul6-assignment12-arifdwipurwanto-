"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

type ProfileErrors = {
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  bio?: string;
  longBio?: string;
  address?: string;
};

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [longBio, setLongBio] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [dataLoading, setDataLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Bad practice: checking auth on every render
  // Best practice: check auth status based on user and loading state, avoid function dependencies
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Bad practice: fetching user data on every render
  // Best practice: fetch once when user is available, with proper validation and cleanup
  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    const abortController = new AbortController();
    
    const validateAndSanitizeUserData = (userData: any) => {
      const formatBirthDate = (birthDate: any) => {
        if (!birthDate) return "";
        return typeof birthDate === 'string' ? birthDate.split("T")[0] : "";
      };

      return {
        username: typeof userData.username === 'string' ? userData.username.trim() : "",
        fullName: typeof userData.fullName === 'string' ? userData.fullName.trim() : "",
        email: typeof userData.email === 'string' ? userData.email.trim().toLowerCase() : "",
        phoneNumber: typeof userData.phoneNumber === 'string' ? userData.phoneNumber.trim() : "",
        birthDate: formatBirthDate(userData.birthDate),
        bio: typeof userData.bio === 'string' ? userData.bio.trim() : "",
        longBio: typeof userData.longBio === 'string' ? userData.longBio.trim() : "",
        address: typeof userData.address === 'string' ? userData.address.trim() : "",
      };
    };
    
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("No authentication token found");
          setDataLoading(false);
          return;
        }

        const response = await fetch(`/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Best practice: validate API response structure before using
        if (!data?.user) {
          throw new Error("Invalid response format");
        }

        // Best practice: validate and sanitize data before setting state
        const sanitizedData = validateAndSanitizeUserData(data.user);

        // Bad practice: setting state without validation
        // Best practice: set state with validated and sanitized data
        setUsername(sanitizedData.username);
        setFullName(sanitizedData.fullName);
        setEmail(sanitizedData.email);
        setPhone(sanitizedData.phoneNumber);
        setBirthDate(sanitizedData.birthDate);
        setBio(sanitizedData.bio);
        setLongBio(sanitizedData.longBio);
        setAddress(sanitizedData.address);
        
      } catch (error) {
        // Best practice: proper error type checking
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Fetch was aborted');
          return;
        }
        console.error("Fetch user data error:", error);
        toast.error("Failed to load user data");
      } finally {
        if (!abortController.signal.aborted) {
          setDataLoading(false);
        }
      }
    };

    fetchUserData();

    // Best practice: cleanup function to abort fetch if component unmounts
    return () => {
      abortController.abort();
    };
  }, [user?.userId]); // Best practice: depend on user ID instead of entire user object

  const validate = () => {
    const newErrors: ProfileErrors = {};

    if (username.length < 6) {
      newErrors.username = "Username must be at least 6 characters.";
    }
    if (!fullName) {
      newErrors.fullName = "Full name is required.";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Must be a valid email format.";
    }
    if (!/^\d{10,15}$/.test(phone)) {
      newErrors.phone = "Phone must be 10-15 digits.";
    }
    if (birthDate) {
      const date = new Date(birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        newErrors.birthDate = "Birth date cannot be in the future.";
      }
    }
    if (bio.length > 160) {
      newErrors.bio = "Bio must be 160 characters or less.";
    }
    if (longBio.length > 2000) {
      newErrors.longBio = "Long bio must be 2000 characters or less.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const toastId = toast.loading("Updating profile...");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          fullName,
          email,
          phone,
          birthDate,
          bio,
          longBio,
          address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile updated successfully!", { id: toastId });
      } else {
        toast.error(data.message || "An error occurred.", { id: toastId });
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Network error occurred.", { id: toastId });
    }
  };

  if (authLoading || dataLoading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center">Update Profile</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-900"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.username && (
                <p className="mt-2 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-900"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.fullName && (
                <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-900"
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="birthDate"
                className="block text-sm font-medium text-gray-900"
              >
                Birth Date
              </label>
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.birthDate && (
                <p className="mt-2 text-sm text-red-600">{errors.birthDate}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-900"
              >
                Address
              </label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your full address"
              />
              {errors.address && (
                <p className="mt-2 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-900"
              >
                Bio (Short)
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Tell us about yourself (max 160 characters)"
                maxLength={160}
              />
              <p className="mt-1 text-xs text-gray-500">
                {bio.length}/160 characters
              </p>
              {errors.bio && (
                <p className="mt-2 text-sm text-red-600">{errors.bio}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="longBio"
                className="block text-sm font-medium text-gray-900"
              >
                Long Bio (For Sesi 12 Practice)
              </label>
              <textarea
                id="longBio"
                value={longBio}
                onChange={(e) => setLongBio(e.target.value)}
                rows={6}
                className="block w-full px-3 py-2 mt-1 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Detailed bio for ETL practice (max 2000 characters)"
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-gray-500">
                {longBio.length}/2000 characters
              </p>
              {errors.longBio && (
                <p className="mt-2 text-sm text-red-600">{errors.longBio}</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Profile
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
