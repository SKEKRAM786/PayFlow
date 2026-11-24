/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../components/Login';
import Register from '../components/Register';
import LandingPage from '../components/LandingPage';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';

describe('Auth Views Unit Tests', () => {
  it('renders landing page with features, animation workflow, and Sk Ekram LinkedIn link', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <LandingPage />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Idempotent Payment Orchestration/i })).toBeInTheDocument();
    expect(screen.getByText(/How PayFlow Processes a Financial Flow/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sk Ekram/i).length).toBeGreaterThan(0);

    const linkedInLinks = screen.getAllByRole('link', { name: /linkedin/i });
    expect(linkedInLinks.length).toBeGreaterThan(0);
    expect(linkedInLinks[0]).toHaveAttribute('href', 'https://www.linkedin.com/in/skekram/');
  });

  it('renders login form correctly with email and password fields, and toggles password visibility', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Login />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Sign In to PayFlow/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/admin@payflow.internal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();

    const pwdInput = screen.getByPlaceholderText('••••••••');
    expect(pwdInput).toHaveAttribute('type', 'password');

    const eyeBtn = screen.getByRole('button', { name: /Show password/i });
    expect(eyeBtn).toBeInTheDocument();

    fireEvent.click(eyeBtn);
    expect(pwdInput).toHaveAttribute('type', 'text');

    fireEvent.click(eyeBtn);
    expect(pwdInput).toHaveAttribute('type', 'password');
  });

  it('renders registration form with password length guidance and eye button', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Register />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Create PayFlow Account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Jane Doe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete Registration/i })).toBeInTheDocument();

    const pwdInput = screen.getByPlaceholderText(/Min 8 characters/i);
    expect(pwdInput).toHaveAttribute('type', 'password');

    const eyeBtn = screen.getByRole('button', { name: /Show password/i });
    fireEvent.click(eyeBtn);
    expect(pwdInput).toHaveAttribute('type', 'text');
  });
});
