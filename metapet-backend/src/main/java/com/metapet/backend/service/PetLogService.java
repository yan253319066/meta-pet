package com.metapet.backend.service;

import org.springframework.stereotype.Service;

@Service
public class PetLogService {

    /**
     * Simulates logging a feed action.
     *
     * @param userId The ID of the user performing the action.
     * @param nftId The ID of the NFT being fed.
     */
    public void recordFeedAction(String userId, String nftId) {
        // In a real application, this would write to a database or a log file.
        System.out.println("LOG_SERVICE: User '" + userId + "' fed NFT '" + nftId + "'. Timestamp: " + System.currentTimeMillis());
    }
}
