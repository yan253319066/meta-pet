package com.metapet.backend;

import com.metapet.backend.dto.AIChatRequest;
import com.metapet.backend.dto.AIChatResponse;
import com.metapet.backend.dto.FeedRequest;
import com.metapet.backend.dto.FeedResponse;
import com.metapet.backend.service.AIChatService;
import com.metapet.backend.service.PetLogService;
import com.metapet.backend.service.MetadataUpdateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/pets")
@CrossOrigin("*") // Allow all origins for simplicity
public class Pet3DController {

    private static final Map<String, PetData> mockPetDatabase = new HashMap<>();

    static {
        mockPetDatabase.put("1", new PetData("1", "RoboDog X1", "dog", "Metallic Silver", 5));
        mockPetDatabase.put("2", new PetData("2", "CyberCat Z2", "cat", "Neon Pink", 3));
        mockPetDatabase.put("3", new PetData("3", "PixelBird A3", "bird", "Sky Blue", 7));
        mockPetDatabase.put("4", new PetData("4", "MechaPanda G4", "panda", "Black & White", 4));
    }

    private final AIChatService aiChatService;
    private final PetLogService petLogService;
    private final MetadataUpdateService metadataUpdateService;

    @Autowired
    public Pet3DController(AIChatService aiChatService, PetLogService petLogService, MetadataUpdateService metadataUpdateService) {
        this.aiChatService = aiChatService;
        this.petLogService = petLogService;
        this.metadataUpdateService = metadataUpdateService;
    }

    @GetMapping("/{nftId}")
    public PetData getPetData(@PathVariable String nftId) {
        return mockPetDatabase.getOrDefault(nftId,
                new PetData(nftId, "Unknown Pet", "unknown", "N/A", 0));
    }

    @PostMapping("/chat")
    public AIChatResponse chatWithPet(@RequestBody AIChatRequest chatRequest) {
        String reply = aiChatService.getMockResponse(chatRequest.getMessage());
        return new AIChatResponse(reply);
    }

    @PostMapping("/feed")
    public FeedResponse feedPet(@RequestBody FeedRequest feedRequest) {
        // Log the action
        petLogService.recordFeedAction(feedRequest.getUserId(), feedRequest.getNftId());

        // Simulate metadata update
        metadataUpdateService.simulateMetadataUpdateForFeed(feedRequest.getNftId());

        // Retrieve pet's name for the response message
        PetData pet = mockPetDatabase.get(feedRequest.getNftId());
        String petName = (pet != null) ? pet.getName() : "the pet"; // Fallback name

        String statusMessage = "Successfully fed " + petName + " (NFT ID: " + feedRequest.getNftId() + ").";
        return new FeedResponse(statusMessage);
    }
}
