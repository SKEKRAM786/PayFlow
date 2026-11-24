package com.payflow.controller;

import com.payflow.dto.response.ReconciliationRecordResponse;
import com.payflow.dto.response.ReconciliationSummaryResponse;
import com.payflow.dto.response.SettlementBatchResponse;
import com.payflow.enums.ReconciliationStatus;
import com.payflow.service.ReconciliationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/reconciliation")
@Tag(name = "Reconciliation", description = "Financial settlement CSV import, automated ledger matching, and variance reporting")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'OPERATIONS')")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;

    public ReconciliationController(ReconciliationService reconciliationService) {
        this.reconciliationService = reconciliationService;
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import settlement CSV", description = "Uploads external bank settlement CSV for matching against internal transactions.")
    public ResponseEntity<SettlementBatchResponse> importSettlementCsv(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reconciliationService.importSettlementCsv(file));
    }

    @PostMapping("/run")
    @Operation(summary = "Execute reconciliation batch", description = "Matches external settlement records with internal transaction ledger.")
    public ResponseEntity<SettlementBatchResponse> runReconciliation(@RequestParam UUID batchId) {
        return ResponseEntity.ok(reconciliationService.runReconciliation(batchId));
    }

    @GetMapping
    @Operation(summary = "Get reconciliation records", description = "Paginated discrepancy and match records with status and search filters.")
    public ResponseEntity<Page<ReconciliationRecordResponse>> getRecords(
            @RequestParam(required = false) UUID batchId,
            @RequestParam(required = false) ReconciliationStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 15, sort = "reconciledAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reconciliationService.getReconciliationRecords(batchId, status, search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get reconciliation record by ID", description = "Detailed match/mismatch record.")
    public ResponseEntity<ReconciliationRecordResponse> getRecordById(@PathVariable UUID id) {
        return ResponseEntity.ok(reconciliationService.getReconciliationRecordById(id));
    }

    @GetMapping("/batches")
    @Operation(summary = "List settlement batches", description = "Paginated list of all imported settlement batches.")
    public ResponseEntity<Page<SettlementBatchResponse>> getBatches(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reconciliationService.getBatches(pageable));
    }

    @GetMapping("/batches/{batchId}")
    @Operation(summary = "Get settlement batch details", description = "Batch metadata, total records, and processing counts.")
    public ResponseEntity<SettlementBatchResponse> getBatchById(@PathVariable UUID batchId) {
        return ResponseEntity.ok(reconciliationService.getBatchById(batchId));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get reconciliation metrics summary", description = "Aggregated counts of matched, amount mismatch, and missing records.")
    public ResponseEntity<ReconciliationSummaryResponse> getSummary() {
        return ResponseEntity.ok(reconciliationService.getSummary());
    }

    @GetMapping("/export")
    @Operation(summary = "Export reconciliation CSV report", description = "Streams downloadable CSV containing reconciliation findings.")
    public ResponseEntity<byte[]> exportCsv(@RequestParam(required = false) UUID batchId) {
        byte[] csvBytes = reconciliationService.exportReconciliationCsv(batchId);
        String filename = "reconciliation_report_" + System.currentTimeMillis() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }
}
