package com.metapet.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.metapet.backend.PetAttributes; // Assuming PetAttributes is in this package
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class MetadataUpdateService {

    private final Map<String, PetAttributes> petAttributesStore = new HashMap<>();
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public MetadataUpdateService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT); // For pretty printing JSON
    }

    // Helper to get or create attributes for an NFT
    private PetAttributes getOrCreateAttributes(String nftId) {
        return petAttributesStore.computeIfAbsent(nftId, k -> new PetAttributes());
    }

    /**
     * Simulates updating metadata after a feed action.
     *
     * @param nftId The ID of the NFT whose metadata is being updated.
     */
    public void simulateMetadataUpdateForFeed(String nftId) {
        PetAttributes currentAttributes = getOrCreateAttributes(nftId);
        Map<String, Object> oldAttributesMap = currentAttributes.toMap(); // Get map before changes

        // Simulate changes due to feeding
        currentAttributes.setHunger(Math.max(0, currentAttributes.getHunger() - (30 + random.nextInt(21)))); // Decrease hunger by 30-50
        currentAttributes.setLastFedTimestamp(System.currentTimeMillis());
        if (currentAttributes.getHunger() < 20) { // If hunger was very low, good mood
            currentAttributes.setMood("happy");
        } else if (currentAttributes.getHunger() < 50) {
            currentAttributes.setMood("content");
        }
        
        // Small chance to level up if fed when very hungry or very happy
        if (random.nextDouble() < 0.1 && (oldAttributesMap.get("hunger") != null && (int)oldAttributesMap.get("hunger") > 70 || "happy".equals(currentAttributes.getMood()))) {
            currentAttributes.setLevel(currentAttributes.getLevel() + 1);
        }

        petAttributesStore.put(nftId, currentAttributes); // Update the store

        try {
            String oldJson = objectMapper.writeValueAsString(oldAttributesMap);
            String newJson = objectMapper.writeValueAsString(currentAttributes.toMap());
            System.out.println("METADATA_UPDATE_SERVICE (Feed Action for NFT '" + nftId + "'):");
            System.out.println("  Old Attributes: " + oldJson);
            System.out.println("  New Attributes: " + newJson);
        } catch (JsonProcessingException e) {
            System.err.println("METADATA_UPDATE_SERVICE: Error serializing attributes to JSON: " + e.getMessage());
        }
    }

    /**
     * Simulates updating metadata after an emote action.
     *
     * @param nftId The ID of the NFT.
     * @param emoteType The type of emote performed.
     */
    public void simulateMetadataUpdateForEmote(String nftId, String emoteType) {
        PetAttributes currentAttributes = getOrCreateAttributes(nftId);
        Map<String, Object> oldAttributesMap = currentAttributes.toMap();

        // Emotes primarily affect mood
        String newMood = currentAttributes.getMood();
        switch (emoteType.toLowerCase()) {
            case "happy":
                newMood = "ecstatic";
                break;
            case "spin":
                newMood = "playful";
                break;
            case "wiggle":
                newMood = "curious";
                break;
            default:
                // No specific mood change for unknown emotes, or could be "confused"
                break;
        }
        currentAttributes.setMood(newMood);
        currentAttributes.setLastPlayedTimestamp(System.currentTimeMillis());

        // Small chance to slightly decrease hunger if playing
        if (random.nextDouble() < 0.05) {
            currentAttributes.setHunger(currentAttributes.getHunger() + 5); // Slightly hungrier after playing
        }

        petAttributesStore.put(nftId, currentAttributes); // Update the store

        try {
            String oldJson = objectMapper.writeValueAsString(oldAttributesMap);
            String newJson = objectMapper.writeValueAsString(currentAttributes.toMap());
            System.out.println("METADATA_UPDATE_SERVICE (Emote Action '" + emoteType + "' for NFT '" + nftId + "'):");
            System.out.println("  Old Attributes: " + oldJson);
            System.out.println("  New Attributes: " + newJson);
        } catch (JsonProcessingException e) {
            System.err.println("METADATA_UPDATE_SERVICE: Error serializing attributes to JSON: " + e.getMessage());
        }
    }
    
    /**
     * Retrieves the current attributes for a specific NFT.
     * @param nftId The ID of the NFT.
     * @return PetAttributes object or null if not found (though getOrCreateAttributes ensures it's usually found).
     */
    public PetAttributes getPetAttributes(String nftId) {
        return petAttributesStore.get(nftId); // Can be null if never interacted with
    }
}
