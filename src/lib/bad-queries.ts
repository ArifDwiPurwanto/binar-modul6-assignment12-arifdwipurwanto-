// Bad queries for optimization practice - Session 11 & 12
// These queries are intentionally inefficient to demonstrate optimization techniques

export const badQueries = {
  // Bad practice: Nested if-else structure for user data processing
  // OPTIMIZED VERSION - Best practice implementation of getUserDataWithNestedLogic
  // Key improvements for better performance:
  // 1. Replaced 4 separate subqueries with 1 efficient LEFT JOIN and aggregation
  // 2. Removed unnecessary CROSS JOIN that adds no value
  // 3. Added WHERE clause to filter deleted records
  // 4. Added LIMIT to prevent excessive data retrieval
  // 5. Simplified CASE statements for better readability
  // 6. Moved complex string operations to application layer
  // 7. Optimized JSON operations with single extraction
  // 8. Return raw timestamps for application-side date calculations
  getUserDataWithNestedLogic: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.bio,
      u.long_bio,
      u.profile_json,
      u.address,
      u.phone_number,
      a.email,
      ur.role,
      ud.division_name,
      -- Best practice: Single aggregation with conditional counting using SUM and CASE
      -- This replaces multiple subqueries with one efficient aggregation
      COALESCE(logs.log_count, 0) as log_count,
      COALESCE(logs.login_count, 0) as login_count,
      COALESCE(logs.update_count, 0) as update_count,
      COALESCE(logs.logout_count, 0) as logout_count,
      -- Best practice: String concatenation handled in application layer when possible
      -- Keep simple concatenations in SQL for better performance
      u.full_name as display_name_base,
      ur.role as role_for_display,
      u.username as username_for_identifier,
      a.email as email_for_identifier,
      -- Best practice: Simplified CASE statement with clear logic
      -- Use simpler conditions and handle in application when complex
      CASE 
        WHEN u.bio IS NULL OR u.bio = '' THEN 'No bio'
        WHEN LENGTH(u.bio) < 10 THEN 'Short'
        WHEN LENGTH(u.bio) < 50 THEN 'Medium'
        ELSE 'Long'
      END as bio_status,
      -- Best practice: Use lookup table or enum mapping in application
      -- Keep role as-is for application-side mapping
      ur.role as role_raw,
      -- Best practice: Use JSON functions efficiently with proper null handling
      -- Extract JSON data with single operation
      COALESCE(u.profile_json->>'social_media', '{}')::json->>'instagram' as instagram_handle,
      -- Best practice: Calculate dates in application layer for better performance
      -- Return raw timestamps for application processing
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_divisions ud ON u.id = ud.user_id
    -- Best practice: Use single LEFT JOIN with aggregation instead of multiple subqueries
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as log_count,
        SUM(CASE WHEN action = 'login' THEN 1 ELSE 0 END) as login_count,
        SUM(CASE WHEN action = 'update_profile' THEN 1 ELSE 0 END) as update_count,
        SUM(CASE WHEN action = 'logout' THEN 1 ELSE 0 END) as logout_count
      FROM user_logs
      GROUP BY user_id
    ) logs ON u.id = logs.user_id
    -- Best practice: Add WHERE clause for filtering and better performance
    WHERE u.deleted_at IS NULL
    -- Best practice: Add indexes on created_at, auth_id, user roles, divisions
    ORDER BY u.created_at DESC
    -- Best practice: Add LIMIT to prevent excessive data retrieval
    LIMIT 1000
  `,

  // Bad practice: Complex nested subqueries for user statistics
  // OPTIMIZED VERSION - Best practice implementation of getUserStatisticsWithNestedSubqueries
  // Key improvements for better performance:
  // 1. Replaced multiple subqueries with single LEFT JOIN aggregations
  // 2. Used conditional counting with SUM and CASE for efficiency
  // 3. Simplified date calculations with fixed intervals
  // 4. Removed unnecessary nested subqueries for role and division counts
  // 5. Added WHERE clause to filter active users
  // 6. Added LIMIT to prevent excessive data retrieval
  getUserStatisticsWithNestedSubqueries: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      -- Bad practice: multiple subqueries for related data
      -- Best practice: Use single aggregation with conditional counting
      COALESCE(logs.total_logs, 0) as total_logs,
      -- Bad practice: multiple subqueries for related data
      -- Best practice: Use SUM with CASE for efficient conditional counting
      COALESCE(logs.login_logs, 0) as login_logs,
      COALESCE(logs.logout_logs, 0) as logout_logs,
      COALESCE(logs.update_logs, 0) as update_logs,
      COALESCE(logs.view_logs, 0) as view_logs,
      COALESCE(logs.export_logs, 0) as export_logs,
      -- Bad practice: nested subqueries for date-based calculations
      -- Best practice: Use fixed date thresholds calculated once, not per-user MAX calculations
      COALESCE(logs.recent_logs_7d, 0) as recent_logs_7d,
      COALESCE(logs.recent_logs_30d, 0) as recent_logs_30d,
      COALESCE(logs.recent_logs_90d, 0) as recent_logs_90d,
      -- Bad practice: subqueries for role and division counts
      -- Best practice: Use LEFT JOIN with COUNT for efficient aggregation
      COALESCE(role_stats.role_count, 0) as role_count,
      COALESCE(div_stats.division_count, 0) as division_count,
      -- Bad practice: complex conditional subqueries
      -- Best practice: Include in main aggregation with date filtering
      COALESCE(logs.today_auth_actions, 0) as today_auth_actions,
      -- Bad practice: subquery for user activity score
      -- Best practice: Calculate activity level using aggregated data
      CASE 
        WHEN COALESCE(logs.total_logs, 0) > 50 THEN 'Very Active'
        WHEN COALESCE(logs.total_logs, 0) > 20 THEN 'Active'
        WHEN COALESCE(logs.total_logs, 0) > 5 THEN 'Moderate'
        ELSE 'Inactive'
      END as activity_level
    FROM users u
    -- Best practice: Single comprehensive LEFT JOIN for all log statistics
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total_logs,
        SUM(CASE WHEN action = 'login' THEN 1 ELSE 0 END) as login_logs,
        SUM(CASE WHEN action = 'logout' THEN 1 ELSE 0 END) as logout_logs,
        SUM(CASE WHEN action = 'update_profile' THEN 1 ELSE 0 END) as update_logs,
        SUM(CASE WHEN action = 'view_users' THEN 1 ELSE 0 END) as view_logs,
        SUM(CASE WHEN action = 'export_data' THEN 1 ELSE 0 END) as export_logs,
        -- Best practice: Use fixed date calculations, not per-user dynamic dates
        SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as recent_logs_7d,
        SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as recent_logs_30d,
        SUM(CASE WHEN created_at > NOW() - INTERVAL '90 days' THEN 1 ELSE 0 END) as recent_logs_90d,
        SUM(CASE WHEN action IN ('login', 'logout') AND created_at > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as today_auth_actions
      FROM user_logs
      GROUP BY user_id
    ) logs ON u.id = logs.user_id
    -- Best practice: Separate efficient aggregations for roles and divisions
    LEFT JOIN (
      SELECT user_id, COUNT(*) as role_count
      FROM user_roles
      GROUP BY user_id
    ) role_stats ON u.id = role_stats.user_id
    LEFT JOIN (
      SELECT user_id, COUNT(*) as division_count
      FROM user_divisions
      GROUP BY user_id
    ) div_stats ON u.id = div_stats.user_id
    -- Bad practice: no WHERE clause, processing all users
    -- Best practice: Add WHERE clause for active users and LIMIT for pagination
    WHERE u.deleted_at IS NULL
    ORDER BY u.created_at DESC
    LIMIT 1000
  `,

  // Bad practice: Complex data cleaning query with multiple conditions
  // OPTIMIZED VERSION - Best practice implementation of getDataForCleaning
  // Key improvements for better performance:
  // 1. Simplified NULL checking with CASE statements
  // 2. Used LEFT JOIN for duplicate detection instead of multiple subqueries
  // 3. Added WHERE clause to filter data that actually needs cleaning
  // 4. Added LIMIT to prevent excessive data retrieval
  getDataForCleaning: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.bio,
      u.long_bio,
      u.address,
      u.phone_number,
      u.profile_json,
      a.email,
      ur.role,
      ud.division_name,
      -- Bad practice: complex NULL checking with multiple conditions
      -- Best practice: Simplified validation logic, move complex validation to application layer
      CASE 
        WHEN u.bio IS NULL OR u.bio = '' THEN 'MISSING_BIO'
        WHEN LENGTH(TRIM(u.bio)) < 3 THEN 'SHORT_BIO'
        ELSE 'NEEDS_VALIDATION'
      END as bio_status,
      -- Bad practice: complex phone number validation
      -- Best practice: Basic validation in SQL, detailed validation in application
      CASE 
        WHEN u.phone_number IS NULL OR u.phone_number = '' THEN 'MISSING_PHONE'
        WHEN u.phone_number NOT LIKE '+62%' THEN 'INVALID_FORMAT'
        WHEN LENGTH(u.phone_number) NOT BETWEEN 10 AND 15 THEN 'INVALID_LENGTH'
        ELSE 'NEEDS_VALIDATION'
      END as phone_status,
      -- Bad practice: complex address validation
      -- Best practice: Simplified address checking, use lookup tables for cities
      CASE 
        WHEN u.address IS NULL OR u.address = '' THEN 'MISSING_ADDRESS'
        WHEN LENGTH(TRIM(u.address)) < 10 THEN 'SHORT_ADDRESS'
        ELSE 'NEEDS_VALIDATION'
      END as address_status,
      -- Bad practice: complex JSON validation
      -- Best practice: Basic JSON structure check, detailed validation in application
      CASE 
        WHEN u.profile_json IS NULL OR u.profile_json = '{}' THEN 'MISSING_PROFILE'
        WHEN u.profile_json->>'social_media' IS NULL THEN 'NO_SOCIAL_MEDIA'
        ELSE 'HAS_PROFILE'
      END as profile_status,
      -- Bad practice: duplicate detection
      -- Best practice: Use window functions or separate duplicate detection queries
      COALESCE(bio_dups.duplicate_count, 0) as bio_duplicates,
      COALESCE(addr_dups.duplicate_count, 0) as address_duplicates,
      COALESCE(phone_dups.duplicate_count, 0) as phone_duplicates,
      -- Best practice: Add data quality score for prioritization
      CASE 
        WHEN u.bio IS NOT NULL AND u.address IS NOT NULL AND u.phone_number IS NOT NULL THEN 'HIGH_QUALITY'
        WHEN u.bio IS NOT NULL OR u.address IS NOT NULL OR u.phone_number IS NOT NULL THEN 'MEDIUM_QUALITY'
        ELSE 'LOW_QUALITY'
      END as data_quality_score
    FROM users u
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_divisions ud ON u.id = ud.user_id
    -- Best practice: Use efficient window functions for duplicate detection
    LEFT JOIN (
      SELECT bio, COUNT(*) - 1 as duplicate_count
      FROM users 
      WHERE bio IS NOT NULL AND bio != '' AND deleted_at IS NULL
      GROUP BY bio 
      HAVING COUNT(*) > 1
    ) bio_dups ON u.bio = bio_dups.bio
    LEFT JOIN (
      SELECT address, COUNT(*) - 1 as duplicate_count
      FROM users 
      WHERE address IS NOT NULL AND address != '' AND deleted_at IS NULL
      GROUP BY address 
      HAVING COUNT(*) > 1
    ) addr_dups ON u.address = addr_dups.address
    LEFT JOIN (
      SELECT phone_number, COUNT(*) - 1 as duplicate_count
      FROM users 
      WHERE phone_number IS NOT NULL AND phone_number != '' AND deleted_at IS NULL
      GROUP BY phone_number 
      HAVING COUNT(*) > 1
    ) phone_dups ON u.phone_number = phone_dups.phone_number
    -- Bad practice: no WHERE clause, processing all data
    -- Best practice: Filter for data that actually needs cleaning
    WHERE u.deleted_at IS NULL
      AND (
        u.bio IS NULL OR u.bio = '' OR LENGTH(TRIM(u.bio)) < 3
        OR u.address IS NULL OR u.address = '' OR LENGTH(TRIM(u.address)) < 10
        OR u.phone_number IS NULL OR u.phone_number = '' OR u.phone_number NOT LIKE '+62%'
        OR u.profile_json IS NULL OR u.profile_json = '{}'
      )
    ORDER BY u.created_at DESC
    LIMIT 5000
  `,

  // Bad practice: Performance testing query with multiple joins and calculations
  // OPTIMIZED VERSION - Best practice implementation of getPerformanceTestData
  // Key improvements for better performance:
  // 1. Replaced multiple subqueries with single LEFT JOIN aggregations
  // 2. Used COALESCE for null handling in aggregations
  // 3. Simplified JSON extraction with single operation
  // 4. Removed unnecessary CROSS JOIN
  // 5. Simplified profile completeness calculation
  // 6. Added performance metrics for testing
  // 7. Added WHERE clause and LIMIT for performance testing
  getPerformanceTestData: `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      u.bio,
      u.long_bio,
      u.profile_json,
      u.address,
      u.phone_number,
      a.email,
      ur.role,
      ud.division_name,
      -- Bad practice: multiple subqueries for the same table
      -- Best practice: Use single aggregation with conditional counting
      COALESCE(logs.total_logs, 0) as total_logs,
      COALESCE(logs.login_count, 0) as login_count,
      COALESCE(logs.logout_count, 0) as logout_count,
      COALESCE(logs.update_count, 0) as update_count,
      COALESCE(logs.view_count, 0) as view_count,
      COALESCE(logs.export_count, 0) as export_count,
      -- Bad practice: complex date calculations
      -- Best practice: Return raw timestamps for application-side calculations
      u.created_at,
      u.updated_at,
      -- Bad practice: string operations on large text fields
      -- Best practice: Calculate lengths efficiently, consider moving to application layer
      CASE WHEN u.long_bio IS NOT NULL THEN LENGTH(u.long_bio) ELSE 0 END as long_bio_length,
      CASE WHEN u.bio IS NOT NULL THEN LENGTH(u.bio) ELSE 0 END as bio_length,
      CASE WHEN u.address IS NOT NULL THEN LENGTH(u.address) ELSE 0 END as address_length,
      -- Bad practice: complex JSON path operations
      -- Best practice: Simplified JSON extraction with single operation
      COALESCE(LENGTH(u.profile_json->'social_media'->>'instagram'), 0) as instagram_length,
      -- Bad practice: complex conditional calculations
      -- Best practice: Simplified profile completeness calculation
      CASE 
        WHEN u.bio IS NOT NULL AND u.address IS NOT NULL AND u.phone_number IS NOT NULL THEN 100
        WHEN u.bio IS NOT NULL AND u.address IS NOT NULL THEN 75
        WHEN u.bio IS NOT NULL OR u.address IS NOT NULL OR u.phone_number IS NOT NULL THEN 50
        ELSE 0
      END as profile_completeness,
      -- Bad practice: nested calculations
      -- Best practice: Use aggregated data instead of additional subquery
      CASE 
        WHEN COALESCE(logs.total_logs, 0) > 50 THEN 'Very Active'
        WHEN COALESCE(logs.total_logs, 0) > 20 THEN 'Active'
        WHEN COALESCE(logs.total_logs, 0) > 5 THEN 'Moderate'
        ELSE 'Inactive'
      END as activity_level,
      -- Best practice: Add performance metrics for testing
      CASE WHEN u.profile_json IS NOT NULL THEN 'HAS_JSON' ELSE 'NO_JSON' END as json_status,
      CASE WHEN u.long_bio IS NOT NULL THEN 'HAS_LONG_BIO' ELSE 'NO_LONG_BIO' END as long_bio_status
    FROM users u
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN user_divisions ud ON u.id = ud.user_id
    -- Best practice: Single efficient aggregation instead of multiple subqueries
    LEFT JOIN (
      SELECT 
        user_id,
        COUNT(*) as total_logs,
        SUM(CASE WHEN action = 'login' THEN 1 ELSE 0 END) as login_count,
        SUM(CASE WHEN action = 'logout' THEN 1 ELSE 0 END) as logout_count,
        SUM(CASE WHEN action = 'update_profile' THEN 1 ELSE 0 END) as update_count,
        SUM(CASE WHEN action = 'view_users' THEN 1 ELSE 0 END) as view_count,
        SUM(CASE WHEN action = 'export_data' THEN 1 ELSE 0 END) as export_count
      FROM user_logs
      GROUP BY user_id
    ) logs ON u.id = logs.user_id
    -- Bad practice: CROSS JOIN for no reason
    -- Best practice: Removed unnecessary CROSS JOIN
    -- Bad practice: no WHERE clause, no LIMIT
    -- Best practice: Add WHERE clause and LIMIT for performance testing
    WHERE u.deleted_at IS NULL
    ORDER BY u.created_at DESC
    LIMIT 2000
  `,
};

// Bad practice: Nested if-else logic for data processing
// Best practice: Use proper TypeScript types, separate functions, and cleaner logic
interface UserData {
  id: number;
  username: string;
  full_name: string;
  bio?: string;
  phone_number?: string;
  address?: string;
  profile_json?: string;
}

interface ProcessedData {
  bioStatus: string;
  bioQuality: string;
  phoneStatus: string;
  phoneQuality: string;
  addressStatus: string;
  addressQuality: string;
  profileStatus: string;
  profileQuality: string;
}

interface ProcessUserResult {
  id: number;
  username: string;
  fullName: string;
  processedData: ProcessedData;
}

// Best practice: Extract validation logic into separate, pure functions
const processBioData = (bio?: string): { status: string; quality: string } => {
  if (!bio) {
    return { status: "missing", quality: "no_data" };
  }

  const testKeywords = ["test", "demo", "example"];
  const hasTestKeyword = testKeywords.some(keyword => bio.includes(keyword));
  
  if (bio.length < 10) {
    return { 
      status: "short", 
      quality: hasTestKeyword ? "test_data" : "valid_short" 
    };
  } else if (bio.length < 50) {
    return { 
      status: "medium", 
      quality: hasTestKeyword ? "demo_data" : "valid_medium" 
    };
  } else {
    return { 
      status: "long", 
      quality: hasTestKeyword ? "example_data" : "valid_long" 
    };
  }
};

// Best practice: Extract phone validation into separate function with clear logic
const processPhoneData = (phoneNumber?: string): { status: string; quality: string } => {
  if (!phoneNumber) {
    return { status: "missing", quality: "no_data" };
  }

  if (!phoneNumber.startsWith("+62")) {
    return { status: "invalid_country_code", quality: "wrong_format" };
  }

  const isValidLength = phoneNumber.length >= 10 && phoneNumber.length <= 15;
  return {
    status: isValidLength ? "valid" : "invalid_length",
    quality: isValidLength ? "good_format" : "bad_format"
  };
};

// Best practice: Extract address validation with configurable city list
const processAddressData = (address?: string): { status: string; quality: string } => {
  if (!address) {
    return { status: "missing", quality: "no_data" };
  }

  if (address.length < 10) {
    return { status: "too_short", quality: "incomplete" };
  }

  const majorCities = ["Jakarta", "Bandung"];
  const isMajorCity = majorCities.some(city => address.includes(city));
  
  return {
    status: "valid",
    quality: isMajorCity ? "major_city" : "other_city"
  };
};

// Best practice: Extract JSON parsing with proper error handling
const processProfileData = (profileJson?: string): { status: string; quality: string } => {
  if (!profileJson) {
    return { status: "missing", quality: "no_data" };
  }

  try {
    const profile = JSON.parse(profileJson);
    
    if (!profile.social_media) {
      return { status: "incomplete", quality: "no_social" };
    }

    if (profile.social_media.instagram) {
      return { status: "complete", quality: "has_social" };
    } else {
      return { status: "partial", quality: "no_instagram" };
    }
  } catch (error) {
    // Best practice: Log error for debugging while returning safe default
    console.error('Failed to parse profile JSON:', error);
    return { status: "invalid_json", quality: "parse_error" };
  }
};

// Best practice: Main function with proper types and clean structure
export const processUserDataWithNestedLogic = (user: UserData): ProcessUserResult => {
  // Best practice: Use destructuring for cleaner code
  const { id, username, full_name, bio, phone_number, address, profile_json } = user;

  // Best practice: Process each field using dedicated functions
  const bioData = processBioData(bio);
  const phoneData = processPhoneData(phone_number);
  const addressData = processAddressData(address);
  const profileData = processProfileData(profile_json);

  // Best practice: Return structured data with proper typing
  return {
    id,
    username,
    fullName: full_name,
    processedData: {
      bioStatus: bioData.status,
      bioQuality: bioData.quality,
      phoneStatus: phoneData.status,
      phoneQuality: phoneData.quality,
      addressStatus: addressData.status,
      addressQuality: addressData.quality,
      profileStatus: profileData.status,
      profileQuality: profileData.quality,
    }
  };
};

// Best practice: Additional utility function for bulk processing
export const processMultipleUsers = (users: UserData[]): ProcessUserResult[] => {
  return users.map(user => processUserDataWithNestedLogic(user));
};
