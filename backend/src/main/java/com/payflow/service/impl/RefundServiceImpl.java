package com.payflow.service.impl;

import com.payflow.dto.request.CreateRefundRequest;
import com.payflow.dto.response.RefundResponse;
import com.payflow.dto.response.RefundableBalanceResponse;
import com.payflow.entity.Customer;
import com.payflow.entity.Payment;
import com.payflow.entity.PaymentTransaction;
import com.payflow.entity.Refund;
import com.payflow.enums.PaymentStatus;
import com.payflow.enums.RefundStatus;
import com.payflow.enums.TransactionStatus;
import com.payflow.enums.TransactionType;
import com.payflow.exception.BusinessRuleException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.provider.PaymentProvider;
import com.payflow.provider.ProviderPaymentResult;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.PaymentTransactionRepository;
import com.payflow.repository.RefundRepository;
import com.payflow.security.UserPrincipal;
import com.payflow.service.RefundService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository transactionRepository;
    private final CustomerRepository customerRepository;
    private final PaymentProvider paymentProvider;

    public RefundServiceImpl(RefundRepository refundRepository,
                             PaymentRepository paymentRepository,
                             PaymentTransactionRepository transactionRepository,
                             CustomerRepository customerRepository,
                             PaymentProvider paymentProvider) {
        this.refundRepository = refundRepository;
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.customerRepository = customerRepository;
        this.paymentProvider = paymentProvider;
    }

    @Override
    @Transactional
    public RefundResponse processRefund(UUID paymentId, CreateRefundRequest request, UserPrincipal principal) {
        // 1. Idempotency Check: Return existing refund if idempotency key was previously processed
        Optional<Refund> existing = refundRepository.findByIdempotencyKey(request.idempotencyKey().trim());
        if (existing.isPresent()) {
            Refund r = existing.get();
            assertPaymentAccess(r.getPayment(), principal);
            return mapToResponse(r);
        }

        // 2. Fetch Payment & Assert Access
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        assertPaymentAccess(payment, principal);

        // 3. Status Eligibility: Only CAPTURED payments can be refunded
        if (payment.getPaymentStatus() != PaymentStatus.CAPTURED) {
            throw new BusinessRuleException(
                    "Payment in status " + payment.getPaymentStatus() + " is not eligible for refund. Only CAPTURED payments can be refunded."
            );
        }

        BigDecimal requestedAmount = request.amount().setScale(4, RoundingMode.HALF_UP);
        if (requestedAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Refund amount must be strictly greater than zero.");
        }

        // 4. Balance Limit Enforcement: Calculate remaining refundable balance
        BigDecimal alreadyCommitted = refundRepository.sumCommittedRefundsByPaymentId(paymentId);
        BigDecimal remainingBalance = payment.getAmount().subtract(alreadyCommitted);

        if (requestedAmount.compareTo(remainingBalance) > 0) {
            throw new BusinessRuleException(
                    String.format("Refund amount (%s %s) exceeds available refundable balance (%s %s).",
                            requestedAmount, payment.getCurrency(), remainingBalance, payment.getCurrency())
            );
        }

        // 5. Generate Unique Refund Reference
        String refundRef = "REF-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

        Refund refund = new Refund(
                payment,
                refundRef,
                request.idempotencyKey().trim(),
                requestedAmount,
                request.reason().trim()
        );
        refund.setRefundStatus(RefundStatus.PENDING);
        Refund savedRefund = refundRepository.save(refund);

        // 6. Invoke Payment Provider Simulator for Settlement
        ProviderPaymentResult result = paymentProvider.refund(payment, requestedAmount, request.reason());

        // 7. Record Immutable PaymentTransaction
        PaymentTransaction tx = new PaymentTransaction(
                payment,
                "TX-" + refundRef,
                result.providerReference(),
                TransactionType.REFUND,
                result.success() ? TransactionStatus.SUCCESS : TransactionStatus.FAILED,
                requestedAmount,
                payment.getCurrency(),
                request.reason()
        );
        PaymentTransaction savedTx = transactionRepository.save(tx);
        if (payment.getTransactions() == null) {
            payment.setTransactions(new java.util.ArrayList<>());
        }
        payment.getTransactions().add(savedTx);

        // 8. Update Refund Status
        savedRefund.setTransaction(savedTx);
        if (result.success()) {
            savedRefund.setRefundStatus(RefundStatus.COMPLETED);
        } else {
            savedRefund.setRefundStatus(RefundStatus.FAILED);
        }

        Refund finalizedRefund = refundRepository.save(savedRefund);
        return mapToResponse(finalizedRefund);
    }

    @Override
    @Transactional(readOnly = true)
    public RefundableBalanceResponse getRefundableBalance(UUID paymentId, UserPrincipal principal) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        assertPaymentAccess(payment, principal);

        BigDecimal totalCaptured = (payment.getPaymentStatus() == PaymentStatus.CAPTURED) ?
                payment.getAmount() : BigDecimal.ZERO;
        BigDecimal completedRefunds = refundRepository.sumCompletedRefundsByPaymentId(paymentId);
        BigDecimal remaining = totalCaptured.subtract(completedRefunds).max(BigDecimal.ZERO);

        return new RefundableBalanceResponse(
                payment.getId(),
                payment.getPaymentReference(),
                totalCaptured,
                completedRefunds,
                remaining,
                payment.getCurrency()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public RefundResponse getRefundById(UUID refundId, UserPrincipal principal) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found with id: " + refundId));
        assertPaymentAccess(refund.getPayment(), principal);
        return mapToResponse(refund);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponse> getRefundsByPaymentId(UUID paymentId, UserPrincipal principal) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        assertPaymentAccess(payment, principal);

        return refundRepository.findByPaymentIdOrderByCreatedAtDesc(paymentId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RefundResponse> getRefunds(RefundStatus status, String currency, Instant startDate, Instant endDate, String search, Pageable pageable, UserPrincipal principal) {
        UUID customerIdFilter = null;
        if (isCustomerRole(principal)) {
            Customer customer = customerRepository.findByUserId(principal.getId()).orElse(null);
            if (customer == null) {
                return Page.empty(pageable);
            }
            customerIdFilter = customer.getId();
        }

        String searchCurr = (currency != null && !currency.trim().isEmpty()) ? currency.trim().toUpperCase() : null;
        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return refundRepository.searchRefunds(customerIdFilter, status, searchCurr, startDate, endDate, searchTerm, pageable)
                .map(this::mapToResponse);
    }

    private void assertPaymentAccess(Payment payment, UserPrincipal principal) {
        if (principal == null) return;
        boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOperations = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATIONS"));
        boolean isOwner = payment.getCustomer().getUser() != null &&
                payment.getCustomer().getUser().getId().equals(principal.getId());

        if (!isAdmin && !isOperations && !isOwner) {
            throw new AccessDeniedException("Access denied: You do not have permission to view or refund this payment.");
        }
    }

    private boolean isCustomerRole(UserPrincipal principal) {
        if (principal == null) return false;
        boolean hasAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOperations = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATIONS"));
        return !hasAdmin && !hasOperations;
    }

    private RefundResponse mapToResponse(Refund refund) {
        Payment p = refund.getPayment();
        PaymentTransaction tx = refund.getTransaction();
        return new RefundResponse(
                refund.getId(),
                refund.getRefundReference(),
                p.getId(),
                p.getPaymentReference(),
                tx != null ? tx.getId() : null,
                tx != null ? tx.getTransactionReference() : null,
                refund.getRefundAmount(),
                p.getCurrency(),
                refund.getRefundReason(),
                refund.getRefundStatus(),
                refund.getIdempotencyKey(),
                refund.getCreatedAt(),
                refund.getUpdatedAt()
        );
    }
}
