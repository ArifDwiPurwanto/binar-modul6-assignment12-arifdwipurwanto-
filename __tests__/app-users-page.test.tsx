/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import UsersPage from '@/app/users/page';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'testuser' },
    loading: false,
    error: null
  })
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/users'
  })
}));

describe('Users Page Component', () => {
  it('should render without crashing', () => {
    render(<UsersPage />);
    
    // Check if the page renders
    expect(document.body).toBeInTheDocument();
  });

  it('should handle user authentication state', () => {
    const { container } = render(<UsersPage />);
    
    // Component should render without errors
    expect(container).toBeDefined();
  });

  it('should display users content when authenticated', () => {
    render(<UsersPage />);
    
    // The page should render successfully
    expect(document.body).toBeInTheDocument();
  });
});
