package com.metapet.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.metapet.backend.PetActivityLog; // Assuming PetActivityLog is in this package
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PetLogService {

    private final List<PetActivityLog> activityLogStore = new ArrayList<>();
    private final ObjectMapper objectMapper;

    public PetLogService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT); // For pretty printing JSON
    }

    /**
     * Records a feed action.
     *
     * @param userId The ID of the user performing the action.
     * @param nftId The ID of the NFT being fed.
     */
    public void recordFeedAction(String userId, String nftId) {
        Map<String, Object> details = new HashMap<>();
        details.put("foodType", "standard Kibble"); // Hardcoded detail for now

        PetActivityLog logEntry = new PetActivityLog(userId, nftId, "FEED", details);
        activityLogStore.add(logEntry);

        try {
            String jsonLog = objectMapper.writeValueAsString(logEntry);
            System.out.println("PET_LOG_SERVICE (Feed Action): " + jsonLog);
        } catch (JsonProcessingException e) {
            System.err.println("PET_LOG_SERVICE: Error serializing log to JSON: " + e.getMessage());
            // Fallback to simple logging if JSON fails
            System.out.println("PET_LOG_SERVICE (Feed Action - Fallback): User '" + userId + "' fed NFT '" + nftId + "'. Details: " + details);
        }
    }

    /**
     * Records an emote action.
     *
     * @param userId The ID of the user performing the action.
     * @param nftId The ID of the NFT.
     * @param emoteType The type of emote performed (e.g., "Happy", "Spin").
     */
    public void recordEmoteAction(String userId, String nftId, String emoteType) {
        Map<String, Object> details = new HashMap<>();
        details.put("emote", emoteType);

        PetActivityLog logEntry = new PetActivityLog(userId, nftId, "EMOTE", details);
        activityLogStore.add(logEntry);

        try {
            String jsonLog = objectMapper.writeValueAsString(logEntry);
            System.out.println("PET_LOG_SERVICE (Emote Action): " + jsonLog);
        } catch (JsonProcessingException e) {
            System.err.println("PET_LOG_SERVICE: Error serializing log to JSON: " + e.getMessage());
            System.out.println("PET_LOG_SERVICE (Emote Action - Fallback): User '" + userId + "' triggered emote '" + emoteType + "' for NFT '" + nftId + "'.");
        }
    }

    /**
     * Retrieves logs for a specific NFT.
     *
     * @param nftId The ID of the NFT.
     * @return A list of PetActivityLog objects for the given NFT.
     */
    public List<PetActivityLog> getLogsForNft(String nftId) {
        return activityLogStore.stream()
                .filter(log -> nftId.equals(log.getNftId()))
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all activity logs.
     * @return A list of all PetActivityLog objects.
     */
    public List<PetActivityLog> getAllLogs() {
        return new ArrayList<>(activityLogStore); // Return a copy
    }
}
