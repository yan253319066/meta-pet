// src/services/nftService.js

/**
 * Simulates fetching a user's NFT data from an API.
 * @param {string} userId - The ID of the user whose NFTs are being fetched (currently unused).
 * @returns {Promise<Array<Object>>} A promise that resolves with a list of NFT objects.
 */
export const fetchUserNFTs = (userId) => {
  console.log(`Fetching NFTs for user: ${userId}`); // Placeholder for actual API call

  const userNFTs = [
    {
      id: 'NFT001',
      name: 'RoboDog X1 Prime',
      contractAddress: '0xabc123...',
      tokenId: '101',
      imageUrl: 'images/robodog_x1.png',
      metadata: {
        modelType: 'dog',
        color: 'Metallic Silver',
        level: 7,
        accessories: ['laser_collar', 'jetpack_mini'],
        baseModelUrl: 'models/Dog.glb',
        animations: ['Idle', 'Walk', 'Bark', 'Jump_Attack'], // Hypothetical animations
        description: 'A prime model of the trusty RoboDog X1 series.',
        rarity: 'Legendary',
      },
    },
    {
      id: 'NFT002',
      name: 'CyberCat Z2 Advanced',
      contractAddress: '0xdef456...',
      tokenId: '202',
      imageUrl: 'images/cybercat_z2.png',
      metadata: {
        modelType: 'cat',
        color: 'Neon Pink',
        level: 5,
        accessories: ['visor_shades'],
        baseModelUrl: 'models/Cat.glb',
        animations: ['Idle_Sit', 'Run', 'Meow_Stretch', 'Pounce'],
        description: 'An advanced CyberCat Z2 with enhanced agility.',
        rarity: 'Epic',
      },
    },
    {
      id: 'NFT003',
      name: 'PixelBird A3 Skywing',
      contractAddress: '0xghi789...',
      tokenId: '303',
      imageUrl: 'images/pixelbird_a3.png',
      metadata: {
        modelType: 'dragon',
        color: 'Sky Blue',
        level: 8,
        accessories: ['goggles', 'feather_crest_blue'],
        baseModelUrl: 'models/Dragon.glb',
        animations: ['Idle_Fly', 'Soar', 'Roar_Fire', 'Dive_Bomb'],
        description: 'A Skywing variant of the PixelBird A3, master of the skies.',
        rarity: 'Rare',
      },
    },
    {
      id: 'NFT004',
      name: 'MechaPanda G4 Guardian',
      contractAddress: '0xjkl012...',
      tokenId: '404',
      imageUrl: 'images/mechapanda_g4.png',
      metadata: {
        modelType: 'panda',
        color: 'Black & White',
        level: 6,
        accessories: ['bamboo_shield', 'power_gauntlets'],
        baseModelUrl: 'models/Panda.glb',
        animations: ['Idle_Stand', 'Walk_Heavy', 'Defend_Roar', 'Bamboo_Swing'],
        description: 'The Guardian G4 model of the MechaPanda, built for defense.',
        rarity: 'Epic',
      },
    },
    {
      id: 'NFT005',
      name: 'VoidKraken Tentaclon',
      contractAddress: '0xmno345...',
      tokenId: '505',
      imageUrl: 'images/voidkraken.png',
      metadata: {
        modelType: 'kraken',
        color: '#8A2BE2',
        level: 10,
        accessories: ['abyssal_crown', 'shadow_cloak'],
        baseModelUrl: 'models/Kraken.glb',
        animations: ['Idle_Float', 'Swim_Slow', 'Tentacle_Whip', 'Abyssal_Howl'],
        description: 'A terrifying Tentaclon from the Void, rarely seen.',
        rarity: 'Mythic',
      },
    }
  ];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(userNFTs);
    }, 500); 
  });
};
