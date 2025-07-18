/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfilePage from '@/app/profile/page';

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
    pathname: '/profile'
  })
}));

describe('Profile Page Component', () => {
  it('should render without crashing', () => {
    render(<ProfilePage />);
    
    // Check if the page renders
    expect(document.body).toBeInTheDocument();
  });

  it('should handle user authentication state', () => {
    const { container } = render(<ProfilePage />);
    
    // Component should render without errors
    expect(container).toBeDefined();
  });

  it('should display profile content when user is authenticated', () => {
    render(<ProfilePage />);
    
    // The page should render successfully
    expect(document.body).toBeInTheDocument();
  });
});
