package com.payflow.security;

import com.payflow.dto.request.LoginRequest;
import com.payflow.dto.request.RegisterRequest;
import com.payflow.dto.response.AuthResponse;
import com.payflow.entity.User;
import com.payflow.enums.UserRole;
import com.payflow.repository.UserRepository;
import com.payflow.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect"
})
class AuthenticationIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtProvider jwtProvider;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully register a new customer with hashed password")
    void shouldRegisterNewUser() {
        RegisterRequest request = new RegisterRequest("Sarah Connor", "sarah@resistance.org", "P@ssword123!");
        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.token()).isNotBlank();
        assertThat(response.user().email()).isEqualTo("sarah@resistance.org");
        assertThat(response.user().role()).isEqualTo("CUSTOMER");

        // Verify password was securely hashed
        User user = userRepository.findByEmail("sarah@resistance.org").orElseThrow();
        assertThat(passwordEncoder.matches("P@ssword123!", user.getPassword())).isTrue();
        assertThat(user.getPassword()).isNotEqualTo("P@ssword123!");

        // Validate JWT token claims
        assertThat(jwtProvider.validateToken(response.token())).isTrue();
        assertThat(jwtProvider.getUserIdFromToken(response.token())).isEqualTo(user.getId());
        assertThat(jwtProvider.getRoleFromToken(response.token())).isEqualTo(UserRole.CUSTOMER.name());
    }

    @Test
    @DisplayName("Should authenticate valid credentials and reject invalid password")
    void shouldAuthenticateUser() {
        authService.register(new RegisterRequest("John Connor", "john@resistance.org", "SecretKey123#"));

        // Valid login
        AuthResponse loginResponse = authService.login(new LoginRequest("john@resistance.org", "SecretKey123#"));
        assertThat(loginResponse).isNotNull();
        assertThat(loginResponse.token()).isNotBlank();

        // Invalid password attempt
        assertThatThrownBy(() -> authService.login(new LoginRequest("john@resistance.org", "WrongPassword!")))
                .isInstanceOf(BadCredentialsException.class);
    }
}
