/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerManager from '../components/CustomerManager';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getCustomers: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'c1111111-1111-1111-1111-111111111111',
          fullName: 'Acme Corp',
          email: 'finance@acme.com',
          phoneNumber: '+1-555-0199',
          status: 'ACTIVE',
          paymentCount: 2,
          createdAt: new Date().toISOString()
        }
      ],
      totalElements: 1,
      totalPages: 1
    }),
    createCustomer: vi.fn(),
    updateCustomer: vi.fn(),
    updateCustomerStatus: vi.fn(),
    deleteCustomer: vi.fn(),
    getPayments: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'p1111111-1111-1111-1111-111111111111',
          reference: 'PAY-SAMPLE-101',
          amount: 150.00,
          currency: 'USD',
          paymentMethod: 'CARD_SIMULATED',
          status: 'CAPTURED',
          createdAt: new Date().toISOString()
        }
      ],
      totalElements: 1,
      totalPages: 1
    }),
    createPayment: vi.fn(),
    authorizePayment: vi.fn(),
    capturePayment: vi.fn(),
    cancelPayment: vi.fn()
  };
});

describe('CustomerManager Component Tests', () => {
  it('renders customer list correctly with fetched records', async () => {
    render(
      <AuthProvider>
        <CustomerManager />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('finance@acme.com')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  it('opens Add Customer modal on button click', async () => {
    render(
      <AuthProvider>
        <CustomerManager />
      </AuthProvider>
    );

    const addBtn = screen.getByRole('button', { name: /\+ Add Customer/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/Onboard New Customer/i)).toBeInTheDocument();
  });

  it('opens Customer Transactions and History view when clicking Transactions & Pay', async () => {
    render(
      <AuthProvider>
        <CustomerManager />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    const txsBtn = screen.getByRole('button', { name: /Transactions & Pay/i });
    fireEvent.click(txsBtn);

    await waitFor(() => {
      expect(screen.getByText(/Make Payment Again/i)).toBeInTheDocument();
      expect(screen.getByText('PAY-SAMPLE-101')).toBeInTheDocument();
      expect(screen.getByText('150.00 USD')).toBeInTheDocument();
    });
  });
});
