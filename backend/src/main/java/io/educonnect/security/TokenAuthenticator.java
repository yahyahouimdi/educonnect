package io.educonnect.security;

import io.educonnect.user.User;
import io.educonnect.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Resolves a bearer token to a live user. Looking the user up on every request means that disabling
 * an account or changing its role takes effect immediately instead of when the token expires.
 */
@Component
@RequiredArgsConstructor
public class TokenAuthenticator {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Optional<AuthenticatedUser> authenticate(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
            return Optional.empty();
        }
        String token = authorizationHeader.substring(BEARER_PREFIX.length()).trim();
        return jwtService.parseUserId(token)
                .flatMap(userRepository::findById)
                .filter(User::isEnabled)
                .map(AuthenticatedUser::from);
    }
}
