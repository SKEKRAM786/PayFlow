package com.payflow.repository;

import com.payflow.entity.ReconciliationRecord;
import com.payflow.enums.ReconciliationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReconciliationRecordRepository extends JpaRepository<ReconciliationRecord, UUID> {

    Optional<ReconciliationRecord> findByExternalReference(String externalReference);

    List<ReconciliationRecord> findByTransactionId(UUID transactionId);

    List<ReconciliationRecord> findByBatchId(UUID batchId);

    boolean existsByBatchIdAndExternalReference(UUID batchId, String externalReference);

    @Query("SELECT r FROM ReconciliationRecord r WHERE " +
           "(:batchId IS NULL OR r.batch.id = :batchId) AND " +
           "(:status IS NULL OR r.reconciliationStatus = :status) AND " +
           "(:search IS NULL OR LOWER(r.externalReference) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(r.internalReference) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<ReconciliationRecord> searchRecords(
            @Param("batchId") UUID batchId,
            @Param("status") ReconciliationStatus status,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT r.reconciliationStatus, COUNT(r) FROM ReconciliationRecord r GROUP BY r.reconciliationStatus")
    List<Object[]> countByStatusGroup();
}
