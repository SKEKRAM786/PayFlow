/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PaymentManager from '../components/PaymentManager';
import { AuthProvider } from '../context/AuthContext';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getPayments: vi.fn().mockResolvedValue({
      content: [
        {
          id: 'p1111111-1111-1111-1111-111111111111',
          paymentReference: 'PAY-USD-99001',
          customerName: 'Global Logistics',
          amount: 1500.00,
          currency: 'USD',
          paymentMethod: 'CARD_SIMULATED',
          paymentStatus: 'CAPTURED',
          createdAt: new Date().toISOString()
        }
      ],
      totalElements: 1,
      totalPages: 1
    }),
    getCustomers: vi.fn().mockResolvedValue({ content: [] })
  };
});

describe('PaymentManager Component Tests', () => {
  it('renders payments list and lifecycle statuses', async () => {
    render(
      <AuthProvider>
        <PaymentManager />
      </AuthProvider>
    );

    expect(screen.getByText(/\+ Process Payment/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('PAY-USD-99001')).toBeInTheDocument();
      expect(screen.getByText(/Global Logistics/i)).toBeInTheDocument();
      expect(screen.getAllByText('CAPTURED').length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });
});
