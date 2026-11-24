package com.payflow.service.impl;

import com.payflow.dto.response.ReconciliationRecordResponse;
import com.payflow.dto.response.ReconciliationSummaryResponse;
import com.payflow.dto.response.SettlementBatchResponse;
import com.payflow.entity.PaymentTransaction;
import com.payflow.entity.ReconciliationRecord;
import com.payflow.entity.SettlementBatch;
import com.payflow.entity.SettlementRecord;
import com.payflow.enums.BatchStatus;
import com.payflow.enums.ReconciliationStatus;
import com.payflow.exception.BusinessRuleException;
import com.payflow.exception.ResourceNotFoundException;
import com.payflow.repository.PaymentTransactionRepository;
import com.payflow.repository.ReconciliationRecordRepository;
import com.payflow.repository.SettlementBatchRepository;
import com.payflow.repository.SettlementRecordRepository;
import com.payflow.service.ReconciliationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class ReconciliationServiceImpl implements ReconciliationService {

    private final SettlementBatchRepository batchRepository;
    private final SettlementRecordRepository settlementRecordRepository;
    private final ReconciliationRecordRepository reconciliationRecordRepository;
    private final PaymentTransactionRepository transactionRepository;

    public ReconciliationServiceImpl(SettlementBatchRepository batchRepository,
                                     SettlementRecordRepository settlementRecordRepository,
                                     ReconciliationRecordRepository reconciliationRecordRepository,
                                     PaymentTransactionRepository transactionRepository) {
        this.batchRepository = batchRepository;
        this.settlementRecordRepository = settlementRecordRepository;
        this.reconciliationRecordRepository = reconciliationRecordRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    @Transactional
    public SettlementBatchResponse importSettlementCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Uploaded settlement CSV file cannot be empty.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "settlement.csv";
        if (!originalFilename.toLowerCase().endsWith(".csv") && !originalFilename.toLowerCase().endsWith(".txt")) {
            throw new BusinessRuleException("Invalid file format. Only CSV files are supported.");
        }

        String batchRef = "BATCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        SettlementBatch batch = new SettlementBatch(batchRef, originalFilename, 0);
        SettlementBatch savedBatch = batchRepository.save(batch);

        List<SettlementRecord> records = new ArrayList<>();
        Set<String> seenRefs = new HashSet<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                throw new BusinessRuleException("CSV file contains no header row.");
            }

            String line;
            int lineNumber = 1;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.trim().isEmpty()) continue;

                // Expected: transaction_reference, payment_reference, amount, currency, settlement_date, settlement_status
                String[] parts = line.split(",", -1);
                if (parts.length < 5) {
                    throw new BusinessRuleException("Malformed CSV line " + lineNumber + ": Insufficient columns.");
                }

                String txRef = parts[0].trim();
                String payRef = parts[1].trim();
                String amountStr = parts[2].trim();
                String currency = parts[3].trim().toUpperCase();
                String dateStr = parts[4].trim();
                String status = parts.length > 5 ? parts[5].trim().toUpperCase() : "SUCCESS";

                if (txRef.isEmpty()) {
                    throw new BusinessRuleException("Line " + lineNumber + ": transaction_reference cannot be empty.");
                }

                if (seenRefs.contains(txRef)) {
                    throw new BusinessRuleException("Duplicate transaction_reference detected in CSV at line " + lineNumber + ": " + txRef);
                }
                seenRefs.add(txRef);

                BigDecimal amount;
                try {
                    amount = new BigDecimal(amountStr).setScale(4, RoundingMode.HALF_UP);
                    if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                        throw new BusinessRuleException("Line " + lineNumber + ": Amount must be greater than zero.");
                    }
                } catch (NumberFormatException ex) {
                    throw new BusinessRuleException("Line " + lineNumber + ": Invalid decimal amount '" + amountStr + "'.");
                }

                Instant settleDate = Instant.now();
                if (!dateStr.isEmpty()) {
                    try {
                        settleDate = Instant.parse(dateStr);
                    } catch (Exception ignored) {
                        // Keep default instant if unparseable
                    }
                }

                SettlementRecord record = new SettlementRecord(
                        savedBatch, txRef, payRef, amount, currency, status, settleDate
                );
                records.add(record);
            }
        } catch (BusinessRuleException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessRuleException("Error processing CSV stream: " + ex.getMessage());
        }

        if (records.isEmpty()) {
            throw new BusinessRuleException("CSV file contains no data rows.");
        }

        settlementRecordRepository.saveAll(records);
        savedBatch.setTotalRecords(records.size());
        SettlementBatch finalized = batchRepository.save(savedBatch);

        return mapBatchToResponse(finalized);
    }

    @Override
    @Transactional
    public SettlementBatchResponse runReconciliation(UUID batchId) {
        SettlementBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement batch not found with id: " + batchId));

        List<SettlementRecord> settlementRecords = settlementRecordRepository.findByBatchId(batchId);
        int matched = 0;
        int mismatched = 0;

        for (SettlementRecord extRecord : settlementRecords) {
            // Check if already reconciled in this batch
            if (reconciliationRecordRepository.existsByBatchIdAndExternalReference(batchId, extRecord.getTransactionReference())) {
                continue;
            }

            // Find matching internal transaction by transactionReference or providerReference
            Optional<PaymentTransaction> internalTxOpt = transactionRepository.findByTransactionReference(extRecord.getTransactionReference());
            if (internalTxOpt.isEmpty() && extRecord.getPaymentReference() != null && !extRecord.getPaymentReference().isEmpty()) {
                // Secondary fallback lookup by payment reference
                var paymentTxs = transactionRepository.searchTransactions(
                        null, null, null, null, null, null, extRecord.getPaymentReference(), Pageable.unpaged()
                );
                if (paymentTxs.hasContent()) {
                    internalTxOpt = Optional.of(paymentTxs.getContent().get(0));
                }
            }

            if (internalTxOpt.isEmpty()) {
                // MISSING_INTERNAL
                ReconciliationRecord recon = new ReconciliationRecord(
                        null, batch, extRecord.getTransactionReference(), null,
                        BigDecimal.ZERO, extRecord.getAmount(), extRecord.getCurrency(),
                        ReconciliationStatus.MISSING_INTERNAL,
                        "Record exists in external settlement file but not found in PayFlow ledger"
                );
                reconciliationRecordRepository.save(recon);
                mismatched++;
                continue;
            }

            PaymentTransaction internalTx = internalTxOpt.get();

            // Check Amount Match
            boolean amountMatch = internalTx.getAmount().compareTo(extRecord.getAmount()) == 0;
            // Check Currency Match
            boolean currencyMatch = internalTx.getCurrency().equalsIgnoreCase(extRecord.getCurrency());
            // Check Status Match
            boolean statusMatch = internalTx.getTransactionStatus().name().equalsIgnoreCase(extRecord.getSettlementStatus());

            if (amountMatch && currencyMatch && statusMatch) {
                ReconciliationRecord recon = new ReconciliationRecord(
                        internalTx, batch, extRecord.getTransactionReference(), internalTx.getTransactionReference(),
                        internalTx.getAmount(), extRecord.getAmount(), extRecord.getCurrency(),
                        ReconciliationStatus.MATCHED, "Exact match across reference, amount, currency and status"
                );
                reconciliationRecordRepository.save(recon);
                matched++;
            } else if (!amountMatch) {
                ReconciliationRecord recon = new ReconciliationRecord(
                        internalTx, batch, extRecord.getTransactionReference(), internalTx.getTransactionReference(),
                        internalTx.getAmount(), extRecord.getAmount(), extRecord.getCurrency(),
                        ReconciliationStatus.AMOUNT_MISMATCH,
                        String.format("Amount discrepancy: Internal=%s, External=%s", internalTx.getAmount(), extRecord.getAmount())
                );
                reconciliationRecordRepository.save(recon);
                mismatched++;
            } else {
                ReconciliationRecord recon = new ReconciliationRecord(
                        internalTx, batch, extRecord.getTransactionReference(), internalTx.getTransactionReference(),
                        internalTx.getAmount(), extRecord.getAmount(), extRecord.getCurrency(),
                        ReconciliationStatus.STATUS_MISMATCH,
                        String.format("Status discrepancy: Internal=%s, External=%s", internalTx.getTransactionStatus(), extRecord.getSettlementStatus())
                );
                reconciliationRecordRepository.save(recon);
                mismatched++;
            }
        }

        batch.setMatchedRecords(matched);
        batch.setMismatchedRecords(mismatched);
        batch.setStatus(mismatched == 0 ? BatchStatus.RECONCILED : BatchStatus.PARTIALLY_RECONCILED);
        SettlementBatch saved = batchRepository.save(batch);

        return mapBatchToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReconciliationRecordResponse> getReconciliationRecords(UUID batchId, ReconciliationStatus status, String search, Pageable pageable) {
        String query = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return reconciliationRecordRepository.searchRecords(batchId, status, query, pageable)
                .map(this::mapRecordToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ReconciliationRecordResponse getReconciliationRecordById(UUID id) {
        ReconciliationRecord record = reconciliationRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reconciliation record not found with id: " + id));
        return mapRecordToResponse(record);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SettlementBatchResponse> getBatches(Pageable pageable) {
        return batchRepository.findAll(pageable).map(this::mapBatchToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public SettlementBatchResponse getBatchById(UUID batchId) {
        SettlementBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement batch not found with id: " + batchId));
        return mapBatchToResponse(batch);
    }

    @Override
    @Transactional(readOnly = true)
    public ReconciliationSummaryResponse getSummary() {
        long total = reconciliationRecordRepository.count();
        List<Object[]> statusCounts = reconciliationRecordRepository.countByStatusGroup();

        Map<String, Long> breakdown = new LinkedHashMap<>();
        for (ReconciliationStatus s : ReconciliationStatus.values()) {
            breakdown.put(s.name(), 0L);
        }

        long matched = 0;
        long amountMismatch = 0;
        long statusMismatch = 0;
        long missingInternal = 0;
        long missingExternal = 0;

        for (Object[] row : statusCounts) {
            ReconciliationStatus st = (ReconciliationStatus) row[0];
            Long cnt = (Long) row[1];
            breakdown.put(st.name(), cnt);

            switch (st) {
                case MATCHED -> matched += cnt;
                case AMOUNT_MISMATCH -> amountMismatch += cnt;
                case STATUS_MISMATCH -> statusMismatch += cnt;
                case MISSING_INTERNAL -> missingInternal += cnt;
                case MISSING_EXTERNAL -> missingExternal += cnt;
            }
        }

        return new ReconciliationSummaryResponse(
                total, matched, amountMismatch, statusMismatch, missingInternal, missingExternal, breakdown
        );
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportReconciliationCsv(UUID batchId) {
        List<ReconciliationRecord> list = (batchId != null) ?
                reconciliationRecordRepository.findByBatchId(batchId) :
                reconciliationRecordRepository.findAll();

        StringBuilder sb = new StringBuilder();
        // Header
        sb.append("id,external_reference,internal_reference,expected_amount,actual_amount,currency,reconciliation_status,mismatch_reason,reconciled_at\n");

        for (ReconciliationRecord r : list) {
            sb.append(escapeCsv(r.getId().toString())).append(",")
              .append(escapeCsv(r.getExternalReference())).append(",")
              .append(escapeCsv(r.getInternalReference() != null ? r.getInternalReference() : "N/A")).append(",")
              .append(r.getExpectedAmount()).append(",")
              .append(r.getActualAmount()).append(",")
              .append(escapeCsv(r.getCurrency() != null ? r.getCurrency() : "USD")).append(",")
              .append(escapeCsv(r.getReconciliationStatus().name())).append(",")
              .append(escapeCsv(r.getMismatchReason() != null ? r.getMismatchReason() : "")).append(",")
              .append(escapeCsv(r.getReconciledAt() != null ? r.getReconciledAt().toString() : "")).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        // Prevent CSV injection: if starting with =, +, -, @ prepend quote
        String sanitized = val;
        if (sanitized.startsWith("=") || sanitized.startsWith("+") || sanitized.startsWith("-") || sanitized.startsWith("@")) {
            sanitized = "'" + sanitized;
        }
        if (sanitized.contains(",") || sanitized.contains("\"") || sanitized.contains("\n")) {
            return "\"" + sanitized.replace("\"", "\"\"") + "\"";
        }
        return sanitized;
    }

    private SettlementBatchResponse mapBatchToResponse(SettlementBatch b) {
        return new SettlementBatchResponse(
                b.getId(),
                b.getBatchReference(),
                b.getFileName(),
                b.getTotalRecords(),
                b.getMatchedRecords(),
                b.getMismatchedRecords(),
                b.getStatus(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }

    private ReconciliationRecordResponse mapRecordToResponse(ReconciliationRecord r) {
        return new ReconciliationRecordResponse(
                r.getId(),
                r.getBatch() != null ? r.getBatch().getId() : null,
                r.getBatch() != null ? r.getBatch().getBatchReference() : null,
                r.getTransaction() != null ? r.getTransaction().getId() : null,
                r.getInternalReference(),
                r.getExternalReference(),
                r.getExpectedAmount(),
                r.getActualAmount(),
                r.getCurrency(),
                r.getReconciliationStatus(),
                r.getMismatchReason(),
                r.getReconciledAt()
        );
    }
}
