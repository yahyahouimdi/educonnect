package io.educonnect.chat;

import io.educonnect.user.Role;
import io.educonnect.user.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Optional;

public final class ChatDtos {

    private ChatDtos() {
    }

    public record ChatRoom(String id, String name, String description) {
    }

    public record SendMessageRequest(@NotBlank @Size(max = 2000) String content) {
    }

    public record ChatMessageResponse(Long id, String room, Long senderId, String senderName, Role senderRole,
                                      String content, Instant sentAt) {

        public static ChatMessageResponse from(ChatMessage message) {
            return new ChatMessageResponse(message.getId(), message.getRoom(),
                    Optional.ofNullable(message.getSender()).map(User::getId).orElse(null),
                    message.getSenderName(), message.getSenderRole(), message.getContent(), message.getCreatedAt());
        }
    }
}
