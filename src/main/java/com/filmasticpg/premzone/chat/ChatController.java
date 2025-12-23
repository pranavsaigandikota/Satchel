package com.filmasticpg.premzone.chat;

import com.filmasticpg.premzone.chat.model.ChatSession;
import com.filmasticpg.premzone.chat.model.ChatMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {

    private final AIService aiService;

    public ChatController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/start")
    public ResponseEntity<ChatSession> startSession(@RequestBody Map<String, String> payload) {
        String title = payload.get("title");
        return ResponseEntity.ok(aiService.startNewSession(title));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatSession>> getHistory() {
        return ResponseEntity.ok(aiService.getUserHistory());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatSession> getSession(@PathVariable Long id) {
        return ResponseEntity.ok(aiService.getSession(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        aiService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/title")
    public ResponseEntity<ChatSession> renameSession(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newTitle = payload.get("title");
        return ResponseEntity.ok(aiService.renameSession(id, newTitle));
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<String> sendMessage(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String message = payload.get("message");
        String image = payload.get("image"); // Optional Base64 image
        String mimeType = payload.get("mimeType"); // Optional MimeType
        String response = aiService.generateResponse(id, message, image, mimeType);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/execute-action")
    public ResponseEntity<String> executeAction(@RequestBody Map<String, Object> payload) {
        String proposalJson = (String) payload.get("proposal");
        Long messageId = payload.containsKey("messageId") ? Long.valueOf(payload.get("messageId").toString()) : null;

        aiService.executeProposal(proposalJson, messageId);
        return ResponseEntity.ok("Action executed successfully.");
    }
}
