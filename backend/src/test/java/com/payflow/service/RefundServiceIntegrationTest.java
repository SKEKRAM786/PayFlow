package com.payflow.service;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.request.CreateRefundRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.RefundResponse;
import com.payflow.dto.response.RefundableBalanceResponse;
import com.payflow.entity.User;
import com.payflow.enums.PaymentMethod;
import com.payflow.enums.RefundStatus;
import com.payflow.enums.UserRole;
import com.payflow.exception.BusinessRuleException;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.PaymentTransactionRepository;
import com.payflow.repository.RefundRepository;
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
        "spring.datasource.url=jdbc:h2:mem:refunddb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class RefundServiceIntegrationTest {

    @Autowired
    private RefundService refundService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private RefundRepository refundRepository;

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    private User adminUser;
    private User customerUser;
    private CustomerResponse customer;

    @BeforeEach
    void setUp() {
        refundRepository.deleteAll();
        transactionRepository.deleteAll();
        paymentRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(new User("Admin Ref", "admin.ref@payflow.test", "Pass12345!", UserRole.ADMIN));
        customerUser = userRepository.save(new User("Merchant Ref", "merchant.ref@payflow.test", "Pass12345!", UserRole.CUSTOMER));

        UserPrincipal principal = UserPrincipal.create(customerUser);
        customer = customerService.createCustomer(
                new CreateCustomerRequest("Refundable Merchant Corp", "ref.corp@payflow.test", "+144444444"),
                principal
        );
    }

    @Test
    @DisplayName("Should execute full refund and calculate zero remaining balance")
    void shouldExecuteFullRefund() {
        UserPrincipal principal = UserPrincipal.create(customerUser);

        // 1. Create, Authorize and Capture Payment of 300.00 USD
        PaymentResponse payment = paymentService.createPayment(new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("300.00"),
                "USD",
                PaymentMethod.CARD_SIMULATED,
                "idemp-pay-" + UUID.randomUUID(),
                "Full refund test"
        ), principal);
        paymentService.authorizePayment(payment.id(), principal);
        paymentService.capturePayment(payment.id(), principal);

        // 2. Execute Full Refund of 300.00 USD
        CreateRefundRequest refundReq = new CreateRefundRequest(
                new BigDecimal("300.00"),
                "Customer cancellation request",
                "idemp-ref-" + UUID.randomUUID()
        );
        RefundResponse refund = refundService.processRefund(payment.id(), refundReq, principal);

        assertThat(refund).isNotNull();
        assertThat(refund.refundStatus()).isEqualTo(RefundStatus.COMPLETED);
        assertThat(refund.refundAmount()).isEqualByComparingTo(new BigDecimal("300.0000"));

        // 3. Check remaining balance is 0.00
        RefundableBalanceResponse balance = refundService.getRefundableBalance(payment.id(), principal);
        assertThat(balance.remainingRefundableAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Should support multiple partial refunds up to captured ceiling")
    void shouldSupportMultiplePartialRefunds() {
        UserPrincipal principal = UserPrincipal.create(customerUser);

        PaymentResponse payment = paymentService.createPayment(new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("500.00"),
                "INR",
                PaymentMethod.UPI_SIMULATED,
                "idemp-pay-" + UUID.randomUUID(),
                "Partial refund test"
        ), principal);
        paymentService.authorizePayment(payment.id(), principal);
        paymentService.capturePayment(payment.id(), principal);

        // First partial refund: 200.00
        RefundResponse r1 = refundService.processRefund(payment.id(), new CreateRefundRequest(
                new BigDecimal("200.00"), "Partial return item 1", "idemp-r1-" + UUID.randomUUID()
        ), principal);
        assertThat(r1.refundStatus()).isEqualTo(RefundStatus.COMPLETED);

        // Second partial refund: 150.00
        RefundResponse r2 = refundService.processRefund(payment.id(), new CreateRefundRequest(
                new BigDecimal("150.00"), "Partial return item 2", "idemp-r2-" + UUID.randomUUID()
        ), principal);
        assertThat(r2.refundStatus()).isEqualTo(RefundStatus.COMPLETED);

        // Check balance: 500 - 350 = 150 remaining
        RefundableBalanceResponse balance = refundService.getRefundableBalance(payment.id(), principal);
        assertThat(balance.remainingRefundableAmount()).isEqualByComparingTo(new BigDecimal("150.0000"));

        // Third refund exceeding balance: 200.00 > 150.00 must be rejected
        assertThatThrownBy(() -> refundService.processRefund(payment.id(), new CreateRefundRequest(
                new BigDecimal("200.00"), "Over-refund attempt", "idemp-r3-" + UUID.randomUUID()
        ), principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("exceeds available refundable balance");
    }

    @Test
    @DisplayName("Should reject refund on uncaptured (PENDING) payment")
    void shouldRejectRefundOnUncapturedPayment() {
        UserPrincipal principal = UserPrincipal.create(customerUser);

        PaymentResponse payment = paymentService.createPayment(new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("100.00"),
                "USD",
                PaymentMethod.CARD_SIMULATED,
                "idemp-pay-" + UUID.randomUUID(),
                "Pending payment"
        ), principal);

        assertThatThrownBy(() -> refundService.processRefund(payment.id(), new CreateRefundRequest(
                new BigDecimal("100.00"), "Early refund", "idemp-ref-" + UUID.randomUUID()
        ), principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Only CAPTURED payments can be refunded");
    }

    @Test
    @DisplayName("Should enforce idempotency on repeated refund requests")
    void shouldEnforceRefundIdempotency() {
        UserPrincipal principal = UserPrincipal.create(customerUser);

        PaymentResponse payment = paymentService.createPayment(new CreatePaymentRequest(
                customer.id(),
                new BigDecimal("100.00"),
                "AED",
                PaymentMethod.BANK_TRANSFER_SIMULATED,
                "idemp-pay-" + UUID.randomUUID(),
                "Idempotency refund"
        ), principal);
        paymentService.authorizePayment(payment.id(), principal);
        paymentService.capturePayment(payment.id(), principal);

        String idempKey = "idemp-refund-same-" + UUID.randomUUID();
        CreateRefundRequest request = new CreateRefundRequest(new BigDecimal("50.00"), "Reason", idempKey);

        RefundResponse first = refundService.processRefund(payment.id(), request, principal);
        RefundResponse second = refundService.processRefund(payment.id(), request, principal);

        assertThat(first.id()).isEqualTo(second.id());
        assertThat(first.refundReference()).isEqualTo(second.refundReference());
        assertThat(refundRepository.count()).isEqualTo(1);
    }
}
