package com.filmasticpg.premzone.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.filmasticpg.premzone.chat.model.ChatMessage;
import com.filmasticpg.premzone.chat.model.ChatSession;
import com.filmasticpg.premzone.chat.model.MessageRole;
import com.filmasticpg.premzone.chat.repo.ChatMessageRepository;
import com.filmasticpg.premzone.chat.repo.ChatSessionRepository;
import com.filmasticpg.premzone.config.UserContext;
import com.filmasticpg.premzone.group.InventoryGroup;
import com.filmasticpg.premzone.group.InventoryGroupService;
import com.filmasticpg.premzone.item.ExpirableItem;
import com.filmasticpg.premzone.item.InventoryItem;
import com.filmasticpg.premzone.item.InventoryItemService;
import com.filmasticpg.premzone.user.AppUser;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class AIService {

    private final ChatClient chatClient;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final InventoryGroupService inventoryGroupService;
    private final InventoryItemService inventoryItemService;
    private final UserContext userContext;
    private final ObjectMapper objectMapper;

    public AIService(ChatClient.Builder builder,
            ChatSessionRepository chatSessionRepository,
            ChatMessageRepository chatMessageRepository,
            InventoryGroupService inventoryGroupService,
            InventoryItemService inventoryItemService,
            UserContext userContext,
            ObjectMapper objectMapper) {
        this.chatClient = builder.build();
        this.chatSessionRepository = chatSessionRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.inventoryGroupService = inventoryGroupService;
        this.inventoryItemService = inventoryItemService;
        this.userContext = userContext;
        this.objectMapper = objectMapper;
    }

    // --- Session Management ---

    @Transactional
    public ChatSession startNewSession(String title) {
        AppUser user = userContext.getCurrentUser();
        ChatSession session = new ChatSession();
        session.setTitle(title != null ? title : "New Chat");
        session.setUser(user);
        return chatSessionRepository.save(session);
    }

    public List<ChatSession> getUserHistory() {
        AppUser user = userContext.getCurrentUser();
        return chatSessionRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public ChatSession getSession(Long sessionId) {
        AppUser user = userContext.getCurrentUser();
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to chat session");
        }
        return session;
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        AppUser user = userContext.getCurrentUser();
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to chat session");
        }
        chatSessionRepository.delete(session);
    }

    // --- Chat Logic ---

    @Transactional
    public String generateResponse(Long sessionId, String userMessage) {
        ChatSession session = getSession(sessionId);

        // 1. Save User Message
        ChatMessage userMsg = new ChatMessage(session, userMessage, MessageRole.USER);
        chatMessageRepository.save(userMsg);

        // 2. Build Context
        String inventoryContext = buildInventoryContext(userMessage);

        // 3. Build History
        List<ChatMessage> historyEntities = chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
        List<Message> promptMessages = new ArrayList<>();

        // Add System Prompt
        String systemText = """
                You are a chill, Gen Z roommate/friend. You help the user manage their inventory and cook stuff.
                Don't be formal. Use casual language (e.g., "No cap", "Bet", "Yo").

                CONTEXT:
                Current Date: %s
                User's Inventory:
                %s

                RULES:
                1. Suggest recipes based on what the user has.
                2. Prioritize items expiring within 7 days. Mention them explicitly (e.g. "Yo, your milk is expiring soon").
                3. Check for specific tools (Category: 'Electronic' or 'Kitchenware'). If available, mention them in **bold** (e.g. "Use your **Air Fryer**").
                4. If the user accepts a suggestion or asks to remove items, provide a JSON PROPOSAL at the end of your response inside a code block.

                PROPOSAL FORMAT:
                ```json
                {
                   "action": "REDUCE_QUANTITY",
                   "items": [
                      {"id": 123, "quantity": 2},
                      {"id": 456, "quantity": 1}
                   ]
                }
                ```
                NEVER propose removing Non-Consumable items (like Tools) unless explicitly asked to.
                For recipes, only reduce Ingredients (Food/Pantry).
                """
                .formatted(LocalDate.now(), inventoryContext);

        promptMessages.add(new SystemMessage(systemText));

        // Add Conversation History
        for (ChatMessage msg : historyEntities) {
            if (msg.getRole() == MessageRole.USER) {
                promptMessages.add(new UserMessage(msg.getContent()));
            } else {
                promptMessages.add(new AssistantMessage(msg.getContent()));
            }
        }

        // 4. Update Title (heuristic)
        if (session.getTitle().equals("New Chat") && historyEntities.size() <= 2) {
            String newTitle = userMessage.length() > 30 ? userMessage.substring(0, 30) + "..." : userMessage;
            session.setTitle(newTitle);
            chatSessionRepository.save(session);
        }

        // 5. Call AI
        String aiResponseText = chatClient.prompt(new Prompt(promptMessages))
                .call()
                .content();

        // 6. Save Assistant Message
        ChatMessage aiMsg = new ChatMessage(session, aiResponseText, MessageRole.ASSISTANT);
        chatMessageRepository.save(aiMsg);

        return aiResponseText;
    }

    @Transactional
    public void executeProposal(String jsonProposal) {
        try {
            JsonNode root = objectMapper.readTree(jsonProposal);
            String action = root.path("action").asText();

            if ("REDUCE_QUANTITY".equals(action)) {
                JsonNode items = root.path("items");
                if (items.isArray()) {
                    for (JsonNode item : items) {
                        Long id = item.path("id").asLong();
                        int quantity = item.path("quantity").asInt();
                        if (id > 0 && quantity > 0) {
                            inventoryItemService.reduceItemQuantity(id, quantity);
                        }
                    }
                }
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Invalid proposal format", e);
        }
    }

    private String buildInventoryContext(String query) {
        List<InventoryGroup> groups = inventoryGroupService.getAllGroups();
        StringBuilder sb = new StringBuilder();

        for (InventoryGroup group : groups) {
            for (InventoryItem item : group.getItems()) {
                String category = "Unknown";
                if (item.getCategory() != null) {
                    category = item.getCategory().getName();
                }

                sb.append(String.format("- [ID: %d] %s (Qty: %d) [Category: %s]",
                        item.getId(), item.getName(), item.getQuantity(), category));

                if (item instanceof ExpirableItem expItem && expItem.getExpiryDate() != null) {
                    sb.append(String.format(" [Expires: %s]", expItem.getExpiryDate()));
                }
                sb.append("\n");
            }
        }
        if (sb.length() == 0)
            return "Inventory is empty.";
        return sb.toString();
    }
}
