package com.metapet.backend.dto;

public class EmoteResponse {
    private String statusMessage;
    private String emotePlayed;

    // Constructors
    public EmoteResponse() {
    }

    public EmoteResponse(String statusMessage, String emotePlayed) {
        this.statusMessage = statusMessage;
        this.emotePlayed = emotePlayed;
    }

    // Getters and Setters
    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }

    public String getEmotePlayed() {
        return emotePlayed;
    }

    public void setEmotePlayed(String emotePlayed) {
        this.emotePlayed = emotePlayed;
    }
}
