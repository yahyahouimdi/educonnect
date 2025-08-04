package io.educonnect.assistant;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Assistant")
@RestController
@RequestMapping("/api/v1/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    @Operation(summary = "Ask the AI teaching assistant; send the recent conversation for context")
    @PostMapping("/chat")
    public AssistantReply chat(@Valid @RequestBody AssistantRequest request) {
        return new AssistantReply(assistantService.reply(request.messages()));
    }

    public record AssistantRequest(@NotEmpty @Size(max = 20) List<@Valid AssistantMessage> messages) {
    }

    public record AssistantReply(String reply) {
    }
}
