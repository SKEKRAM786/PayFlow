package com.payflow.controller;

import com.payflow.dto.response.TransactionDetailResponse;
import com.payflow.enums.TransactionStatus;
import com.payflow.enums.TransactionType;
import com.payflow.security.UserPrincipal;
import com.payflow.service.TransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@Tag(name = "Transactions", description = "Immutable transaction ledger, searchable history, and audit trail")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    @Operation(summary = "Get paginated transactions", description = "Search and filter immutable financial transactions with customer, date range, status, and currency filters.")
    public ResponseEntity<Page<TransactionDetailResponse>> getTransactions(
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) TransactionStatus status,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(transactionService.getTransactions(type, status, currency, customerId, startDate, endDate, search, pageable, principal));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transaction by ID", description = "Retrieves full transaction metadata and parent payment details.")
    public ResponseEntity<TransactionDetailResponse> getTransactionById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(transactionService.getTransactionById(id, principal));
    }

    @GetMapping("/reference/{reference}")
    @Operation(summary = "Get transaction by Reference", description = "Query immutable transaction by unique reference key.")
    public ResponseEntity<TransactionDetailResponse> getTransactionByReference(
            @PathVariable String reference,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(transactionService.getTransactionByReference(reference, principal));
    }

    @GetMapping("/payment/{paymentId}")
    @Operation(summary = "Get transactions by Payment ID", description = "Returns chronological event ledger for a specific payment.")
    public ResponseEntity<List<TransactionDetailResponse>> getTransactionsByPayment(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(transactionService.getTransactionsByPaymentId(paymentId, principal));
    }
}
