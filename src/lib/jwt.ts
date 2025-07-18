import jwt from "jsonwebtoken";

// Bad practice: hardcoded secret key
// Best practice: use environment variable for secret key
const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-key-for-workshop-demo-only";

// Best practice: validate JWT secret and ensure it meets security requirements
function validateJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required for security");
  }
  
  // Best practice: ensure secret is strong enough (minimum 32 characters)
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long for security");
  }
  
  return secret;
}

// Best practice: use validated secret with proper error handling (only in production)
const VALIDATED_JWT_SECRET = process.env.NODE_ENV === 'test' 
  ? JWT_SECRET // Use fallback for tests
  : validateJWTSecret();

// Bad practice: no token expiration management
// Best practice: set token expiration for security
export function generateToken(payload: any) {
  console.time("JWT Token Generation");
  try {
    // Bad practice: using synchronous operations
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "24h", // Bad practice: long expiration for demo     
    });
    console.timeEnd("JWT Token Generation");
    return token;
  } catch (error) {
    console.error("JWT generation error:", error);
    console.timeEnd("JWT Token Generation");
    throw error;
  }
}

// Best practice: proper token expiration management with typed payload
interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Best practice: async token generation with proper typing and validation
export async function generateTokenSecure(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  try {
    // Best practice: validate input payload
    if (!payload.userId || !payload.email) {
      throw new Error("Invalid payload: userId and email are required");
    }

    // Best practice: use asynchronous operations to avoid blocking event loop
    return new Promise((resolve, reject) => {
      // Best practice: shorter expiration time for better security (15 minutes)
      jwt.sign(
        payload,
        VALIDATED_JWT_SECRET,
        { 
          expiresIn: "15m", // Best practice: short expiration time
          algorithm: "HS256", // Best practice: explicit algorithm
          issuer: "your-app-name", // Best practice: specify issuer
          audience: "your-app-users" // Best practice: specify audience
        },
        (error, token) => {
          if (error) {
            reject(new Error(`JWT generation failed: ${error.message}`));
          } else {
            resolve(token as string);
          }
        }
      );
    });
  } catch (error) {
    throw new Error(`Token generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Best practice: separate refresh token generation with longer expiration
export async function generateRefreshToken(payload: Pick<JWTPayload, 'userId'>): Promise<string> {
  try {
    if (!payload.userId) {
      throw new Error("Invalid payload: userId is required for refresh token");
    }

    return new Promise((resolve, reject) => {
      jwt.sign(
        { userId: payload.userId, type: 'refresh' },
        VALIDATED_JWT_SECRET,
        { 
          expiresIn: "7d", // Best practice: longer expiration for refresh tokens
          algorithm: "HS256",
          issuer: "your-app-name",
          audience: "your-app-users"
        },
        (error, token) => {
          if (error) {
            reject(new Error(`Refresh token generation failed: ${error.message}`));
          } else {
            resolve(token as string);
          }
        }
      );
    });
  } catch (error) {
    throw new Error(`Refresh token generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Bad practice: no proper error handling
// Best practice: use try-catch for synchronous operations
export function verifyToken(token: string) {
  console.time("JWT Token Verification");
  try {
    // Bad practice: using synchronous operations
    const decoded = jwt.verify(token, JWT_SECRET);
    console.timeEnd("JWT Token Verification");
    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error);
    console.timeEnd("JWT Token Verification");
    throw error;
  }
}

// Best practice: async token verification with proper typing and validation
export async function verifyTokenSecure(token: string): Promise<JWTPayload> {
  try {
    // Best practice: validate input token
    if (!token || typeof token !== 'string') {
      throw new Error("Invalid token: token must be a non-empty string");
    }

    if (token.length < 10) {
      throw new Error("Invalid token: token too short");
    }

    // Best practice: use asynchronous operations to avoid blocking event loop
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        VALIDATED_JWT_SECRET,
        {
          algorithms: ['HS256'], // Best practice: explicitly specify allowed algorithms
          issuer: "your-app-name", // Best practice: verify issuer
          audience: "your-app-users", // Best practice: verify audience
          ignoreExpiration: false, // Best practice: enforce expiration
          clockTolerance: 30 // Best practice: allow 30 seconds clock skew
        },
        (error, decoded) => {
          if (error) {
            // Best practice: provide specific error messages based on error type
            if (error.name === 'TokenExpiredError') {
              reject(new Error('Token has expired'));
            } else if (error.name === 'JsonWebTokenError') {
              reject(new Error('Invalid token format'));
            } else if (error.name === 'NotBeforeError') {
              reject(new Error('Token not active yet'));
            } else {
              reject(new Error(`Token verification failed: ${error.message}`));
            }
          } else {
            // Best practice: validate decoded payload structure
            const payload = decoded as JWTPayload;
            if (!payload.userId || !payload.email) {
              reject(new Error('Invalid token payload: missing required fields'));
            } else {
              resolve(payload);
            }
          }
        }
      );
    });
  } catch (error) {
    throw new Error(`Token verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Best practice: proper typing for handler function
type AuthenticatedHandler = (request: AuthenticatedRequest) => Promise<Response> | Response;

// Best practice: extend Request interface with proper typing
interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// Bad practice: middleware without proper error handling
// Best practice: middleware with proper error handling, typing, and security
export function authMiddleware(handler: AuthenticatedHandler) {
  return async (request: Request): Promise<Response> => {
    try {
      // Best practice: validate authorization header format
      const authHeader = request.headers.get("authorization");

      if (!authHeader) {
        return new Response(
          JSON.stringify({ 
            error: "Authentication required",
            message: "Authorization header is missing" 
          }), 
          {
            status: 401,
            headers: { 
              "Content-Type": "application/json",
              "WWW-Authenticate": "Bearer" // Best practice: proper WWW-Authenticate header
            },
          }
        );
      }

      if (!authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid authentication format",
            message: "Authorization header must start with 'Bearer '" 
          }), 
          {
            status: 401,
            headers: { 
              "Content-Type": "application/json",
              "WWW-Authenticate": "Bearer"
            },
          }
        );
      }

      const token = authHeader.substring(7);

      // Best practice: validate token format before verification
      if (!token || token.length < 10) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid token",
            message: "Token is malformed or too short" 
          }), 
          {
            status: 401,
            headers: { 
              "Content-Type": "application/json",
              "WWW-Authenticate": "Bearer"
            },
          }
        );
      }

      // Best practice: use secure async token verification
      const user = await verifyTokenSecure(token);

      // Best practice: create properly typed authenticated request
      const authenticatedRequest = Object.assign(request, { user }) as AuthenticatedRequest;

      // Best practice: call handler with typed request
      return await handler(authenticatedRequest);

    } catch (error) {
      // Best practice: specific error handling based on error type
      if (error instanceof Error) {
        if (error.message.includes("expired")) {
          return new Response(
            JSON.stringify({ 
              error: "Token expired",
              message: "Please refresh your token and try again" 
            }), 
            {
              status: 401,
              headers: { 
                "Content-Type": "application/json",
                "WWW-Authenticate": "Bearer"
              },
            }
          );
        }

        if (error.message.includes("Invalid token")) {
          return new Response(
            JSON.stringify({ 
              error: "Invalid token",
              message: "Token verification failed" 
            }), 
            {
              status: 401,
              headers: { 
                "Content-Type": "application/json",
                "WWW-Authenticate": "Bearer"
              },
            }
          );
        }
      }

      // Best practice: generic error handling for unexpected errors
      return new Response(
        JSON.stringify({ 
          error: "Authentication failed",
          message: "Unable to authenticate request" 
        }), 
        {
          status: 401,
          headers: { 
            "Content-Type": "application/json",
            "WWW-Authenticate": "Bearer"
          },
        }
      );
    }
  };
}

// Best practice: role-based authorization middleware
export function requireRole(roles: string[]) {
  return function roleMiddleware(handler: AuthenticatedHandler) {
    return authMiddleware(async (request: AuthenticatedRequest) => {
      // Best practice: check user role authorization
      if (!request.user.role || !roles.includes(request.user.role)) {
        return new Response(
          JSON.stringify({ 
            error: "Insufficient permissions",
            message: `Access denied. Required roles: ${roles.join(", ")}` 
          }), 
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return await handler(request);
    });
  };
}
