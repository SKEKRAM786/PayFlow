/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../components/DashboardPage';
import { AuthProvider } from '../context/AuthContext';

describe('Dashboard Page Component Tests', () => {
  it('renders executive overview metrics and distribution headers', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Executive Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Payments/i)).toBeInTheDocument();
    expect(screen.getByText(/Captured USD Volume/i)).toBeInTheDocument();
  });
});
