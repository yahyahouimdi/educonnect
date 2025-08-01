package io.educonnect.chat;

import io.educonnect.chat.ChatDtos.ChatMessageResponse;
import io.educonnect.chat.ChatDtos.ChatRoom;
import io.educonnect.common.exception.BadRequestException;
import io.educonnect.common.exception.NotFoundException;
import io.educonnect.course.Course;
import io.educonnect.course.CourseRepository;
import io.educonnect.security.AuthenticatedUser;
import io.educonnect.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Chat rooms are derived from the catalog: one institution-wide room plus one room per published course.
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    static final String GENERAL_ROOM = "general";
    private static final Pattern COURSE_ROOM = Pattern.compile("^course-(\\d+)$");
    private static final int HISTORY_LIMIT = 100;

    private final ChatMessageRepository messageRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ChatRoom> listRooms() {
        List<ChatRoom> rooms = new ArrayList<>();
        rooms.add(new ChatRoom(GENERAL_ROOM, "General", "Open discussion for the whole institution"));
        for (Course course : courseRepository.findAllByPublishedTrueOrderByPositionAscTitleAsc()) {
            rooms.add(new ChatRoom("course-" + course.getId(), course.getTitle(), "Questions about this course"));
        }
        return rooms;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> history(String room) {
        requireRoom(room);
        List<ChatMessageResponse> latestFirst = messageRepository
                .findByRoomOrderByCreatedAtDescIdDesc(room, PageRequest.of(0, HISTORY_LIMIT)).stream()
                .map(ChatMessageResponse::from)
                .toList();
        List<ChatMessageResponse> chronological = new ArrayList<>(latestFirst);
        Collections.reverse(chronological);
        return chronological;
    }

    @Transactional
    public ChatMessageResponse post(String room, String content, AuthenticatedUser sender) {
        requireRoom(room);
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Message cannot be empty");
        }
        String trimmed = content.trim();
        if (trimmed.length() > 2000) {
            throw new BadRequestException("Message is too long (2000 characters maximum)");
        }
        ChatMessage message = new ChatMessage();
        message.setRoom(room);
        message.setSender(userRepository.getReferenceById(sender.id()));
        message.setSenderName(sender.fullName());
        message.setSenderRole(sender.role());
        message.setContent(trimmed);
        return ChatMessageResponse.from(messageRepository.save(message));
    }

    private void requireRoom(String room) {
        if (GENERAL_ROOM.equals(room)) {
            return;
        }
        Matcher matcher = COURSE_ROOM.matcher(room == null ? "" : room);
        boolean exists = matcher.matches() && courseRepository.findById(Long.valueOf(matcher.group(1)))
                .filter(Course::isPublished)
                .isPresent();
        if (!exists) {
            throw new NotFoundException("Chat room " + room + " does not exist");
        }
    }
}
