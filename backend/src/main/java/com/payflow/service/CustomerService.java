package com.payflow.service;

import com.payflow.dto.request.CreateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerRequest;
import com.payflow.dto.request.UpdateCustomerStatusRequest;
import com.payflow.dto.response.CustomerResponse;
import com.payflow.enums.CustomerStatus;
import com.payflow.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CustomerService {
    CustomerResponse createCustomer(CreateCustomerRequest request, UserPrincipal principal);
    Page<CustomerResponse> getCustomers(String search, CustomerStatus status, Pageable pageable, UserPrincipal principal);
    CustomerResponse getCustomerById(UUID id, UserPrincipal principal);
    CustomerResponse updateCustomer(UUID id, UpdateCustomerRequest request, UserPrincipal principal);
    CustomerResponse updateCustomerStatus(UUID id, UpdateCustomerStatusRequest request);
    void deleteCustomer(UUID id, UserPrincipal principal);
}
