package com.metapet.backend;

import java.util.HashMap;
import java.util.Map;

public class PetAttributes {
    private int level;
    private String mood; // e.g., "happy", "neutral", "sad"
    private int hunger; // e.g., 0-100, where 0 is not hungry, 100 is very hungry
    private long lastFedTimestamp;
    private long lastPlayedTimestamp;

    // Default constructor for Jackson or manual instantiation
    public PetAttributes() {
        this.level = 1;
        this.mood = "neutral";
        this.hunger = 50; // Start at a moderate hunger level
        this.lastFedTimestamp = System.currentTimeMillis();
        this.lastPlayedTimestamp = System.currentTimeMillis();
    }

    // Constructor with initial values
    public PetAttributes(int level, String mood, int hunger) {
        this.level = level;
        this.mood = mood;
        this.hunger = hunger;
        this.lastFedTimestamp = System.currentTimeMillis();
        this.lastPlayedTimestamp = System.currentTimeMillis();
    }

    // Getters and Setters
    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public String getMood() {
        return mood;
    }

    public void setMood(String mood) {
        this.mood = mood;
    }

    public int getHunger() {
        return hunger;
    }

    public void setHunger(int hunger) {
        this.hunger = Math.max(0, Math.min(100, hunger)); // Clamp hunger between 0 and 100
    }

    public long getLastFedTimestamp() {
        return lastFedTimestamp;
    }

    public void setLastFedTimestamp(long lastFedTimestamp) {
        this.lastFedTimestamp = lastFedTimestamp;
    }

    public long getLastPlayedTimestamp() {
        return lastPlayedTimestamp;
    }

    public void setLastPlayedTimestamp(long lastPlayedTimestamp) {
        this.lastPlayedTimestamp = lastPlayedTimestamp;
    }

    // Convenience method to return a map representation (useful for "details" in logs or simple display)
    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("level", level);
        map.put("mood", mood);
        map.put("hunger", hunger);
        map.put("lastFedTimestamp", lastFedTimestamp);
        map.put("lastPlayedTimestamp", lastPlayedTimestamp);
        return map;
    }

    // toString for basic logging if needed, though JSON is preferred via ObjectMapper
    @Override
    public String toString() {
        return "PetAttributes{" +
                "level=" + level +
                ", mood='" + mood + '\'' +
                ", hunger=" + hunger +
                ", lastFedTimestamp=" + lastFedTimestamp +
                ", lastPlayedTimestamp=" + lastPlayedTimestamp +
                '}';
    }
}
