package com.payflow.entity;

import com.payflow.enums.BatchStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "settlement_batches", indexes = {
        @Index(name = "idx_batch_ref", columnList = "batch_reference", unique = true),
        @Index(name = "idx_batch_status", columnList = "status"),
        @Index(name = "idx_batch_created", columnList = "created_at")
})
public class SettlementBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "Batch reference is required")
    @Size(max = 64)
    @Column(name = "batch_reference", nullable = false, unique = true, length = 64)
    private String batchReference;

    @NotBlank(message = "File name is required")
    @Size(max = 255)
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "total_records", nullable = false)
    private int totalRecords = 0;

    @Column(name = "matched_records", nullable = false)
    private int matchedRecords = 0;

    @Column(name = "mismatched_records", nullable = false)
    private int mismatchedRecords = 0;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private BatchStatus status = BatchStatus.IMPORTED;

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SettlementRecord> records = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public SettlementBatch() {}

    public SettlementBatch(String batchReference, String fileName, int totalRecords) {
        this.batchReference = batchReference;
        this.fileName = fileName;
        this.totalRecords = totalRecords;
        this.status = BatchStatus.IMPORTED;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getBatchReference() { return batchReference; }
    public void setBatchReference(String batchReference) { this.batchReference = batchReference; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }
    public int getMatchedRecords() { return matchedRecords; }
    public void setMatchedRecords(int matchedRecords) { this.matchedRecords = matchedRecords; }
    public int getMismatchedRecords() { return mismatchedRecords; }
    public void setMismatchedRecords(int mismatchedRecords) { this.mismatchedRecords = mismatchedRecords; }
    public BatchStatus getStatus() { return status; }
    public void setStatus(BatchStatus status) { this.status = status; }
    public List<SettlementRecord> getRecords() { return records; }
    public void setRecords(List<SettlementRecord> records) { this.records = records; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
