package com.payflow.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCustomerRequest(
        @NotBlank(message = "Customer full name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        String fullName,

        @NotBlank(message = "Customer email is required")
        @Email(message = "Must be a valid email address")
        @Size(max = 120, message = "Email cannot exceed 120 characters")
        String email,

        @Size(max = 25, message = "Phone number cannot exceed 25 characters")
        @Pattern(regexp = "^$|^[+0-9\\-\\s()]{7,25}$", message = "Phone number contains invalid characters")
        String phoneNumber
) {}
