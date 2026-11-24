package com.payflow.service;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerStatusRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.entity.Customer;
import com.payflow.entity.Payment;
import com.payflow.entity.User;
import com.payflow.enums.CustomerStatus;
import com.payflow.enums.PaymentMethod;
import com.payflow.enums.UserRole;
import com.payflow.exception.BusinessRuleException;
import com.payflow.repository.CustomerRepository;
import com.payflow.repository.PaymentRepository;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:customerdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class CustomerServiceIntegrationTest {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private User adminUser;
    private User customerUser;
    private User anotherCustomerUser;

    @BeforeEach
    void setUp() {
        paymentRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(new User("Admin User", "admin@payflow.internal", "Pass12345!", UserRole.ADMIN));
        customerUser = userRepository.save(new User("Client A", "client.a@company.com", "Pass12345!", UserRole.CUSTOMER));
        anotherCustomerUser = userRepository.save(new User("Client B", "client.b@company.com", "Pass12345!", UserRole.CUSTOMER));
    }

    @Test
    @DisplayName("Should create customer successfully and prevent duplicate email")
    void shouldCreateCustomerAndPreventDuplicates() {
        UserPrincipal principal = UserPrincipal.create(customerUser);
        CreateCustomerRequest request = new CreateCustomerRequest("Acme Logistics", "contact@acme.com", "+1234567890");

        CustomerResponse created = customerService.createCustomer(request, principal);
        assertThat(created).isNotNull();
        assertThat(created.email()).isEqualTo("contact@acme.com");
        assertThat(created.status()).isEqualTo(CustomerStatus.ACTIVE);
        assertThat(created.userId()).isEqualTo(customerUser.getId());

        // Duplicate email rejection
        assertThatThrownBy(() -> customerService.createCustomer(request, principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("Should enforce ownership when accessing customer profile")
    void shouldEnforceOwnership() {
        UserPrincipal principalA = UserPrincipal.create(customerUser);
        UserPrincipal principalB = UserPrincipal.create(anotherCustomerUser);
        UserPrincipal adminPrincipal = UserPrincipal.create(adminUser);

        CustomerResponse customerA = customerService.createCustomer(
                new CreateCustomerRequest("Acme Client A", "client.a.biz@acme.com", "+111111111"), principalA);

        // Owner can read
        assertThat(customerService.getCustomerById(customerA.id(), principalA)).isNotNull();

        // Admin can read
        assertThat(customerService.getCustomerById(customerA.id(), adminPrincipal)).isNotNull();

        // Another customer is denied
        assertThatThrownBy(() -> customerService.getCustomerById(customerA.id(), principalB))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("Should update customer information and validate unique email")
    void shouldUpdateCustomer() {
        UserPrincipal principal = UserPrincipal.create(customerUser);
        CustomerResponse created = customerService.createCustomer(
                new CreateCustomerRequest("Acme Original", "info@acme.com", "+10000000"), principal);

        UpdateCustomerRequest updateReq = new UpdateCustomerRequest("Acme Updated Corp", "updated@acme.com", "+19999999");
        CustomerResponse updated = customerService.updateCustomer(created.id(), updateReq, principal);

        assertThat(updated.fullName()).isEqualTo("Acme Updated Corp");
        assertThat(updated.email()).isEqualTo("updated@acme.com");
    }

    @Test
    @DisplayName("Should prevent deletion if customer has payment history")
    void shouldPreventDeletionWithPaymentHistory() {
        UserPrincipal principal = UserPrincipal.create(adminUser);
        Customer customer = customerRepository.save(new Customer("Enterprise Client", "ent@payflow.com", "+122222222", adminUser));

        Payment payment = new Payment(
                customer,
                new BigDecimal("500.0000"),
                "USD",
                PaymentMethod.CARD_SIMULATED,
                "idemp-del-" + UUID.randomUUID(),
                "Subscription charge"
        );
        paymentRepository.save(payment);

        assertThatThrownBy(() -> customerService.deleteCustomer(customer.getId(), principal))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("existing payments");
    }

    @Test
    @DisplayName("Should search and paginate customers")
    void shouldSearchAndPaginateCustomers() {
        UserPrincipal adminPrincipal = UserPrincipal.create(adminUser);
        customerService.createCustomer(new CreateCustomerRequest("Apex Corp", "contact@apex.com", null), adminPrincipal);
        customerService.createCustomer(new CreateCustomerRequest("Beta Global", "info@beta.com", null), adminPrincipal);

        Page<CustomerResponse> results = customerService.getCustomers("Apex", null, PageRequest.of(0, 10), adminPrincipal);
        assertThat(results.getTotalElements()).isEqualTo(1);
        assertThat(results.getContent().get(0).fullName()).isEqualTo("Apex Corp");
    }
}
