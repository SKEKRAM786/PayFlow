package com.payflow.service;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.entity.User;
import com.payflow.enums.PaymentMethod;
import com.payflow.enums.PaymentStatus;
import com.payflow.enums.TransactionType;
import com.payflow.enums.UserRole;
import com.payflow.exception.BusinessRuleException;
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
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:paymentdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class PaymentEngineIntegrationTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    private User adminUser;
    private User customerUser;
    private CustomerResponse customer;

    @BeforeEach
    void setUp() {
        transactionRepository.deleteAll();
        paymentRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(new User("Admin Master", "admin@payflow.test", "Pass12345!", UserRole.ADMIN));
        customerUser = userRepository.save(new User("Merchant Alpha", "alpha@merchant.test", "Pass12345!", UserRole.CUSTOMER));

        UserPrincipal principal = UserPrincipal.create(customerUser);
        customer = customerService.createCustomer(
                new CreateCustomerRequest("Alpha Stores", "billing@alpha.test", "+1987654321"),
                principal
        );
    }

    @Test
    @DisplayName("Should execute complete payment lifecycle: PENDING -> AUTHORIZED -> CAPTURED")
    void shouldExecuteFullPaymentLifecycle() {
        UserPrincipal principal = UserPrincipal.create(customerUser);
        String idempotencyKey = "idemp-" + UUID.randomUUID();

        // 1. Create Payment
        CreatePaymentRequest createReq = new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("250.7500"),
                "USD",
                PaymentMethod.CARD_SIMULATED,
                idempotencyKey,
                "E-commerce order checkout"
        );
        PaymentResponse created = paymentService.createPayment(createReq, principal);

        assertThat(created).isNotNull();
        assertThat(created.paymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(created.paymentReference()).startsWith("PAY-");
        assertThat(created.amount()).isEqualByComparingTo(new BigDecimal("250.7500"));

        // 2. Authorize Payment
        PaymentResponse authorized = paymentService.authorizePayment(created.id(), principal);
        assertThat(authorized.paymentStatus()).isEqualTo(PaymentStatus.AUTHORIZED);
        assertThat(authorized.transactions()).hasSize(1);
        assertThat(authorized.transactions().get(0).transactionType()).isEqualTo(TransactionType.AUTHORIZATION);

        // 3. Capture Payment
        PaymentResponse captured = paymentService.capturePayment(created.id(), principal);
        assertThat(captured.paymentStatus()).isEqualTo(PaymentStatus.CAPTURED);
        assertThat(captured.transactions()).hasSize(2);
        assertThat(captured.transactions().get(1).transactionType()).isEqualTo(TransactionType.CAPTURE);
    }

    @Test
    @DisplayName("Should enforce idempotency and return existing payment on duplicate request")
    void shouldEnforceIdempotency() {
        UserPrincipal principal = UserPrincipal.create(customerUser);
        String idempotencyKey = "idemp-duplicate-" + UUID.randomUUID();

        CreatePaymentRequest request = new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("100.00"),
                "INR",
                PaymentMethod.UPI_SIMULATED,
                idempotencyKey,
                "Subscription charge"
        );

        PaymentResponse first = paymentService.createPayment(request, principal);
        PaymentResponse second = paymentService.createPayment(request, principal);

        assertThat(first.id()).isEqualTo(second.id());
        assertThat(first.paymentReference()).isEqualTo(second.paymentReference());
        assertThat(paymentRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should prevent invalid state transitions (e.g. Capture before Authorization)")
    void shouldRejectInvalidStateTransitions() {
        UserPrincipal principal = UserPrincipal.create(customerUser);
        PaymentResponse payment = paymentService.createPayment(new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("80.00"),
                "AED",
                PaymentMethod.CARD_SIMULATED,
                "idemp-" + UUID.randomUUID(),
                "Direct capture attempt"
        ), principal);

        // Attempting to capture directly from PENDING must fail
        assertThatThrownBy(() -> paymentService.capturePayment(payment.id(), principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Invalid state transition");
    }

    @Test
    @DisplayName("Should reject cancellation of already captured payments")
    void shouldRejectCancellationOfCapturedPayment() {
        UserPrincipal principal = UserPrincipal.create(customerUser);
        PaymentResponse payment = paymentService.createPayment(new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("50.00"),
                "USD",
                PaymentMethod.CARD_SIMULATED,
                "idemp-" + UUID.randomUUID(),
                "Checkout"
        ), principal);

        paymentService.authorizePayment(payment.id(), principal);
        paymentService.capturePayment(payment.id(), principal);

        assertThatThrownBy(() -> paymentService.cancelPayment(payment.id(), principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Captured payments cannot be cancelled");
    }

    @Test
    @DisplayName("Should handle simulator decline scenarios deterministically")
    void shouldHandleSimulatorDecline() {
        UserPrincipal principal = UserPrincipal.create(customerUser);
        PaymentResponse payment = paymentService.createPayment(new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("9999.00"), // Trigger amount for insufficient funds in simulator
                "USD",
                PaymentMethod.CARD_SIMULATED,
                "idemp-" + UUID.randomUUID(),
                "High value order"
        ), principal);

        PaymentResponse authResult = paymentService.authorizePayment(payment.id(), principal);
        assertThat(authResult.paymentStatus()).isEqualTo(PaymentStatus.FAILED);
    }
}
