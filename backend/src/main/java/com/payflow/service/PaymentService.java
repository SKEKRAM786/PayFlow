package com.payflow.service;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.enums.PaymentStatus;
import com.payflow.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PaymentService {
    PaymentResponse createPayment(CreatePaymentRequest request, UserPrincipal principal);
    PaymentResponse authorizePayment(UUID paymentId, UserPrincipal principal);
    PaymentResponse capturePayment(UUID paymentId, UserPrincipal principal);
    PaymentResponse cancelPayment(UUID paymentId, UserPrincipal principal);
    PaymentResponse getPaymentById(UUID paymentId, UserPrincipal principal);
    Page<PaymentResponse> getPayments(String reference, PaymentStatus status, String currency, Pageable pageable, UserPrincipal principal);
    Page<PaymentResponse> getPayments(String reference, PaymentStatus status, String currency, UUID customerId, Pageable pageable, UserPrincipal principal);
}
