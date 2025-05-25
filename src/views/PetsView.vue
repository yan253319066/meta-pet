<template>
  <div class="pets-view-page-container">
    <!-- Mobile Layout: Tabs -->
    <van-tabs v-if="isMobile" v-model:active="activeMobileTab" sticky @change="onMobileTabChange">
      <van-tab name="my-pets" title="My Pets">
        <div class="nft-list-container mobile-list-container">
          <h2>My 3D Pets</h2>
          <van-loading v-if="isLoadingNFTList" type="spinner" vertical class="list-loading">Loading pets...</van-loading>
          <van-list v-else-if="userNFTs.length > 0" class="nft-vant-list">
            <van-cell 
              v-for="nft in userNFTs" 
              :key="nft.id" 
              :title="nft.name" 
              :label="`Rarity: ${nft.metadata.rarity} | Level: ${nft.metadata.level}`" 
              is-link 
              @click="selectNFT(nft)"
              :class="{ 'selected-nft-vant': selectedNftId === nft.id }"
            />
          </van-list>
          <div v-else class="empty-state-pets">
            <van-empty description="No pets found." />
          </div>
        </div>
      </van-tab>
      <van-tab name="3d-space" title="3D Space & Actions">
        <div class="tab-content-placeholder space-and-actions-tab">
          <div ref="sceneContainerMobile" class="scene-container-mobile" :class="{'hidden-until-selected': !selectedPetData}">
             <div v-if="!selectedPetData" class="select-pet-prompt">Select a pet to view in 3D.</div>
             <div v-if="isModelLoading && selectedPetData" class="model-loading-indicator">Loading Image...</div>
          </div>
          <div v-if="selectedPetData" class="mobile-pet-dashboard">
            <van-card
              :title="selectedPetData.displayName"
              :desc="`Level: ${selectedPetData.level} | Rarity: ${selectedPetData.fullNftData?.metadata.rarity}`"
              class="pet-info-card"
            >
              <template #tags>
                <van-tag plain type="primary">{{ selectedPetData.modelType }}</van-tag>
                <van-tag plain :color="selectedPetData.color" :style="{ color: getContrastingTextColor(selectedPetData.color), marginLeft: '5px' }">{{ selectedPetData.color }}</van-tag>
              </template>
            </van-card>
            <div class="pet-actions-group-vant">
              <van-button icon="gift-o" @click="feedPet" :disabled="isAnyActionActive" size="small" type="success">Feed</van-button>
              <van-button icon="smile-o" @click="triggerHappyEmote" :disabled="isAnyActionActive" size="small" type="primary">Happy</van-button>
              <van-button icon="replay" @click="triggerSpinEmote" :disabled="isAnyActionActive" size="small" type="primary">Spin</van-button>
              <van-button icon="passed" @click="triggerWiggleEmote" :disabled="isAnyActionActive" size="small" type="primary">Wiggle</van-button>
            </div>
          </div>
        </div>
      </van-tab>
      <van-tab name="chat" title="Chat">
        <div class="tab-content-placeholder chat-tab-content">
          <div v-if="selectedPetData" class="chat-interface-container mobile-chat-full-height">
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
            <div class="chat-input-area vant-chat-input">
              <van-field
                v-model="currentUserMessage"
                @keyup.enter="sendMessage"
                placeholder="Type your message..."
                :disabled="isAnyActionActive"
                clearable
                rows="1"
                autosize
                class="chat-input-field"
              />
              <van-button 
                icon="microphone" 
                @click="toggleVoiceListening" 
                :disabled="!speechApiSupported || isAnyActionActiveButVoice" 
                :type="isListening ? 'danger' : 'default'" 
                size="small" 
                class="chat-control-button"
                title="Voice Input"
              />
              <van-button 
                type="primary" 
                @click="sendMessage" 
                :disabled="isAnyActionActive || currentUserMessage.trim() === ''" 
                size="small" 
                class="chat-control-button send-button"
                title="Send Message"
              >Send</van-button>
              <van-button 
                :icon="isTtsEnabled ? 'volume' : 'volume-o'" 
                @click="toggleTts" 
                :disabled="!ttsSupported" 
                size="small" 
                class="chat-control-button"
                :type="isTtsEnabled ? 'success' : 'default'"
                title="Toggle Text-to-Speech"
              />
            </div>
            <div v-if="!speechApiSupported || !ttsSupported" class="speech-support-notice">
              <span v-if="!speechApiSupported">Voice input not supported. </span>
              <span v-if="!ttsSupported">Voice output not supported.</span>
            </div>
          </div>
          <div v-else class="select-pet-prompt">Select a pet to chat.</div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- Desktop Layout: 3 Columns -->
    <van-row v-else gutter="16" class="desktop-layout-container">
      <van-col span="6" class="column-desktop nft-list-col-desktop">
        <div class="nft-list-container">
          <h2>My 3D Pets</h2>
          <van-loading v-if="isLoadingNFTList" type="spinner" vertical class="list-loading">Loading pets...</van-loading>
          <van-list v-else-if="userNFTs.length > 0" class="nft-vant-list">
             <van-cell 
              v-for="nft in userNFTs" 
              :key="nft.id" 
              :title="nft.name" 
              :label="`Rarity: ${nft.metadata.rarity} | Level: ${nft.metadata.level}`" 
              is-link 
              @click="selectNFT(nft)"
              :class="{ 'selected-nft-vant': selectedNftId === nft.id }"
            />
          </van-list>
          <div v-else class="empty-state-pets">
            <van-empty description="No pets found." />
          </div>
        </div>
      </van-col>
      <van-col span="10" class="column-desktop scene-col-desktop">
        <div ref="sceneContainerDesktop" class="scene-container-desktop" :class="{'hidden-until-selected': !selectedPetData}">
            <div v-if="!selectedPetData" class="select-pet-prompt-desktop">Select a pet from the list to view it in 3D and interact.</div>
            <div v-if="isModelLoading && selectedPetData" class="model-loading-indicator">Loading Image...</div>
        </div>
        <div v-if="selectedPetData" class="desktop-pet-dashboard">
            <van-card
              :title="selectedPetData.displayName"
              :desc="`Level: ${selectedPetData.level} | Rarity: ${selectedPetData.fullNftData?.metadata.rarity}`"
              class="pet-info-card"
            >
              <template #tags>
                <van-tag plain type="primary">{{ selectedPetData.modelType }}</van-tag>
                <van-tag plain :color="selectedPetData.color" :style="{ color: getContrastingTextColor(selectedPetData.color), marginLeft: '5px' }">{{ selectedPetData.color }}</van-tag>
              </template>
            </van-card>
            <div class="pet-actions-group-vant">
              <van-button icon="gift-o" @click="feedPet" :disabled="isAnyActionActive" size="small" type="success">Feed</van-button>
              <van-button icon="smile-o" @click="triggerHappyEmote" :disabled="isAnyActionActive" size="small" type="primary">Happy</van-button>
              <van-button icon="replay" @click="triggerSpinEmote" :disabled="isAnyActionActive" size="small" type="primary">Spin</van-button>
              <van-button icon="passed" @click="triggerWiggleEmote" :disabled="isAnyActionActive" size="small" type="primary">Wiggle</van-button>
            </div>
        </div>
      </van-col>
      <van-col span="8" class="column-desktop chat-col-desktop">
        <div v-if="selectedPetData" class="chat-interface-container desktop-chat-full-height">
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
            <div class="chat-input-area vant-chat-input">
              <van-field
                v-model="currentUserMessage"
                @keyup.enter="sendMessage"
                placeholder="Type your message..."
                :disabled="isAnyActionActive"
                clearable
                rows="1"
                autosize
                class="chat-input-field"
              />
              <van-button 
                icon="microphone" 
                @click="toggleVoiceListening" 
                :disabled="!speechApiSupported || isAnyActionActiveButVoice" 
                :type="isListening ? 'danger' : 'default'" 
                size="small" 
                class="chat-control-button"
                title="Voice Input"
              />
              <van-button 
                type="primary" 
                @click="sendMessage" 
                :disabled="isAnyActionActive || currentUserMessage.trim() === ''" 
                size="small" 
                class="chat-control-button send-button"
                title="Send Message"
              >Send</van-button>
              <van-button 
                :icon="isTtsEnabled ? 'volume' : 'volume-o'" 
                @click="toggleTts" 
                :disabled="!ttsSupported" 
                size="small" 
                class="chat-control-button"
                :type="isTtsEnabled ? 'success' : 'default'"
                title="Toggle Text-to-Speech"
              />
            </div>
            <div v-if="!speechApiSupported || !ttsSupported" class="speech-support-notice">
              <span v-if="!speechApiSupported">Voice input not supported. </span>
              <span v-if="!ttsSupported">Voice output not supported.</span>
            </div>
        </div>
        <div v-else class="select-pet-prompt-desktop">Select a pet to chat with it.</div>
      </van-col>
    </van-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import * as THREE from 'three';
// GLTFLoader removed
import { fetchUserNFTs } from '../services/nftService.js';
import { API_BASE_URL } from '../config.js';

// Layout & UI State
const isMobile = ref(window.innerWidth <= 768);
const activeMobileTab = ref('my-pets'); 

// NFT and Pet data state
const userNFTs = ref([]); 
const isLoadingNFTList = ref(true);
const selectedNftId = ref(null); 
const selectedPetData = ref(null); 
const isLoadingPetData = ref(false); 
const isModelLoading = ref(false);

// Three.js scene state
const sceneContainerDesktop = ref(null); 
const sceneContainerMobile = ref(null); 

let renderer;
let scene;
let camera;
let clock; 
let currentPetModel = null; 
let animationFrameId;
const modelOriginalScale = new THREE.Vector3(); 
const modelOriginalPosition = new THREE.Vector3();
const modelOriginalRotation = new THREE.Euler();

// Interaction & Chat state
const isPetActionInProgress = ref(false); 
const chatMessages = ref([]); 
const currentUserMessage = ref(''); 
const chatMessagesArea = ref(null); 
const isPetTyping = ref(false); 

// Voice Input & Output State
const speechApiSupported = ref(true);
const isListening = ref(false);
let recognition = null; 
const ttsSupported = ref(true);
const isTtsEnabled = ref(false);
let synth = null; 

const textureLoader = new THREE.TextureLoader(); 

// Computed properties
const isAnyActionActive = computed(() => {
  return isPetActionInProgress.value || isModelLoading.value || isPetTyping.value || isListening.value;
});
const isAnyActionActiveButVoice = computed(() => { // Used to allow mic button when only listening is active
    return isPetActionInProgress.value || isModelLoading.value || isPetTyping.value;
});
// availableAnimations removed

// --- Utility Functions ---
const formatTimestamp = (timestamp) => { return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
const scrollToBottom = () => { nextTick(() => { if (chatMessagesArea.value) chatMessagesArea.value.scrollTop = chatMessagesArea.value.scrollHeight; }); };
watch(chatMessages, scrollToBottom, { deep: true });

const resetPetActionFlag = () => { isPetActionInProgress.value = false; };
const resetTypingFlag = () => { isPetTyping.value = false; }; 

// --- Responsive Handling ---
const checkMobile = () => { isMobile.value = window.innerWidth <= 768; };

// --- Backend Interactions ---
const callEmoteBackend = async (emoteType) => {
  if (!selectedPetData.value) return;
  try {
    const response = await fetch(`${API_BASE_URL}/pets/emote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'tempUser123', nftId: selectedPetData.value.id, emoteType: emoteType }),
    });
    const emoteResponseData = await response.json();
    if (!response.ok) throw new Error(emoteResponseData.statusMessage || `Emote backend error: ${response.status}`);
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
  const targetScale = modelOriginalScale.clone().multiplyScalar(1.2);
  currentPetModel.scale.copy(targetScale);
  chatMessages.value.push({ sender: 'system', text: `Feeding ${selectedPetData.value.displayName}...`, timestamp: new Date() });
  try {
    const response = await fetch(`${API_BASE_URL}/pets/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'tempUser123', nftId: selectedPetData.value.id }),
    });
    const feedResponseData = await response.json();
    if (!response.ok) throw new Error(feedResponseData.statusMessage || `HTTP error!`);
    chatMessages.value.push({ sender: 'system', text: `${feedResponseData.statusMessage}<br>Pet says: Yummy! That was tasty!`, timestamp: new Date() });
    speakText("Yummy! That was tasty!");
  } catch (error) { 
    console.error('Failed to feed pet via backend:', error);
    const errorText = `Failed to feed ${selectedPetData.value.displayName}. Error: ${error.message}`;
    chatMessages.value.push({ sender: 'system', text: errorText, timestamp: new Date() });
    speakText(errorText);
  } 
  finally {
    setTimeout(() => { if(currentPetModel) currentPetModel.scale.copy(modelOriginalScale); resetPetActionFlag(); }, 500);
    scrollToBottom();
  }
};
const triggerHappyEmote = () => {
  if (!currentPetModel || isAnyActionActive.value) return;
  isPetActionInProgress.value = true;
  modelOriginalPosition.copy(currentPetModel.position);
  currentPetModel.position.y += 0.3; 
  const petText = 'Whee! I\'m happy!';
  chatMessages.value.push({ sender: 'pet', text: petText, timestamp: new Date() }); speakText(petText);
  callEmoteBackend("Happy");
  setTimeout(() => { if(currentPetModel) currentPetModel.position.copy(modelOriginalPosition); resetPetActionFlag(); }, 300);
};
const triggerSpinEmote = () => {
   if (!currentPetModel || isAnyActionActive.value) return;
  isPetActionInProgress.value = true;
  modelOriginalRotation.copy(currentPetModel.rotation);
  const petText = 'Look at me, I\'m spinning!';
  chatMessages.value.push({ sender: 'pet', text: petText, timestamp: new Date() }); speakText(petText);
  callEmoteBackend("Spin");
  const targetRotationY = currentPetModel.rotation.y + Math.PI * 2;
  const initialRotationY = currentPetModel.rotation.y;
  const duration = 500; let startTime = null;
  function animateSpin(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    currentPetModel.rotation.y = initialRotationY + (targetRotationY - initialRotationY) * progress;
    if (progress < 1) requestAnimationFrame(animateSpin);
    else { currentPetModel.rotation.copy(modelOriginalRotation); resetPetActionFlag(); }
  }
  requestAnimationFrame(animateSpin);
};
const triggerWiggleEmote = () => {
   if (!currentPetModel || isAnyActionActive.value) return;
  isPetActionInProgress.value = true;
  modelOriginalRotation.copy(currentPetModel.rotation);
  const petText = 'Wiggle wiggle!';
  chatMessages.value.push({ sender: 'pet', text: petText, timestamp: new Date() }); speakText(petText);
  callEmoteBackend("Wiggle");
  const wiggleAmount = 0.3; const wiggleDuration = 100; 
  currentPetModel.rotation.z += wiggleAmount;
  setTimeout(() => { if(currentPetModel) currentPetModel.rotation.z -= wiggleAmount * 2;
    setTimeout(() => { if(currentPetModel) currentPetModel.rotation.z += wiggleAmount; 
       setTimeout(() => { if(currentPetModel) currentPetModel.rotation.copy(modelOriginalRotation); resetPetActionFlag(); }, wiggleDuration);
    }, wiggleDuration);
  }, wiggleDuration); 
};
// playAnimation removed

// --- Chat Logic ---
const sendMessage = async () => {
  if (currentUserMessage.value.trim() === '' || isAnyActionActive.value) return; // isAnyActionActive covers all loading/action states
  const userMessageText = currentUserMessage.value;
  chatMessages.value.push({ sender: 'user', text: userMessageText, timestamp: new Date() });
  currentUserMessage.value = ''; 
  isPetTyping.value = true; 

  try {
    const response = await fetch(`${API_BASE_URL}/pets/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
const toggleVoiceListening = () => {
  if (!speechApiSupported.value || isAnyActionActiveButVoice.value) return;
  if (isListening.value) recognition.stop();
  else {
    try { recognition.start(); isListening.value = true; } 
    catch (e) { console.error("Error starting speech recognition:", e); chatMessages.value.push({ sender: 'system', text: 'Voice recognition error.', timestamp: new Date() });}
  }
};
const setupSpeechRecognition = () => {
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognitionAPI) {
    recognition = new SpeechRecognitionAPI();
    recognition.continuous = false; recognition.lang = 'en-US'; recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      currentUserMessage.value = transcript;
      if (transcript.trim()) sendMessage();
    };
    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      let msg = "Voice error.";
      if (event.error === 'no-speech') msg = "No speech detected.";
      else if (event.error === 'audio-capture') msg = "Mic problem.";
      else if (event.error === 'not-allowed') msg = "Mic access denied.";
      chatMessages.value.push({ sender: 'system', text: msg, timestamp: new Date() });
      isListening.value = false;
    };
    recognition.onend = () => { isListening.value = false; };
  } else speechApiSupported.value = false;
};

// --- Voice Output (TTS) Logic ---
const speakText = (text) => {
  if (!isTtsEnabled.value || !ttsSupported.value || !synth || !text) return;
  if (synth.speaking) synth.cancel(); 
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; 
  utterance.onerror = (event) => { console.error('TTS error', event); chatMessages.value.push({ sender: 'system', text: `Speech error: ${event.error}`, timestamp: new Date()}); };
  synth.speak(utterance);
};
const toggleTts = () => {
  isTtsEnabled.value = !isTtsEnabled.value;
  if (!isTtsEnabled.value && synth && synth.speaking) synth.cancel();
  const status = isTtsEnabled.value ? "enabled" : "disabled";
  chatMessages.value.push({ sender: 'system', text: `Voice output ${status}.`, timestamp: new Date() });
  speakText(`Voice output ${status}.`);
};
const setupSpeechSynthesis = () => {
  if ('speechSynthesis' in window) synth = window.speechSynthesis;
  else ttsSupported.value = false;
};

// --- Three.js Model Update Logic ---
const removeCurrentPetModel = () => { /* ... (unchanged, uses currentPetModel) ... */ };
const updatePetModelDisplay = (petDisplayData) => { /* ... (unchanged, uses textureLoader, currentPetModel) ... */ };

// --- NFT Selection & Data Handling ---
const selectNFT = async (nft) => { 
  if (isLoadingPetData.value || isAnyActionActive.value) return;
  selectedNftId.value = nft.id; 
  isLoadingPetData.value = true; 
  selectedPetData.value = null; 
  chatMessages.value = []; 
  if (synth && synth.speaking) synth.cancel();

  try {
    const displayDataResponse = await fetch(`${API_BASE_URL}/pets/${nft.id}`);
    if (!displayDataResponse.ok) throw new Error(`HTTP error! status: ${displayDataResponse.status}`);
    const backendDisplayProfile = await displayDataResponse.json();
    selectedPetData.value = { 
      id: nft.id, displayName: nft.name,
      modelType: backendDisplayProfile.modelType, color: backendDisplayProfile.color,
      level: nft.metadata.level, fullNftData: nft,
    };
    await nextTick(); 
    const currentContainer = isMobile.value ? sceneContainerMobile.value : sceneContainerDesktop.value;
    if (currentContainer && scene) updatePetModelDisplay(selectedPetData.value); 
    else if (currentContainer && !scene) {
        cleanupThreeSceneFunc = setupThreeScene(currentContainer);
        updatePetModelDisplay(selectedPetData.value);
    }
    if (isMobile.value) activeMobileTab.value = '3d-space';
    
    isPetTyping.value = true; 
    const greetingResponse = await fetch(`${API_BASE_URL}/pets/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'tempUser', message: `Hello, I'm ${selectedPetData.value.displayName}` })
    });
    const greetingData = await greetingResponse.json(); 
    if (!greetingResponse.ok) throw new Error(greetingData.reply || `Greeting HTTP error!`);
    const greetingText = greetingData.reply;
    chatMessages.value.push({ sender: 'pet', text: greetingText, timestamp: new Date() });
    speakText(greetingText);

  } catch (error) {
    console.error('Failed to select NFT:', error);
    const errorText = error.message || "Sorry, I had trouble getting ready.";
    const errorDisplayData = { displayName: nft.name || "Error", modelType: 'default', color: '#FF0000', fullNftData: nft };
     selectedPetData.value = { id: nft.id, displayName: nft.name || "Error", modelType: 'default', color: '#FF0000', level: 0, fullNftData: nft };
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
let sceneInitialized = false;
let cleanupThreeSceneFunc = () => {};
const setupThreeScene = (containerElement) => { /* ... (unchanged) ... */ };

// --- Lifecycle Hooks ---
onMounted(async () => { 
  isLoadingNFTList.value = true;
  try { userNFTs.value = await fetchUserNFTs('currentUser123'); } 
  catch (error) { console.error("PetsView.vue: CRITICAL - Failed to fetch user NFTs:", error); userNFTs.value = []; } 
  finally { isLoadingNFTList.value = false; }
  window.addEventListener('resize', checkMobile);
  checkMobile(); 
  await nextTick();
  const initialContainer = isMobile.value ? sceneContainerMobile.value : sceneContainerDesktop.value;
  if (initialContainer && (!isMobile.value || activeMobileTab.value === '3d-space')) { // Only init if desktop or mobile 3D tab active
    cleanupThreeSceneFunc = setupThreeScene(initialContainer);
  } else {
    console.log("Initial scene setup deferred (mobile tab not 3d-space or container not ready).");
  }
  setupSpeechRecognition(); 
  setupSpeechSynthesis(); 
});
onUnmounted(() => { 
  window.removeEventListener('resize', checkMobile);
  cleanupThreeSceneFunc(); 
  if (recognition) { recognition.stop(); recognition.onresult = null; recognition.onerror = null; recognition.onend = null; recognition = null; }
  if (synth && synth.speaking) synth.cancel();
});

const onMobileTabChange = async (tabName) => { /* ... (unchanged) ... */ };
watch(isMobile, async (newIsMobile) => { /* ... (unchanged) ... */ });
const getContrastingTextColor = (hexColor) => { /* ... (unchanged) ... */ };

</script>

<style scoped>
.pets-view-page-container { /* ... */ }
.nft-list-container h2, .column-desktop h2 { /* ... */ }
.mobile-list-container { /* ... */ }
.list-loading { /* ... */ }
.nft-vant-list .van-cell { /* ... */ }
.nft-vant-list .van-cell__title { /* ... */ }
.nft-vant-list .van-cell__label { /* ... */ }
.selected-nft-vant { /* ... */ }
.selected-nft-vant .van-cell__title,
.selected-nft-vant .van-cell__label,
.selected-nft-vant .van-cell__value { /* ... */ }
.empty-state-pets { /* ... */ }
.empty-state-pets .van-empty__description { /* ... */ }
.desktop-layout-container { /* ... */ }
.column-desktop { /* ... */ }
.scene-col-desktop { /* ... */ }
.scene-container-desktop, .scene-container-mobile { /* ... */ }
.select-pet-prompt, .select-pet-prompt-desktop { /* ... */ }
.model-loading-indicator { /* ... */ }
.tab-content-placeholder { /* ... */ }
.space-and-actions-tab { justify-content: flex-start; /* Align items to top */ }
.chat-tab-content { padding: 0; height: 100%; /* Allow chat to fill tab */ }
.mobile-pet-dashboard, .desktop-pet-dashboard { /* ... */ }
.mobile-pet-dashboard h3, .desktop-pet-dashboard h3 { /* ... */ }
.pet-info-card { /* ... */ }
.pet-actions-group-vant { /* ... */ }
.pet-actions-group-vant .van-button { /* ... */ }

/* Chat Interface Specific Styles */
.chat-interface-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* Ensure it fills its parent column/tab */
  background-color: #fff;
}
.mobile-chat-full-height {
    height: calc(100vh - 64px - 20px - 44px - 44px); /* Full viewport - navbar - page padding - tabs header - tab content padding */
}
.desktop-chat-full-height {
    height: 100%;
}

.chat-messages-area { 
  flex-grow: 1; 
  overflow-y: auto; 
  padding: 15px; 
  background-color: var(--van-background-2, #f7f8fa); 
}
.chat-message { /* ... (existing message styles) ... */ }
.user-message { /* ... */ }
.pet-message { /* ... */ }
.system-message { /* ... */ }
.typing-indicator .message-text i { /* ... */ }
.ellipsis-dot { /* ... */ }
@keyframes ellipsis-blink { /* ... */ }
.message-sender { /* ... */ }
.message-text { /* ... */ }
.message-timestamp { /* ... */ }
.user-message .message-timestamp { /* ... */ }
.system-message .message-timestamp { /* ... */ }

.vant-chat-input {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background-color: var(--van-background, #fff);
  border-top: 1px solid var(--van-border-color, #ebedf0);
}
.chat-input-field {
  flex-grow: 1;
  margin-right: 8px;
  border: none; /* Vant field is already styled */
  background-color: var(--van-field-input-background-color, #f7f8fa); /* Match Vant field style */
  border-radius: 20px; /* Match Vant field style if desired */
}
.chat-input-field :deep(.van-field__control) {
    padding: 0 10px; /* Adjust padding inside field if needed */
}

.chat-control-button {
  margin-left: 5px;
  flex-shrink: 0; /* Prevent buttons from shrinking */
}
.send-button {
  /* Specific style for send if needed */
}
.mic-button { /* Updated for Vant button */
  /* icon prop handles the icon, type handles color */
}
.mic-button.is-listening {
  /* Vant button type="danger" handles red background */
  animation: pulse-mic 1.5s infinite; /* Keep pulse */
}
.tts-button { /* Updated for Vant button */
  /* icon prop handles the icon, type handles color */
}
.tts-button.is-enabled {
  /* Vant button type="success" for green */
}

.speech-support-notice { 
  font-size: 0.8em; color: #777; text-align: center; padding: 5px 10px; 
  background-color: var(--van-background, #fff);
}

/* Ensure Vant tabs fill height if possible, or page container scrolls */
:deep(.van-tabs__content) { 
    height: 100%; /* Try to make content take full height */
}
:deep(.van-tab__panel) {
    height: 100%; /* Try to make panel take full height */
}
</style>
