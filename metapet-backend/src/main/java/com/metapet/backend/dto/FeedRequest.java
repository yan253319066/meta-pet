package com.metapet.backend.dto;

public class FeedRequest {
    private String userId;
    private String nftId;

    // Constructors
    public FeedRequest() {
    }

    public FeedRequest(String userId, String nftId) {
        this.userId = userId;
        this.nftId = nftId;
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
}
