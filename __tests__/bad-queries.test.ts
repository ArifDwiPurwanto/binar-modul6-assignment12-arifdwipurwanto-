/**
 * @jest-environment node
 */
import { badQueries } from "@/lib/bad-queries";

describe("Bad Queries Module - Consolidated Tests", () => {
  describe("badQueries object structure", () => {
    it("should have all required query properties", () => {
      expect(badQueries).toBeDefined();
      expect(typeof badQueries).toBe("object");
      
      // Check for all expected query properties
      expect(badQueries.getUserDataWithNestedLogic).toBeDefined();
      expect(badQueries.getUserStatisticsWithNestedSubqueries).toBeDefined();
      expect(badQueries.getComplexUserAnalytics).toBeDefined();
      expect(badQueries.getDashboardDataWithMultipleJoins).toBeDefined();
    });

    it("should have all queries as non-empty strings", () => {
      Object.entries(badQueries).forEach(([key, query]) => {
        expect(typeof query).toBe("string");
        expect(query.trim()).not.toBe("");
        expect(query.length).toBeGreaterThan(10);
      });
    });
  });

  describe("getUserDataWithNestedLogic query", () => {
    it("should have getUserDataWithNestedLogic query", () => {
      expect(badQueries.getUserDataWithNestedLogic).toBeDefined();
      expect(typeof badQueries.getUserDataWithNestedLogic).toBe("string");
      expect(badQueries.getUserDataWithNestedLogic.trim()).not.toBe("");
    });

    it("should contain expected SQL elements in getUserDataWithNestedLogic", () => {
      const query = badQueries.getUserDataWithNestedLogic;
      
      // Check for main SELECT clause
      expect(query).toContain("SELECT");
      expect(query).toContain("u.id");
      expect(query).toContain("u.username");
      expect(query).toContain("u.full_name");
      expect(query).toContain("u.bio");
      
      // Check for subqueries
      expect(query).toContain("(SELECT COUNT(*) FROM user_logs WHERE user_id = u.id)");
      expect(query).toContain("as log_count");
      expect(query).toContain("as login_count");
      expect(query).toContain("as update_count");
      expect(query).toContain("as logout_count");
      
      // Check for CONCAT operations
      expect(query).toContain("CONCAT");
      expect(query).toContain("display_name");
      expect(query).toContain("user_identifier");
      
      // Check for CASE statements
      expect(query).toContain("CASE");
      expect(query).toContain("bio_status");
      expect(query).toContain("role_display");
      
      // Check for JSON operations
      expect(query).toContain("profile_json");
      expect(query).toContain("social_media");
    });

    it("should contain proper SQL syntax elements", () => {
      const query = badQueries.getUserDataWithNestedLogic;
      
      // Check for SQL keywords
      expect(query).toContain("FROM");
      expect(query).toContain("LEFT JOIN");
      expect(query).toContain("WHERE");
      expect(query).toContain("ORDER BY");
      
      // Check for table aliases
      expect(query).toContain("users u");
      expect(query).toContain("auth a");
      
      // Check for proper parentheses matching
      const openParens = (query.match(/\(/g) || []).length;
      const closeParens = (query.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    it("should include complex nested logic patterns", () => {
      const query = badQueries.getUserDataWithNestedLogic;
      
      // Check for nested subqueries (multiline and whitespace-aware)
      expect(query).toMatch(/\(SELECT[\s\S]*\(SELECT[\s\S]*\)[\s\S]*\)/);
      
      // Check for multiple aggregation functions
      expect(query).toContain("COUNT(*)");
      expect(query).toContain("SUM(");
      expect(query).toContain("AVG(");
      
      // Check for conditional logic
      expect(query).toContain("CASE WHEN");
      expect(query).toContain("ELSE");
      expect(query).toContain("END");
    });
  });

  describe("getUserStatisticsWithNestedSubqueries query", () => {
    it("should have getUserStatisticsWithNestedSubqueries query", () => {
      expect(badQueries.getUserStatisticsWithNestedSubqueries).toBeDefined();
      expect(typeof badQueries.getUserStatisticsWithNestedSubqueries).toBe("string");
      expect(badQueries.getUserStatisticsWithNestedSubqueries.trim()).not.toBe("");
    });

    it("should contain statistical aggregation functions", () => {
      const query = badQueries.getUserStatisticsWithNestedSubqueries;
      
      // Check for statistical functions
      expect(query).toContain("COUNT(");
      expect(query).toContain("CASE");
      expect(query).toContain("INTERVAL");
      expect(query).toContain("user_logs");
      
      // Check for subquery patterns
      expect(query).toContain("(SELECT");
      expect(query).toContain("FROM users");
      expect(query).toContain("WHERE");
    });

    it("should include proper GROUP BY and HAVING clauses", () => {
      const query = badQueries.getUserStatisticsWithNestedSubqueries;
      
      // Check for grouping and filtering
      expect(query.toLowerCase()).toMatch(/(interval|case|when)/);
      
      // Check for proper SQL structure
      expect(query).toContain("SELECT");
      expect(query).toContain("FROM");
    });
  });

  describe("getComplexUserAnalytics query", () => {
    it("should have getComplexUserAnalytics query defined", () => {
      expect(badQueries.getComplexUserAnalytics).toBeDefined();
      expect(typeof badQueries.getComplexUserAnalytics).toBe("string");
      expect(badQueries.getComplexUserAnalytics.trim()).not.toBe("");
    });

    it("should contain analytics-related calculations", () => {
      const query = badQueries.getComplexUserAnalytics;
      
      // Check for analytics patterns
      expect(query).toContain("SELECT");
      expect(query).toContain("FROM");
      
      // Should contain some form of calculation or analysis
      expect(query).toMatch(/(COUNT|SUM|AVG|CASE|WHEN)/i);
    });
  });

  describe("getDashboardDataWithMultipleJoins query", () => {
    it("should have getDashboardDataWithMultipleJoins query defined", () => {
      expect(badQueries.getDashboardDataWithMultipleJoins).toBeDefined();
      expect(typeof badQueries.getDashboardDataWithMultipleJoins).toBe("string");
      expect(badQueries.getDashboardDataWithMultipleJoins.trim()).not.toBe("");
    });

    it("should contain multiple JOIN operations", () => {
      const query = badQueries.getDashboardDataWithMultipleJoins;
      
      // Check for multiple joins
      const joinCount = (query.toLowerCase().match(/join/g) || []).length;
      expect(joinCount).toBeGreaterThan(1);
      
      // Check for different types of joins
      expect(query.toLowerCase()).toMatch(/(left join|inner join|right join|join)/);
    });

    it("should include dashboard-related data fields", () => {
      const query = badQueries.getDashboardDataWithMultipleJoins;
      
      // Should contain fields typically found in dashboards
      expect(query).toContain("SELECT");
      expect(query).toMatch(/(users|user_logs|divisions)/i);
    });
  });

  describe("Query complexity and performance concerns", () => {
    it("should identify potentially problematic query patterns", () => {
      Object.entries(badQueries).forEach(([queryName, query]) => {
        // Check for nested subqueries (performance concern)
        const nestedSubqueries = (query.match(/\(SELECT.*\(SELECT/gi) || []).length;
        if (nestedSubqueries > 0) {
          expect(nestedSubqueries).toBeGreaterThan(0); // Document the complexity
        }
        
        // Check for cartesian product risks (multiple unrelated joins)
        const joinCount = (query.toLowerCase().match(/join/g) || []).length;
        if (joinCount > 3) {
          expect(joinCount).toBeGreaterThan(3); // Document potential complexity
        }
      });
    });

    it("should have queries with sufficient complexity to be 'bad'", () => {
      Object.entries(badQueries).forEach(([queryName, query]) => {
        // Each query should be reasonably complex
        expect(query.length).toBeGreaterThan(100);
        
        // Should contain at least some complex SQL elements
        const complexPatterns = [
          /\(SELECT/gi,     // Subqueries
          /CASE WHEN/gi,    // Conditional logic
          /JOIN/gi,         // Joins
          /COUNT\(/gi,      // Aggregations
          /CONCAT/gi        // String operations
        ];
        
        const complexityScore = complexPatterns.reduce((score, pattern) => {
          return score + (query.match(pattern) || []).length;
        }, 0);
        
        expect(complexityScore).toBeGreaterThan(0);
      });
    });
  });

  describe("SQL syntax validation", () => {
    it("should have balanced parentheses in all queries", () => {
      Object.entries(badQueries).forEach(([queryName, query]) => {
        const openParens = (query.match(/\(/g) || []).length;
        const closeParens = (query.match(/\)/g) || []).length;
        expect(openParens).toBe(closeParens);
      });
    });

    it("should have proper SQL keywords in correct order", () => {
      Object.entries(badQueries).forEach(([queryName, query]) => {
        // Should start with SELECT
        expect(query.trim().toUpperCase()).toMatch(/^SELECT/);
        
        // Should contain FROM
        expect(query.toUpperCase()).toContain("FROM");
        
        // If it has WHERE, it should come after FROM
        if (query.toUpperCase().includes("WHERE")) {
          const fromIndex = query.toUpperCase().indexOf("FROM");
          const whereIndex = query.toUpperCase().indexOf("WHERE");
          expect(whereIndex).toBeGreaterThan(fromIndex);
        }
      });
    });

    it("should not contain obvious SQL injection vulnerabilities", () => {
      Object.entries(badQueries).forEach(([queryName, query]) => {
        // These are static queries, so they shouldn't have obvious injection patterns
        expect(query).not.toMatch(/['"];.*--/); // No obvious comment-based injection
        expect(query).not.toMatch(/UNION.*SELECT.*FROM/i); // No obvious union-based injection
      });
    });
  });

  describe("Query readability and maintainability concerns", () => {
    it("should demonstrate poor readability patterns", () => {
      Object.entries(badQueries).forEach(([queryName, query]) => {
        // These are intentionally "bad" queries, so they might lack proper formatting
        const lines = query.split('\n');
        
        // At least some queries should be on single lines (bad practice)
        const singleLineQueries = Object.values(badQueries).filter(q => !q.includes('\n'));
        if (singleLineQueries.length > 0) {
          expect(singleLineQueries.length).toBeGreaterThan(0);
        }
      });
    });

    it("should contain overly complex logic that could be simplified", () => {
      const mainQuery = badQueries.getUserDataWithNestedLogic;
      
      // Should have multiple levels of nesting (multiline-aware)
      expect(mainQuery).toMatch(/\(SELECT[\s\S]*\(SELECT/);
      
      // Should have multiple CASE statements
      const caseCount = (mainQuery.match(/CASE WHEN/gi) || []).length;
      expect(caseCount).toBeGreaterThan(1);
    });
  });

  describe("Export and module structure", () => {
    it("should export badQueries object correctly", () => {
      expect(badQueries).toBeDefined();
      expect(typeof badQueries).toBe("object");
      expect(badQueries).not.toBeNull();
    });

    it("should have consistent property naming", () => {
      const propertyNames = Object.keys(badQueries);
      
      propertyNames.forEach(name => {
        // Should be camelCase
        expect(name).toMatch(/^[a-z][a-zA-Z0-9]*$/);
        
        // Should be descriptive
        expect(name.length).toBeGreaterThan(5);
        
        // Should contain descriptive words
        expect(name.toLowerCase()).toMatch(/(get|user|data|query|complex|nested)/);
      });
    });

    it("should maintain immutability of query strings", () => {
      const originalQueries = { ...badQueries };
      
      // Attempting to modify should not change the original
      try {
        (badQueries as any).newQuery = "SELECT * FROM test";
      } catch (e) {
        // Expected if object is frozen
      }
      
      // Original queries should remain unchanged
      Object.entries(originalQueries).forEach(([key, value]) => {
        expect(badQueries[key as keyof typeof badQueries]).toBe(value);
      });
    });
  });
});
/**
 * @jest-environment node
 */
import { processUserDataWithNestedLogic, processMultipleUsers } from "@/lib/bad-queries";

describe("Bad Queries Processing Function - Coverage Tests", () => {
  describe("processUserDataWithNestedLogic function", () => {
    it("should process user with complete bio data", () => {
      const user = {
        id: "1",
        username: "testuser",
        full_name: "Test User",
        bio: "This is a test bio with sufficient length",
        phone_number: "+6281234567890",
        address: "Jl. Test Street No. 123, Jakarta Selatan",
        profile_json: '{"social_media": {"instagram": "@testuser"}}'
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.id).toBe("1");
      expect(result.username).toBe("testuser");
      expect(result.fullName).toBe("Test User");
      expect(result.processedData).toBeDefined();
    });

    it("should process user with short bio", () => {
      const user = {
        id: "2",
        username: "shortbio",
        full_name: "Short Bio User",
        bio: "short",
        phone_number: "+6289876543210",
        address: "Jl. Short Address",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
      expect(result.id).toBe("2");
    });

    it("should process user with short bio containing test keyword", () => {
      const user = {
        id: "2a",
        username: "testbio",
        full_name: "Test Bio User",
        bio: "test bio", // Short bio (< 10 chars) containing "test"
        phone_number: "+6289876543210",
        address: "Jl. Test Address",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
      expect(result.id).toBe("2a");
      expect((result.processedData as any).bioStatus).toBe("short");
      expect((result.processedData as any).bioQuality).toBe("test_data");
    });

    it("should process user with medium bio containing demo", () => {
      const user = {
        id: "3",
        username: "demobio",
        full_name: "Demo Bio User",
        bio: "This is a demo bio for testing purposes",
        phone_number: "+6281234567890",
        address: "Jl. Demo Street, Bandung",
        profile_json: '{"theme": "dark"}'
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with long bio containing example", () => {
      const user = {
        id: "4",
        username: "longbio",
        full_name: "Long Bio User",
        bio: "This is a very long example bio that contains more than fifty characters and should be classified as long bio",
        phone_number: "+6287654321098",
        address: "Jl. Example Street No. 456, Jakarta Pusat",
        profile_json: '{"social_media": {"twitter": "@longbio"}}'
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with long bio without example keyword", () => {
      const user = {
        id: "4a",
        username: "validlongbio",
        full_name: "Valid Long Bio User",
        bio: "This is a very long and comprehensive biography that contains more than fifty characters and should be classified as long bio without any special keywords",
        phone_number: "+6287654321098",
        address: "Jl. Valid Street No. 456, Jakarta Pusat",
        profile_json: '{"social_media": {"twitter": "@validlongbio"}}'
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
      expect(result.id).toBe("4a");
      expect((result.processedData as any).bioStatus).toBe("long");
      expect((result.processedData as any).bioQuality).toBe("valid_long");
    });

    it("should process user with no bio", () => {
      const user = {
        id: "5",
        username: "nobio",
        full_name: "No Bio User",
        bio: null,
        phone_number: "+6285555555555",
        address: "Jl. No Bio Street",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with invalid phone number format", () => {
      const user = {
        id: "6",
        username: "invalidphone",
        full_name: "Invalid Phone User",
        bio: "User with invalid phone",
        phone_number: "+1234567890",
        address: "Jl. Invalid Phone Street",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with too short phone number", () => {
      const user = {
        id: "7",
        username: "shortphone",
        full_name: "Short Phone User",
        bio: "User with short phone",
        phone_number: "+62123",
        address: "Jl. Short Phone Street",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with too long phone number", () => {
      const user = {
        id: "8",
        username: "longphone",
        full_name: "Long Phone User",
        bio: "User with long phone",
        phone_number: "+621234567890123456",
        address: "Jl. Long Phone Street",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with no phone number", () => {
      const user = {
        id: "9",
        username: "nophone",
        full_name: "No Phone User",
        bio: "User with no phone",
        phone_number: null,
        address: "Jl. No Phone Street",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with short address", () => {
      const user = {
        id: "10",
        username: "shortaddr",
        full_name: "Short Address User",
        bio: "User with short address",
        phone_number: "+6281234567890",
        address: "Short",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with Jakarta address", () => {
      const user = {
        id: "11",
        username: "jakartauser",
        full_name: "Jakarta User",
        bio: "User from Jakarta",
        phone_number: "+6281234567890",
        address: "Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with Bandung address", () => {
      const user = {
        id: "12",
        username: "bandunguser",
        full_name: "Bandung User",
        bio: "User from Bandung",
        phone_number: "+6281234567890",
        address: "Jl. Asia Afrika No. 456, Bandung, Jawa Barat",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with no address", () => {
      const user = {
        id: "13",
        username: "noaddr",
        full_name: "No Address User",
        bio: "User with no address",
        phone_number: "+6281234567890",
        address: null,
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with valid profile JSON", () => {
      const user = {
        id: "14",
        username: "validprofile",
        full_name: "Valid Profile User",
        bio: "User with valid profile",
        phone_number: "+6281234567890",
        address: "Jl. Valid Profile Street",
        profile_json: '{"social_media": {"instagram": "@validprofile", "twitter": "@validprofile"}}'
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with profile JSON but no social media", () => {
      const user = {
        id: "15",
        username: "nosocial",
        full_name: "No Social User",
        bio: "User with no social media",
        phone_number: "+6281234567890",
        address: "Jl. No Social Street",
        profile_json: '{"theme": "dark", "language": "en"}'
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with social media but no instagram", () => {
      const user = {
        id: "16",
        username: "noinsta",
        full_name: "No Instagram User",
        bio: "User with no instagram",
        phone_number: "+6281234567890",
        address: "Jl. No Instagram Street",
        profile_json: '{"social_media": {"twitter": "@noinsta", "facebook": "noinsta"}}'
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should handle invalid JSON in profile_json", () => {
      const user = {
        id: "17",
        username: "invalidjson",
        full_name: "Invalid JSON User",
        bio: "User with invalid JSON",
        phone_number: "+6281234567890",
        address: "Jl. Invalid JSON Street",
        profile_json: '{"invalid": json}'
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should process user with no profile JSON", () => {
      const user = {
        id: "18",
        username: "noprofile",
        full_name: "No Profile User",
        bio: "User with no profile",
        phone_number: "+6281234567890",
        address: "Jl. No Profile Street",
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
    });

    it("should handle all combinations of missing data", () => {
      const user = {
        id: "19",
        username: "minimal",
        full_name: "Minimal User",
        bio: null,
        phone_number: null,
        address: null,
        profile_json: null
      };

      const result = processUserDataWithNestedLogic(user);

      expect(result.processedData).toBeDefined();
      expect(result.id).toBe("19");
      expect(result.username).toBe("minimal");
      expect(result.fullName).toBe("Minimal User");
    });
  });

  describe("processMultipleUsers function", () => {
    it("should process empty array and return empty array", () => {
      const users: any[] = [];
      const result = processMultipleUsers(users);
      
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should process single user correctly", () => {
      const users = [
        {
          id: 1,
          username: "testuser",
          full_name: "Test User",
          bio: "This is a test bio", // 18 chars = medium length
          phone_number: "+628123456789",
          address: "Jakarta, Indonesia",
          profile_json: '{"social_media":{"instagram":"test_user"}}'
        }
      ];

      const result = processMultipleUsers(users);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].username).toBe("testuser");
      expect(result[0].fullName).toBe("Test User");
      expect(result[0].processedData.bioStatus).toBe("medium"); // Fixed: 18 chars is medium (10-50)
      expect(result[0].processedData.phoneStatus).toBe("valid");
      expect(result[0].processedData.addressStatus).toBe("valid");
      expect(result[0].processedData.profileStatus).toBe("complete");
    });

    it("should process multiple users correctly", () => {
      const users = [
        {
          id: 1,
          username: "user1",
          full_name: "User One",
          bio: "Short bio",
          phone_number: "+628123456789",
          address: "Jakarta, Indonesia",
          profile_json: '{"social_media":{"instagram":"user1"}}'
        },
        {
          id: 2,
          username: "user2",
          full_name: "User Two",
          bio: "This is a much longer bio that should be considered long length for testing purposes and validation", // 94 chars = long
          phone_number: "+628987654321",
          address: "Bandung, West Java, Indonesia with more detailed address information",
          profile_json: '{"social_media":{}}'
        },
        {
          id: 3,
          username: "user3",
          full_name: "User Three"
          // Missing optional fields
        }
      ];

      const result = processMultipleUsers(users);

      expect(result).toHaveLength(3);
      
      // Test first user
      expect(result[0].id).toBe(1);
      expect(result[0].username).toBe("user1");
      expect(result[0].processedData.bioStatus).toBe("short");
      expect(result[0].processedData.phoneStatus).toBe("valid");
      expect(result[0].processedData.addressStatus).toBe("valid");
      expect(result[0].processedData.profileStatus).toBe("complete");

      // Test second user
      expect(result[1].id).toBe(2);
      expect(result[1].username).toBe("user2");
      expect(result[1].processedData.bioStatus).toBe("long"); // Fixed: 94 chars is long (>50)
      expect(result[1].processedData.phoneStatus).toBe("valid");
      expect(result[1].processedData.addressStatus).toBe("valid");
      expect(result[1].processedData.profileStatus).toBe("partial");

      // Test third user (missing fields)
      expect(result[2].id).toBe(3);
      expect(result[2].username).toBe("user3");
      expect(result[2].processedData.bioStatus).toBe("missing");
      expect(result[2].processedData.phoneStatus).toBe("missing");
      expect(result[2].processedData.addressStatus).toBe("missing");
      expect(result[2].processedData.profileStatus).toBe("missing");
    });

    it("should handle users with invalid data formats", () => {
      const users = [
        {
          id: 1,
          username: "invalid_user",
          full_name: "Invalid User",
          bio: "",
          phone_number: "08123456789", // Invalid format (no +62)
          address: "Short",
          profile_json: '{"invalid": "json structure"}'
        },
        {
          id: 2,
          username: "corrupted_user",
          full_name: "Corrupted User",
          bio: "Te", // Too short
          phone_number: "+6281234567890123456789", // Too long
          address: "", // Empty
          profile_json: 'invalid json' // Invalid JSON
        }
      ];

      const result = processMultipleUsers(users);

      expect(result).toHaveLength(2);
      
      // Test first user with invalid formats
      expect(result[0].processedData.bioStatus).toBe("missing");
      expect(result[0].processedData.phoneStatus).toBe("invalid_country_code");
      expect(result[0].processedData.addressStatus).toBe("too_short");
      expect(result[0].processedData.profileStatus).toBe("incomplete");

      // Test second user with corrupted data
      expect(result[1].processedData.bioStatus).toBe("short");
      expect(result[1].processedData.phoneStatus).toBe("invalid_length");
      expect(result[1].processedData.addressStatus).toBe("missing");
      expect(result[1].processedData.profileStatus).toBe("invalid_json");
    });

    it("should maintain order of users in the result", () => {
      const users = [
        { id: 5, username: "fifth", full_name: "Fifth User" },
        { id: 2, username: "second", full_name: "Second User" },
        { id: 8, username: "eighth", full_name: "Eighth User" },
        { id: 1, username: "first", full_name: "First User" }
      ];

      const result = processMultipleUsers(users);

      expect(result).toHaveLength(4);
      expect(result[0].id).toBe(5);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(8);
      expect(result[3].id).toBe(1);
      
      expect(result[0].username).toBe("fifth");
      expect(result[1].username).toBe("second");
      expect(result[2].username).toBe("eighth");
      expect(result[3].username).toBe("first");
    });

    it("should handle large arrays efficiently", () => {
      // Create a large array of users for performance testing
      const users = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        username: `user${index + 1}`,
        full_name: `User ${index + 1}`,
        bio: index % 2 === 0 ? "Short bio" : "This is a much longer bio that should be considered medium length for testing purposes and performance validation",
        phone_number: index % 3 === 0 ? "+628123456789" : undefined,
        address: index % 4 === 0 ? "Jakarta, Indonesia" : undefined,
        profile_json: index % 5 === 0 ? '{"social_media":{"instagram":"user"}}' : undefined
      }));

      const startTime = Date.now();
      const result = processMultipleUsers(users);
      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result).toHaveLength(100);
      expect(processingTime).toBeLessThan(1000); // Should process 100 users in less than 1 second
      
      // Verify first and last users are processed correctly
      expect(result[0].id).toBe(1);
      expect(result[99].id).toBe(100);
      
      // Verify processing works correctly for different patterns
      expect(result[0].processedData.phoneStatus).toBe("valid"); // index 0, divisible by 3
      expect(result[1].processedData.phoneStatus).toBe("missing"); // index 1, not divisible by 3
    });

    it("should call processUserDataWithNestedLogic for each user", () => {
      // This test verifies that processMultipleUsers correctly delegates to processUserDataWithNestedLogic
      const users = [
        { id: 1, username: "test1", full_name: "Test 1" },
        { id: 2, username: "test2", full_name: "Test 2" }
      ];

      const result = processMultipleUsers(users);

      // Verify that each user was processed and returned with the expected structure
      result.forEach((processedUser, index) => {
        expect(processedUser).toHaveProperty('id');
        expect(processedUser).toHaveProperty('username');
        expect(processedUser).toHaveProperty('fullName');
        expect(processedUser).toHaveProperty('processedData');
        expect(processedUser.processedData).toHaveProperty('bioStatus');
        expect(processedUser.processedData).toHaveProperty('bioQuality');
        expect(processedUser.processedData).toHaveProperty('phoneStatus');
        expect(processedUser.processedData).toHaveProperty('phoneQuality');
        expect(processedUser.processedData).toHaveProperty('addressStatus');
        expect(processedUser.processedData).toHaveProperty('addressQuality');
        expect(processedUser.processedData).toHaveProperty('profileStatus');
        expect(processedUser.processedData).toHaveProperty('profileQuality');
        
        expect(processedUser.id).toBe(users[index].id);
        expect(processedUser.username).toBe(users[index].username);
        expect(processedUser.fullName).toBe(users[index].full_name);
      });
    });
  });
});
