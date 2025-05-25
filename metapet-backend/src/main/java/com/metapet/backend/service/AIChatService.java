package com.metapet.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class AIChatService {

    private final WebClient webClient;

    @Value("${gemini.api.key:YOUR_GEMINI_API_KEY_HERE}") // Default if not in properties
    private String apiKey;

    // Hypothetical Gemini API endpoint for text generation
    private static final String GEMINI_API_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=%s";

    public AIChatService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(String.format(GEMINI_API_URL_TEMPLATE, apiKey)).build();
    }
    
    // Helper method to construct the request body for Gemini
    private Map<String, Object> buildGeminiRequestBody(String userMessage) {
        Map<String, String> part = Collections.singletonMap("text", userMessage);
        Map<String, List<Map<String, String>>> content = Collections.singletonMap("parts", Collections.singletonList(part));
        return Collections.singletonMap("contents", Collections.singletonList(content));
    }

    /**
     * Generates an AI response by calling the Gemini LLM API.
     *
     * @param userMessage The message from the user.
     * @return A Mono<String> containing the AI-generated reply, or a fallback message on error.
     */
    public Mono<String> getRealAIResponse(String userMessage) {
        if (apiKey == null || "YOUR_GEMINI_API_KEY_HERE".equals(apiKey)) {
            System.err.println("AIChatService: API Key not configured or is a placeholder. Returning mock response.");
            return Mono.just("AI Service not configured. This is a mock reply indicating setup is needed.");
        }
        
        // Update WebClient instance with the actual API key if it was loaded from properties after construction
        WebClient currentWebClient = this.webClient.mutate().baseUrl(String.format(GEMINI_API_URL_TEMPLATE, apiKey)).build();

        Map<String, Object> requestBody = buildGeminiRequestBody(userMessage);

        return currentWebClient.post()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(GeminiResponse.class) // Use a DTO to map the response
                .map(response -> {
                    // Extract text from the first candidate, first part
                    if (response != null && response.getCandidates() != null && !response.getCandidates().isEmpty()) {
                        GeminiResponse.Candidate firstCandidate = response.getCandidates().get(0);
                        if (firstCandidate.getContent() != null && firstCandidate.getContent().getParts() != null && !firstCandidate.getContent().getParts().isEmpty()) {
                            return firstCandidate.getContent().getParts().get(0).getText();
                        }
                    }
                    return "Sorry, I received an unexpected response structure from the AI.";
                })
                .onErrorResume(e -> {
                    // Log the error (e.g., using a logger framework)
                    System.err.println("AIChatService: Error calling Gemini API: " + e.getMessage());
                    return Mono.just("Sorry, I couldn't connect to the AI right now. Please try again later.");
                });
    }

    // Static nested DTOs for mapping Gemini API JSON response
    // Based on the example structure:
    // { "candidates": [{ "content": { "parts": [{ "text": "AI response" }], "role": "model" } }] }
    public static class GeminiResponse {
        private List<Candidate> candidates;
        public List<Candidate> getCandidates() { return candidates; }
        public void setCandidates(List<Candidate> candidates) { this.candidates = candidates; }

        public static class Candidate {
            private Content content;
            public Content getContent() { return content; }
            public void setContent(Content content) { this.content = content; }
        }

        public static class Content {
            private List<Part> parts;
            private String role; // "model"
            public List<Part> getParts() { return parts; }
            public void setParts(List<Part> parts) { this.parts = parts; }
            public String getRole() { return role; }
            public void setRole(String role) { this.role = role; }
        }

        public static class Part {
            private String text;
            public String getText() { return text; }
            public void setText(String text) { this.text = text; }
        }
    }
}
