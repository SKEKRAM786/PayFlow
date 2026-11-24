package com.payflow.service;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.TransactionDetailResponse;
import com.payflow.entity.User;
import com.payflow.enums.PaymentMethod;
import com.payflow.enums.TransactionStatus;
import com.payflow.enums.TransactionType;
import com.payflow.enums.UserRole;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.PaymentTransactionRepository;
import com.payflow.repository.UserRepository;
import com.payflow.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:txdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class TransactionServiceIntegrationTest {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    private User adminUser;
    private User customerUserA;
    private User customerUserB;
    private CustomerResponse customerA;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        paymentRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(new User("Admin TX", "admin.tx@payflow.test", "Pass12345!", UserRole.ADMIN));
        customerUserA = userRepository.save(new User("Merchant TX A", "tx.a@payflow.test", "Pass12345!", UserRole.CUSTOMER));
        customerUserB = userRepository.save(new User("Merchant TX B", "tx.b@payflow.test", "Pass12345!", UserRole.CUSTOMER));

        UserPrincipal principalA = UserPrincipal.create(customerUserA);
        customerA = customerService.createCustomer(
                new CreateCustomerRequest("Corp TX A", "tx.a.biz@payflow.test", "+155555555"),
                principalA
        );
    }

    @Test
    @DisplayName("Should query recorded transactions by payment, reference, and filters")
    void shouldQueryRecordedTransactions() {
        UserPrincipal principalA = UserPrincipal.create(customerUserA);
        UserPrincipal adminPrincipal = UserPrincipal.create(adminUser);

        // 1. Create, Authorize & Capture a payment
        CreatePaymentRequest createReq = new CreatePaymentRequest(
                customerA.id(),
                new BigDecimal("499.0000"),
                "USD",
                PaymentMethod.CARD_SIMULATED,
                "idemp-tx-" + UUID.randomUUID(),
                "Software license invoice"
        );
        PaymentResponse payment = paymentService.createPayment(createReq, principalA);
        paymentService.authorizePayment(payment.id(), principalA);
        paymentService.capturePayment(payment.id(), principalA);

        // 2. Query transactions by payment ID
        List<TransactionDetailResponse> txList = transactionService.getTransactionsByPaymentId(payment.id(), principalA);
        assertThat(txList).hasSize(2);
        assertThat(txList.get(0).transactionType()).isIn(TransactionType.AUTHORIZATION, TransactionType.CAPTURE);

        // 3. Query transaction by exact reference
        String firstRef = txList.get(0).transactionReference();
        TransactionDetailResponse singleTx = transactionService.getTransactionByReference(firstRef, principalA);
        assertThat(singleTx).isNotNull();
        assertThat(singleTx.amount()).isEqualByComparingTo(new BigDecimal("499.0000"));

        // 4. Admin search with filters
        Page<TransactionDetailResponse> adminResults = transactionService.getTransactions(
                TransactionType.CAPTURE,
                TransactionStatus.SUCCESS,
                "USD",
                null,
                null,
                payment.paymentReference(),
                PageRequest.of(0, 10),
                adminPrincipal
        );
        assertThat(adminResults.getTotalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should enforce customer ownership isolation on transactions")
    void shouldEnforceCustomerOwnershipOnTransactions() {
        UserPrincipal principalA = UserPrincipal.create(customerUserA);
        UserPrincipal principalB = UserPrincipal.create(customerUserB);

        CreatePaymentRequest createReq = new CreatePaymentRequest(
                customerA.id(),
                new BigDecimal("120.00"),
                "AED",
                PaymentMethod.BANK_TRANSFER_SIMULATED,
                "idemp-tx-" + UUID.randomUUID(),
                "Logistics freight fee"
        );
        PaymentResponse payment = paymentService.createPayment(createReq, principalA);
        paymentService.authorizePayment(payment.id(), principalA);

        List<TransactionDetailResponse> txs = transactionService.getTransactionsByPaymentId(payment.id(), principalA);
        assertThat(txs).isNotEmpty();
        UUID txId = txs.get(0).id();

        // Customer B cannot access Customer A's transaction
        assertThatThrownBy(() -> transactionService.getTransactionById(txId, principalB))
                .isInstanceOf(AccessDeniedException.class);
    }
}
