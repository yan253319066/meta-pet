package com.metapet.backend;

import java.time.Instant;
import java.util.Map;

public class PetActivityLog {
    private String timestamp;
    private String userId;
    private String nftId;
    private String actionType;
    private Map<String, Object> details;

    // Constructors
    public PetActivityLog() {
        this.timestamp = Instant.now().toString();
    }

    public PetActivityLog(String userId, String nftId, String actionType, Map<String, Object> details) {
        this.timestamp = Instant.now().toString();
        this.userId = userId;
        this.nftId = nftId;
        this.actionType = actionType;
        this.details = details;
    }

    // Getters and Setters
    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

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

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public void setDetails(Map<String, Object> details) {
        this.details = details;
    }

    // toString() can be overridden for simple console logging if JSON serialization isn't set up for it
    // However, we'll use Jackson via Spring Boot for JSON printing in the service.
}
