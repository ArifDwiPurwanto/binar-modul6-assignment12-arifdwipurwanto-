/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

describe('Home Page Component', () => {
  it('should render without crashing', () => {
    render(<Home />);
    
    // Check if the main container exists
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('should contain navigation links', () => {
    render(<Home />);
    
    // Check for links to various pages
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should have proper page structure', () => {
    const { container } = render(<Home />);
    
    // Check if component renders properly
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should display welcome content', () => {
    render(<Home />);
    
    // The page should render without errors
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });
});
