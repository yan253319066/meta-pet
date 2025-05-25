<template>
  <div class="pets-view-container">
    <!-- Left Column: NFT List -->
    <div class="column left-column">
      <h2>My 3D Pets</h2>
      <div v-if="isLoadingNFTList" class="loading-nft-list">Loading your pets...</div>
      <ul v-else-if="userNFTs.length > 0">
        <li v-for="nft in userNFTs" :key="nft.id" @click="selectNFT(nft)" 
            :class="{ 'selected-nft': selectedNftId === nft.id }">
          {{ nft.name }} <span class="nft-rarity">({{ nft.metadata.rarity }})</span>
        </li>
      </ul>
      <div v-else>No pets found.</div>
    </div>

    <!-- Center Column: 3D Scene -->
    <div class="column center-column" ref="sceneContainer">
      <div v-if="isModelLoading" class="model-loading-indicator">
        Loading 3D Model...
      </div>
    </div>

    <!-- Right Column: Chat/Controls & Pet Data -->
    <div class="column right-column">
      <div v-if="selectedPetData" class="chat-interface-container">
        <h3>Chat with {{ selectedPetData.displayName }}</h3>
        <div class="pet-info-bar">
          <p><strong>Name:</strong> {{ selectedPetData.displayName }}</p>
          <p><strong>Type:</strong> {{ selectedPetData.modelType }} | <strong>Color:</strong> {{ selectedPetData.color }} | <strong>Level:</strong> {{ selectedPetData.level }}</p>
           <p v-if="selectedPetData.fullNftData"><strong>Rarity:</strong> {{ selectedPetData.fullNftData.metadata.rarity }}</p>
        </div>

        <div class="pet-actions-bar">
          <button @click="feedPet" :disabled="isAnyActionActive" class="action-button feed-button">Feed {{ selectedPetData.displayName }}</button>
          <button @click="triggerHappyEmote" :disabled="isAnyActionActive" class="action-button emote-button">Happy 🎉</button>
          <button @click="triggerSpinEmote" :disabled="isAnyActionActive" class="action-button emote-button">Spin 💫</button>
          <button @click="triggerWiggleEmote" :disabled="isAnyActionActive" class="action-button emote-button">Wiggle ✨</button>
        </div>
        
        <div class="animation-controls-bar" v-if="availableAnimations.length > 0">
          <h4>Animations:</h4>
          <button v-for="animName in availableAnimations" :key="animName" 
                  @click="playAnimation(animName)" 
                  :disabled="isAnyActionActive"
                  class="action-button animation-button">
            Play {{ animName }}
          </button>
        </div>
        
        <div class="chat-messages-area" ref="chatMessagesArea">
          <div v-for="(message, index) in chatMessages" :key="index" 
               :class="['chat-message', message.sender === 'user' ? 'user-message' : 'pet-message', message.sender === 'system' ? 'system-message' : '']">
            <span class="message-sender">
              {{ message.sender === 'user' ? 'You' : (message.sender === 'pet' ? selectedPetData.displayName : 'System') }}:
            </span>
            <span class="message-text" v-html="message.text"></span>
            <span class="message-timestamp">{{ formatTimestamp(message.timestamp) }}</span>
          </div>
          <div v-if="isPetTyping" class="chat-message pet-message typing-indicator">
            <span class="message-sender">{{ selectedPetData.displayName }}: </span>
            <span class="message-text">
              <i>typing<span class="ellipsis-dot">.</span><span class="ellipsis-dot">.</span><span class="ellipsis-dot">.</span></i>
            </span>
          </div>
        </div>
        
        <div class="chat-input-area">
          <input type="text" v-model="currentUserMessage" @keyup.enter="sendMessage" placeholder="Type your message..." :disabled="isAnyActionActive"/>
          <button @click="toggleVoiceListening" 
                  :class="['mic-button', { 'is-listening': isListening, 'not-supported': !speechApiSupported }]" 
                  :disabled="!speechApiSupported || isAnyActionActiveButVoice"
                  :title="speechApiSupported ? (isListening ? 'Stop Listening' : 'Start Voice Input') : 'Voice input not supported'">
            🎤
          </button>
          <button @click="sendMessage" :disabled="isAnyActionActive || currentUserMessage.trim() === ''">Send</button>
          <button @click="toggleTts" 
                  :class="['tts-button', { 'is-enabled': isTtsEnabled, 'not-supported': !ttsSupported }]"
                  :disabled="!ttsSupported"
                  :title="ttsSupported ? (isTtsEnabled ? 'Mute AI Responses' : 'Speak AI Responses') : 'Voice output not supported'">
            {{ isTtsEnabled ? '🔇' : '🔊' }}
          </button>
        </div>
         <div v-if="!speechApiSupported || !ttsSupported" class="speech-support-notice">
            <span v-if="!speechApiSupported">Voice input (Speech Recognition) not supported. </span>
            <span v-if="!ttsSupported">Voice output (Text-to-Speech) not supported.</span>
        </div>
      </div>
      <div v-else-if="isLoadingPetData || isLoadingNFTList || isModelLoading">
        <p>Loading...</p>
      </div>
      <div v-else>
        <p>Select a pet from the list to see its details and chat. The 3D model will update in the center panel.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { fetchUserNFTs } from '../services/nftService.js';

// --- Reactive State Declarations ---
const userNFTs = ref([]); 
const isLoadingNFTList = ref(true);
const selectedNftId = ref(null); 
const selectedPetData = ref(null); 
const isLoadingPetData = ref(false); 
const isModelLoading = ref(false);

const sceneContainer = ref(null);
let renderer;
let scene;
let camera;
let clock; 
let currentPetModel = null; 
let animationFrameId;
const modelOriginalScale = new THREE.Vector3(); 
const modelOriginalPosition = new THREE.Vector3();
const modelOriginalRotation = new THREE.Euler();

let mixer = null; 
let animationActions = {}; 
let loadedGltfAnimations = [];

const isPetActionInProgress = ref(false); 
const chatMessages = ref([]);
const currentUserMessage = ref('');
const chatMessagesArea = ref(null); 
const isPetTyping = ref(false); 

// Voice Input State
const speechApiSupported = ref(true);
const isListening = ref(false);
let recognition = null; 

// Voice Output (TTS) State
const ttsSupported = ref(true);
const isTtsEnabled = ref(false);
let synth = null; // window.speechSynthesis instance

const gltfLoader = new GLTFLoader();

const isAnyActionActive = computed(() => {
  return isPetActionInProgress.value || isModelLoading.value || isPetTyping.value || isListening.value;
});
const isAnyActionActiveButVoice = computed(() => {
    return isPetActionInProgress.value || isModelLoading.value || isPetTyping.value;
});

const availableAnimations = computed(() => {
  return selectedPetData.value?.fullNftData?.metadata?.animations || [];
});

// --- Utility Functions ---
const formatTimestamp = (timestamp) => { return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
const scrollToBottom = () => { nextTick(() => { if (chatMessagesArea.value) chatMessagesArea.value.scrollTop = chatMessagesArea.value.scrollHeight; }); };
watch(chatMessages, scrollToBottom, { deep: true });

const resetPetActionFlag = () => { isPetActionInProgress.value = false; };
const resetTypingFlag = () => { isPetTyping.value = false; }; 

// --- Pet Actions & Emotes ---
const feedPet = async () => { /* ... (unchanged) ... */ };
const triggerHappyEmote = () => { /* ... (unchanged) ... */ };
const triggerSpinEmote = () => { /* ... (unchanged) ... */ };
const triggerWiggleEmote = () => { /* ... (unchanged) ... */ };
const playAnimation = (animationName) => { /* ... (unchanged) ... */ };

// --- Chat Logic ---
const sendMessage = async () => {
  if (currentUserMessage.value.trim() === '' || isPetTyping.value || isPetActionInProgress.value || isModelLoading.value) return;
  const userMessageText = currentUserMessage.value;
  chatMessages.value.push({ sender: 'user', text: userMessageText, timestamp: new Date() });
  currentUserMessage.value = ''; 
  isPetTyping.value = true; 

  try {
    const response = await fetch('http://localhost:8080/api/pets/chat', { /* ... */ });
    const backendResponse = await response.json(); 
    if (!response.ok) throw new Error(backendResponse.reply || `HTTP error! status: ${response.status}`);
    
    const aiReplyText = backendResponse.reply;
    chatMessages.value.push({ sender: 'pet', text: aiReplyText, timestamp: new Date() });
    speakText(aiReplyText); // Speak the AI's response

  } catch (error) {
    console.error('Failed to send message:', error);
    const errorText = error.message || "Error connecting to AI.";
    chatMessages.value.push({ sender: 'pet', text: errorText, timestamp: new Date() });
    speakText(errorText); // Speak the error message
  } finally {
    resetTypingFlag(); 
    scrollToBottom();
  }
};

// --- Voice Input Logic ---
const toggleVoiceListening = () => { /* ... (unchanged) ... */ };
const setupSpeechRecognition = () => { /* ... (unchanged) ... */ };

// --- Voice Output (TTS) Logic ---
const speakText = (text) => {
  if (!isTtsEnabled.value || !ttsSupported.value || !synth || !text) {
    return;
  }

  if (synth.speaking) {
    console.log("TTS: Cancelling previous speech before speaking new text.");
    synth.cancel(); 
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; // Or make this configurable
  // utterance.voice = selectedVoice; // Optional: if voice selection is implemented
  
  utterance.onerror = (event) => {
    console.error('SpeechSynthesisUtterance.onerror', event);
    chatMessages.value.push({ sender: 'system', text: `Speech output error: ${event.error}`, timestamp: new Date()});
  };
  
  synth.speak(utterance);
};

const toggleTts = () => {
  isTtsEnabled.value = !isTtsEnabled.value;
  if (!isTtsEnabled.value && synth && synth.speaking) {
    synth.cancel(); // Stop speaking if TTS is turned off
  }
  // Optionally, provide feedback:
  const status = isTtsEnabled.value ? "enabled" : "disabled";
  chatMessages.value.push({ sender: 'system', text: `Voice output ${status}.`, timestamp: new Date() });
  speakText(`Voice output ${status}.`); // Speak the status change
};

const setupSpeechSynthesis = () => {
  if ('speechSynthesis' in window) {
    synth = window.speechSynthesis;
    ttsSupported.value = true;
    // Optional: Populate voice list (often needs voiceschanged event)
    // synth.onvoiceschanged = () => {
    //   const voices = synth.getVoices();
    //   console.log("Available TTS voices:", voices);
    // };
  } else {
    ttsSupported.value = false;
    console.warn("Web Speech Synthesis API not supported by this browser.");
  }
};

// --- Three.js Model Update Logic ---
const removeCurrentPetModel = () => { /* ... (unchanged) ... */ };
const updatePetModelDisplay = (petDisplayData) => { /* ... (unchanged) ... */ };

// --- NFT Selection & Data Handling ---
const selectNFT = async (nft) => { 
  if (isLoadingPetData.value || isAnyActionActive.value) { /* ... */ return; }
  
  selectedNftId.value = nft.id; 
  isLoadingPetData.value = true; 
  selectedPetData.value = null; 
  chatMessages.value = []; 
  // isPetTyping will be set for greeting

  // If TTS was speaking, stop it when changing pets
  if (synth && synth.speaking) {
    synth.cancel();
  }

  try {
    const displayDataResponse = await fetch(`http://localhost:8080/api/pets/${nft.id}`);
    if (!displayDataResponse.ok) throw new Error(`HTTP error! status: ${displayDataResponse.status}`);
    const backendDisplayProfile = await displayDataResponse.json();

    const petDisplayProfile = { /* ... */ };
    selectedPetData.value = petDisplayProfile;
    updatePetModelDisplay(petDisplayProfile); 

    isPetTyping.value = true; 
    const greetingResponse = await fetch('http://localhost:8080/api/pets/chat', { /* ... */ });
    const greetingData = await greetingResponse.json(); 
    if (!greetingResponse.ok) throw new Error(greetingData.reply || `Greeting HTTP error!`);
    
    const greetingText = greetingData.reply;
    chatMessages.value.push({ sender: 'pet', text: greetingText, timestamp: new Date() });
    speakText(greetingText); // Speak the initial greeting

  } catch (error) {
    console.error('Failed to select NFT or get initial greeting:', error);
    const errorText = error.message || "Sorry, I had trouble getting ready.";
    // ... (error display logic)
    speakText(errorText); // Speak the error
  } finally {
    isLoadingPetData.value = false; 
    resetTypingFlag(); 
    scrollToBottom();
  }
};

// --- Three.js Scene Setup ---
const setupThreeScene = (container) => { /* ... (unchanged) ... */ };
// --- Lifecycle Hooks ---
let cleanupThreeScene = () => {};
onMounted(async () => { 
  setupSpeechRecognition(); 
  setupSpeechSynthesis(); // Initialize Speech Synthesis
  // ... (rest of onMounted unchanged)
});
onUnmounted(() => { 
  if (recognition) { /* ... (recognition cleanup) ... */ }
  if (synth && synth.speaking) { // Stop any TTS on unmount
    synth.cancel();
  }
  cleanupThreeScene(); 
});

// --- (Full script content from previous turns assumed for context) ---
</script>

<style scoped>
/* ... existing styles ... */
.mic-button { /* ... */ }
@keyframes pulse-mic { /* ... */ }
.speech-support-notice { /* ... */ }

.tts-button {
  padding: 10px 12px;
  margin-left: 5px;
  border-radius: 50%;
  background-color: #6c757d; /* Neutral gray */
  color: white;
  border: none;
  cursor: pointer;
  font-size: 1.1em;
  line-height: 1;
}
.tts-button:hover {
  background-color: #5a6268;
}
.tts-button.is-enabled {
  background-color: #28a745; /* Green when enabled */
}
.tts-button.not-supported {
  background-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.7;
}
.tts-button:disabled:not(.not-supported) {
    background-color: #adb5bd; /* For when any other action is active */
    cursor: not-allowed;
}

/* Ensure existing styles are here */
.pets-view-container { display: flex; height: calc(100vh - 100px); width: 100%; }
.column { padding: 15px; border: 1px solid #ccc; overflow-y: auto; }
/* ... other styles from previous turns ... */
.chat-input-area { display: flex; padding: 15px; border-top: 1px solid #ccc; background-color: #f8f9fa; align-items: center; }
.chat-input-area input { flex-grow: 1; /* ... */ }
.chat-input-area button { /* ... send button style ... */ }
.right-column > p { padding: 15px; text-align: center; }

</style>
