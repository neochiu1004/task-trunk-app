

## 方案一：多選標籤篩選

將 `activeTag: string` 改為 `activeTags: string[]`，支援同時選取多個篩選條件（OR 聯集）。

### 改動範圍

**1. `src/pages/Index.tsx`**
- `activeTag: string` → `activeTags: string[]`，預設 `[]`（空 = 全部）
- 移除 `invertFilter` 相關邏輯（多選後反向意義不大，簡化處理）
- 篩選邏輯改為：
  - `activeTags` 為空 → 顯示全部
  - 否則票券只要符合任一選中條件即顯示（OR）
  - 特殊標籤（`special_expiring` 等）與一般標籤混合判斷
- `setActiveTag` 改為 toggle 函式：點擊已選標籤取消，點擊未選標籤加入
- `useMemo` 依賴改為 `activeTags`
- 刪除標籤時從 `activeTags` 中也移除

**2. `src/components/layout/Header.tsx`**
- Props：`activeTag: string` → `activeTags: string[]`，`setActiveTag` → `toggleTag: (tag: string) => void`
- 移除 `invertFilter` / `setInvertFilter` props 與反向按鈕
- 「全部」按鈕：點擊清空 `activeTags`，高亮條件改為 `activeTags.length === 0`
- 各標籤按鈕：`onClick` 改呼叫 `toggleTag(tag)`，高亮條件改為 `activeTags.includes(tag)`
- 支援多個標籤同時高亮顯示

### UI 行為

- 點擊標籤 → toggle 選中狀態（可多選）
- 點擊「全部」→ 清空所有選取
- 已選標籤保持各自的高亮色（快到期橘色、重複橙色等）
- 選中多個時，票券符合**任一**條件即顯示

### 不改動的部分
- 搜尋邏輯維持不變（搜尋在篩選之上疊加）
- 排序邏輯不變
- 選擇模式不變

