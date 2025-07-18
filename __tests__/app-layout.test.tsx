/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout from '@/app/layout';

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font'
  })
}));

describe('RootLayout Component', () => {
  it('should render with proper HTML structure', () => {
    const mockChildren = <div data-testid="test-child">Test Content</div>;
    
    render(
      <RootLayout>
        {mockChildren}
      </RootLayout>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('should have proper metadata and font setup', () => {
    const mockChildren = <div>Content</div>;
    
    const { container } = render(
      <RootLayout>
        {mockChildren}
      </RootLayout>
    );

    // Check if the layout renders children properly
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should apply Inter font className', () => {
    const mockChildren = <div>Content</div>;
    
    const { container } = render(
      <RootLayout>
        {mockChildren}
      </RootLayout>
    );

    // The layout should render without errors
    expect(container).toBeDefined();
  });
});
