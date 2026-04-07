# Task Trunk App Wiki

最後更新：2026-04-07 23:59（Asia/Taipei）

## 專案位置
- 本機路徑：`/Users/neochiu/Downloads/n8n/wallet/task-trunk-app`
- 目前分支：`main`

## 主要網域與服務
- GitHub Repo：https://github.com/neochiu1004/task-trunk-app
- Git Remote（push/fetch）：`origin https://github.com/neochiu1004/task-trunk-app`
- 線上站點（目前觀察用）：https://task-trunk-app.vercel.app/
- 本機開發：`http://localhost:8080`
- Telegram API（提醒通知）：`https://api.telegram.org`
- Google Fonts：
  - `https://fonts.googleapis.com`
  - `https://fonts.gstatic.com`
- Supabase：
  - URL 來源：`VITE_SUPABASE_URL`
  - Publishable Key 來源：`VITE_SUPABASE_PUBLISHABLE_KEY`
  - 設定檔：[src/integrations/supabase/client.ts](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/integrations/supabase/client.ts)

## 帳號與密碼現況
- GitHub 帳號：從 remote 可確認為 `neochiu1004`
- Vercel 帳號：repo 內未找到明確帳號資訊，需向專案持有者確認
- Supabase 帳號：repo 內未找到登入帳號資訊，僅看到 env 變數引用
- Telegram Bot Token / Chat ID：
  - repo 預設值為空
  - 使用者可在設定頁輸入
  - 相關欄位：
    - [src/lib/constants.ts](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/lib/constants.ts)
    - [src/js/pages/settingsPage.js](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/js/pages/settingsPage.js)
    - [src/components/modals/SettingsModal.tsx](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/components/modals/SettingsModal.tsx)
- 密碼現況結論：
  - 目前 repo 內沒有找到可直接交接的正式帳號密碼
  - 下一個對話若需要登入 Vercel / Supabase / Telegram，需另外向你索取或在本機環境變數中查

## 部署與入口重點
- 這個 repo 同時存在兩套路徑：
  - React/Vite 路徑：`src/main.tsx` -> `src/pages/Index.tsx`
  - 舊版 JS 路徑：`index.html` -> `src/js/main.js` -> `src/js/pages/ticketsPage.js`
- 目前線上 `task-trunk-app.vercel.app` 實際使用的是舊版 JS 入口，不是 React `Index.tsx`
- 這點非常重要，因為如果只改 React 元件，線上站可能完全不會生效

## 最近已知修改重點
- 已為 React 首頁加入版本與更新時間顯示
- 已為舊版 JS 首頁加入版本與更新時間顯示
- 已修正線上實際使用的票卡到期資訊：
  - `active` 卡片改成優先只顯示倒數，不再同時顯示完整到期日
- 關鍵檔案：
  - [src/js/pages/ticketsPage.js](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/js/pages/ticketsPage.js)
  - [src/js/main.js](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/js/main.js)
  - [src/pages/Index.tsx](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/pages/Index.tsx)
  - [src/components/ticket/TicketCard.tsx](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/components/ticket/TicketCard.tsx)
  - [vite.config.ts](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/vite.config.ts)

## Push 方式
- 標準流程：
```bash
cd /Users/neochiu/Downloads/n8n/wallet/task-trunk-app
git status --short
git add <files>
git commit -m "your message"
git push origin main
```

- 這個專案最近就是直接 push 到 `origin/main`
- 目前沒有看到額外的 Git flow、release branch 或 PR 必經流程紀錄

## 常用指令
- 安裝依賴：
```bash
npm install
```

- 本機開發：
```bash
npm run dev
```

- 正式建置：
```bash
npm run build
```

- 預覽：
```bash
npm run preview
```

## 接手時先做的事
1. 先看首頁有沒有顯示版本與更新時間，確認不是舊快取。
2. 如果要修線上 `task-trunk-app.vercel.app`，優先檢查 [index.html](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/index.html) 與 [src/js/pages/ticketsPage.js](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/js/pages/ticketsPage.js)。
3. 如果改 React 但線上沒變，先懷疑目前部署仍走舊版 JS 入口。
4. 若需要帳密，先確認是不是存在本機 env 或由使用者手動填在設定頁，不要假設 repo 內有保存。
