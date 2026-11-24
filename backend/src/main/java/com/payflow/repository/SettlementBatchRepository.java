package com.payflow.repository;

import com.payflow.entity.SettlementBatch;
import com.payflow.enums.BatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettlementBatchRepository extends JpaRepository<SettlementBatch, UUID> {
    Optional<SettlementBatch> findByBatchReference(String batchReference);
    Page<SettlementBatch> findByStatus(BatchStatus status, Pageable pageable);
}
