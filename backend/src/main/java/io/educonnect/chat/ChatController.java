package io.educonnect.chat;

import io.educonnect.chat.ChatDtos.ChatMessageResponse;
import io.educonnect.chat.ChatDtos.ChatRoom;
import io.educonnect.chat.ChatDtos.SendMessageRequest;
import io.educonnect.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Chat over STOMP: clients send to {@code /app/chat/{room}} and subscribe to {@code /topic/rooms/{room}}.
 * REST endpoints expose the room list, recent history and a fallback for sending without a socket.
 */
@Tag(name = "Chat")
@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/api/v1/chat/rooms")
    public List<ChatRoom> rooms() {
        return chatService.listRooms();
    }

    @Operation(summary = "Most recent messages of a room, oldest first")
    @GetMapping("/api/v1/chat/rooms/{room}/messages")
    public List<ChatMessageResponse> history(@PathVariable String room) {
        return chatService.history(room);
    }

    @PostMapping("/api/v1/chat/rooms/{room}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageResponse send(@PathVariable String room, @Valid @RequestBody SendMessageRequest request,
                                    @AuthenticationPrincipal AuthenticatedUser sender) {
        return broadcast(chatService.post(room, request.content(), sender));
    }

    @MessageMapping("/chat/{room}")
    public void sendOverSocket(@DestinationVariable String room, @Payload SendMessageRequest request,
                               Authentication authentication) {
        broadcast(chatService.post(room, request.content(), (AuthenticatedUser) authentication.getPrincipal()));
    }

    private ChatMessageResponse broadcast(ChatMessageResponse message) {
        messagingTemplate.convertAndSend("/topic/rooms/" + message.room(), message);
        return message;
    }
}
