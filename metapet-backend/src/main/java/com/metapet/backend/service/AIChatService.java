package com.metapet.backend.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Service
public class AIChatService {

    private final List<String> mockResponses = Arrays.asList(
            "That's really interesting!",
            "Tell me more about that.",
            "I'm not sure I understand, can you elaborate?",
            "Fascinating!",
            "What do you think about it?",
            "Hmm, let me think...",
            "I love talking about this stuff!"
    );

    private final Random random = new Random();

    /**
     * Generates a mock AI response based on the user's message.
     * For now, it selects a random response from a predefined list,
     * or a specific response if keywords are found.
     *
     * @param userMessage The message from the user.
     * @return A mock AI-generated reply.
     */
    public String getMockResponse(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return "Please say something!";
        }

        String lowerCaseMessage = userMessage.toLowerCase();

        if (lowerCaseMessage.contains("hello") || lowerCaseMessage.contains("hi")) {
            return "Hello there! How are you today?";
        } else if (lowerCaseMessage.contains("how are you")) {
            return "I'm doing great, thanks for asking! Ready to chat.";
        } else if (lowerCaseMessage.contains("name")) {
            return "You can call me your MetaPet AI assistant!";
        } else if (lowerCaseMessage.contains("bye")) {
            return "Goodbye! It was nice chatting with you.";
        }

        // Return a random response from the list
        return mockResponses.get(random.nextInt(mockResponses.size()));
    }
}
