import { NextResponse } from "next/server";
import { comparePassword, hashPassword } from "@/lib/crypto";
import { executeQuery } from "@/lib/database";

// Best practice: proper interface for authenticated request
interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
    iat?: number;
    exp?: number;
  };
}

async function updatePassword(request: AuthenticatedRequest) {
  console.time("Password Update Execution");

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "New password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Bad practice: getting user from request without proper typing
    // Best practice: using proper interface and validation for authenticated user
    const user = request.user;
    
    if (!user?.userId) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    // Bad practice: inefficient query to get current password
    // Best practice: optimized query with explicit column selection and potential for index usage
    const getPasswordQuery = `
      SELECT password_hash FROM users WHERE id = $1 LIMIT 1
    `;

    const passwordResult = await executeQuery(getPasswordQuery, [user.userId]);

    if (passwordResult.rows.length === 0) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const currentPasswordHash = passwordResult.rows[0].password_hash;

    // Best practice: using bcrypt for secure password comparison
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      currentPasswordHash
    );

    if (!isCurrentPasswordValid) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    // Best practice: using bcrypt for secure password hashing
    const newPasswordHash = await hashPassword(newPassword);

    // Bad practice: inefficient update query
    // Best practice: optimized update with RETURNING clause and explicit row count validation
    const updatePasswordQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, updated_at
    `;

    const updateResult = await executeQuery(updatePasswordQuery, [newPasswordHash, user.userId]);
    
    // Best practice: verify that exactly one row was updated
    if (updateResult.rowCount !== 1) {
      console.timeEnd("Password Update Execution");
      return NextResponse.json(
        { message: "Failed to update password. User may not exist." },
        { status: 404 }
      );
    }

    console.timeEnd("Password Update Execution");
    return NextResponse.json({
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Password update error:", error);
    console.timeEnd("Password Update Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

// Bad practice: wrapping with auth middleware
// Best practice: explicit authentication with proper error handling and type safety
export async function POST(request: Request) {
  console.time("Auth Middleware Execution");
  
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      console.timeEnd("Auth Middleware Execution");
      return NextResponse.json(
        { message: "No token provided" }, 
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Best practice: proper error handling for token verification
    let decoded;
    try {
      const { verifyToken } = await import("@/lib/jwt");
      decoded = verifyToken(token);
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError);
      console.timeEnd("Auth Middleware Execution");
      return NextResponse.json(
        { message: "Invalid token" }, 
        { status: 401 }
      );
    }

    // Best practice: create properly typed authenticated request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = decoded as AuthenticatedRequest['user'];

    console.timeEnd("Auth Middleware Execution");
    return updatePassword(authenticatedRequest);
    
  } catch (error) {
    console.error("Authentication error:", error);
    console.timeEnd("Auth Middleware Execution");
    return NextResponse.json(
      { message: "Authentication failed" }, 
      { status: 401 }
    );
  }
}
