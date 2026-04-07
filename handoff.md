# Handoff

專案路徑：`/Users/neochiu/Downloads/n8n/wallet/task-trunk-app`

## 先看這些
- 專案完整交接資訊：[wiki.md](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/wiki.md)
- 線上站點：https://task-trunk-app.vercel.app/
- GitHub Repo：https://github.com/neochiu1004/task-trunk-app
- 目前主要分支：`main`

## 非常重要
- 目前線上站實際走的是舊版 JS 入口，不是 React 首頁。
- 線上入口：
  - [index.html](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/index.html)
  - [src/js/main.js](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/js/main.js)
  - [src/js/pages/ticketsPage.js](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/js/pages/ticketsPage.js)
- 如果只改 React：
  - [src/main.tsx](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/main.tsx)
  - [src/pages/Index.tsx](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/pages/Index.tsx)
  線上很可能不會生效。

## 最近已完成
- 線上票卡到期資訊已改成只留倒數，避免重複日期
- 首頁已加入版本與更新時間
- 已使用 / 回收桶已補上背景強度與卡片透明度設定
- 多張背景圖已補上手動 `下一張背景`

## 驗證重點
- 首頁是否看到版本與更新時間
- 如果畫面和預期不同，先懷疑是 PWA 快取或部署仍吃舊 bundle
- 線上問題優先檢查：
  - [src/js/pages/ticketsPage.js](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/js/pages/ticketsPage.js)
  - [src/js/pages/settingsPage.js](/Users/neochiu/Downloads/n8n/wallet/task-trunk-app/src/js/pages/settingsPage.js)

## Push 方式
```bash
cd /Users/neochiu/Downloads/n8n/wallet/task-trunk-app
git status --short
git add <files>
git commit -m "message"
git push origin main
```
