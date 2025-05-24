package com.metapet.backend.dto;

public class AIChatResponse {
    private String reply;

    // Constructors
    public AIChatResponse() {
    }

    public AIChatResponse(String reply) {
        this.reply = reply;
    }

    // Getters and Setters
    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}
