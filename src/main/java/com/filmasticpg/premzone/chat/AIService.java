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
import com.filmasticpg.premzone.item.FoodItem;
import com.filmasticpg.premzone.item.MedicalItem;
import com.filmasticpg.premzone.item.PantryItem;
import com.filmasticpg.premzone.item.ElectronicItem;
import com.filmasticpg.premzone.item.SupplyItem;
import com.filmasticpg.premzone.item.InventoryItem;
import com.filmasticpg.premzone.item.InventoryItemService;
import com.filmasticpg.premzone.user.AppUser;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.model.Media;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MimeTypeUtils;

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
    public String generateResponse(Long sessionId, String userMessage, String base64Image, String mimeType) {
        ChatSession session = getSession(sessionId);

        // 1. Save User Message (Text part)
        // Note: We are currently NOT saving the image to DB to save space, but we use
        // it for generation.
        ChatMessage userMsg = new ChatMessage(session, userMessage + (base64Image != null ? " [Image Uploaded]" : ""),
                MessageRole.USER);
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
                      {"id": 123, "name": "Milk", "quantity": 2},
                      {"id": 456, "name": "Eggs", "quantity": 1}
                   ]
                }
                ```
                OR
                ```json
                {
                   "action": "ADD_ITEMS",
                   "items": [
                      {
                        "name": "Milk",
                        "quantity": 1,
                        "groupId": 1,
                        "category": "Dairy",
                        "expiryDate": "2024-12-31",
                        "type": "Food"
                      }
                   ]
                }
                ```

                RULES FOR ADDING:
                1. If the user provides a list or image of items, use "ADD_ITEMS".
                2. Pick the most relevant Group ID from context. If unsure, use the first one.
                3. **ESTIMATE** details if not provided:
                   - `category`: Infer from name (e.g., Apple -> Produce/Food, Tylenol -> Medical).
                   - `expiryDate`: ESTIMATE for Food/Medical. (Milk: +7 days, Veggies: +5 days, Canned: +1 year). Format YYYY-MM-DD.
                   - `type`: 'Food', 'Medical', 'Electronics', 'Supply', 'Pantry'.
                4. For Images: Analyze the image to identify items and quantities.

                NEVER propose removing Non-Consumable items (like Tools) unless explicitly asked to.
                For recipes, only reduce Ingredients (Food/Pantry).
                IMPORTANT: You MUST include the exact "name" of the item in the JSON so the user knows what is being removed.
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

        // Add Current User Message (Multi-modal if image exists)
        if (base64Image != null && !base64Image.isEmpty()) {
            try {
                // Use provided mimeType or default to JPEG
                org.springframework.util.MimeType type = (mimeType != null && !mimeType.isEmpty())
                        ? MimeTypeUtils.parseMimeType(mimeType)
                        : MimeTypeUtils.IMAGE_JPEG;

                Media media = new Media(type, new org.springframework.core.io.ByteArrayResource(
                        java.util.Base64.getDecoder().decode(base64Image)));
                promptMessages.add(new UserMessage(userMessage, List.of(media)));
            } catch (Exception e) {
                // Fallback if image fails
                promptMessages.add(new UserMessage(userMessage + " [Image Upload Failed: " + e.getMessage() + "]"));
            }
        } else {
            promptMessages.add(new UserMessage(userMessage));
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
    public void executeProposal(String jsonProposal, Long messageId) {
        try {
            JsonNode root = objectMapper.readTree(jsonProposal);
            String action = root.path("action").asText();
            boolean executed = false;

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
                    executed = true;
                }
            } else if ("ADD_ITEMS".equals(action)) {
                JsonNode items = root.path("items");
                if (items.isArray()) {
                    for (JsonNode item : items) {
                        try {
                            String name = item.path("name").asText();
                            int quantity = item.path("quantity").asInt();
                            String type = item.path("type").asText("Food");
                            String categoryName = item.path("category").asText("General");
                            // Default to first group if not specified.
                            Long groupId = item.has("groupId") ? item.path("groupId").asLong() : 1L;
                            if (groupId == 0)
                                groupId = 1L; // Fallback

                            // Estimate expiry if present
                            String expiryDateStr = item.has("expiryDate") ? item.path("expiryDate").asText() : null;
                            LocalDate expiryDate = (expiryDateStr != null && !expiryDateStr.isEmpty())
                                    ? LocalDate.parse(expiryDateStr)
                                    : null;

                            InventoryItem newItem;
                            // Factory logic for concrete items
                            switch (type.toLowerCase()) {
                                case "food":
                                    newItem = new FoodItem();
                                    break;
                                case "medical":
                                    newItem = new MedicalItem();
                                    break;
                                case "pantry":
                                    newItem = new PantryItem();
                                    break;
                                case "electronics":
                                    newItem = new ElectronicItem();
                                    break;
                                case "supply":
                                default:
                                    newItem = new SupplyItem(); // Default to Supply
                                    break;
                            }

                            newItem.setName(name);
                            newItem.setQuantity(quantity);
                            // newItem.setType(type); // Removed as it doesn't exist; class determines type
                            if (newItem instanceof ExpirableItem expItem) {
                                expItem.setExpiryDate(expiryDate);
                            }
                            // Note: condition is not in ExpirableItem base but InventoryItem depending on
                            // implementation.
                            // Assuming InventoryItem has setCondition or similar if needed, but not
                            // critical for MVP.

                            inventoryItemService.addItem(groupId, newItem, categoryName);

                        } catch (Exception e) {
                            System.err.println("Failed to add item: " + e.getMessage());
                        }
                    }
                    executed = true;
                }
            }

            // Persist execution state if messageId is provided
            if (executed && messageId != null) {
                ChatMessage message = chatMessageRepository.findById(messageId).orElse(null);
                if (message != null) {
                    // Start simple: Append a flag or modify JSON.
                    // Best way is to parse the original content, find the JSON block, and inject
                    // "executed": true.
                    // But parsing mix of text and JSON is hard.
                    // Easier: Just append a marker [EXECUTED] or similar and handle in frontend?
                    // Or since the frontend parses the JSON block, we can just edit the JSON block
                    // in the text.

                    String content = message.getContent();
                    // Basic string replacement to inject "executed": true into the JSON action
                    // block
                    // We look for the "action": "..." part and insert "executed": true, right
                    // before it.
                    // Robustness: This is heuristic but works for our generated prompts
                    if (content.contains("\"action\":")) {
                        String updatedContent = content.replaceFirst("\"action\":", "\"executed\": true, \"action\":");
                        message.setContent(updatedContent);
                        chatMessageRepository.save(message);
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
            sb.append(String.format("Group: %s [ID: %d]\n", group.getGroupName(), group.getId()));
            for (InventoryItem item : group.getItems()) {
                String category = "Unknown";
                if (item.getCategory() != null) {
                    category = item.getCategory().getName();
                }

                sb.append(String.format("  - [ID: %d] %s (Qty: %d) [Category: %s]",
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
