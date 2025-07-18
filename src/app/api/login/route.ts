import { NextResponse } from "next/server";
import { comparePassword } from "@/lib/crypto";
import { executeQuery } from "@/lib/database";
import { generateToken } from "@/lib/jwt";

export async function POST(request: Request) {
  console.time("Login API Execution");

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Step 1: First, get basic auth and user data for login validation
    const authQuery = `
      SELECT 
        a.id as auth_id,
        a.email,
        a.password,
        u.id as user_id,
        u.username,
        u.full_name
      FROM auth a
      INNER JOIN users u ON a.id = u.auth_id
      WHERE a.email = $1
    `;

    const authResult = await executeQuery(authQuery, [email]);

    if (authResult.rows.length === 0) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    const user = authResult.rows[0];

    // Best practice: using bcrypt for secure password comparison
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      console.timeEnd("Login API Execution");
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Step 2: After successful authentication, get additional user details
    const userDetailsQuery = `
      SELECT 
        u.birth_date,
        u.bio,
        u.long_bio,
        u.profile_json,
        u.address,
        u.phone_number,
        ur.role,
        ud.division_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      WHERE u.id = $1
    `;

    const userDetailsResult = await executeQuery(userDetailsQuery, [user.user_id]);
    const userDetails = userDetailsResult.rows[0] || {};

    // Best practice: minimal data in token - only essential identifiers
    const tokenPayload = {
      userId: user.user_id,
      role: userDetails.role,
    };

    const token = generateToken(tokenPayload);

    // Log the login action
    await executeQuery(
      "INSERT INTO user_logs (user_id, action) VALUES ($1, $2)",
      [user.user_id, "login"]
    );

    console.timeEnd("Login API Execution");
    return NextResponse.json({
      message: "Login successful!",
      token,
      user: {
        id: user.user_id,
        authId: user.auth_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: userDetails.role,
        division: userDetails.division_name,
        bio: userDetails.bio,
        longBio: userDetails.long_bio,
        profileJson: userDetails.profile_json,
        address: userDetails.address,
        phoneNumber: userDetails.phone_number,
        birthDate: userDetails.birth_date,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    console.timeEnd("Login API Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
