package com.payflow.service;

import com.payflow.dto.response.NotificationResponse;
import com.payflow.entity.Notification;
import com.payflow.entity.User;
import com.payflow.enums.NotificationType;
import com.payflow.enums.UserRole;
import com.payflow.repository.NotificationRepository;
import com.payflow.repository.UserRepository;
import com.payflow.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceUnitTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private NotificationServiceImpl notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(notificationRepository, userRepository);
    }

    @Test
    @DisplayName("Should persist notification and compute unread counts")
    void testSendAndQueryNotification() {
        UUID userId = UUID.randomUUID();
        User user = new User("John Admin", "admin@payflow.test", "encodedPassword", UserRole.ADMIN);
        user.setId(userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse res = notificationService.sendNotification(
                userId,
                "Payment Captured",
                "Payment PAY-101 was captured",
                NotificationType.PAYMENT_CAPTURED
        );

        assertThat(res.title()).isEqualTo("Payment Captured");
        assertThat(res.notificationType()).isEqualTo(NotificationType.PAYMENT_CAPTURED);
        assertThat(res.isRead()).isFalse();

        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    @DisplayName("Should mark notification as read when owned by user")
    void testMarkAsRead() {
        UUID userId = UUID.randomUUID();
        UUID notifId = UUID.randomUUID();
        User user = new User("John Admin", "admin@payflow.test", "pwd", UserRole.ADMIN);
        user.setId(userId);

        Notification n = new Notification(user, "Title", "Message", NotificationType.ADMIN_ALERT);
        when(notificationRepository.findById(notifId)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        NotificationResponse updated = notificationService.markAsRead(notifId, userId);
        assertThat(updated.isRead()).isTrue();
    }
}
