# MetaPet

[中文文檔](README_cn.md) | [English](README.md)

![MetaPet Logo](public/images/logo.png)

MetaPet 是一個結合現實資產映射（RWA）、NFT 交易市場與人工智能互動的 Web3 項目，旨在打造現實寵物與數字生命融合的新體驗。

## 🌟 項目特點

- 🐢 **真實資產綁定**：每個 NFT 都映射一隻真實寵物，NFT 代表寵物的身份與成長記錄。
- 📈 **成長型 NFT**：NFT metadata 隨寵物成長和記錄上傳自動更新（如等級、體重、健康狀態）。
- 🛒 **內置市場**：支持 BNB 和 USDT 交易，自養 / 代養兩種購買方式，支持推薦返傭。
- 🤖 **AI 智能陪伴**：通過 AI 與您的寵物互動，支持對話與數字形象個性化。
- 🔗 **鏈上記錄**：成長日誌、養護行為、轉移與繁殖記錄全部鏈上存證。
- 📊 **監管機制**：支持實驗性投資監管機制，鏈上可視化資金流轉路徑。

## 🎥 項目演示

- 🌐 在線體驗：[https://metapet.info](https://metapet.info)

## 🚀 快速開始

### 1. 克隆項目
```bash
git clone https://github.com/your-org/meta-pet.git
cd meta-pet
```

### 2. 啟動前端
```bash
cd frontend
npm install
npm run dev
```

### 3. 啟動後端
```bash
cd ../backend
./mvnw spring-boot:run
```

### 4. 智能合約部署
```bash
cd contracts
npx hardhat compile
npx hardhat deploy --network yourNetwork
```

## 📦 技術架構

- **Solidity + OpenZeppelin**：NFT、市場與日誌合約
- **Vue 3 + Vite**：用戶前端，響應式佈局
- **Spring Boot**：RESTful API、內容審核與緩存層
- **Pinata/IPFS**：日誌文件（圖像、視頻、文本）分佈式存儲
- **OpenAI API**：寵物個性 AI 聊天、日常生成輔助
- **MySQL / Redis**：基礎數據與緩存支持

## 📚 文檔

- [繁體中文白皮書](docs/whitepaper/metapet_whitepaper_cn_tw.pdf)
- [English Whitepaper](docs/whitepaper/metapet_whitepaper_en.pdf)
- [繁體中文使用指南](docs/user-guide-cn-tw.md)
- [English User Guide](docs/user-guide-en.md)

## 👥 社區與支持

### 加入我們
- GitHub Issues / Discussions 歡迎提出建議或報告問題
- 歡迎提交 PR，參與社區共建
- 開啟 Watch / Star / Fork，加入寵物星球的共創之路！

### 商務合作 / 聯繫我們
- 🌐 Website: [https://metapet.info](https://metapet.info)
- 📬 Telegram: [https://t.me/OS_Blockchain](https://t.me/OS_Blockchain)

## 🧪 項目性質聲明

MetaPet 當前為實驗性探索項目，處於持續開發與驗證階段。項目中包含的所有功能、合約與數據結構可能隨實際運行效果而調整。

### 風險提示
用戶在使用過程中應充分理解以下風險：
- 功能變更、系統故障可能導致體驗或資產異常
- 數字資產價格存在波動
- 合約漏洞、生態依賴性導致資產風險

> ⚠️ 本項目不對實驗性功能的安全性、穩定性或收益作任何承諾。
 