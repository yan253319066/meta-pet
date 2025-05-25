package com.metapet.backend.dto;

public class EmoteRequest {
    private String userId;
    private String nftId;
    private String emoteType; // e.g., "Happy", "Spin", "Wiggle"

    // Constructors
    public EmoteRequest() {
    }

    public EmoteRequest(String userId, String nftId, String emoteType) {
        this.userId = userId;
        this.nftId = nftId;
        this.emoteType = emoteType;
    }

    // Getters and Setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getNftId() {
        return nftId;
    }

    public void setNftId(String nftId) {
        this.nftId = nftId;
    }

    public String getEmoteType() {
        return emoteType;
    }

    public void setEmoteType(String emoteType) {
        this.emoteType = emoteType;
    }
}
