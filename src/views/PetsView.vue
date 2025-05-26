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
      <van-col :span="6" class="column-desktop nft-list-col-desktop">
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
      <van-col :span="10" class="column-desktop scene-col-desktop">
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
      <van-col :span="8" class="column-desktop chat-col-desktop">
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
import { fetchUserNFTs } from '../services/nftService.js';
import { API_BASE_URL } from '../config.js';

console.log('PetsView.vue: script setup started');

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
const textureLoader = new THREE.TextureLoader(); 

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

// Computed properties
const isAnyActionActive = computed(() => {
  return isPetActionInProgress.value || isModelLoading.value || isPetTyping.value || isListening.value;
});
const isAnyActionActiveButVoice = computed(() => { 
    return isPetActionInProgress.value || isModelLoading.value || isPetTyping.value;
});

// --- Utility Functions ---
const formatTimestamp = (timestamp) => {
  if (!timestamp || !(timestamp instanceof Date)) return '';
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const scrollToBottom = () => { nextTick(() => { if (chatMessagesArea.value) chatMessagesArea.value.scrollTop = chatMessagesArea.value.scrollHeight; }); };
watch(chatMessages, scrollToBottom, { deep: true });

const resetPetActionFlag = () => { isPetActionInProgress.value = false; };
const resetTypingFlag = () => { isPetTyping.value = false; }; 

const getContrastingTextColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return '#000000';
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
};

// --- Responsive Handling ---
const checkMobile = () => { 
  console.log('checkMobile: window.innerWidth', window.innerWidth);
  isMobile.value = window.innerWidth <= 768;
  console.log('checkMobile: isMobile.value set to', isMobile.value);
};

// --- Backend Interactions ---
const callEmoteBackend = async (emoteType) => {
  if (!selectedPetData.value) {
    console.log(`callEmoteBackend: No selectedPetData, exiting for ${emoteType}.`);
    return;
  }
  console.log(`callEmoteBackend: Called for ${emoteType} with NFT ID ${selectedPetData.value.id}`);
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
  console.log('ACTION_BUTTON: feedPet called. isAnyActionActive:', isAnyActionActive.value, 'selectedPetData:', !!selectedPetData.value, 'currentPetModel:', !!currentPetModel);
  if (!currentPetModel || !selectedPetData.value || isAnyActionActive.value) {
    console.warn('feedPet: Action prevented. Conditions not met.');
    return;
  }
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
    const successMsg = `${feedResponseData.statusMessage}<br>Pet says: Yummy! That was tasty!`;
    chatMessages.value.push({ sender: 'system', text: successMsg, timestamp: new Date() });
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
  console.log('ACTION_BUTTON: triggerHappyEmote called. isAnyActionActive:', isAnyActionActive.value, 'selectedPetData:', !!selectedPetData.value, 'currentPetModel:', !!currentPetModel);
  if (!currentPetModel || isAnyActionActive.value) {
    console.warn('triggerHappyEmote: Action prevented. Conditions not met.');
     return;
  }
  isPetActionInProgress.value = true;
  modelOriginalPosition.copy(currentPetModel.position);
  currentPetModel.position.y += 0.3; 
  const petText = 'Whee! I\'m happy!';
  chatMessages.value.push({ sender: 'pet', text: petText, timestamp: new Date() }); speakText(petText);
  callEmoteBackend("Happy");
  setTimeout(() => { if(currentPetModel) currentPetModel.position.copy(modelOriginalPosition); resetPetActionFlag(); }, 300);
};

const triggerSpinEmote = () => {
  console.log('ACTION_BUTTON: triggerSpinEmote called. isAnyActionActive:', isAnyActionActive.value, 'selectedPetData:', !!selectedPetData.value, 'currentPetModel:', !!currentPetModel);
  if (!currentPetModel || isAnyActionActive.value) {
    console.warn('triggerSpinEmote: Action prevented. Conditions not met.');
    return;
  }
  isPetActionInProgress.value = true;
  modelOriginalRotation.copy(currentPetModel.rotation);
  const petText = 'Look at me, I\'m spinning!';
  chatMessages.value.push({ sender: 'pet', text: petText, timestamp: new Date() }); speakText(petText);
  callEmoteBackend("Spin");
  const targetRotationY = currentPetModel.rotation.y + Math.PI * 2;
  const initialRotationY = currentPetModel.rotation.y;
  const duration = 500; let startTime = null;
  function animateSpin(timestamp) {
    if (!currentPetModel) { resetPetActionFlag(); return; } 
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    currentPetModel.rotation.y = initialRotationY + (targetRotationY - initialRotationY) * progress;
    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      currentPetModel.rotation.copy(modelOriginalRotation);
      resetPetActionFlag();
    }
  }
  requestAnimationFrame(animateSpin);
};

const triggerWiggleEmote = () => {
  console.log('ACTION_BUTTON: triggerWiggleEmote called. isAnyActionActive:', isAnyActionActive.value, 'selectedPetData:', !!selectedPetData.value, 'currentPetModel:', !!currentPetModel);
  if (!currentPetModel || isAnyActionActive.value) {
    console.warn('triggerWiggleEmote: Action prevented. Conditions not met.');
    return;
  }
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

// --- Chat Logic ---
const sendMessage = async () => {
  if (currentUserMessage.value.trim() === '' || isAnyActionActive.value) return;
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
  if (isListening.value) {
    if (recognition) recognition.stop();
    isListening.value = false; 
  } else {
    if (recognition) {
      try { 
        recognition.start(); 
        isListening.value = true; 
      } 
      catch (e) { 
        console.error("Error starting speech recognition:", e);
        chatMessages.value.push({ sender: 'system', text: 'Voice recognition error. Could not start.', timestamp: new Date() });
        isListening.value = false; 
      }
    } else {
        chatMessages.value.push({ sender: 'system', text: 'Voice recognition not initialized.', timestamp: new Date() });
    }
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
      if (event.error === 'no-speech') msg = "No speech detected. Please try again.";
      else if (event.error === 'audio-capture') msg = "Microphone problem. Please check your microphone.";
      else if (event.error === 'not-allowed') msg = "Microphone access denied. Please allow access in your browser settings.";
      chatMessages.value.push({ sender: 'system', text: msg, timestamp: new Date() });
      isListening.value = false;
    };
    recognition.onend = () => { isListening.value = false; };
    console.log('PetsView.vue: Speech recognition setup complete.');
  } else {
    speechApiSupported.value = false;
    console.warn('PetsView.vue: Speech recognition not supported by this browser.');
  }
};

// --- Voice Output (TTS) Logic ---
const speakText = (text) => {
  if (!isTtsEnabled.value || !ttsSupported.value || !synth || !text) return;
  if (synth.speaking) synth.cancel(); 
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; 
  utterance.onerror = (event) => { 
    console.error('TTS error', event); 
    chatMessages.value.push({ sender: 'system', text: `Speech synthesis error: ${event.error}`, timestamp: new Date()}); 
  };
  synth.speak(utterance);
};
const toggleTts = () => {
  isTtsEnabled.value = !isTtsEnabled.value;
  if (!isTtsEnabled.value && synth && synth.speaking) synth.cancel();
  const status = isTtsEnabled.value ? "enabled" : "disabled";
  const ttsMessage = `Voice output ${status}.`;
  chatMessages.value.push({ sender: 'system', text: ttsMessage, timestamp: new Date() });
  speakText(ttsMessage);
};
const setupSpeechSynthesis = () => {
  if ('speechSynthesis' in window) {
    synth = window.speechSynthesis;
    console.log('PetsView.vue: Speech synthesis setup complete.');
  } else {
    ttsSupported.value = false;
    console.warn('PetsView.vue: Speech synthesis not supported by this browser.');
  }
};

// --- Three.js Model Update Logic ---
const removeCurrentPetModel = () => {
  console.log('removeCurrentPetModel: Called');
  if (currentPetModel) {
    console.log('removeCurrentPetModel: Removing model:', currentPetModel.name || currentPetModel.uuid);
    if (scene && scene.remove) { scene.remove(currentPetModel); }
    if (currentPetModel.geometry && typeof currentPetModel.geometry.dispose === 'function') { currentPetModel.geometry.dispose(); }
    if (currentPetModel.material) {
      if (currentPetModel.material.map && typeof currentPetModel.material.map.dispose === 'function') { currentPetModel.material.map.dispose(); }
      if (typeof currentPetModel.material.dispose === 'function') { currentPetModel.material.dispose(); }
    }
    currentPetModel = null;
    console.log('removeCurrentPetModel: Model removed and resources disposed (attempted).');
  } else {
    console.log('removeCurrentPetModel: No currentPetModel to remove.');
  }
};

const updatePetModelDisplay = (petDisplayData) => {
  console.log('updatePetModelDisplay: Called with petDisplayData:', JSON.parse(JSON.stringify(petDisplayData || {})));
  isModelLoading.value = true;
  removeCurrentPetModel();

  let imageUrl = petDisplayData?.fullNftData?.imageUrl;
  if (!imageUrl && petDisplayData?.fullNftData?.metadata?.imageUrl) {
    imageUrl = petDisplayData.fullNftData.metadata.imageUrl;
  }
  console.log('updatePetModelDisplay: Using imageUrl:', imageUrl);

  if (!imageUrl) {
    console.error('updatePetModelDisplay: No imageUrl found in petDisplayData.');
    if (scene) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(petDisplayData?.color || 0xff00ff) });
        currentPetModel = new THREE.Mesh(geometry, material);
        currentPetModel.name = "FallbackCube_NoImage";
        scene.add(currentPetModel);
        console.log('updatePetModelDisplay: Fallback cube created due to no imageUrl.');
    } else {
        console.error('updatePetModelDisplay: Scene not initialized, cannot create fallback cube.');
    }
    isModelLoading.value = false;
    return;
  }
  
  console.log('updatePetModelDisplay: Attempting to load texture:', imageUrl);
  textureLoader.load(
    imageUrl,
    (texture) => { 
      console.log('updatePetModelDisplay: Texture loaded successfully for:', imageUrl);
      if (!scene) {
          console.error('updatePetModelDisplay: Scene not initialized, cannot add model.');
          isModelLoading.value = false;
          return;
      }
      const aspectRatio = texture.image ? texture.image.width / texture.image.height : 1;
      const planeHeight = 2;
      const planeWidth = planeHeight * aspectRatio;
      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
      currentPetModel = new THREE.Mesh(geometry, material);
      currentPetModel.name = `PetPlane_${petDisplayData?.id || 'UnknownID'}`;
      
      currentPetModel.position.set(0, 0, 0);
      currentPetModel.rotation.set(0, 0, 0); 
      modelOriginalPosition.copy(currentPetModel.position);
      modelOriginalRotation.copy(currentPetModel.rotation);
      modelOriginalScale.copy(currentPetModel.scale);

      scene.add(currentPetModel);
      console.log('updatePetModelDisplay: Image plane created and added to scene. Name:', currentPetModel.name);
      isModelLoading.value = false;
    },
    undefined, 
    (error) => { 
      console.error('updatePetModelDisplay: Texture FAILED to load for:', imageUrl, error);
      if (scene) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(petDisplayData?.color || 0xff0000) });
        currentPetModel = new THREE.Mesh(geometry, material);
        currentPetModel.name = "ErrorFallbackCube_TextureLoad";
        scene.add(currentPetModel);
        console.log('updatePetModelDisplay: Error fallback cube created due to texture load failure.');
      } else {
        console.error('updatePetModelDisplay: Scene not initialized, cannot create error fallback cube.');
      }
      isModelLoading.value = false;
    }
  );
};

// --- NFT Selection & Data Handling ---
const selectNFT = async (nft) => { 
  console.log('selectNFT: Called with NFT:', JSON.parse(JSON.stringify(nft)));
  if (isLoadingPetData.value || (isAnyActionActive.value && selectedNftId.value === nft.id)) { // Allow re-selection if no action is active
      console.warn('selectNFT: Action prevented. isLoadingPetData:', isLoadingPetData.value, 'isAnyActionActive:', isAnyActionActive.value, 'Same NFT selected during action:', selectedNftId.value === nft.id);
      return;
  }
  
  selectedNftId.value = nft.id; 
  isLoadingPetData.value = true; 
  selectedPetData.value = null; 
  chatMessages.value = []; 
  if (synth && synth.speaking) synth.cancel();

  try {
    const displayDataResponse = await fetch(`${API_BASE_URL}/pets/${nft.id}`);
    if (!displayDataResponse.ok) throw new Error(`HTTP error! status: ${displayDataResponse.status}`);
    const backendDisplayProfile = await displayDataResponse.json();

    const petFullData = { 
      id: nft.id, 
      displayName: nft.name,
      modelType: backendDisplayProfile.modelType, 
      color: backendDisplayProfile.color,
      level: nft.metadata.level, 
      fullNftData: nft, 
    };
    selectedPetData.value = petFullData;
    console.log('selectNFT: selectedPetData.value assigned:', JSON.parse(JSON.stringify(selectedPetData.value)));
    
    await nextTick(); 
    const currentContainer = isMobile.value ? sceneContainerMobile.value : sceneContainerDesktop.value;
    if (currentContainer) {
        if (!sceneInitialized || (renderer && renderer.domElement.parentElement !== currentContainer)) {
             console.log("selectNFT: Scene not initialized for current container or needs re-parenting. Calling setupThreeScene.");
             cleanupThreeSceneFunc(); // Clean up previous if any (e.g. after layout switch)
             cleanupThreeSceneFunc = setupThreeScene(currentContainer);
        }
        console.log('selectNFT: About to call updatePetModelDisplay with:', JSON.parse(JSON.stringify(selectedPetData.value)));
        updatePetModelDisplay(selectedPetData.value); 
        console.log('selectNFT: updatePetModelDisplay was called.');
    } else {
        console.error('selectNFT: No valid scene container found to update model display.');
    }

    if (isMobile.value && activeMobileTab.value !== '3d-space') {
        activeMobileTab.value = '3d-space'; 
    }
    
    isPetTyping.value = true; 
    console.log('selectNFT: Fetching initial greeting for:', selectedPetData.value.displayName);
    const greetingResponse = await fetch(`${API_BASE_URL}/pets/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'tempUser', message: `Hello, I'm ${selectedPetData.value.displayName}` })
    });
    const greetingData = await greetingResponse.json(); 
    if (!greetingResponse.ok) {
      console.error('selectNFT: Failed to fetch initial AI greeting.', greetingData.reply || `Greeting HTTP error!`);
      throw new Error(greetingData.reply || `Greeting HTTP error!`);
    }
    console.log('selectNFT: Initial AI greeting fetched successfully.');
    const greetingText = greetingData.reply;
    chatMessages.value.push({ sender: 'pet', text: greetingText, timestamp: new Date() });
    speakText(greetingText);

  } catch (error) {
    console.error('selectNFT: Failed to select NFT or get initial greeting:', error);
    const errorText = error.message || "Sorry, I had trouble getting ready.";
    const errorDisplayData = { 
        displayName: nft.name || "Error Pet", 
        modelType: 'default', 
        color: '#FF0000', 
        fullNftData: nft,
        level: 0,
        id: nft.id
    };
    selectedPetData.value = errorDisplayData;
    if (scene) updatePetModelDisplay(errorDisplayData); 
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

const setupThreeScene = (containerElement) => {
  console.log('setupThreeScene: Called with container:', containerElement);
  if (!containerElement) {
    console.error('setupThreeScene: Container element is null or undefined. Scene setup aborted.');
    return () => {}; 
  }
  if (sceneInitialized && renderer && renderer.domElement.parentElement === containerElement) {
      console.warn('setupThreeScene: Scene already initialized in this container. Aborting duplicate setup.');
      return cleanupThreeSceneFunc; 
  }

  cleanupThreeSceneFunc(); // Clean up any existing scene first

  sceneInitialized = true;
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0); 

  const width = containerElement.clientWidth;
  const height = containerElement.clientHeight > 0 ? containerElement.clientHeight : 250; // Ensure height is positive
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(0, 0.5, 2.5); 
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  containerElement.innerHTML = ''; // Clear previous canvas if any
  containerElement.appendChild(renderer.domElement);
  console.log('setupThreeScene: Renderer appended to container.');

  const ambientLight = new THREE.AmbientLight(0xffffff, 2.5); 
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(1, 2, 3);
  scene.add(directionalLight);
  console.log('setupThreeScene: Scene, camera, renderer, lights created.');

  const animate = () => {
    if (!sceneInitialized) return;
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (currentPetModel && currentPetModel.rotation && !isAnyActionActive.value) { 
      currentPetModel.rotation.y += delta * 0.4; 
    }
    if(renderer && scene && camera) renderer.render(scene, camera);
  };
  animate();
  console.log('setupThreeScene: Animation loop started.');

  const handleResize = () => {
    if (!renderer || !camera || !containerElement || !sceneInitialized) return;
    const newWidth = containerElement.clientWidth;
    const newHeight = containerElement.clientHeight > 0 ? containerElement.clientHeight : 250;
    if (newWidth === 0 || newHeight === 0) return;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
    console.log('setupThreeScene: Resized to', newWidth, newHeight);
  };
  window.addEventListener('resize', handleResize);

  const localCleanup = () => {
    console.log('setupThreeScene: localCleanup called.');
    sceneInitialized = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId); animationFrameId = null;
    window.removeEventListener('resize', handleResize);
    removeCurrentPetModel();
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer = null;
    }
    if (scene) scene = null;
    camera = null; clock = null;
    console.log('setupThreeScene: Scene cleaned up via localCleanup.');
  };
  cleanupThreeSceneFunc = localCleanup;
  return localCleanup;
};

// --- Lifecycle Hooks & Responsive Logic ---
onMounted(async () => { 
  console.log('PetsView.vue: onMounted hook started');
  isLoadingNFTList.value = true;
  try {
    console.log('PetsView.vue: About to call fetchUserNFTs');
    const nfts = await fetchUserNFTs('currentUser123'); 
    console.log('PetsView.vue: Data received from fetchUserNFTs:', JSON.parse(JSON.stringify(nfts)));
    userNFTs.value = nfts;
    console.log('PetsView.vue: userNFTs.value after assignment:', JSON.parse(JSON.stringify(userNFTs.value)));
  } catch (error) {
    console.error("PetsView.vue: CRITICAL - Failed to fetch user NFTs in onMounted:", error);
    userNFTs.value = []; 
  } finally {
    isLoadingNFTList.value = false;
  }

  window.addEventListener('resize', checkMobile);
  checkMobile(); 

  await nextTick(); 
  const initialContainer = isMobile.value ? sceneContainerMobile.value : sceneContainerDesktop.value;
  console.log('CALLER_OF_SETUP: [onMounted] About to call setupThreeScene. Container visible/ready?:', !!initialContainer);
  if (initialContainer && (!isMobile.value || activeMobileTab.value === '3d-space')) {
    cleanupThreeSceneFunc = setupThreeScene(initialContainer);
  } else {
    console.log("onMounted: Initial scene setup deferred (mobile tab not 3d-space or container not ready).");
  }
  setupSpeechRecognition(); 
  setupSpeechSynthesis(); 
  console.log('PetsView.vue: onMounted hook finished');
});

onUnmounted(() => { 
  console.log('PetsView.vue: onUnmounted hook called.');
  window.removeEventListener('resize', checkMobile);
  cleanupThreeSceneFunc(); 
  if (recognition) { 
    recognition.stop(); recognition.onresult = null; recognition.onerror = null; recognition.onend = null; recognition = null; 
  }
  if (synth && synth.speaking) synth.cancel();
});

const onMobileTabChange = async (tabName) => {
  console.log('CALLER_OF_SETUP: [onMobileTabChange] Tab changed to:', tabName, 'isMobile:', isMobile.value);
  await nextTick(); 
  const currentContainer = sceneContainerMobile.value;
  if (tabName === '3d-space' && isMobile.value && currentContainer) {
    if (!sceneInitialized || (renderer && renderer.domElement.parentElement !== currentContainer)) {
      console.log("onMobileTabChange: Setting up or re-attaching scene for 3D Space tab.");
      cleanupThreeSceneFunc(); 
      cleanupThreeSceneFunc = setupThreeScene(currentContainer);
      if (selectedPetData.value) { 
        console.log('onMobileTabChange: Re-displaying selected pet model after tab change.');
        updatePetModelDisplay(selectedPetData.value);
      }
    } else {
      console.log('onMobileTabChange: Scene already initialized and attached to mobile container or container not ready.');
    }
  } else if (tabName !== '3d-space' && isMobile.value && sceneInitialized) {
    console.log('onMobileTabChange: Switched away from 3D tab on mobile. Cleaning up scene.');
    cleanupThreeSceneFunc();
  }
};

watch(isMobile, async (newIsMobileValue, oldIsMobileValue) => {
  if (newIsMobileValue === oldIsMobileValue) return;
  console.log('CALLER_OF_SETUP: [watch isMobile] Layout changed. New isMobile:', newIsMobileValue);
  
  cleanupThreeSceneFunc(); 
  await nextTick(); 
  
  let targetContainer = null;
  if (newIsMobileValue) {
    if (activeMobileTab.value === '3d-space') {
      targetContainer = sceneContainerMobile.value;
    } else {
      console.log('watch isMobile: Switched to mobile, but 3D tab not active. Scene setup deferred.');
      return; // Don't setup scene if 3D tab isn't active on mobile
    }
  } else {
    targetContainer = sceneContainerDesktop.value;
  }
  
  console.log(`CALLER_OF_SETUP: [watch isMobile] Target container for scene setup: ${targetContainer ? 'found' : 'not found'}`);
  if (targetContainer) {
    cleanupThreeSceneFunc = setupThreeScene(targetContainer);
    if (selectedPetData.value) { 
      console.log('watch isMobile: Re-displaying selected pet model after layout change.');
      updatePetModelDisplay(selectedPetData.value);
    }
  } else {
    console.error("watch isMobile: No target container available for scene setup after layout change.");
  }
});

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
  background-color: var(--van-background-2, #f7f8fa);
}

/* Ensure Vant tabs fill height if possible, or page container scrolls */
:deep(.van-tabs__content) { 
    height: 100%; /* Try to make content take full height */
}
:deep(.van-tab__panel) {
    height: 100%; /* Try to make panel take full height */
}
</style>
