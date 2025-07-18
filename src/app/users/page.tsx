"use client";

import { useEffect, useReducer, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

// Bad practice: global variable for API URL
// Best practice: Use environment variables and proper API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_ENDPOINTS = {
  USERS: `${API_BASE_URL}/api/users`,
} as const;

// Bad practice: no proper TypeScript interfaces
// Best practice: Well-structured TypeScript interfaces with proper naming, optional fields, and documentation
/**
 * Represents a user entity with complete profile information
 */
interface User {
  // Core identifiers
  id: number;
  username: string;
  email: string;
  
  // Personal information
  fullName: string;
  birthDate?: string; // Optional - not all users may provide birth date
  bio?: string; // Optional profile field
  longBio?: string; // Optional extended profile field
  
  // Contact and location
  address?: string; // Optional address information
  division?: string; // Optional organizational division
  
  // Timestamps (keeping as string for API compatibility, could be Date objects)
  createdAt: string;
  updatedAt: string;
}

/**
 * API response structure containing user data with metadata
 */
interface UserApiResponse {
  users: User[];
  total: number;
  totalUsers: number;
  newerUsers: number;
}

/**
 * Extended user data for component state (includes metadata)
 * @deprecated Consider separating metadata from user entity
 */
interface UserData extends User {
  totalUsers: number;
  newerUsers: number;
}

// Best practice: Centralized state management with useReducer
interface UsersState {
  users: User[];
  loading: boolean;
  error: string;
  searchTerm: string;
  sortBy: string;
  divisionFilter: string;
  currentPage: number;
  itemsPerPage: number;
  totalCount: number;
  isRefreshing: boolean;
  lastFetchTime: Date;
  fetchCount: number;
  userMetadata: {
    totalUsers: number;
    newerUsers: number;
  };
}

type UsersAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SORT_BY'; payload: string }
  | { type: 'SET_DIVISION_FILTER'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'SET_TOTAL_COUNT'; payload: number }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_FETCH_TIME'; payload: Date }
  | { type: 'INCREMENT_FETCH_COUNT' }
  | { type: 'SET_USER_METADATA'; payload: { totalUsers: number; newerUsers: number } };

// Best practice: Pure reducer function for predictable state updates
function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload, currentPage: 1 }; // Reset page on search
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload };
    case 'SET_DIVISION_FILTER':
      return { ...state, divisionFilter: action.payload, currentPage: 1 }; // Reset page on filter
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, currentPage: 1 }; // Reset page on items per page change
    case 'SET_TOTAL_COUNT':
      return { ...state, totalCount: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'SET_FETCH_TIME':
      return { ...state, lastFetchTime: action.payload };
    case 'INCREMENT_FETCH_COUNT':
      return { ...state, fetchCount: state.fetchCount + 1 };
    case 'SET_USER_METADATA':
      return { ...state, userMetadata: action.payload };
    default:
      return state;
  }
}

// Best practice: Initial state as a constant
const initialUsersState: UsersState = {
  users: [],
  loading: true,
  error: "",
  searchTerm: "",
  sortBy: "createdAt",
  divisionFilter: "all",
  currentPage: 1,
  itemsPerPage: 20,
  totalCount: 0,
  isRefreshing: false,
  lastFetchTime: new Date(),
  fetchCount: 0,
  userMetadata: { totalUsers: 0, newerUsers: 0 },
};

// Bad practice: component with poor naming and no optimization
// Best practice: Use meaningful component names and optimize for performance
export default function UsersPageComponent() {
  // Bad practice: multiple state variables instead of useReducer
  // Best practice: Use useReducer for complex state management
  const [state, dispatch] = useReducer(usersReducer, initialUsersState);

  const { requireAuth } = useAuth();

  // Bad practice: checking auth on every render
  useEffect(() => {
    requireAuth("/login");
  }, [requireAuth]);

  // Bad practice: hardcoded fetch function with no error handling optimization
  // Best practice: Use useCallback to memoize functions and optimize re-renders
  const fetchUsersData = useCallback(async () => {
    console.time("Users Page Fetch");
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: "" });

    try {
      // Bad practice: no timeout, no retry logic
      const url =
        state.divisionFilter !== "all"
          ? `${API_ENDPOINTS.USERS}?division=${state.divisionFilter}`
          : API_ENDPOINTS.USERS;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Bad practice: no validation of response data
      // Best practice: Validate response data structure
      dispatch({ type: 'SET_USERS', payload: data.users || [] });
      dispatch({ type: 'SET_TOTAL_COUNT', payload: data.total || 0 });
      // Best practice: Separate metadata handling
      dispatch({ 
        type: 'SET_USER_METADATA', 
        payload: {
          totalUsers: data.totalUsers || 0,
          newerUsers: data.newerUsers || 0,
        }
      });
      dispatch({ type: 'SET_FETCH_TIME', payload: new Date() });
      dispatch({ type: 'INCREMENT_FETCH_COUNT' });
    } catch (error) {
      // Bad practice: generic error handling
      // Best practice: Specific error handling with user feedback
      console.error("Fetch error:", error);
      dispatch({ type: 'SET_ERROR', payload: "Failed to load users data" });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      console.timeEnd("Users Page Fetch");
    }
  }, [state.divisionFilter]);

  // Bad practice: useEffect with no dependencies array optimization
  // Best practice: useEffect with dependencies to avoid unnecessary re-fetching
  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  // Bad practice: inefficient filtering and sorting logic
  // Best practice: Use useMemo to optimize expensive computations
  const getFilteredAndSortedUsers = useMemo(() => {
    let filteredUsers = [...state.users];

    // Best practice: Simplified filtering logic with early returns
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter((user) => {
        return (
          user.fullName.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.bio?.toLowerCase().includes(searchLower) ||
          user.address?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Best practice: Simplified sorting with utility function
    const sortFunctions = {
      createdAt: (a: User, b: User) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      fullName: (a: User, b: User) => a.fullName.toLowerCase().localeCompare(b.fullName.toLowerCase()),
      username: (a: User, b: User) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()),
      division: (a: User, b: User) => (a.division || "").toLowerCase().localeCompare((b.division || "").toLowerCase()),
    };

    const sortFunction = sortFunctions[state.sortBy as keyof typeof sortFunctions];
    if (sortFunction) {
      filteredUsers.sort(sortFunction);
    }

    return filteredUsers;
  }, [state.users, state.searchTerm, state.sortBy]);

  // Bad practice: inefficient pagination calculation
  // Best practice: Use useMemo for optimized pagination calculations
  const getPaginatedUsers = useMemo(() => {
    const filteredUsers = getFilteredAndSortedUsers;
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [getFilteredAndSortedUsers, state.currentPage, state.itemsPerPage]);

  // Bad practice: inefficient pagination info calculation
  // Best practice: Use useMemo for optimized pagination info calculations
  const getPaginationInfo = useMemo(() => {
    const filteredUsers = getFilteredAndSortedUsers;
    const totalPages = Math.ceil(filteredUsers.length / state.itemsPerPage);
    const startIndex = (state.currentPage - 1) * state.itemsPerPage + 1;
    const endIndex = Math.min(state.currentPage * state.itemsPerPage, filteredUsers.length);

    return {
      totalPages,
      startIndex,
      endIndex,
      totalItems: filteredUsers.length,
    };
  }, [getFilteredAndSortedUsers, state.currentPage, state.itemsPerPage]);

  // Bad practice: inefficient date formatting
  // Best practice: Use modern date formatting with Intl API and memoization
  const formatDateOptimized = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Validate date
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      // Use Intl.DateTimeFormat for proper internationalization and timezone handling
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // 24-hour format
        timeZone: 'local' // Use user's local timezone
      }).format(date);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Invalid Date';
    }
  }, []);

  // Bad practice: inefficient user card rendering
  // Best practice: Optimized user card rendering with memoization and better structure
  const UserCardField = useCallback(({ label, value, className = "" }: { 
    label: string; 
    value: string | number; 
    className?: string;
  }) => (
    <p className={className} style={{ margin: "0 0 4px 0", color: "#666" }}>
      <strong>{label}:</strong> {value}
    </p>
  ), []);

  const truncateText = useCallback((text: string, maxLength: number = 100): string => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }, []);

  const renderOptimizedUserCard = useCallback((user: User, index: number) => {
    // Best practice: Extract styles to improve readability and performance
    const cardStyles = {
      card: {
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px 0",
        backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
        transition: "box-shadow 0.2s ease-in-out",
        cursor: "pointer",
      } as const,
      container: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "16px",
      } as const,
      header: {
        margin: "0 0 8px 0",
        fontSize: "18px",
        fontWeight: "bold",
        color: "#333",
      } as const,
      timestampField: {
        margin: "0 0 4px 0",
        color: "#999",
        fontSize: "12px",
      } as const,
      metadata: {
        textAlign: "right" as const,
        fontSize: "12px",
        color: "#999",
        minWidth: "120px",
      },
      metadataItem: {
        margin: "2px 0",
        padding: "2px 4px",
        backgroundColor: "#f0f0f0",
        borderRadius: "4px",
      } as const,
    };

    return (
      <article 
        key={user.id} 
        style={cardStyles.card}
        aria-labelledby={`user-${user.id}-name`}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div style={cardStyles.container}>
          <div style={{ flex: 1 }}>
            <h3 id={`user-${user.id}-name`} style={cardStyles.header}>
              {user.fullName}
            </h3>
            
            {/* Core information */}
            <UserCardField label="Username" value={user.username} />
            <UserCardField label="Email" value={user.email} />
            
            {/* Optional fields with better conditional rendering */}
            {user.birthDate && (
              <UserCardField label="Birth Date" value={user.birthDate} />
            )}
            {user.division && (
              <UserCardField label="Division" value={user.division} />
            )}
            {user.address && (
              <UserCardField label="Address" value={user.address} />
            )}
            {user.bio && (
              <UserCardField label="Bio" value={user.bio} />
            )}
            {user.longBio && (
              <UserCardField 
                label="Long Bio" 
                value={truncateText(user.longBio)} 
              />
            )}
            
            {/* Timestamps with improved styling */}
            <p style={cardStyles.timestampField}>
              <strong>Created:</strong> {formatDateOptimized(user.createdAt)}
            </p>
            <p style={cardStyles.timestampField}>
              <strong>Updated:</strong> {formatDateOptimized(user.updatedAt)}
            </p>
          </div>
          
          {/* Metadata section with improved layout */}
          <aside style={cardStyles.metadata} aria-label="User statistics">
            <div style={cardStyles.metadataItem}>
              <div>Total Users</div>
              <div style={{ fontWeight: "bold" }}>{state.userMetadata.totalUsers}</div>
            </div>
            <div style={cardStyles.metadataItem}>
              <div>Newer Users</div>
              <div style={{ fontWeight: "bold" }}>{state.userMetadata.newerUsers}</div>
            </div>
          </aside>
        </div>
      </article>
    );
  }, [UserCardField, truncateText, formatDateOptimized, state.userMetadata]);

  // Bad practice: inefficient pagination controls
  // Best practice: Optimized pagination controls with accessibility and better structure
  const PaginationButton = useCallback(({ 
    children, 
    onClick, 
    disabled = false, 
    isActive = false, 
    ariaLabel,
    ...props 
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    isActive?: boolean;
    ariaLabel?: string;
  }) => {
    const buttonStyles = {
      margin: "0 2px",
      padding: "8px 12px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: isActive ? "bold" : "normal",
      backgroundColor: disabled 
        ? "#f5f5f5" 
        : isActive 
          ? "#007bff" 
          : "#fff",
      color: disabled 
        ? "#999" 
        : isActive 
          ? "#fff" 
          : "#333",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all 0.2s ease-in-out",
      minWidth: "40px",
      outline: "none",
    };

    return (
      <button
        {...props}
        onClick={onClick}
        disabled={disabled}
        style={buttonStyles}
        aria-label={ariaLabel}
        aria-current={isActive ? "page" : undefined}
        onFocus={(e) => {
          if (!disabled) {
            (e.target as HTMLButtonElement).style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
          }
        }}
        onBlur={(e) => {
          (e.target as HTMLButtonElement).style.boxShadow = "none";
        }}
        onMouseEnter={(e) => {
          if (!disabled && !isActive) {
            (e.target as HTMLButtonElement).style.backgroundColor = "#e9ecef";
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isActive) {
            (e.target as HTMLButtonElement).style.backgroundColor = "#fff";
          }
        }}
      >
        {children}
      </button>
    );
  }, []);

  const renderOptimizedPaginationControls = useCallback(() => {
    const paginationInfo = getPaginationInfo;
    const { totalPages } = paginationInfo;
    const { currentPage } = state;

    // Don't render pagination if only one page or no pages
    if (totalPages <= 1) {
      return null;
    }

    // Constants for better maintainability
    const MAX_VISIBLE_PAGES = 5;
    const ELLIPSIS = "...";

    // Calculate visible page range
    const getVisiblePageRange = () => {
      const halfVisible = Math.floor(MAX_VISIBLE_PAGES / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);
      
      // Adjust start page if we're near the end
      if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
        startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
      }
      
      return { startPage, endPage };
    };

    const { startPage, endPage } = getVisiblePageRange();
    
    // Generate page numbers array using modern array methods
    const visiblePages = Array.from(
      { length: endPage - startPage + 1 }, 
      (_, i) => startPage + i
    );

    const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
      }
    };

    const paginationStyles = {
      container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "24px 0",
        gap: "4px",
        flexWrap: "wrap" as const,
      },
      info: {
        fontSize: "14px",
        color: "#666",
        margin: "0 16px",
        whiteSpace: "nowrap" as const,
      },
      ellipsis: {
        padding: "8px 4px",
        color: "#999",
        fontSize: "14px",
        userSelect: "none" as const,
      }
    };

    return (
      <nav 
        aria-label="Pagination Navigation"
        role="navigation"
      >
        <div style={paginationStyles.container}>
          {/* Previous button */}
          <PaginationButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            ariaLabel="Go to previous page"
          >
            ← Previous
          </PaginationButton>

          {/* First page if not visible */}
          {startPage > 1 && (
            <>
              <PaginationButton
                onClick={() => handlePageChange(1)}
                ariaLabel="Go to page 1"
              >
                1
              </PaginationButton>
              {startPage > 2 && (
                <span style={paginationStyles.ellipsis}>{ELLIPSIS}</span>
              )}
            </>
          )}

          {/* Visible page numbers */}
          {visiblePages.map((pageNumber) => (
            <PaginationButton
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              isActive={pageNumber === currentPage}
              ariaLabel={
                pageNumber === currentPage 
                  ? `Current page, page ${pageNumber}` 
                  : `Go to page ${pageNumber}`
              }
            >
              {pageNumber}
            </PaginationButton>
          ))}

          {/* Last page if not visible */}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span style={paginationStyles.ellipsis}>{ELLIPSIS}</span>
              )}
              <PaginationButton
                onClick={() => handlePageChange(totalPages)}
                ariaLabel={`Go to page ${totalPages}`}
              >
                {totalPages}
              </PaginationButton>
            </>
          )}

          {/* Next button */}
          <PaginationButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            ariaLabel="Go to next page"
          >
            Next →
          </PaginationButton>
        </div>

        {/* Pagination info */}
        <div style={paginationStyles.info}>
          Showing {paginationInfo.startIndex}-{paginationInfo.endIndex} of {paginationInfo.totalItems} results
        </div>
      </nav>
    );
  }, [getPaginationInfo, state.currentPage, dispatch, PaginationButton]);

  // Bad practice: inefficient filter controls
  // Best practice: Optimized filter controls with accessibility, debouncing, and better structure
  const FilterField = useCallback(({ 
    id, 
    label, 
    children, 
    description,
    isRequired = false 
  }: {
    id: string;
    label: string;
    children: React.ReactNode;
    description?: string;
    isRequired?: boolean;
  }) => {
    const fieldStyles = {
      container: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "4px",
        minWidth: "120px",
      },
      label: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#333",
        cursor: "pointer",
      },
      description: {
        fontSize: "12px",
        color: "#666",
        marginTop: "2px",
      }
    };

    return (
      <div style={fieldStyles.container}>
        <label 
          htmlFor={id} 
          style={fieldStyles.label}
          aria-label={`${label}${isRequired ? ' (required)' : ''}`}
        >
          {label}{isRequired && <span style={{ color: "#dc3545" }}>*</span>}
        </label>
        {children}
        {description && (
          <span style={fieldStyles.description} id={`${id}-description`}>
            {description}
          </span>
        )}
      </div>
    );
  }, []);


  // Best practice: Configuration constants for maintainability
  const FILTER_CONFIG = useMemo(() => ({
    DIVISIONS: [
      { value: "all", label: "All Divisions" },
      { value: "Tech", label: "Technology" },
      { value: "QA", label: "Quality Assurance" },
      { value: "HR", label: "Human Resources" },
      { value: "Marketing", label: "Marketing" },
      { value: "Finance", label: "Finance" },
      { value: "Sales", label: "Sales" },
      { value: "Operations", label: "Operations" },
      { value: "Legal", label: "Legal" },
      { value: "Design", label: "Design" },
      { value: "Product", label: "Product Management" },
    ],
    SORT_OPTIONS: [
      { value: "createdAt", label: "Created Date" },
      { value: "fullName", label: "Full Name" },
      { value: "username", label: "Username" },
      { value: "division", label: "Division" },
    ],
    ITEMS_PER_PAGE: [
      { value: 10, label: "10 per page" },
      { value: 20, label: "20 per page" },
      { value: 50, label: "50 per page" },
      { value: 100, label: "100 per page" },
    ],
    REFRESH_TIMEOUT: 1000,
    SEARCH_DEBOUNCE: 300,
  }), []);

  // Best practice: Memoized event handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    dispatch({ type: 'SET_SEARCH_TERM', payload: value });
  }, [dispatch]);

  const handleSortChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_SORT_BY', payload: event.target.value });
  }, [dispatch]);

  const handleDivisionChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_DIVISION_FILTER', payload: event.target.value });
  }, [dispatch]);

  const handleItemsPerPageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value);
    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: value });
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    fetchUsersData();
    setTimeout(() => {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }, FILTER_CONFIG.REFRESH_TIMEOUT);
  }, [dispatch, fetchUsersData, FILTER_CONFIG.REFRESH_TIMEOUT]);

  const handleClearFilters = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: '' });
    dispatch({ type: 'SET_SORT_BY', payload: 'createdAt' });
    dispatch({ type: 'SET_DIVISION_FILTER', payload: 'all' });
    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: 20 });
  }, [dispatch]);

  // Best practice: Keyboard shortcuts for better UX
  const handleKeyboardShortcuts = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'f':
          event.preventDefault();
          document.getElementById('search-input')?.focus();
          break;
        case 'r':
          event.preventDefault();
          handleRefresh();
          break;
        case 'x':
          event.preventDefault();
          handleClearFilters();
          break;
      }
    }
  }, [handleRefresh, handleClearFilters]);

  const renderOptimizedFilterControls = useCallback(() => {
    const containerStyles = {
      container: {
        margin: "24px 0",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "12px",
        border: "1px solid #e9ecef",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      },
      header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        flexWrap: "wrap" as const,
        gap: "8px",
      },
      title: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#333",
        margin: 0,
      },
      shortcutsInfo: {
        fontSize: "12px",
        color: "#666",
        fontStyle: "italic",
      },
      filtersGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "16px",
      },
      actionsContainer: {
        display: "flex",
        gap: "12px",
        justifyContent: "flex-end",
        alignItems: "center",
        flexWrap: "wrap" as const,
      },
      input: {
        padding: "10px 12px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        width: "100%",
        maxWidth: "250px",
        transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        outline: "none",
      },
      select: {
        padding: "10px 12px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        width: "100%",
        backgroundColor: "#fff",
        cursor: "pointer",
        transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        outline: "none",
      },
      button: {
        padding: "10px 16px",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "500",
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        outline: "none",
        minWidth: "100px",
      },
      refreshButton: {
        backgroundColor: "#28a745",
        color: "#fff",
      },
      clearButton: {
        backgroundColor: "#6c757d",
        color: "#fff",
      },
      activeFiltersInfo: {
        fontSize: "12px",
        color: "#495057",
        fontWeight: "500",
      }
    };

    const getActiveFiltersCount = () => {
      let count = 0;
      if (state.searchTerm) count++;
      if (state.divisionFilter !== "all") count++;
      if (state.sortBy !== "createdAt") count++;
      if (state.itemsPerPage !== 20) count++;
      return count;
    };

    const activeFiltersCount = getActiveFiltersCount();

    return (
      <section 
        style={containerStyles.container}
        aria-label="Filter and search controls"
        onKeyDown={handleKeyboardShortcuts}
      >
        {/* Header */}
        <div style={containerStyles.header}>
          <h2 style={containerStyles.title}>
            Filter & Search
            {activeFiltersCount > 0 && (
              <span style={{ 
                marginLeft: "8px", 
                fontSize: "12px", 
                backgroundColor: "#007bff", 
                color: "#fff",
                padding: "2px 6px",
                borderRadius: "10px"
              }}>
                {activeFiltersCount} active
              </span>
            )}
          </h2>
          <div style={containerStyles.shortcutsInfo}>
            Ctrl+F: Focus Search | Ctrl+R: Refresh | Ctrl+X: Clear
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div style={containerStyles.filtersGrid}>
          {/* Search Field */}
          <FilterField 
            id="search-input" 
            label="Search Users"
            description="Search by name, username, email, bio, or address"
          >
            <input
              id="search-input"
              type="text"
              value={state.searchTerm}
              onChange={handleSearchChange}
              placeholder="Type to search..."
              style={{
                ...containerStyles.input,
                borderColor: state.searchTerm ? "#007bff" : "#ddd",
              }}
              aria-describedby="search-input-description"
              onFocus={(e) => {
                e.target.style.borderColor = "#007bff";
                e.target.style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = state.searchTerm ? "#007bff" : "#ddd";
                e.target.style.boxShadow = "none";
              }}
            />
          </FilterField>

          {/* Sort Field */}
          <FilterField 
            id="sort-select" 
            label="Sort Order"
            description="Choose how to sort the user list"
          >
            <select
              id="sort-select"
              value={state.sortBy}
              onChange={handleSortChange}
              style={{
                ...containerStyles.select,
                borderColor: state.sortBy !== "createdAt" ? "#007bff" : "#ddd",
              }}
              aria-describedby="sort-select-description"
              onFocus={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = "#007bff";
                (e.target as HTMLSelectElement).style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
              }}
              onBlur={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = state.sortBy !== "createdAt" ? "#007bff" : "#ddd";
                (e.target as HTMLSelectElement).style.boxShadow = "none";
              }}
            >
              {FILTER_CONFIG.SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>

          {/* Division Filter */}
          <FilterField 
            id="division-select" 
            label="Division Filter"
            description="Filter by organizational division"
          >
            <select
              id="division-select"
              value={state.divisionFilter}
              onChange={handleDivisionChange}
              style={{
                ...containerStyles.select,
                borderColor: state.divisionFilter !== "all" ? "#007bff" : "#ddd",
              }}
              aria-describedby="division-select-description"
              onFocus={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = "#007bff";
                (e.target as HTMLSelectElement).style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
              }}
              onBlur={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = state.divisionFilter !== "all" ? "#007bff" : "#ddd";
                (e.target as HTMLSelectElement).style.boxShadow = "none";
              }}
            >
              {FILTER_CONFIG.DIVISIONS.map(division => (
                <option key={division.value} value={division.value}>
                  {division.label}
                </option>
              ))}
            </select>
          </FilterField>

          {/* Items Per Page */}
          <FilterField 
            id="items-select" 
            label="Items Per Page"
            description="Number of users to display per page"
          >
            <select
              id="items-select"
              value={state.itemsPerPage}
              onChange={handleItemsPerPageChange}
              style={{
                ...containerStyles.select,
                borderColor: state.itemsPerPage !== 20 ? "#007bff" : "#ddd",
              }}
              aria-describedby="items-select-description"
              onFocus={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = "#007bff";
                (e.target as HTMLSelectElement).style.boxShadow = "0 0 0 2px rgba(0, 123, 255, 0.25)";
              }}
              onBlur={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = state.itemsPerPage !== 20 ? "#007bff" : "#ddd";
                (e.target as HTMLSelectElement).style.boxShadow = "none";
              }}
            >
              {FILTER_CONFIG.ITEMS_PER_PAGE.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        </div>

        {/* Action Buttons */}
        <div style={containerStyles.actionsContainer}>
          <div style={containerStyles.activeFiltersInfo}>
            Showing {getPaginationInfo.totalItems} of {state.totalCount} users
          </div>
          
          <button
            onClick={handleClearFilters}
            disabled={activeFiltersCount === 0}
            style={{
              ...containerStyles.button,
              ...containerStyles.clearButton,
              opacity: activeFiltersCount === 0 ? 0.5 : 1,
              cursor: activeFiltersCount === 0 ? "not-allowed" : "pointer",
            }}
            aria-label="Clear all filters"
            onMouseEnter={(e) => {
              if (activeFiltersCount > 0) {
                (e.target as HTMLButtonElement).style.backgroundColor = "#5a6268";
              }
            }}
            onMouseLeave={(e) => {
              if (activeFiltersCount > 0) {
                (e.target as HTMLButtonElement).style.backgroundColor = "#6c757d";
              }
            }}
          >
            Clear Filters
          </button>

          <button
            onClick={handleRefresh}
            disabled={state.isRefreshing}
            style={{
              ...containerStyles.button,
              ...containerStyles.refreshButton,
              opacity: state.isRefreshing ? 0.7 : 1,
              cursor: state.isRefreshing ? "not-allowed" : "pointer",
            }}
            aria-label={state.isRefreshing ? "Refreshing data..." : "Refresh user data"}
            onMouseEnter={(e) => {
              if (!state.isRefreshing) {
                (e.target as HTMLButtonElement).style.backgroundColor = "#218838";
              }
            }}
            onMouseLeave={(e) => {
              if (!state.isRefreshing) {
                (e.target as HTMLButtonElement).style.backgroundColor = "#28a745";
              }
            }}
          >
            {state.isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </section>
    );
  }, [
    state, 
    FILTER_CONFIG, 
    handleSearchChange, 
    handleSortChange, 
    handleDivisionChange, 
    handleItemsPerPageChange, 
    handleRefresh, 
    handleClearFilters, 
    handleKeyboardShortcuts,
    getPaginationInfo.totalItems,
    FilterField
  ]);

  if (state.loading) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>
            Loading users...
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Please wait while we fetch the data
          </div>
        </div>
      </>
    );
  }

  if (state.error) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div
            style={{ fontSize: "24px", color: "#dc3545", marginBottom: "16px" }}
          >
            Error: {state.error}
          </div>
          <button
            onClick={fetchUsersData}
            style={{
              padding: "8px 16px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  const paginatedUsers = getPaginatedUsers;
  const paginationInfo = getPaginationInfo;

  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Users List</h1>
          <p style={{ color: "#666", marginBottom: "16px" }}>
            Total: {state.totalCount} users | Showing: {paginationInfo.startIndex}-
            {paginationInfo.endIndex} of {paginationInfo.totalItems} filtered
            results
          </p>
          <p style={{ color: "#999", fontSize: "12px" }}>
            Last fetched: {state.lastFetchTime.toLocaleString()} | Fetch count:{" "}
            {state.fetchCount}
          </p>
        </div>

        {renderOptimizedFilterControls()}

        <div style={{ marginBottom: "20px" }}>
          {paginatedUsers.map((user, index) => renderOptimizedUserCard(user, index))}
        </div>

        {renderOptimizedPaginationControls()}

        <div style={{ marginTop: "20px", textAlign: "center", color: "#666" }}>
          <p>
            This page demonstrates poor performance practices for refactoring
            practice.
          </p>
          <p>Check the console for timing information.</p>
        </div>
      </div>
    </>
  );
}
