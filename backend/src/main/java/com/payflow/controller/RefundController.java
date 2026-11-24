package com.payflow.controller;

import com.payflow.dto.request.CreateRefundRequest;
import com.payflow.dto.response.RefundResponse;
import com.payflow.dto.response.RefundableBalanceResponse;
import com.payflow.enums.RefundStatus;
import com.payflow.security.UserPrincipal;
import com.payflow.service.RefundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@Tag(name = "Refunds", description = "Refund management: full/partial refunds, balance tracking and history")
@SecurityRequirement(name = "bearerAuth")
public class RefundController {

    private final RefundService refundService;

    public RefundController(RefundService refundService) {
        this.refundService = refundService;
    }

    @PostMapping("/payments/{paymentId}/refunds")
    @Operation(summary = "Process refund", description = "Initiate a full or partial refund for a captured payment. Idempotent.")
    public ResponseEntity<RefundResponse> processRefund(
            @PathVariable UUID paymentId,
            @Valid @RequestBody CreateRefundRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(refundService.processRefund(paymentId, request, principal));
    }

    @GetMapping("/payments/{paymentId}/refundable-amount")
    @Operation(summary = "Get refundable balance", description = "Calculates remaining refundable amount for a payment.")
    public ResponseEntity<RefundableBalanceResponse> getRefundableBalance(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(refundService.getRefundableBalance(paymentId, principal));
    }

    @GetMapping("/payments/{paymentId}/refunds")
    @Operation(summary = "Get refunds by payment", description = "List all refunds associated with a given payment ID.")
    public ResponseEntity<List<RefundResponse>> getRefundsByPayment(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(refundService.getRefundsByPaymentId(paymentId, principal));
    }

    @GetMapping("/refunds")
    @Operation(summary = "Get paginated refund history", description = "Search and filter refunds by status, currency, and date range.")
    public ResponseEntity<Page<RefundResponse>> getRefunds(
            @RequestParam(required = false) RefundStatus status,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(refundService.getRefunds(status, currency, startDate, endDate, search, pageable, principal));
    }

    @GetMapping("/refunds/{refundId}")
    @Operation(summary = "Get refund by ID", description = "Retrieve full refund record.")
    public ResponseEntity<RefundResponse> getRefundById(
            @PathVariable UUID refundId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(refundService.getRefundById(refundId, principal));
    }
}
