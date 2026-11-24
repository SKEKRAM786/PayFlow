package com.payflow.service.impl;

import com.payflow.dto.response.TransactionDetailResponse;
import com.payflow.entity.Customer;
import com.payflow.entity.Payment;
import com.payflow.entity.PaymentTransaction;
import com.payflow.enums.TransactionStatus;
import com.payflow.enums.TransactionType;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.PaymentTransactionRepository;
import com.payflow.security.UserPrincipal;
import com.payflow.service.TransactionService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final PaymentTransactionRepository transactionRepository;
    private final PaymentRepository paymentRepository;
    private final CustomerRepository customerRepository;

    public TransactionServiceImpl(PaymentTransactionRepository transactionRepository,
                                  PaymentRepository paymentRepository,
                                  CustomerRepository customerRepository) {
        this.transactionRepository = transactionRepository;
        this.paymentRepository = paymentRepository;
        this.customerRepository = customerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionDetailResponse> getTransactions(
            TransactionType type,
            TransactionStatus status,
            String currency,
            Instant startDate,
            Instant endDate,
            String search,
            Pageable pageable,
            UserPrincipal principal) {
        return getTransactions(type, status, currency, null, startDate, endDate, search, pageable, principal);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TransactionDetailResponse> getTransactions(
            TransactionType type,
            TransactionStatus status,
            String currency,
            UUID customerId,
            Instant startDate,
            Instant endDate,
            String search,
            Pageable pageable,
            UserPrincipal principal) {

        UUID customerIdFilter = null;
        if (isCustomerRole(principal)) {
            Customer customer = customerRepository.findByUserId(principal.getId()).orElse(null);
            if (customer == null) {
                return Page.empty(pageable);
            }
            customerIdFilter = customer.getId();
        } else if (customerId != null) {
            customerIdFilter = customerId;
        }

        String searchCurr = (currency != null && !currency.trim().isEmpty()) ? currency.trim().toUpperCase() : null;
        String searchTerm = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return transactionRepository.searchTransactions(
                customerIdFilter, type, status, searchCurr, startDate, endDate, searchTerm, pageable
        ).map(this::mapToDetailResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDetailResponse getTransactionById(UUID id, UserPrincipal principal) {
        PaymentTransaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + id));

        assertTransactionAccess(tx, principal);
        return mapToDetailResponse(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public TransactionDetailResponse getTransactionByReference(String reference, UserPrincipal principal) {
        PaymentTransaction tx = transactionRepository.findByTransactionReference(reference.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with reference: " + reference));

        assertTransactionAccess(tx, principal);
        return mapToDetailResponse(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionDetailResponse> getTransactionsByPaymentId(UUID paymentId, UserPrincipal principal) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        assertPaymentAccess(payment, principal);

        return transactionRepository.findByPaymentIdOrderByCreatedAtDesc(paymentId)
                .stream()
                .map(this::mapToDetailResponse)
                .toList();
    }

    private void assertTransactionAccess(PaymentTransaction tx, UserPrincipal principal) {
        assertPaymentAccess(tx.getPayment(), principal);
    }

    private void assertPaymentAccess(Payment payment, UserPrincipal principal) {
        if (principal == null) return;
        boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOperations = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATIONS"));
        boolean isOwner = payment.getCustomer().getUser() != null &&
                payment.getCustomer().getUser().getId().equals(principal.getId());

        if (!isAdmin && !isOperations && !isOwner) {
            throw new AccessDeniedException("Access denied: You do not have permission to view this transaction record.");
        }
    }

    private boolean isCustomerRole(UserPrincipal principal) {
        if (principal == null) return false;
        boolean hasAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOperations = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATIONS"));
        return !hasAdmin && !hasOperations;
    }

    private TransactionDetailResponse mapToDetailResponse(PaymentTransaction tx) {
        Payment p = tx.getPayment();
        Customer c = p.getCustomer();
        return new TransactionDetailResponse(
                tx.getId(),
                tx.getTransactionReference(),
                tx.getProviderReference(),
                tx.getTransactionType(),
                tx.getTransactionStatus(),
                tx.getAmount(),
                tx.getCurrency(),
                tx.getDescription(),
                p.getId(),
                p.getPaymentReference(),
                p.getPaymentStatus(),
                p.getPaymentMethod(),
                c.getId(),
                c.getFullName(),
                tx.getCreatedAt()
        );
    }
}
