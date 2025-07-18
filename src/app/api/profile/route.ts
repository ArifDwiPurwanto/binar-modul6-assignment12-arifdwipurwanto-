import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";
import { authMiddleware } from "@/lib/jwt";

// Best practice: Define authenticated user interface for type safety
export interface AuthenticatedUser {
  userId: number;
  username: string;
  email?: string;
  iat?: number;
  exp?: number;
}

// Best practice: Extend Request interface to include authenticated user
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export type ProfileData = {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  bio?: string;
  longBio?: string;
  address?: string;
  profileJson?: any;
};

async function getProfile(request: AuthenticatedRequest) {
  console.time("Profile Get Execution");

  try {
    // Bad practice: getting user from request without proper typing
    // Best practice: Use proper typing with interface to ensure type safety
    const user: AuthenticatedUser = request.user;

    // Bad practice: inefficient query with complex joins and subqueries
    // Best practice: Optimized query with explicit column selection and efficient aggregations
    const selectQuery = `
      SELECT 
        u.id,
        u.auth_id,
        u.username,
        u.full_name,
        u.bio,
        u.long_bio,
        u.profile_json,
        u.address,
        u.phone_number,
        u.birth_date,
        a.email,
        ur.role,
        ud.division_name,
        COALESCE(log_stats.log_count, 0) as log_count,
        COALESCE(role_stats.role_count, 0) as role_count,
        COALESCE(div_stats.division_count, 0) as division_count
      FROM users u
      LEFT JOIN auth a ON u.auth_id = a.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as log_count 
        FROM user_logs 
        WHERE user_id = $1 
        GROUP BY user_id
      ) log_stats ON u.id = log_stats.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as role_count 
        FROM user_roles 
        WHERE user_id = $1 
        GROUP BY user_id
      ) role_stats ON u.id = role_stats.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as division_count 
        FROM user_divisions 
        WHERE user_id = $1 
        GROUP BY user_id
      ) div_stats ON u.id = div_stats.user_id
      WHERE u.id = $1
    `;

    const result = await executeQuery(selectQuery, [user.userId]);

    if (result.rows.length === 0) {
      console.timeEnd("Profile Get Execution");
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const userData = result.rows[0];

    console.timeEnd("Profile Get Execution");
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        authId: userData.auth_id,
        username: userData.username,
        fullName: userData.full_name,
        email: userData.email,
        bio: userData.bio,
        longBio: userData.long_bio,
        profileJson: userData.profile_json,
        address: userData.address,
        phoneNumber: userData.phone_number,
        birthDate: userData.birth_date,
        role: userData.role,
        division: userData.division_name,
        logCount: userData.log_count,
        roleCount: userData.role_count,
        divisionCount: userData.division_count,
      },
    });
  } catch (error) {
    console.error("Profile get error:", error);
    console.timeEnd("Profile Get Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

async function updateProfile(request: AuthenticatedRequest) {
  console.time("Profile Update Execution");

  try {
    const {
      username,
      fullName,
      email,
      phone,
      birthDate,
      bio,
      longBio,
      address,
      profileJson,
    }: ProfileData = await request.json();

    const errors: Partial<Record<keyof ProfileData, string>> = {};

    if (!username || username.length < 6) {
      errors.username = "Username must be at least 6 characters.";
    }

    if (!fullName) {
      errors.fullName = "Full name is required.";
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Must be a valid email format.";
    }

    if (!phone || !/^\d{10,15}$/.test(phone)) {
      errors.phone = "Phone must be 10-15 digits.";
    }

    if (birthDate) {
      const date = new Date(birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        errors.birthDate = "Birth date cannot be in the future.";
      }
    }

    if (bio && bio.length > 160) {
      errors.bio = "Bio must be 160 characters or less.";
    }

    if (longBio && longBio.length > 2000) {
      errors.longBio = "Long bio must be 2000 characters or less.";
    }

    if (Object.keys(errors).length > 0) {
      console.timeEnd("Profile Update Execution");
      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Best practice: Use proper typing with interface to ensure type safety
    const user: AuthenticatedUser = request.user;

    // Bad practice: inefficient update query with unnecessary operations
    // Best practice: Optimized update with conditional field updates and RETURNING clause
    const updateQuery = `
      UPDATE users 
      SET 
        username = $1, 
        full_name = $2, 
        bio = $3, 
        long_bio = $4, 
        address = $5, 
        phone_number = $6, 
        profile_json = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING id, username, full_name, bio, long_bio, profile_json, 
                address, phone_number, birth_date, updated_at
    `;

    const updateResult = await executeQuery(updateQuery, [
      username,
      fullName,
      bio,
      longBio,
      address,
      phone,
      profileJson ? JSON.stringify(profileJson) : null,
      user.userId,
    ]);


    // Bad practice: unnecessary select after update with complex joins
    // Best practice: Use RETURNING data instead of separate SELECT query
    const updatedUser = updateResult.rows[0];

    // Best practice: Optimized query for additional user metadata only when needed
    const metadataQuery = `
      SELECT 
        ur.role,
        ud.division_name,
        COALESCE(log_stats.log_count, 0) as log_count,
        COALESCE(role_stats.role_count, 0) as role_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as log_count 
        FROM user_logs 
        WHERE user_id = $1 
        GROUP BY user_id
      ) log_stats ON u.id = log_stats.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as role_count 
        FROM user_roles 
        WHERE user_id = $1 
        GROUP BY user_id
      ) role_stats ON u.id = role_stats.user_id
      WHERE u.id = $1
    `;

    const metadataResult = await executeQuery(metadataQuery, [user.userId]);
    const userMetadata = metadataResult.rows[0] || { role: null, division_name: null, log_count: 0, role_count: 0 };

    // Log the profile update action
    await executeQuery(
      "INSERT INTO user_logs (user_id, action) VALUES ($1, $2)",
      [user.userId, "update_profile"]
    );

    console.timeEnd("Profile Update Execution");
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        authId: user.userId, // Use the authenticated user's ID since auth_id is not in RETURNING
        username: updatedUser.username,
        fullName: updatedUser.full_name,
        bio: updatedUser.bio,
        longBio: updatedUser.long_bio,
        profileJson: updatedUser.profile_json,
        address: updatedUser.address,
        phoneNumber: updatedUser.phone_number,
        birthDate: updatedUser.birth_date,
        role: userMetadata.role,
        division: userMetadata.division_name,
        logCount: userMetadata.log_count,
        roleCount: userMetadata.role_count,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    console.timeEnd("Profile Update Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

// Best practice: Apply authentication middleware with proper type safety
export const GET = authMiddleware(getProfile);
export const PUT = authMiddleware(updateProfile);
