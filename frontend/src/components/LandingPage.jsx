import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  CreditCard,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  FileCheck2,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Lock,
  ArrowLeftRight,
  UserCheck
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Active step in the interactive "How PayFlow Works" pipeline
  const [activeStep, setActiveStep] = useState(0);

  // Workflow pipeline steps
  const steps = [
    {
      step: '01',
      title: 'Payment Order & Idempotency',
      subtitle: 'Client Initiates Transaction',
      description: 'The checkout client creates an order specifying amount, currency, and a unique idempotencyKey. PayFlow guarantees zero duplicate charges even across network timeouts and retries.',
      endpoint: 'POST /api/payments',
      status: 'PENDING',
      details: [
        'Idempotency key enforcement prevents duplicate debits',
        'Customer profile verification and isolated tenancy',
        'Initial order registered in PENDING status'
      ]
    },
    {
      step: '02',
      title: 'Provider Authorization',
      subtitle: 'Gateway Adapter Authorization',
      description: 'PayFlow invokes provider adapters (Simulated Card Rails, Bank Wire, or Crypto). Holds buyer funds and receives a unique provider transaction tracking reference.',
      endpoint: 'POST /api/payments/{id}/authorize',
      status: 'AUTHORIZED',
      details: [
        'Simulated network authorization with latency model',
        'Locks payment status to AUTHORIZED',
        'Records initial authorization entry in transaction ledger'
      ]
    },
    {
      step: '03',
      title: 'Settlement & Capture',
      subtitle: 'Funds Captured into Volume',
      description: 'Settles and captures the authorized transaction into active financial volume. Authorizations can be captured in full or voided before capture.',
      endpoint: 'POST /api/payments/{id}/capture',
      status: 'CAPTURED',
      details: [
        'Settles payment into active merchant ledger',
        'Precision monetary calculations using BigDecimal',
        'Locks captured funds and updates real-time analytics'
      ]
    },
    {
      step: '04',
      title: 'Ledger Journal & Reconciliation',
      subtitle: 'Immutable Ledger & Automated Matching',
      description: 'Every authorization, capture, void, and refund writes an immutable audit journal record into the Ledger. Bank clearing CSV statements are automatically matched against internal records.',
      endpoint: 'POST /api/reconciliation/import',
      status: 'MATCHED',
      details: [
        'Append-only double-entry transaction ledger',
        'Automatic discrepancy flagging for mismatches or missing records',
        'Real-time audit log tracking every user and system event'
      ]
    }
  ];

  // Auto-cycle through steps if user is not clicking
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', position: 'relative', overflowX: 'hidden' }}>
      {/* Background ambient lighting */}
      <div className="auth-ambient-bg" style={{ position: 'fixed' }} />
      <div className="auth-grid-pattern" style={{ position: 'fixed' }} />

      {/* Navigation Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        backgroundColor: theme === 'dark' ? 'rgba(9, 13, 22, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary), #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.1rem',
              boxShadow: '0 4px 10px rgba(59, 130, 246, 0.35)'
            }}>
              PF
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  PayFlow
                </span>
                <span className="brand-badge">Enterprise 2.0</span>
              </div>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }} className="desktop-nav">
            <a href="#how-it-works" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              How It Works
            </a>
            <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500 }}>
              Platform Features
            </a>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isAuthenticated ? (
              <Link to="/payments" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                Open Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary btn-sm" style={{ padding: '0.5rem 0.95rem', fontWeight: 600 }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ padding: '0.5rem 1rem' }}>
                  Get Started →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ position: 'relative', zIndex: 10 }}>
        {/* Hero Section */}
        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '4.5rem 1.5rem 3.5rem 1.5rem', textAlign: 'center' }}>
          <div className="landing-hero-badge animate-float">
            <span>⚡ Java 21 & Spring Boot 3</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>React Enterprise Payment Infrastructure</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.75rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 auto 1.5rem auto',
            maxWidth: 960,
            color: 'var(--text-main)'
          }}>
            Idempotent Payment Orchestration, <span style={{ color: 'var(--primary)' }}>Immutable Ledger</span> & Automated Settlement
          </h1>

          <p style={{
            fontSize: '1.125rem',
            lineHeight: 1.6,
            color: 'var(--text-muted)',
            maxWidth: 780,
            margin: '0 auto 2.5rem auto'
          }}>
            PayFlow is an enterprise payment processing engine built for financial reliability. It provides end-to-end payment lifecycles, simulated adapter authorization, double-entry ledger journals, and automated bank reconciliation with zero duplicate debits.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            <Link
              to={isAuthenticated ? '/payments' : '/login'}
              className="btn btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>{isAuthenticated ? 'Go to Payment Console' : 'Launch Platform Demo'}</span>
              <ArrowRight size={18} />
            </Link>

            <a
              href="#how-it-works"
              className="btn-secondary"
              style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              <span>How It Works ↓</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            maxWidth: 1000,
            margin: '0 auto',
            textAlign: 'left'
          }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Financial Precision</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem' }}>BigDecimal Math</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Zero floating-point rounding errors</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Execution Safety</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.25rem' }}>100% Idempotent</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Unique idempotency key guardrails</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Ledger Guarantee</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>Append-Only</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Immutable double-entry journal</div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Settlement Check</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)', marginTop: '0.25rem' }}>Automated CSV</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Bank clearing statement reconciliation</div>
            </div>
          </div>
        </section>

        {/* Section: Interactive "How PayFlow Works" Pipeline */}
        <section id="how-it-works" style={{ maxWidth: 1180, margin: '0 auto', padding: '3.5rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="brand-badge" style={{ marginBottom: '0.75rem' }}>Interactive Pipeline</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              How PayFlow Processes a Financial Flow
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 640, margin: '0 auto', fontSize: '0.95rem' }}>
              Explore the exact 4-stage lifecycle of every payment order from client initiation to double-entry ledger settlement.
            </p>
          </div>

          {/* Stepper Navigation Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {steps.map((st, idx) => (
              <div
                key={st.step}
                className={`step-card ${activeStep === idx ? 'active' : ''}`}
                onClick={() => setActiveStep(idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                    PHASE {st.step}
                  </span>
                  <span className={`badge ${activeStep === idx ? 'up' : 'badge-secondary'}`}>
                    {st.status}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {st.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {st.subtitle}
                </div>
              </div>
            ))}
          </div>

          {/* Active Step Detailed Simulation Box */}
          <div className="card" style={{
            padding: '2rem',
            backgroundColor: 'var(--bg-modal)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span className="brand-badge" style={{ fontSize: '0.85rem' }}>
                  {steps[activeStep].endpoint}
                </span>
                <span className="badge up">
                  Status: {steps[activeStep].status}
                </span>
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                {steps[activeStep].title}
              </h3>

              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                {steps[activeStep].description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {steps[activeStep].details.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-main)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Live Terminal / JSON Preview */}
            <div style={{
              backgroundColor: '#090d16',
              borderRadius: '0.75rem',
              border: '1px solid #1e293b',
              padding: '1.25rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.825rem',
              color: '#f8fafc',
              overflowX: 'auto',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                </div>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>payflow-transaction.json</span>
              </div>

              <pre style={{ margin: 0, lineHeight: 1.5, color: '#38bdf8' }}>
{activeStep === 0 && `{
  "reference": "PAY-7008044F-D",
  "customerId": "1dbbf558-f895-45d8-9ede",
  "customerName": "Sk Ekram",
  "amount": 150.00,
  "currency": "USD",
  "status": "PENDING",
  "idempotencyKey": "idemp-1795489-x92",
  "createdAt": "2026-11-24T08:25:53Z"
}`}
{activeStep === 1 && `{
  "reference": "PAY-7008044F-D",
  "status": "AUTHORIZED",
  "authorizedAmount": 150.00,
  "provider": "SIMULATED_CARD_RAIL",
  "providerReference": "SIM-AUTH-90BC12",
  "journalEntry": {
    "type": "AUTHORIZATION",
    "status": "SUCCESS"
  }
}`}
{activeStep === 2 && `{
  "reference": "PAY-7008044F-D",
  "status": "CAPTURED",
  "capturedAmount": 150.00,
  "settlementCurrency": "USD",
  "remainingRefundable": 150.00,
  "journalEntry": {
    "type": "CAPTURE",
    "txRef": "SIM-CAP-68CDBA73-89B"
  }
}`}
{activeStep === 3 && `{
  "ledgerJournal": {
    "totalEvents": 2,
    "events": [
      { "type": "AUTHORIZATION", "status": "SUCCESS" },
      { "type": "CAPTURE", "status": "SUCCESS" }
    ]
  },
  "reconciliation": {
    "bankMatchStatus": "MATCHED",
    "discrepancy": 0.00
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* Section: Platform Features Grid */}
        <section id="features" style={{ maxWidth: 1180, margin: '0 auto', padding: '3.5rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="brand-badge" style={{ marginBottom: '0.75rem' }}>Enterprise Modules</span>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Full Suite of Financial Modules
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 640, margin: '0 auto', fontSize: '0.95rem' }}>
              Designed from the ground up for strict consistency, auditability, and regulatory compliance.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="landing-card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <CreditCard size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Payment Orchestration
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Full lifecycle state machine governing PENDING, AUTHORIZED, CAPTURED, CANCELLED, and FAILED payments with simulated card and wire network adapters.
              </p>
            </div>

            <div className="landing-card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <BookOpen size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Immutable Ledger Journal
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Dedicated financial ledger module recording every authorization, capture, and cancellation with multi-parameter filtering by customer, type, and date.
              </p>
            </div>

            <div className="landing-card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <FileCheck2 size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Automated Bank Reconciliation
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Upload external bank settlement CSV files. The engine compares external transactions with internal ledger records, highlighting matches and discrepancies.
              </p>
            </div>

            <div className="landing-card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <RefreshCw size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Partial & Full Refunds
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Calculate available refundable balances dynamically. Over-refunding is strictly prohibited and full refund audit trails are recorded.
              </p>
            </div>

            <div className="landing-card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(6, 182, 212, 0.12)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <TrendingUp size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Real-Time Analytics & KPIs
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Gross payment volume, net captured volume, refund ratios, success/failure status distributions, and payment trend breakdowns without hardcoded values.
              </p>
            </div>

            <div className="landing-card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <ShieldCheck size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Immutable Audit Logging
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Automatic tracking of all administrative actions, customer updates, login events, and transaction operations with correlation IDs and role security.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2.5rem 1.5rem', backgroundColor: 'var(--bg-sidebar)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
              PF
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              PayFlow Enterprise
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
              © {new Date().getFullYear()} PayFlow Platform
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Built by <strong style={{ color: 'var(--text-main)' }}>Sk Ekram</strong>
            </span>
            <a
              href="https://www.linkedin.com/in/skekram/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>LinkedIn</span>
              <ExternalLink size={13} />
            </a>
            <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
