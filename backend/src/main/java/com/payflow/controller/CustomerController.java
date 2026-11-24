package com.payflow.controller;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerStatusRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.enums.CustomerStatus;
import com.payflow.security.UserPrincipal;
import com.payflow.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customers", description = "Customer onboarding, query, profile updates and status management")
@SecurityRequirement(name = "bearerAuth")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @PostMapping
    @Operation(summary = "Create a customer", description = "Creates a new customer profile associated with the authenticated user.")
    public ResponseEntity<CustomerResponse> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.createCustomer(request, principal));
    }

    @GetMapping
    @Operation(summary = "Get paginated customers", description = "Search, filter by status, sort and paginate customer records.")
    public ResponseEntity<Page<CustomerResponse>> getCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CustomerStatus status,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(customerService.getCustomers(search, status, pageable, principal));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get customer by ID", description = "Retrieves customer profile with ownership permission verification.")
    public ResponseEntity<CustomerResponse> getCustomerById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(customerService.getCustomerById(id, principal));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer", description = "Updates customer name, email and phone number.")
    public ResponseEntity<CustomerResponse> updateCustomer(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(customerService.updateCustomer(id, request, principal));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Change customer status (Admin only)", description = "Activates or deactivates a customer profile.")
    public ResponseEntity<CustomerResponse> updateCustomerStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCustomerStatusRequest request) {
        return ResponseEntity.ok(customerService.updateCustomerStatus(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete / Deactivate customer", description = "Safely deactivates customer; rejects deletion if payment history exists.")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        customerService.deleteCustomer(id, principal);
        return ResponseEntity.noContent().build();
    }
}
