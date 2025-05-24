<template>
  <div class="pets-view-container">
    <!-- Left Column: NFT List -->
    <div class="column left-column">
      <h2>My 3D Pets</h2>
      <ul>
        <li v-for="nft in mockNFTs" :key="nft.id" @click="selectNFT(nft)">
          {{ nft.name }}
        </li>
      </ul>
    </div>

    <!-- Center Column: 3D Scene -->
    <div class="column center-column" ref="sceneContainer">
      <!-- Three.js scene will be rendered here -->
    </div>

    <!-- Right Column: Chat/Controls & Pet Data -->
    <div class="column right-column">
      <div v-if="selectedPetData" class="chat-interface-container">
        <h3>Chat with {{ selectedPetData.name }}</h3>
        <div class="pet-info-bar">
          <p><strong>Type:</strong> {{ selectedPetData.modelType }} | <strong>Color:</strong> {{ selectedPetData.color }} | <strong>Level:</strong> {{ selectedPetData.level }}</p>
        </div>

        <div class="pet-actions-bar">
          <button @click="feedPet" :disabled="isPetActionInProgress" class="action-button feed-button">Feed {{ selectedPetData.name }}</button>
          <button @click="triggerHappyEmote" :disabled="isPetActionInProgress" class="action-button emote-button">Happy 🎉</button>
          <button @click="triggerSpinEmote" :disabled="isPetActionInProgress" class="action-button emote-button">Spin 💫</button>
          <button @click="triggerWiggleEmote" :disabled="isPetActionInProgress" class="action-button emote-button">Wiggle ✨</button>
        </div>
        
        <div class="chat-messages-area" ref="chatMessagesArea">
          <div v-for="(message, index) in chatMessages" :key="index" 
               :class="['chat-message', message.sender === 'user' ? 'user-message' : 'pet-message', message.sender === 'system' ? 'system-message' : '']">
            <span class="message-sender">
              {{ message.sender === 'user' ? 'You' : (message.sender === 'pet' ? selectedPetData.name : 'System') }}:
            </span>
            <span class="message-text" v-html="message.text"></span>
            <span class="message-timestamp">{{ formatTimestamp(message.timestamp) }}</span>
          </div>
          <div v-if="isPetTyping" class="chat-message pet-message typing-indicator">
            <span class="message-sender">{{ selectedPetData.name }}: </span>
            <span class="message-text"><i>typing...</i></span>
          </div>
        </div>
        
        <div class="chat-input-area">
          <input type="text" v-model="currentUserMessage" @keyup.enter="sendMessage" placeholder="Type your message..." :disabled="isPetTyping || isPetActionInProgress"/>
          <button @click="sendMessage" :disabled="isPetTyping || isPetActionInProgress">Send</button>
        </div>
      </div>
      <div v-else-if="isLoadingPetData">
        <p>Loading pet data...</p>
      </div>
      <div v-else>
        <p>Select a pet from the list to see its details and chat. The 3D model will update in the center panel.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import * as THREE from 'three';

const mockNFTs = ref([
  { id: '1', name: 'RoboDog X1 (Dog)' },
  { id: '2', name: 'CyberCat Z2 (Cat)' },
  { id: '3', name: 'PixelBird A3 (Dragon)' },
  { id: '4', name: 'MechaPanda G4 (Panda/Default)' },
]);

const sceneContainer = ref(null);
let renderer;
let scene;
let camera;
let currentPetModel = null;
let animationFrameId;
const modelOriginalScale = new THREE.Vector3(); 
const modelOriginalPosition = new THREE.Vector3();
const modelOriginalRotation = new THREE.Euler();


const selectedPetData = ref(null);
const isLoadingPetData = ref(false);
const isPetActionInProgress = ref(false); // Used for both feed and emotes

const chatMessages = ref([]);
const currentUserMessage = ref('');
const chatMessagesArea = ref(null); 
const isPetTyping = ref(false);

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = () => {
  nextTick(() => { if (chatMessagesArea.value) chatMessagesArea.value.scrollTop = chatMessagesArea.value.scrollHeight; });
};

watch(chatMessages, scrollToBottom, { deep: true });

const resetActionFlag = () => {
  isPetActionInProgress.value = false;
};

// --- Pet Actions & Emotes ---
const feedPet = async () => {
  if (!currentPetModel || !selectedPetData.value || isPetActionInProgress.value) return;
  isPetActionInProgress.value = true;

  modelOriginalScale.copy(currentPetModel.scale);
  const targetScale = modelOriginalScale.clone().multiplyScalar(1.3);
  currentPetModel.scale.copy(targetScale);

  chatMessages.value.push({ sender: 'system', text: `Feeding ${selectedPetData.value.name}...`, timestamp: new Date() });

  try {
    const response = await fetch('http://localhost:8080/api/pets/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'tempUser123', nftId: selectedPetData.value.nftId }),
    });
    const feedResponseData = await response.json();
    if (!response.ok) throw new Error(feedResponseData.statusMessage || `HTTP error! status: ${response.status}`);
    
    chatMessages.value.push({ sender: 'system', text: `${feedResponseData.statusMessage}<br>Pet says: Yummy! That was tasty!`, timestamp: new Date() });
  } catch (error) {
    console.error('Failed to feed pet via backend:', error);
    chatMessages.value.push({ sender: 'system', text: `Failed to feed ${selectedPetData.value.name}. Error: ${error.message}`, timestamp: new Date() });
    chatMessages.value.push({ sender: 'pet', text: 'Oh no, something went wrong with my snack!', timestamp: new Date() });
  } finally {
    setTimeout(() => {
      currentPetModel.scale.copy(modelOriginalScale);
      resetActionFlag();
    }, 600);
    scrollToBottom();
  }
};

const triggerHappyEmote = () => {
  if (!currentPetModel || isPetActionInProgress.value) return;
  isPetActionInProgress.value = true;
  
  modelOriginalPosition.copy(currentPetModel.position);
  currentPetModel.position.y += 0.5; // Jump up

  chatMessages.value.push({ sender: 'pet', text: 'Whee! I\'m happy!', timestamp: new Date() });

  setTimeout(() => {
    currentPetModel.position.copy(modelOriginalPosition); // Back to original position
    resetActionFlag();
  }, 400); // Duration of jump
};

const triggerSpinEmote = () => {
  if (!currentPetModel || isPetActionInProgress.value) return;
  isPetActionInProgress.value = true;

  modelOriginalScale.copy(currentPetModel.scale);
  const targetScale = modelOriginalScale.clone().multiplyScalar(1.2); // Scale up slightly
  
  chatMessages.value.push({ sender: 'pet', text: 'Look at me, I\'m spinning! (Well, pulsing!)', timestamp: new Date() });

  // Quick double scale pulse as a proxy for spin
  currentPetModel.scale.copy(targetScale);
  setTimeout(() => {
    currentPetModel.scale.copy(modelOriginalScale);
    setTimeout(() => {
      currentPetModel.scale.copy(targetScale);
      setTimeout(() => {
        currentPetModel.scale.copy(modelOriginalScale);
        resetActionFlag();
      }, 200);
    }, 200);
  }, 200); // Total duration ~600ms
};

const triggerWiggleEmote = () => {
  if (!currentPetModel || isPetActionInProgress.value) return;
  isPetActionInProgress.value = true;

  modelOriginalRotation.copy(currentPetModel.rotation);
  chatMessages.value.push({ sender: 'pet', text: 'Wiggle wiggle!', timestamp: new Date() });

  const wiggleAmount = 0.4; // Radians
  const wiggleDuration = 150; // ms for each part of wiggle

  currentPetModel.rotation.z += wiggleAmount;
  setTimeout(() => {
    currentPetModel.rotation.z -= wiggleAmount * 2;
    setTimeout(() => {
      currentPetModel.rotation.z += wiggleAmount; // Back to near original z
       setTimeout(() => { // One more to ensure it's back
        currentPetModel.rotation.copy(modelOriginalRotation); // Reset to exact original rotation
        resetActionFlag();
      }, wiggleDuration);
    }, wiggleDuration);
  }, wiggleDuration); // Total duration ~450ms
};


// --- Chat Logic ---
const sendMessage = async () => {
  if (currentUserMessage.value.trim() === '' || isPetTyping.value || isPetActionInProgress.value) return;
  const userMessageText = currentUserMessage.value;
  chatMessages.value.push({ sender: 'user', text: userMessageText, timestamp: new Date() });
  currentUserMessage.value = ''; 
  isPetTyping.value = true;

  try {
    const response = await fetch('http://localhost:8080/api/pets/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'tempUser', message: userMessageText }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const backendResponse = await response.json();
    chatMessages.value.push({ sender: 'pet', text: backendResponse.reply, timestamp: new Date() });
  } catch (error) {
    console.error('Failed to send message:', error);
    chatMessages.value.push({ sender: 'pet', text: "Sorry, I couldn't connect to the AI brain.", timestamp: new Date() });
  } finally {
    isPetTyping.value = false;
    scrollToBottom();
  }
};

// --- Three.js Logic ---
const removeCurrentPetModel = () => {
  if (currentPetModel) {
    scene.remove(currentPetModel);
    if (currentPetModel.geometry) currentPetModel.geometry.dispose();
    if (currentPetModel.material) currentPetModel.material.dispose();
    currentPetModel = null;
  }
};

const updatePetModel = (petData) => {
  removeCurrentPetModel();
  let geometry;
  const modelType = petData && petData.modelType ? petData.modelType.toLowerCase() : 'default';
  const modelColor = petData && petData.color ? petData.color : '#007bff';

  switch (modelType) {
    case 'cat': geometry = new THREE.SphereGeometry(1, 32, 32); break;
    case 'dog': geometry = new THREE.CapsuleGeometry(0.8, 1.2, 20, 32); break;
    case 'dragon': geometry = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16); break;
    default: geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); break;
  }
  const material = new THREE.MeshStandardMaterial({ color: modelColor });
  currentPetModel = new THREE.Mesh(geometry, material);
  
  // Store initial transformations when model is first created/updated
  modelOriginalScale.copy(currentPetModel.scale);
  modelOriginalPosition.copy(currentPetModel.position);
  modelOriginalRotation.copy(currentPetModel.rotation);

  scene.add(currentPetModel);
};

const selectNFT = async (nft) => {
  isLoadingPetData.value = true;
  selectedPetData.value = null;
  chatMessages.value = []; 
  isPetTyping.value = false;
  isPetActionInProgress.value = false;

  try {
    const response = await fetch(`http://localhost:8080/api/pets/${nft.id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    selectedPetData.value = data;
    updatePetModel(data); // This will set original scale/pos/rot

    isPetTyping.value = true;
    const greetingResponse = await fetch('http://localhost:8080/api/pets/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'tempUser', message: `Hello, I'm ${data.name}` })
    });
    if (!greetingResponse.ok) throw new Error(`Greeting HTTP error! status: ${greetingResponse.status}`);
    const greetingData = await greetingResponse.json();
    chatMessages.value.push({ sender: 'pet', text: greetingData.reply, timestamp: new Date() });
  } catch (error) {
    console.error('Failed to fetch pet data or initial greeting:', error);
    const errorData = { name: 'Error Pet', modelType: 'default', color: '#ff0000', level: 0, nftId: nft.id };
    selectedPetData.value = errorData;
    updatePetModel(errorData);
    chatMessages.value.push({ sender: 'pet', text: "Sorry, I couldn't load properly.", timestamp: new Date() });
  } finally {
    isLoadingPetData.value = false;
    isPetTyping.value = false;
    scrollToBottom();
  }
};

const setupThreeScene = (container) => {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
  camera.position.z = 4;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(containerWidth, containerHeight);
  container.appendChild(renderer.domElement);
  updatePetModel({ modelType: 'default', color: '#007bff' }); // Initial default model
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(3, 5, 5);
  scene.add(directionalLight);

  const handleResize = () => {
    if (sceneContainer.value) {
      const newWidth = sceneContainer.value.clientWidth;
      const newHeight = sceneContainer.value.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    }
  };
  window.addEventListener('resize', handleResize);

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    if (currentPetModel && !isPetActionInProgress.value) { // Only rotate if not in an action
      currentPetModel.rotation.x += 0.01;
      currentPetModel.rotation.y += 0.01;
    }
    renderer.render(scene, camera);
  };
  animate();

  return () => {
    window.removeEventListener('resize', handleResize);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    removeCurrentPetModel();
    if (renderer) {
      if (renderer.domElement && container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    }
  };
};

let cleanupThreeScene = () => {};
onMounted(async () => {
  await nextTick();
  if (sceneContainer.value) { cleanupThreeScene = setupThreeScene(sceneContainer.value); } 
  else { console.error("Scene container not found on mount."); }
});
onUnmounted(() => { cleanupThreeScene(); });

</script>

<style scoped>
.pets-view-container { display: flex; height: calc(100vh - 100px); width: 100%; }
.column { padding: 15px; border: 1px solid #ccc; overflow-y: auto; }
.left-column { width: 20%; background-color: #f9f9f9; }
.left-column h2 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.left-column ul { list-style: none; padding: 0; margin: 0; }
.left-column li { padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; transition: background-color 0.2s ease; }
.left-column li:hover { background-color: #e9e9e9; }
.left-column li:last-child { border-bottom: none; }
.center-column { width: 60%; background-color: #e0e0e0; display: flex; justify-content: center; align-items: center; position: relative; height: 100%; padding: 0; overflow: hidden; }
.center-column canvas { display: block; }
.right-column { width: 20%; background-color: #f9f9f9; display: flex; flex-direction: column; height: 100%; padding: 0; }
.chat-interface-container { display: flex; flex-direction: column; height: 100%; }
.chat-interface-container h3 { margin: 0; padding: 15px; border-bottom: 1px solid #eee; text-align: center; background-color: #f0f0f0; }
.pet-info-bar { padding: 5px 15px; background-color: #e9ecef; border-bottom: 1px solid #dee2e6; font-size: 0.8em; text-align: center; }
.pet-info-bar p { margin: 5px 0; }

.pet-actions-bar {
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-around; /* Distribute buttons */
  flex-wrap: wrap; /* Allow buttons to wrap on smaller screens */
  gap: 8px; /* Add gap between buttons */
}
.action-button {
  padding: 8px 12px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.9em;
}
.feed-button { background-color: #28a745; }
.feed-button:hover { background-color: #218838; }
.emote-button { background-color: #17a2b8; } /* Teal for emotes */
.emote-button:hover { background-color: #138496; }
.action-button:disabled { background-color: #adb5bd; cursor: not-allowed; }


.chat-messages-area { flex-grow: 1; overflow-y: auto; padding: 15px; background-color: #fff; }
.chat-message { margin-bottom: 10px; padding: 8px 12px; border-radius: 15px; max-width: 85%; word-wrap: break-word; }
.user-message { background-color: #007bff; color: white; margin-left: auto; border-bottom-right-radius: 5px; }
.pet-message { background-color: #e9ecef; color: #333; margin-right: auto; border-bottom-left-radius: 5px; }
.system-message { background-color: #6c757d; color: white; font-style: italic; text-align: center; margin-left: auto; margin-right: auto; border-radius: 8px; }
.typing-indicator .message-text i { color: #555; }
.message-sender { font-weight: bold; display: block; font-size: 0.8em; margin-bottom: 3px; }
.message-text { font-size: 0.95em; }
.message-timestamp { font-size: 0.7em; color: #777; display: block; text-align: right; margin-top: 4px; }
.user-message .message-timestamp { color: #f0f0f0; }
.system-message .message-timestamp { color: #e0e0e0; }
.chat-input-area { display: flex; padding: 15px; border-top: 1px solid #ccc; background-color: #f8f9fa; }
.chat-input-area input { flex-grow: 1; padding: 10px; border: 1px solid #ccc; border-radius: 20px; margin-right: 10px; outline: none; }
.chat-input-area input:disabled { background-color: #e9ecef; }
.chat-input-area button { padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 20px; cursor: pointer; transition: background-color 0.2s ease; }
.chat-input-area button:hover { background-color: #0056b3; }
.chat-input-area button:disabled { background-color: #a0cfff; cursor: not-allowed; }
.right-column > p { padding: 15px; text-align: center; }
</style>
