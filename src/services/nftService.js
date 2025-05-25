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
      "id": 144,
      "txHash": "0x41f2055053c2ed0fa090160c6dde81b38e34d287e1e3c3b485cb8d64abb7dd01",
      "eventName": "Listed",
      "blockNumber": 30415370,
      "tokenId": "1043",
      "imageUrl": "https://harlequin-immense-fox-43.mypinata.cloud/ipfs/QmeLrRCAz9cQnst7ZX3UHub7CsNBcaA2iFh14tEAg8h9iY",
      "metaJsonUrl": "https://harlequin-immense-fox-43.mypinata.cloud/ipfs/QmWaKJ28uTT3kikxQVpVUT8hrdDx2jfa1X2BYsjw5FvuY5",
      "seller": "0xfb502a67f67d76407cfa93f7bd1d0a340bb47815",
      "buyer": null,
      "price": "0.1",
      "payment": "0",
      "fostered": 1,
      "listedTime": 1747620087,
      "purchasedTime": null,
      "deliveryConfirmedTime": null,
      "status": 0,
      "mintTime": 1747619481,
      "name": "Melvin Sørli",
      "exp": 0,
      "level": 20,
      "totalTasksCompleted": 0,
      "gender": 1,
      "breedType": "Turtle",
      "likeCount": null,
      "shareCount": null,
      "commentCount": null,
      "isAdopt": null,
      "isFostered": null,
      "isListed": null,
      "requiredExp": 19
    },
    {
      "id": 143,
      "txHash": "0x2e07aae8a443f0777d954c33ab45eab2d91b47023a5accda6ca74d13d0ae7687",
      "eventName": "Listed",
      "blockNumber": 30415361,
      "tokenId": "1042",
      "imageUrl": "https://harlequin-immense-fox-43.mypinata.cloud/ipfs/QmetJMbVsgU8Vh4s1ySMCbZr87vCzuuos8ERh6HeJEHqP3",
      "metaJsonUrl": "https://harlequin-immense-fox-43.mypinata.cloud/ipfs/QmT9BVGftKHh5GNs9uMA1m9wLDBMdHLoD9rNoMCSppn67x",
      "seller": "0x3bb64864c3ac1478c4c7771c0f9044a84106a177",
      "buyer": null,
      "price": "0.5",
      "payment": "0",
      "fostered": 1,
      "listedTime": 1747620069,
      "purchasedTime": null,
      "deliveryConfirmedTime": null,
      "status": 0,
      "mintTime": 1747619477,
      "name": "Mathys Rey",
      "exp": 0,
      "level": 13,
      "totalTasksCompleted": 0,
      "gender": 0,
      "breedType": "Turtle",
      "likeCount": null,
      "shareCount": null,
      "commentCount": null,
      "isAdopt": null,
      "isFostered": null,
      "isListed": null,
      "requiredExp": 15
    },
    {
      "id": 142,
      "txHash": "0x4e1de5727071f49502f085b88d5dbcf8139ff2f0758c7b555de01f02accddf76",
      "eventName": "Listed",
      "blockNumber": 30415352,
      "tokenId": "1041",
      "imageUrl": "https://harlequin-immense-fox-43.mypinata.cloud/ipfs/QmaRe1UFAQ3ESCKSqWvQTuwj5EBLwmCLUoNix7UTJkxyNi",
      "metaJsonUrl": "https://harlequin-immense-fox-43.mypinata.cloud/ipfs/QmWU1qBFjjhLBjLeWRK6Kg2ckjMtq3NRTafkWpHpYwiy15",
      "seller": "0x9c134adc6587731460e3868201149414cb2e8008",
      "buyer": null,
      "price": "0.2",
      "payment": "0",
      "fostered": 1,
      "listedTime": 1747620051,
      "purchasedTime": null,
      "deliveryConfirmedTime": null,
      "status": 0,
      "mintTime": 1747619469,
      "name": "Ronja Linna",
      "exp": 0,
      "level": 20,
      "totalTasksCompleted": 0,
      "gender": 0,
      "breedType": "Turtle",
      "likeCount": null,
      "shareCount": null,
      "commentCount": null,
      "isAdopt": null,
      "isFostered": null,
      "isListed": null,
      "requiredExp": 19
    }
  ];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(userNFTs);
    }, 500);
  });
};
