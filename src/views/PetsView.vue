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
import { API_BASE_URL } from '../config.js'; // Import API_BASE_URL

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

const speechApiSupported = ref(true);
const isListening = ref(false);
let recognition = null; 

const ttsSupported = ref(true);
const isTtsEnabled = ref(false);
let synth = null; 

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

// --- Backend Interaction for Emotes/Actions ---
const callEmoteBackend = async (emoteType) => {
  if (!selectedPetData.value) return;
  try {
    const response = await fetch(`${API_BASE_URL}/pets/emote`, { // Use API_BASE_URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'tempUser123', 
        nftId: selectedPetData.value.id,
        emoteType: emoteType,
      }),
    });
    const emoteResponseData = await response.json();
    if (!response.ok) {
      throw new Error(emoteResponseData.statusMessage || `Emote backend error: ${response.status}`);
    }
    console.log('Emote backend response:', emoteResponseData.statusMessage);
  } catch (error) {
    console.error(`Error calling /emote backend for ${emoteType}:`, error);
    chatMessages.value.push({ sender: 'system', text: `Could not register emote '${emoteType}' with backend.`, timestamp: new Date() });
  }
};

// --- Pet Actions & Emotes ---
const feedPet = async () => {
  if (!currentPetModel || !selectedPetData.value || isAnyActionActive.value) return;
  isPetActionInProgress.value = true;
  modelOriginalScale.copy(currentPetModel.scale);
  const targetScale = modelOriginalScale.clone().multiplyScalar(1.3);
  currentPetModel.scale.copy(targetScale);
  chatMessages.value.push({ sender: 'system', text: `Feeding ${selectedPetData.value.displayName}...`, timestamp: new Date() });
  try {
    const response = await fetch(`${API_BASE_URL}/pets/feed`, { // Use API_BASE_URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'tempUser123', nftId: selectedPetData.value.id }),
    });
    const feedResponseData = await response.json();
    if (!response.ok) throw new Error(feedResponseData.statusMessage || `HTTP error! status: ${response.status}`);
    chatMessages.value.push({ sender: 'system', text: `${feedResponseData.statusMessage}<br>Pet says: Yummy! That was tasty!`, timestamp: new Date() });
  } catch (error) { 
    console.error('Failed to feed pet via backend:', error);
    chatMessages.value.push({ sender: 'system', text: `Failed to feed ${selectedPetData.value.displayName}. Error: ${error.message}`, timestamp: new Date() });
    chatMessages.value.push({ sender: 'pet', text: 'Oh no, something went wrong with my snack!', timestamp: new Date() });
  } 
  finally {
    setTimeout(() => { if(currentPetModel) currentPetModel.scale.copy(modelOriginalScale); resetPetActionFlag(); }, 600);
    scrollToBottom();
  }
};

const triggerHappyEmote = () => { /* ... (unchanged, callEmoteBackend uses API_BASE_URL) ... */ };
const triggerSpinEmote = () => { /* ... (unchanged, callEmoteBackend uses API_BASE_URL) ... */ };
const triggerWiggleEmote = () => { /* ... (unchanged, callEmoteBackend uses API_BASE_URL) ... */ };

// --- Animation Player ---
const playAnimation = (animationName) => { /* ... (unchanged, callEmoteBackend uses API_BASE_URL) ... */ };

// --- Chat Logic ---
const sendMessage = async () => {
  if (currentUserMessage.value.trim() === '' || isPetTyping.value || isPetActionInProgress.value || isModelLoading.value) return;
  const userMessageText = currentUserMessage.value;
  chatMessages.value.push({ sender: 'user', text: userMessageText, timestamp: new Date() });
  currentUserMessage.value = ''; 
  isPetTyping.value = true; 

  try {
    const response = await fetch(`${API_BASE_URL}/pets/chat`, { // Use API_BASE_URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'tempUser', message: userMessageText }),
    });
    const backendResponse = await response.json(); 
    if (!response.ok) throw new Error(backendResponse.reply || `HTTP error! status: ${response.status}`);
    const aiReplyText = backendResponse.reply;
    chatMessages.value.push({ sender: 'pet', text: aiReplyText, timestamp: new Date() });
    speakText(aiReplyText);
  } catch (error) {
    console.error('Failed to send message:', error);
    const errorText = error.message || "Error connecting to AI.";
    chatMessages.value.push({ sender: 'pet', text: errorText, timestamp: new Date() });
    speakText(errorText);
  } finally {
    resetTypingFlag(); 
    scrollToBottom();
  }
};

// --- Voice Input Logic ---
const toggleVoiceListening = () => { /* ... (unchanged) ... */ };
const setupSpeechRecognition = () => { /* ... (unchanged) ... */ };
// --- Voice Output (TTS) Logic ---
const speakText = (text) => { /* ... (unchanged) ... */ };
const toggleTts = () => { /* ... (unchanged) ... */ };
const setupSpeechSynthesis = () => { /* ... (unchanged) ... */ };
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
  if (synth && synth.speaking) synth.cancel();

  try {
    const displayDataResponse = await fetch(`${API_BASE_URL}/pets/${nft.id}`, { // Use API_BASE_URL
       // Assuming nft.id maps to the simple ID the backend expects for this endpoint
    });
    if (!displayDataResponse.ok) throw new Error(`HTTP error! status: ${displayDataResponse.status}`);
    const backendDisplayProfile = await displayDataResponse.json();

    const petDisplayProfile = { 
      id: nft.id, displayName: nft.name,
      modelType: backendDisplayProfile.modelType, color: backendDisplayProfile.color,
      level: nft.metadata.level, fullNftData: nft,
    };
    selectedPetData.value = petDisplayProfile;
    updatePetModelDisplay(petDisplayProfile); 

    isPetTyping.value = true; 
    const greetingResponse = await fetch(`${API_BASE_URL}/pets/chat`, { // Use API_BASE_URL
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'tempUser', message: `Hello, I'm ${selectedPetData.value.displayName}` })
    });
    const greetingData = await greetingResponse.json(); 
    if (!greetingResponse.ok) throw new Error(greetingData.reply || `Greeting HTTP error!`);
    const greetingText = greetingData.reply;
    chatMessages.value.push({ sender: 'pet', text: greetingText, timestamp: new Date() });
    speakText(greetingText);

  } catch (error) {
    console.error('Failed to select NFT or get initial greeting:', error);
    const errorText = error.message || "Sorry, I had trouble getting ready.";
    const errorDisplayData = { displayName: nft.name || "Unknown (Error)", modelType: 'default', color: '#FF0000', fullNftData: nft };
     selectedPetData.value = {
        id: nft.id, displayName: nft.name || "Unknown (Error)",
        modelType: 'default', color: '#FF0000', level: 0, fullNftData: nft,
    };
    updatePetModelDisplay(errorDisplayData);
    chatMessages.value.push({ sender: 'pet', text: errorText, timestamp: new Date() });
    speakText(errorText);
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
onMounted(async () => { /* ... (unchanged) ... */ });
onUnmounted(() => { /* ... (unchanged) ... */ });

// --- (Full script content from previous turns assumed for context) ---
</script>

<style scoped>
/* ... (All existing styles from previous turns are assumed here) ... */
</style>
