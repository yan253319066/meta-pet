package com.metapet.backend.dto;

public class AIChatRequest {
    private String userId;
    private String message;

    // Constructors
    public AIChatRequest() {
    }

    public AIChatRequest(String userId, String message) {
        this.userId = userId;
        this.message = message;
    }

    // Getters and Setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
