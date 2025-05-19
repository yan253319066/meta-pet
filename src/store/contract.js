export let contractStore = {
    USDC: '',
    PetInfoManager: '',
    PetNFT: '',
    PetMarket: '',
    PetDiary: '',
    PetBreeding: ''
}

export const updateContractStore = (contract) => {
    contractStore = contract
}