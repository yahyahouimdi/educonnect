package io.educonnect.auth;

import io.educonnect.auth.AuthDtos.AuthResponse;
import io.educonnect.auth.AuthDtos.LoginRequest;
import io.educonnect.security.JwtService;
import io.educonnect.security.JwtService.IssuedToken;
import io.educonnect.user.User;
import io.educonnect.user.UserDtos.UserResponse;
import io.educonnect.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Invalid email or password";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new BadCredentialsException(INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException(INVALID_CREDENTIALS);
        }
        if (!user.isEnabled()) {
            throw new DisabledException("This account has been disabled. Please contact the administration.");
        }

        IssuedToken token = jwtService.issue(user);
        return new AuthResponse(token.value(), "Bearer", token.expiresAt(), UserResponse.from(user));
    }
}
