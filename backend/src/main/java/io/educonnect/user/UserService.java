package io.educonnect.user;

import io.educonnect.common.PageResponse;
import io.educonnect.common.exception.BadRequestException;
import io.educonnect.common.exception.ConflictException;
import io.educonnect.common.exception.NotFoundException;
import io.educonnect.user.UserDtos.CreateUserRequest;
import io.educonnect.user.UserDtos.UpdateUserRequest;
import io.educonnect.user.UserDtos.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> search(Role role, String search, Pageable pageable) {
        String term = StringUtils.hasText(search) ? search.trim() : null;
        return PageResponse.of(userRepository.search(role, term, pageable), UserResponse::from);
    }

    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> NotFoundException.of("User", id));
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("A user with email " + email + " already exists");
        }
        User user = new User(request.fullName().trim(), email, passwordEncoder.encode(request.password()), request.role());
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse update(Long id, UpdateUserRequest request, Long currentUserId) {
        User user = getById(id);
        String email = normalizeEmail(request.email());

        userRepository.findByEmailIgnoreCase(email)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new ConflictException("A user with email " + email + " already exists");
                });

        if (id.equals(currentUserId) && (request.role() != Role.ADMIN || !request.enabled())) {
            throw new BadRequestException("You cannot remove your own administrator access");
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setRole(request.role());
        user.setEnabled(request.enabled());
        if (StringUtils.hasText(request.password())) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return UserResponse.from(user);
    }

    @Transactional
    public void delete(Long id, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new BadRequestException("You cannot delete your own account");
        }
        userRepository.delete(getById(id));
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = getById(userId);
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
