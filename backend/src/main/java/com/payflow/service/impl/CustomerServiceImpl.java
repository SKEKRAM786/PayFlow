package com.payflow.service.impl;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerStatusRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.entity.Customer;
import com.payflow.entity.User;
import com.payflow.enums.CustomerStatus;
import com.payflow.enums.UserRole;
import com.payflow.exception.BusinessRuleException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.UserRepository;
import com.payflow.security.UserPrincipal;
import com.payflow.service.CustomerService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    public CustomerServiceImpl(CustomerRepository customerRepository,
                               UserRepository userRepository,
                               PaymentRepository paymentRepository) {
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional
    public CustomerResponse createCustomer(CreateCustomerRequest request, UserPrincipal principal) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (customerRepository.existsByEmail(normalizedEmail)) {
            throw new BusinessRuleException("A customer with email " + normalizedEmail + " already exists.");
        }

        User user = null;
        if (principal != null) {
            user = userRepository.findById(principal.getId()).orElse(null);
        }

        Customer customer = new Customer(
                request.fullName().trim(),
                normalizedEmail,
                request.phoneNumber() != null ? request.phoneNumber().trim() : null,
                user
        );

        Customer saved = customerRepository.save(customer);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getCustomers(String search, CustomerStatus status, Pageable pageable, UserPrincipal principal) {
        // Customer role can only see their own customer profile
        if (isCustomerRole(principal)) {
            return customerRepository.findByUserId(principal.getId())
                    .map(c -> (Page<CustomerResponse>) new PageImpl<CustomerResponse>(List.of(mapToResponse(c)), pageable, 1))
                    .orElseGet(() -> Page.empty(pageable));
        }

        String queryParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return customerRepository.searchCustomers(queryParam, status, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(UUID id, UserPrincipal principal) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        assertOwnershipOrAdmin(customer, principal);
        return mapToResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomer(UUID id, UpdateCustomerRequest request, UserPrincipal principal) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        assertOwnershipOrAdmin(customer, principal);

        String normalizedEmail = request.email().trim().toLowerCase();
        if (customerRepository.existsByEmailAndIdNot(normalizedEmail, id)) {
            throw new BusinessRuleException("Another customer with email " + normalizedEmail + " already exists.");
        }

        customer.setFullName(request.fullName().trim());
        customer.setEmail(normalizedEmail);
        customer.setPhoneNumber(request.phoneNumber() != null ? request.phoneNumber().trim() : null);

        Customer updated = customerRepository.save(customer);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomerStatus(UUID id, UpdateCustomerStatusRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        customer.setStatus(request.status());
        Customer updated = customerRepository.save(customer);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCustomer(UUID id, UserPrincipal principal) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        assertOwnershipOrAdmin(customer, principal);

        // Safe soft-delete: Check if payment history exists
        if (customer.getPayments() != null && !customer.getPayments().isEmpty()) {
            throw new BusinessRuleException(
                    "Customer has existing payments and cannot be deleted. Deactivate customer instead."
            );
        }

        // Also deactivate to prevent cascading data loss
        customer.setStatus(CustomerStatus.INACTIVE);
        customerRepository.save(customer);
    }

    private void assertOwnershipOrAdmin(Customer customer, UserPrincipal principal) {
        if (principal == null) return;
        boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOperations = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATIONS"));
        boolean isOwner = customer.getUser() != null && customer.getUser().getId().equals(principal.getId());

        if (!isAdmin && !isOperations && !isOwner) {
            throw new AccessDeniedException("You do not have permission to access or modify this customer profile.");
        }
    }

    private boolean isCustomerRole(UserPrincipal principal) {
        if (principal == null) return false;
        boolean hasAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean hasOperations = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OPERATIONS"));
        return !hasAdmin && !hasOperations;
    }

    private CustomerResponse mapToResponse(Customer customer) {
        long paymentCount = customer.getPayments() != null ? customer.getPayments().size() : 0L;
        return new CustomerResponse(
                customer.getId(),
                customer.getFullName(),
                customer.getEmail(),
                customer.getPhoneNumber(),
                customer.getStatus(),
                customer.getUser() != null ? customer.getUser().getId() : null,
                paymentCount,
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}
