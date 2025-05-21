import { BrowserProvider, Contract, ethers, formatUnits, parseEther, ZeroAddress, Signature, MaxUint256 } from 'ethers'
import { store } from '@/store/appkitStore'
import ERC20Abi from '@/abi/ERC20Abi.json'
import NFTAbi from '@/abi/NFTAbi.json'
import MarketAbi from '@/abi/MarketAbi.json'
import BreedingAbi from '@/abi/BreedingAbi.json'
import DiaryAbi from '@/abi/DiaryAbi.json'
import ManagerAbi from '@/abi/ManagerAbi.json'
import { contractStore } from '@/store/contract'

export const zeroAddress = ZeroAddress;

export const signMessage = async (message) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    // return provider.request({
    //     method: 'personal_sign',
    //     params: ['Hello from AppKit!', address]
    // })

    const signature = await signer?.signMessage(message);
    return signature;
}

export const referrerCount = async () => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const managerContract = new Contract(contractStore.PetInfoManager, ManagerAbi, signer)
    const count = await managerContract.getReferrerCount(await signer.getAddress())
    return count;
}

export const getShippingFee = async (breedType) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const managerContract = new Contract(contractStore.PetInfoManager, ManagerAbi, signer)
    return await managerContract.getShippingFee(breedType)
}

export const adoptPet = async (uri, name, breedType, parent) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const breedContract = new Contract(contractStore.PetBreeding, BreedingAbi, signer)
    let tx = await breedContract.adoptPet(uri, name, breedType, parent)
    tx = await tx.wait()
    return tx.hash;
}
export const userMint = async (uri, name, breedType, gender, fee) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const breedContract = new Contract(contractStore.PetBreeding, BreedingAbi, signer)
    let tx = await breedContract.userMint(uri, name, breedType, gender, { value: fee })
    tx = await tx.wait()
    return tx.hash;
}
export const mintFeeETH = async () => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const breedContract = new Contract(contractStore.PetBreeding, BreedingAbi, signer)
    return await breedContract.mintFeeETH();
}
export const upgradeNft = async (tokenId, fee) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const breedContract = new Contract(contractStore.PetBreeding, BreedingAbi, signer)
    let tx = await breedContract.growPet(tokenId, { value: fee })
    tx = await tx.wait()
    return tx.hash;
}
export const upFee = async () => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const breedContract = new Contract(contractStore.PetBreeding, BreedingAbi, signer)
    return await breedContract.upFeeETH()
}

export const breedFee = async () => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const breedContract = new Contract(contractStore.PetBreeding, BreedingAbi, signer)
    return await breedContract.breedFeeETH()
}

export const deliverPet = async (tokenId, deliveryAddress, fee) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const breedContract = new Contract(contractStore.PetBreeding, BreedingAbi, signer)
    let tx = await breedContract.deliverPet(tokenId, deliveryAddress, { value: fee })
    tx = await tx.wait()
    return tx.hash;
}

export const breedNft = async (tokenId1, tokenId2, uri, fee) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const breedContract = new Contract(contractStore.PetBreeding, BreedingAbi, signer)
    let tx = await breedContract.breedPets(tokenId1, tokenId2, uri, { value: fee })
    tx = await tx.wait()
    return tx.hash;
}

export const confirmDelivery = async (tokenId) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const breedContract = new Contract(contractStore.PetBreeding, BreedingAbi, signer)
    let tx = await breedContract.confirmDelivery(tokenId)
    tx = await tx.wait()
    return tx.hash;
}
export const addLog = async (tokenId, ipfsHash, isETHPayment, fee) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const diaryContract = new Contract(contractStore.PetDiary, DiaryAbi, signer)
    let tx = await diaryContract.addLog(tokenId, ipfsHash, isETHPayment, { value: fee })
    tx = await tx.wait()
    return tx.hash;
}
export const uploadFee = async () => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const diaryContract = new Contract(contractStore.PetDiary, DiaryAbi, signer)
    return await diaryContract.uploadFeeETH()
}

export const NftApprove = async (operator, tokenId) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const nftContract = new Contract(contractStore.PetNFT, NFTAbi, signer)
    let tx = await nftContract.approve(operator, tokenId)
    tx = await tx.wait()
}
export const NftSetApprovalForAll = async (operator, bool) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const nftContract = new Contract(contractStore.PetNFT, NFTAbi, signer)
    let tx = await nftContract.setApprovalForAll(operator, bool)
    tx = await tx.wait()
}
export const isApprovedForAll = async (owner, operator) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const nftContract = new Contract(contractStore.PetNFT, NFTAbi, signer)
    return await nftContract.isApprovedForAll(owner, operator)
}

export const nftBalanceOf = async (address) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const nftContract = new Contract(contractStore.PetNFT, NFTAbi, signer)
    return await nftContract.balanceOf(address)
}

export const listNft = async (tokenId, price, payment) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const isApproved = await isApprovedForAll(await signer.getAddress(), contractStore.PetMarket)
    if (!isApproved) {
        await NftSetApprovalForAll(contractStore.PetMarket, true)
    }
    const marketContract = new Contract(contractStore.PetMarket, MarketAbi, signer)
    let tx = await marketContract.listNFT(tokenId, parseEther(price), payment)
    tx = await tx.wait()
    return tx.hash;
}

// 获取用户签名并发送交易
export async function listNFTWithPermit(tokenId, price, payment, deadline) {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const nftContract = new Contract(contractStore.PetNFT, NFTAbi, signer)
    const marketContract = new Contract(MARKET_CONTRACT_ADDRESS, MarketAbi, signer)
    const chainId = store.networkState.chainId
    const domain = {
        name: "PetNFT",
        version: "1",
        chainId: chainId,
        verifyingContract: NFT_CONTRACT_ADDRESS,
    };

    const types = {
        Permit: [
            { name: "spender", type: "address" },
            { name: "tokenId", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };
    const nonce = await nftContract.getNonce(tokenId);
    const value = {
        spender: contractStore.PetMarket,
        tokenId: tokenId,
        nonce: nonce,
        deadline: deadline
    };
    const signature = await signer.signTypedData(domain, types, value);

    // 使用签名调用 listWithPermit
    let tx = await marketContract.listWithPermit(tokenId, price, payment, deadline, signature);
    tx = await tx.wait()
    return tx.hash;
}

export const unlistNft = async (tokenId) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const marketContract = new Contract(contractStore.PetMarket, MarketAbi, signer)
    let tx = await marketContract.unlistNFT(tokenId)
    tx = await tx.wait()
    return tx.hash;
}

export const buyNftByEth = async (tokenId, price) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const marketContract = new Contract(contractStore.PetMarket, MarketAbi, signer)
    let tx = await marketContract.buyNFTByEth(tokenId, { value: parseEther(price) })
    tx = await tx.wait()
    return tx.hash;
}

export const sendTx = async (address) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const tx = {
        from: address,
        to: address, // same address just for testing
        value: parseEther("0.0001")
    }
    return await signer.sendTransaction(tx)
}

export const getBalanceEth = async (address) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    return await ethersProvider.getBalance(address);
}

export const getBalance = async (address) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const balance = await ethersProvider.getBalance(address);
    return formatUnits(balance, 'ether')
}

/**base main usdc 6 */
export const getUsdcBalance = async (address, convert) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const erc20Contract = new Contract(contractStore.USDC, ERC20Abi, signer)
    if (convert)
        return await erc20Contract.balanceOf(address)
    else return formatUnits(await erc20Contract.balanceOf(address), 6)
}

export const buyNftByUsdc = async (tokenId) => {
    const ethersProvider = new BrowserProvider(store.eip155Provider);
    const signer = await ethersProvider.getSigner()
    const address = await signer.getAddress();
    // 1. 准备 USDC 合约 
    const usdc = new Contract(contractStore.USDC, ERC20Abi, signer);

    // 2. 获取用户的 nonce 
    const nonce = await usdc.nonces(address);

    // 3. 设置过期时间（1小时后）
    const deadline = (Math.floor(Date.now() / 1000) + 3600) * 24 * 365 * 10;

    // 4. 签名数据（EIP-712）
    const domain = {
        name: "USD Coin",
        version: "2",
        // name: "USDT",
        // version: "1",
        chainId: store.networkState.chainId, // Base 主网 chainId 
        verifyingContract: contractStore.USDC,
    };

    const types = {
        Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
    };

    const message = {
        owner: address,
        spender: contractStore.PetMarket,
        value: MaxUint256,
        nonce: nonce.toString(),
        deadline,
    };

    // 5. 用户签名 
    const signature = await signer.signTypedData(domain, types, message);
    const { v, r, s } = Signature.from(signature);

    // 6. 调用支付合约 
    const marketContract = new Contract(
        contractStore.PetMarket,
        MarketAbi,
        signer
    );

    let tx = await marketContract.buyNFTByUsdc(
        tokenId,
        deadline,
        v,
        r,
        s
    );

    // 监听支付成功事件 
    tx = await tx.wait();
    // console.log(tx)
    return tx.hash
}