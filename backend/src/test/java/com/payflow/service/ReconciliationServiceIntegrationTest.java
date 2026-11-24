package com.payflow.service;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.ReconciliationSummaryResponse;
import com.payflow.dto.response.SettlementBatchResponse;
import com.payflow.entity.User;
import com.payflow.enums.BatchStatus;
import com.payflow.enums.PaymentMethod;
import com.payflow.enums.UserRole;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.PaymentTransactionRepository;
import com.payflow.repository.ReconciliationRecordRepository;
import com.payflow.repository.SettlementBatchRepository;
import com.payflow.repository.SettlementRecordRepository;
import com.payflow.repository.UserRepository;
import com.payflow.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:recondb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class ReconciliationServiceIntegrationTest {

    @Autowired
    private ReconciliationService reconciliationService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private SettlementBatchRepository batchRepository;

    @Autowired
    private SettlementRecordRepository settlementRecordRepository;

    @Autowired
    private ReconciliationRecordRepository reconciliationRecordRepository;

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    private User adminUser;
    private PaymentResponse capturedPayment;

    @BeforeEach
    void setUp() {
        reconciliationRecordRepository.deleteAll();
        settlementRecordRepository.deleteAll();
        batchRepository.deleteAll();
        transactionRepository.deleteAll();
        paymentRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(new User("Recon Admin", "recon.admin@payflow.test", "Pass12345!", UserRole.ADMIN));
        User customerUser = userRepository.save(new User("Recon Customer", "recon.cust@payflow.test", "Pass12345!", UserRole.CUSTOMER));

        UserPrincipal principal = UserPrincipal.create(customerUser);
        CustomerResponse customer = customerService.createCustomer(
                new CreateCustomerRequest("Recon Merchant", "recon.merchant@payflow.test", "+188888888"),
                principal
        );

        capturedPayment = paymentService.createPayment(new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("500.00"),
                "USD",
                PaymentMethod.CARD_SIMULATED,
                "idemp-recon-" + UUID.randomUUID(),
                "Reconciliation sample invoice"
        ), principal);
        paymentService.authorizePayment(capturedPayment.id(), principal);
        capturedPayment = paymentService.capturePayment(capturedPayment.id(), principal);
    }

    @Test
    @DisplayName("Should import settlement CSV and match records accurately against ledger")
    void shouldImportAndReconcileSettlementCsv() {
        String txRef = capturedPayment.transactions().get(1).transactionReference();

        // Prepare CSV with 3 lines:
        // 1. MATCHED: matching txRef with exact amount 500.00
        // 2. AMOUNT_MISMATCH: matching capturedPayment.paymentReference() with wrong amount 450.00
        // 3. MISSING_INTERNAL: unknown external reference
        String csvContent = "transaction_reference,payment_reference,amount,currency,settlement_date,settlement_status\n" +
                txRef + "," + capturedPayment.paymentReference() + ",500.00,USD,2026-11-23T00:00:00Z,SUCCESS\n" +
                "TX-UNKNOWN-001," + capturedPayment.paymentReference() + ",450.00,USD,2026-11-23T00:00:00Z,SUCCESS\n" +
                "TX-EXTERNAL-999,PAY-UNKNOWN-999,100.00,USD,2026-11-23T00:00:00Z,SUCCESS\n";

        MockMultipartFile file = new MockMultipartFile(
                "file", "settlement_bank_nov.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8)
        );

        // 1. Import
        SettlementBatchResponse batch = reconciliationService.importSettlementCsv(file);
        assertThat(batch).isNotNull();
        assertThat(batch.totalRecords()).isEqualTo(3);
        assertThat(batch.status()).isEqualTo(BatchStatus.IMPORTED);

        // 2. Run Reconciliation
        SettlementBatchResponse reconciledBatch = reconciliationService.runReconciliation(batch.id());
        assertThat(reconciledBatch.matchedRecords()).isEqualTo(1);
        assertThat(reconciledBatch.mismatchedRecords()).isEqualTo(2);

        // 3. Verify Metrics Summary
        ReconciliationSummaryResponse summary = reconciliationService.getSummary();
        assertThat(summary.totalRecords()).isEqualTo(3);
        assertThat(summary.matchedCount()).isEqualTo(1);
        assertThat(summary.amountMismatchCount()).isEqualTo(1);
        assertThat(summary.missingInternalCount()).isEqualTo(1);

        // 4. Verify Export CSV
        byte[] exportedBytes = reconciliationService.exportReconciliationCsv(batch.id());
        String exportedContent = new String(exportedBytes, StandardCharsets.UTF_8);
        assertThat(exportedContent).contains("MATCHED");
        assertThat(exportedContent).contains("AMOUNT_MISMATCH");
        assertThat(exportedContent).contains("MISSING_INTERNAL");
    }
}
