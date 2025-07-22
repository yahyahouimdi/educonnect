package io.educonnect.security;

import io.educonnect.user.Role;
import io.educonnect.user.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.security.Principal;
import java.util.List;

/**
 * The principal stored in the security context for every authenticated request or WebSocket session.
 */
public record AuthenticatedUser(Long id, String email, String fullName, Role role) implements Principal {

    public static AuthenticatedUser from(User user) {
        return new AuthenticatedUser(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }

    public Authentication toAuthentication() {
        return new UsernamePasswordAuthenticationToken(this, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role.name())));
    }

    @Override
    public String getName() {
        return email;
    }
}
