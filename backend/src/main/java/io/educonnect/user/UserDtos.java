package io.educonnect.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class UserDtos {

    private UserDtos() {
    }

    public record UserResponse(Long id, String fullName, String email, Role role, boolean enabled, Instant createdAt) {

        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole(),
                    user.isEnabled(), user.getCreatedAt());
        }
    }

    public record CreateUserRequest(
            @NotBlank @Size(max = 150) String fullName,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotNull Role role) {
    }

    /** Password is optional on update: when blank, the current password is kept. */
    public record UpdateUserRequest(
            @NotBlank @Size(max = 150) String fullName,
            @NotBlank @Email @Size(max = 190) String email,
            @Size(min = 8, max = 100) String password,
            @NotNull Role role,
            boolean enabled) {
    }
}
