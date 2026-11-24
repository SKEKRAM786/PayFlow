package com.payflow.service;

import com.payflow.dto.response.ReconciliationRecordResponse;
import com.payflow.dto.response.ReconciliationSummaryResponse;
import com.payflow.dto.response.SettlementBatchResponse;
import com.payflow.enums.ReconciliationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface ReconciliationService {
    SettlementBatchResponse importSettlementCsv(MultipartFile file);
    SettlementBatchResponse runReconciliation(UUID batchId);
    Page<ReconciliationRecordResponse> getReconciliationRecords(UUID batchId, ReconciliationStatus status, String search, Pageable pageable);
    ReconciliationRecordResponse getReconciliationRecordById(UUID id);
    Page<SettlementBatchResponse> getBatches(Pageable pageable);
    SettlementBatchResponse getBatchById(UUID batchId);
    ReconciliationSummaryResponse getSummary();
    byte[] exportReconciliationCsv(UUID batchId);
}
