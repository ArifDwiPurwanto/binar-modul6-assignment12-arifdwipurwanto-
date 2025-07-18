import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: Request) {
  console.time("Users API Execution");

  /* 
  Best practice: Recommended database indexes for optimal performance:
  
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_divisions_division_name ON user_divisions(division_name);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_logs_action_user_id ON user_logs(action, user_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_divisions_user_id ON user_divisions(user_id);
  */

  try {
    // Bad practice: extract query params manually without proper parsing
    // Best practice: Use Next.js built-in URL parsing with proper validation and type safety
    const { searchParams } = new URL(request.url);
    const divisionFilter = searchParams.get("division")?.trim() || null;
    
    // Best practice: Validate and sanitize input parameters
    const validDivisions = ["engineering", "marketing", "sales", "hr", "finance", "all"];
    const sanitizedDivision = divisionFilter && validDivisions.includes(divisionFilter.toLowerCase()) 
      ? divisionFilter.toLowerCase() 
      : null;

    // Best practice: Add pagination parameters for better performance
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    // Bad practice: extremely inefficient query with multiple joins, subqueries, and no pagination
    // Best practice: Use efficient query with CTEs, aggregations, and pagination for better performance
    let query = `
      WITH user_stats AS (
        -- Pre-calculate user statistics in a single pass
        SELECT 
          user_id,
          COUNT(*) as log_count,
          COUNT(CASE WHEN action = 'login' THEN 1 END) as login_count,
          COUNT(CASE WHEN action = 'update_profile' THEN 1 END) as update_count,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_logs
        FROM user_logs 
        GROUP BY user_id
      ),
      user_counts AS (
        -- Calculate role and division counts efficiently
        SELECT 
          ur.user_id,
          COUNT(DISTINCT ur.role) as role_count
        FROM user_roles ur
        GROUP BY ur.user_id
      ),
      division_counts AS (
        SELECT 
          ud.user_id,
          COUNT(*) as division_count
        FROM user_divisions ud
        GROUP BY ud.user_id
      ),
      total_user_count AS (
        -- Calculate total users once
        SELECT COUNT(*) as total_users FROM users
      )
      SELECT 
        u.id,
        u.username,
        u.full_name,
        u.birth_date,
        u.bio,
        u.long_bio,
        u.profile_json,
        u.address,
        u.phone_number,
        u.created_at,
        u.updated_at,
        a.email,
        ur.role,
        ud.division_name,
        -- Best practice: Efficient aggregations using CTEs
        tuc.total_users,
        (SELECT COUNT(*) FROM users WHERE created_at > u.created_at) as newer_users,
        COALESCE(us.log_count, 0) as log_count,
        COALESCE(uc.role_count, 0) as role_count,
        COALESCE(dc.division_count, 0) as division_count,
        COALESCE(us.login_count, 0) as login_count,
        COALESCE(us.update_count, 0) as update_count,
        COALESCE(us.recent_logs, 0) as recent_logs,
        -- Best practice: Simplified string operations
        CONCAT(u.full_name, ' (', COALESCE(ur.role, 'no role'), ')') as display_name,
        COALESCE(NULLIF(u.bio, ''), 'No bio available') as bio_display,
        -- Best practice: Simplified JSON operations with proper null handling
        COALESCE(
          u.profile_json->'social_media'->>'instagram',
          'No Instagram'
        ) as instagram_handle
      FROM users u
      LEFT JOIN auth a ON u.auth_id = a.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
      LEFT JOIN user_stats us ON u.id = us.user_id
      LEFT JOIN user_counts uc ON u.id = uc.user_id
      LEFT JOIN division_counts dc ON u.id = dc.user_id
      CROSS JOIN total_user_count tuc
    `;

    // Bad practice: inefficient filtering without proper indexing
    // Best practice: Use parameterized queries to prevent SQL injection and validate input
    if (sanitizedDivision && sanitizedDivision !== "all") {
      query += ` WHERE ud.division_name = $1`;
    }

    // Best practice: Add pagination and ordering for better performance
    query += ` 
      ORDER BY u.created_at DESC 
      LIMIT $${sanitizedDivision && sanitizedDivision !== "all" ? "2" : "1"} 
      OFFSET $${sanitizedDivision && sanitizedDivision !== "all" ? "3" : "2"}`;

    // Best practice: Use parameterized queries with proper parameter binding including pagination
    const queryParams = sanitizedDivision && sanitizedDivision !== "all" 
      ? [sanitizedDivision, limit, offset] 
      : [limit, offset];
    const result = await executeQuery(query, queryParams);

    // Best practice: Get total count for pagination metadata
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total_count
      FROM users u
      LEFT JOIN user_divisions ud ON u.id = ud.user_id
    `;
    
    const countParams: any[] = [];
    if (sanitizedDivision && sanitizedDivision !== "all") {
      countQuery += ` WHERE ud.division_name = $1`;
      countParams.push(sanitizedDivision);
    }
    
    const countResult = await executeQuery(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0]?.total_count || "0");
    const totalPages = Math.ceil(totalCount / limit);

    // Bad practice: processing all data in memory with complex transformations
    // Best practice: Use proper TypeScript interfaces and minimize data transformation in application layer
    interface UserRow {
      id: number;
      username: string;
      full_name: string;
      email: string;
      birth_date: string;
      bio: string;
      long_bio: string;
      profile_json: any;
      address: string;
      phone_number: string;
      created_at: string;
      updated_at: string;
      role: string;
      division_name: string;
      display_name: string;
      bio_display: string;
      instagram_handle: string;
      total_users: number;
      newer_users: number;
      log_count: number;
      role_count: number;
      division_count: number;
      login_count: number;
      update_count: number;
      recent_logs: number;
    }

    // Best practice: Use proper typing and simplified data transformation
    const users = result.rows.map((user: UserRow) => {
      // Bad practice: complex data processing in application layer
      // Best practice: Keep transformation minimal and type-safe
      const profileJson = user.profile_json || null;
      
      // Best practice: Use optional chaining and nullish coalescing for safe property access
      const socialMedia = profileJson?.social_media ?? {};
      const preferences = profileJson?.preferences ?? {};
      const skills = profileJson?.skills ?? [];
      const interests = profileJson?.interests ?? [];

      // Bad practice: unnecessary calculations
      // Best practice: Move calculations to SQL or compute only when needed
      const createdDate = new Date(user.created_at);
      const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Best practice: Use constants for business logic thresholds
      const ACTIVE_USER_THRESHOLD = 5;
      const SENIOR_ROLES = ['admin', 'moderator'] as const;
      
      const isActive = user.log_count > ACTIVE_USER_THRESHOLD;
      const isSenior = SENIOR_ROLES.includes(user.role as typeof SENIOR_ROLES[number]);

      // Best practice: Calculate profile completeness efficiently
      const profileFields = [user.bio, user.address, user.phone_number, user.profile_json];
      const completedFields = profileFields.filter(Boolean).length;
      const profileCompleteness = Math.round((completedFields / profileFields.length) * 100);

      return {
        // Core user data
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        birthDate: user.birth_date,
        bio: user.bio,
        longBio: user.long_bio,
        address: user.address,
        phoneNumber: user.phone_number,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        
        // Role and division
        role: user.role,
        division: user.division_name,
        
        // Profile data
        profileJson,
        socialMedia,
        preferences,
        skills,
        interests,
        
        // Computed fields (from SQL)
        displayName: user.display_name,
        bioDisplay: user.bio_display,
        instagramHandle: user.instagram_handle,
        
        // Bad practice: calculated fields that could be computed in SQL
        // Statistics from database
        totalUsers: user.total_users,
        newerUsers: user.newer_users,
        logCount: user.log_count,
        roleCount: user.role_count,
        divisionCount: user.division_count,
        loginCount: user.login_count,
        updateCount: user.update_count,
        recentLogs: user.recent_logs,
        
        // Bad practice: application-level calculations
        // Computed properties
        daysSinceCreated,
        isActive,
        isSenior,
        profileCompleteness,
        
        // Bad practice: redundant data
        // Best practice: Compute boolean flags efficiently
        hasProfile: Boolean(user.profile_json),
        hasBio: Boolean(user.bio),
        hasAddress: Boolean(user.address),
        hasPhone: Boolean(user.phone_number),
      };
    });

    // Bad practice: additional processing after mapping
    // Best practice: Combine filtering and counting in a single pass for better performance
    const PROFILE_COMPLETENESS_THRESHOLD = 75;
    
    const stats = users.reduce((acc, user) => {
      // Count active users
      if (user.isActive) acc.activeUsers++;
      
      // Count senior users
      if (user.isSenior) acc.seniorUsers++;
      
      // Count users with complete profiles
      if (user.profileCompleteness > PROFILE_COMPLETENESS_THRESHOLD) {
        acc.usersWithCompleteProfiles++;
      }
      
      // Count users by division
      const division = user.division || 'unknown';
      acc.usersByDivision[division] = (acc.usersByDivision[division] || 0) + 1;
      
      return acc;
    }, {
      activeUsers: 0,
      seniorUsers: 0,
      usersWithCompleteProfiles: 0,
      usersByDivision: {} as Record<string, number>
    });

    console.timeEnd("Users API Execution");
    return NextResponse.json({
      users,
      // Best practice: Include pagination metadata
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      // Statistics (from current page only)
      currentPageStats: {
        count: users.length,
        activeUsers: stats.activeUsers,
        seniorUsers: stats.seniorUsers,
        usersWithCompleteProfiles: stats.usersWithCompleteProfiles,
        usersByDivision: stats.usersByDivision,
      },
      filteredBy: sanitizedDivision || "all",
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Users API error:", error);
    console.timeEnd("Users API Execution");
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
