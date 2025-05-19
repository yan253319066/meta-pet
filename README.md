# MetaPet

[中文文檔](README_cn.md) | [English](README.md)

![MetaPet Logo](public/images/logo.png)

MetaPet is a Web3 project that combines Real World Asset (RWA) mapping, NFT marketplace, and AI interaction, aiming to create a new experience of integrating real pets with digital life.

## 🌟 Features

- 🐢 **Real Asset Binding**: Each NFT maps to a real pet, representing its identity and growth records.
- 📈 **Growth NFT**: NFT metadata automatically updates with pet growth and record uploads (e.g., level, weight, health status).
- 🛒 **Built-in Marketplace**: Supports BNB and USDT trading, self-raising/entrusting purchase methods, with referral commissions.
- 🤖 **AI Companion**: Interact with your pet through AI, supporting conversations and personalized digital avatars.
- 🔗 **On-chain Records**: Growth logs, care behaviors, transfers, and breeding records are all stored on-chain.
- 📊 **Regulatory Mechanism**: Supports experimental investment regulatory mechanisms with on-chain visualization of fund flows.

## 🎥 Demo

- 🌐 Live Demo: [https://metapet.info](https://metapet.info)

## 🚀 Quick Start

### 1. Clone the Project
```bash
git clone https://github.com/your-org/meta-pet.git
cd meta-pet
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Start Backend
```bash
cd ../backend
./mvnw spring-boot:run
```

### 4. Deploy Smart Contracts
```bash
cd contracts
npx hardhat compile
npx hardhat deploy --network yourNetwork
```

## 📦 Technical Architecture

- **Solidity + OpenZeppelin**: NFT, marketplace, and log contracts
- **Vue 3 + Vite**: User frontend with responsive layout
- **Spring Boot**: RESTful API, content moderation, and caching layer
- **Pinata/IPFS**: Distributed storage for log files (images, videos, text)
- **OpenAI API**: Pet personality AI chat and daily generation assistance
- **MySQL / Redis**: Basic data and cache support

## 📚 Documentation

- [Chinese Whitepaper](docs/whitepaper/metapet_whitepaper_cn_tw.pdf)
- [English Whitepaper](docs/whitepaper/metapet_whitepaper_en.pdf)
- [繁體中文使用指南](docs/user-guide-cn-tw.md)
- [English User Guide](docs/user-guide-en.md)

## 👥 Community & Support

### Join Us
- GitHub Issues/Discussions: Welcome suggestions and bug reports
- PR contributions are welcome
- Watch/Star/Fork to join the Pet Planet co-creation journey!

### Business Cooperation / Contact Us
- 🌐 Website: [https://metapet.info](https://metapet.info)
- 📬 Telegram: [https://t.me/OS_Blockchain](https://t.me/OS_Blockchain)

## 🧪 Project Nature Statement

MetaPet is currently an experimental exploration project in continuous development and validation. All features, contracts, and data structures may be adjusted based on actual operational results.

### Risk Disclosure
Users should fully understand the following risks:
- Feature changes and system failures may cause experience or asset anomalies
- Digital asset prices are volatile
- Contract vulnerabilities and ecosystem dependencies may lead to asset risks

> ⚠️ This project makes no promises regarding the security, stability, or returns of experimental features. 