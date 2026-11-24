package com.payflow.controller;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.enums.PaymentStatus;
import com.payflow.security.UserPrincipal;
import com.payflow.service.PaymentService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Payment lifecycle engine: creation, authorization, capture, and cancellation")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @Operation(summary = "Create payment", description = "Creates a payment in PENDING status. Idempotent by idempotencyKey.")
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPayment(request, principal));
    }

    @PostMapping("/{id}/authorize")
    @Operation(summary = "Authorize payment", description = "Sends payment to simulated provider adapter for authorization.")
    public ResponseEntity<PaymentResponse> authorizePayment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(paymentService.authorizePayment(id, principal));
    }

    @PostMapping("/{id}/capture")
    @Operation(summary = "Capture payment", description = "Settles and captures an authorized payment into CAPTURED status.")
    public ResponseEntity<PaymentResponse> capturePayment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(paymentService.capturePayment(id, principal));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel payment", description = "Cancels a pending or authorized payment; rejects cancellation of captured payments.")
    public ResponseEntity<PaymentResponse> cancelPayment(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(paymentService.cancelPayment(id, principal));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID", description = "Retrieves payment details and associated transaction history.")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(paymentService.getPaymentById(id, principal));
    }

    @GetMapping
    @Operation(summary = "Get paginated payments", description = "Search by reference, filter by status, currency, and customer. Customer-restricted.")
    public ResponseEntity<Page<PaymentResponse>> getPayments(
            @RequestParam(required = false) String reference,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) UUID customerId,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(paymentService.getPayments(reference, status, currency, customerId, pageable, principal));
    }
}
