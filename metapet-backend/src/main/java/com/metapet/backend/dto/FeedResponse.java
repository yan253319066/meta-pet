package com.metapet.backend.dto;

public class FeedResponse {
    private String statusMessage;
    // In the future, we might add fields like:
    // private int newLevel;
    // private int newMoodScore;

    // Constructors
    public FeedResponse() {
    }

    public FeedResponse(String statusMessage) {
        this.statusMessage = statusMessage;
    }

    // Getters and Setters
    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }
}
