package com.payflow.service;

import com.payflow.dto.response.NotificationResponse;
import com.payflow.entity.User;
import com.payflow.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

public interface NotificationService {
    NotificationResponse sendNotification(UUID userId, String title, String message, NotificationType type);
    NotificationResponse sendNotification(User user, String title, String message, NotificationType type);
    Page<NotificationResponse> getUserNotifications(UUID userId, Pageable pageable);
    long getUnreadCount(UUID userId);
    NotificationResponse markAsRead(UUID notificationId, UUID userId);
    void markAllAsRead(UUID userId);
    void deleteNotification(UUID notificationId, UUID userId);
    SseEmitter subscribe(UUID userId);
}
