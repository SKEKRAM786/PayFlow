package com.payflow.repository;

import com.payflow.entity.*;
import com.payflow.enums.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class RepositoryMappingTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentTransactionRepository transactionRepository;

    @Autowired
    private RefundRepository refundRepository;

    @Test
    @DisplayName("Should persist and query User entity with unique email")
    void shouldPersistUser() {
        User user = new User("Alice Admin", "alice@payflow.internal", "$2a$10$hashedPasswordHere", UserRole.ADMIN);
        entityManager.persistAndFlush(user);

        Optional<User> found = userRepository.findByEmail("alice@payflow.internal");
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isNotNull();
        assertThat(found.get().getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(found.get().getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should persist Customer and Payment with relational integrity")
    void shouldPersistCustomerAndPayment() {
        Customer customer = new Customer("Acme Corp", "finance@acme.com", "+1234567890");
        entityManager.persistAndFlush(customer);

        Payment payment = new Payment(
                customer,
                new BigDecimal("1500.5000"),
                "USD",
                PaymentMethod.CARD_SIMULATED,
                "idemp-" + UUID.randomUUID(),
                "Subscription settlement"
        );
        entityManager.persistAndFlush(payment);

        PaymentTransaction tx = new PaymentTransaction(
                payment,
                "TX-" + UUID.randomUUID(),
                TransactionType.CAPTURE,
                TransactionStatus.SUCCESS,
                new BigDecimal("1500.5000"),
                "USD"
        );
        entityManager.persistAndFlush(tx);

        Refund refund = new Refund(payment, tx, new BigDecimal("200.0000"), "Partial refund");
        refund.setRefundStatus(RefundStatus.COMPLETED);
        entityManager.persistAndFlush(refund);

        BigDecimal completedRefunds = refundRepository.sumCompletedRefundsByPaymentId(payment.getId());
        assertThat(completedRefunds).isEqualByComparingTo(new BigDecimal("200.0000"));
        assertThat(transactionRepository.findByTransactionReference(tx.getTransactionReference())).isPresent();
    }
}
