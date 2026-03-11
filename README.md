# Task Trunk App - 票券管理 PWA

這是一個以 React + TypeScript 打造的票券管理工具，支援票券新增、分組檢視、核銷、回收桶、條碼掃描、範本套用與本地資料備份匯入匯出。

## 🚀 特色與體驗

### ✨ 介面風格
- **Wabi 風格視覺語言**：暖中性色背景、低飽和品牌色、卡片層次陰影與一致圓角。
- **行動優先佈局**：頂部操作列、底部導覽列、Modal/Drawer 流程適合手機操作。
- **一致元件語言**：按鈕、輸入框、卡片、下拉選單採同一套視覺規則。

### 📋 功能能力
- **票券生命週期管理**：待使用、已使用、回收桶三種視圖切換。
- **快速新增**：支援名稱、序號、到期日、兌換連結、標籤、圖片。
- **圖片條碼辨識**：可由圖片掃描序號，並在多條碼時選擇要套用的結果。
- **範本系統**：建立、套用、排序、重命名票券範本，提升重複輸入效率。
- **標籤與搜尋**：標籤篩選 + 關鍵字搜尋（名稱、標籤、序號、備註）。
- **批次操作**：支援選取模式進行批次異動。
- **本地資料管理**：JSON 匯出/匯入、資料健康檢查。
- **到期提醒整合**：可設定 Telegram 提醒（依設定條件推播）。

## 🧱 技術棧
- **框架**：React 18 + TypeScript
- **建置**：Vite 5
- **UI**：Tailwind CSS + shadcn/ui + Radix UI
- **動畫**：Framer Motion
- **資料**：IndexedDB（本地儲存）
- **其他**：PWA、ZXing 條碼辨識、React Query、Supabase Client（整合基礎）

## 🛠️ 本地開發

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動開發模式
```bash
npm run dev
```
預設會在 `http://localhost:8080` 啟動。

### 3. 建置正式版
```bash
npm run build
```

### 4. 預覽正式版
```bash
npm run preview
```

### 5. 程式碼檢查
```bash
npm run lint
```

## 📁 專案結構
```text
src/
├── components/
│   ├── layout/           # Header / BottomNavigation
│   ├── modals/           # 新增、設定、匯入匯出、批次操作
│   ├── ticket/           # 票券卡片、條碼、兌換流程
│   └── ui/               # 共用 UI 元件（shadcn）
├── lib/                  # db、helpers、validation、constants
├── pages/                # Index / NotFound
├── types/                # Ticket、Template、Settings 型別
└── index.css             # 全域主題與視覺 token
```

## 📝 更新說明（本次改造）
- 視覺層改為 jijun 取向：色盤、背景層次、元件圓角/陰影、導覽語言。
- 保持原有功能流程、資料欄位與型別契約不變。
- README 改為產品型中文說明格式。
