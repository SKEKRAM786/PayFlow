package com.payflow.service.impl;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.TransactionResponse;
import com.payflow.entity.Customer;
import com.payflow.entity.Payment;
import com.payflow.entity.PaymentTransaction;
import com.payflow.enums.CustomerStatus;
import com.payflow.enums.PaymentStatus;
import com.payflow.enums.TransactionStatus;
import com.payflow.enums.TransactionType;
import com.payflow.exception.BusinessRuleException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.provider.PaymentProvider;
import com.payflow.provider.ProviderPaymentResult;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.PaymentTransactionRepository;
import com.payflow.security.UserPrincipal;
import com.payflow.service.PaymentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final PaymentProvider paymentProvider;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              CustomerRepository customerRepository,
                              PaymentTransactionRepository transactionRepository,
                              PaymentProvider paymentProvider) {
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
        this.transactionRepository = transactionRepository;
        this.paymentProvider = paymentProvider;
    }

    @Override
    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request, UserPrincipal principal) {
        // Idempotency check: Return existing payment if idempotency key was previously processed
        Optional<Payment> existing = paymentRepository.findByIdempotencyKey(request.idempotencyKey().trim());
        if (existing.isPresent()) {
            Payment p = existing.get();
            assertPaymentAccess(p, principal);
            return mapToResponse(p);
        }

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.customerId()));

        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new BusinessRuleException("Cannot initiate payment for inactive customer.");
        }

        assertCustomerOwnership(customer, principal);

        BigDecimal roundedAmount = request.amount().setScale(4, RoundingMode.HALF_UP);
        if (roundedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Payment amount must be strictly greater than zero.");
        }

        Payment payment = new Payment(
                customer,
                roundedAmount,
                request.currency().trim().toUpperCase(),
                request.paymentMethod(),
                request.idempotencyKey().trim(),
                request.description()
        );

        String paymentRef = "PAY-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        payment.setPaymentReference(paymentRef);
        payment.setPaymentStatus(PaymentStatus.PENDING);

        Payment saved = paymentRepository.save(payment);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public PaymentResponse authorizePayment(UUID paymentId, UserPrincipal principal) {
        Payment payment = getAndAssertPayment(paymentId, principal);

        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new BusinessRuleException(
                    "Invalid state transition: Cannot authorize payment in status " + payment.getPaymentStatus()
            );
        }

        ProviderPaymentResult result = paymentProvider.authorize(payment);

        PaymentTransaction tx = new PaymentTransaction(
                payment,
                result.providerReference(),
                TransactionType.AUTHORIZATION,
                result.success() ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                payment.getAmount(),
                payment.getCurrency()
        );
        PaymentTransaction savedTx = transactionRepository.save(tx);
        if (payment.getTransactions() == null) {
            payment.setTransactions(new java.util.ArrayList<>());
        }
        payment.getTransactions().add(savedTx);

        if (result.success()) {
            payment.setPaymentStatus(PaymentStatus.AUTHORIZED);
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
        }

        Payment updated = paymentRepository.save(payment);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public PaymentResponse capturePayment(UUID paymentId, UserPrincipal principal) {
        Payment payment = getAndAssertPayment(paymentId, principal);

        if (payment.getPaymentStatus() != PaymentStatus.AUTHORIZED) {
            throw new BusinessRuleException(
                    "Invalid state transition: Payment must be AUTHORIZED before capture. Current status: " + payment.getPaymentStatus()
            );
        }

        ProviderPaymentResult result = paymentProvider.capture(payment);

        PaymentTransaction tx = new PaymentTransaction(
                payment,
                result.providerReference(),
                TransactionType.CAPTURE,
                result.success() ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                payment.getAmount(),
                payment.getCurrency()
        );
        PaymentTransaction savedTx = transactionRepository.save(tx);
        if (payment.getTransactions() == null) {
            payment.setTransactions(new java.util.ArrayList<>());
        }
        payment.getTransactions().add(savedTx);

        if (result.success()) {
            payment.setPaymentStatus(PaymentStatus.CAPTURED);
        } else {
            payment.setPaymentStatus(PaymentStatus.FAILED);
        }

        Payment updated = paymentRepository.save(payment);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public PaymentResponse cancelPayment(UUID paymentId, UserPrincipal principal) {
        Payment payment = getAndAssertPayment(paymentId, principal);

        if (payment.getPaymentStatus() == PaymentStatus.CAPTURED) {
            throw new BusinessRuleException("Captured payments cannot be cancelled. Initiate a refund instead.");
        }

        if (payment.getPaymentStatus() == PaymentStatus.CANCELLED || payment.getPaymentStatus() == PaymentStatus.FAILED) {
            throw new BusinessRuleException("Payment is already " + payment.getPaymentStatus());
        }

        ProviderPaymentResult result = paymentProvider.cancel(payment);

        PaymentTransaction tx = new PaymentTransaction(
                payment,
                result.providerReference(),
                TransactionType.CANCELLATION,
                TransactionStatus.SUCCESS,
                payment.getAmount(),
                payment.getCurrency()
        );
        PaymentTransaction savedTx = transactionRepository.save(tx);
        if (payment.getTransactions() == null) {
            payment.setTransactions(new java.util.ArrayList<>());
        }
        payment.getTransactions().add(savedTx);

        payment.setPaymentStatus(PaymentStatus.CANCELLED);
        Payment updated = paymentRepository.save(payment);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(UUID paymentId, UserPrincipal principal) {
        Payment payment = getAndAssertPayment(paymentId, principal);
        return mapToResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPayments(String reference, PaymentStatus status, String currency, Pageable pageable, UserPrincipal principal) {
        return getPayments(reference, status, currency, null, pageable, principal);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPayments(String reference, PaymentStatus status, String currency, UUID customerId, Pageable pageable, UserPrincipal principal) {
        UUID customerIdFilter = customerId;

        // If the authenticated user is a CUSTOMER, restrict to their customer record
        if (isCustomerRole(principal)) {
            Customer customer = customerRepository.findByUserId(principal.getId())
                    .orElse(null);
            if (customer == null) {
                return Page.empty(pageable);
            }
            customerIdFilter = customer.getId();
        }

        String searchRef = (reference != null && !reference.trim().isEmpty()) ? reference.trim() : null;
        String searchCurr = (currency != null && !currency.trim().isEmpty()) ? currency.trim().toUpperCase() : null;

        return paymentRepository.searchPayments(customerIdFilter, status, searchCurr, searchRef, pageable)
                .map(this::mapToResponse);
    }

    private Payment getAndAssertPayment(UUID paymentId, UserPrincipal principal) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        assertPaymentAccess(payment, principal);
        return payment;
    }

    private void assertPaymentAccess(Payment payment, UserPrincipal principal) {
        if (principal == null) return;
        boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOperations = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATIONS"));
        boolean isOwner = payment.getCustomer().getUser() != null &&
                payment.getCustomer().getUser().getId().equals(principal.getId());

        if (!isAdmin && !isOperations && !isOwner) {
            throw new AccessDeniedException("Access denied: You do not own this payment record.");
        }
    }

    private void assertCustomerOwnership(Customer customer, UserPrincipal principal) {
        if (principal == null) return;
        boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOperations = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATIONS"));
        boolean isOwner = customer.getUser() != null && customer.getUser().getId().equals(principal.getId());

        if (!isAdmin && !isOperations && !isOwner) {
            throw new AccessDeniedException("Cannot create payments for an unassociated customer.");
        }
    }

    private boolean isCustomerRole(UserPrincipal principal) {
        if (principal == null) return false;
        boolean hasAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOperations = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATIONS"));
        return !hasAdmin && !hasOperations;
    }

    private PaymentResponse mapToResponse(Payment payment) {
        List<TransactionResponse> txs = payment.getTransactions() != null ?
                payment.getTransactions().stream()
                        .map(t -> new TransactionResponse(
                                t.getId(),
                                t.getTransactionReference(),
                                t.getTransactionType(),
                                t.getTransactionStatus(),
                                t.getAmount(),
                                t.getCurrency(),
                                t.getCreatedAt()
                        ))
                        .toList() : List.of();

        return new PaymentResponse(
                payment.getId(),
                payment.getPaymentReference(),
                payment.getCustomer().getId(),
                payment.getCustomer().getFullName(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getPaymentMethod(),
                payment.getPaymentStatus(),
                payment.getIdempotencyKey(),
                payment.getDescription(),
                txs,
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }
}
