# 實作計畫 (Implementation Plan)

> 由 `/pm` 維護

---

## 專案資訊

- **專案名稱**: BNI 富禮一對一預約平台 (bni-tool)
- **PRD 版本**: v0.1
- **計畫建立日期**: 2026-07-02
- **最後更新**: 2026-07-02

---

## 排序原則

LINE channel 與 Supabase 專案尚未申請（需用戶操作）。因此：

1. **Phase 1–2 不依賴任何外部服務**：開發模式提供假登入（dev auth bypass，以環境變數切換），資料庫先用本機 Supabase（`supabase start`）或直接建雲端免費專案
2. **LINE 整合獨立為 Phase 3**：channel 申請完成後隨時可接上，不阻塞核心開發
3. **空檔計算引擎優先**：「固定模式＋一次性−例外−已預約」是全案最複雜的邏輯，做成純函數並先寫測試，之後所有功能都建立在它之上

---

## 階段規劃

### Phase 1: 基礎建設

- [ ] 1.1 建立 Next.js 專案（App Router + TypeScript + Tailwind），ESLint/Prettier/Vitest 設定
- [ ] 1.2 設計資料庫 schema 與 migration：`members`、`availability_patterns`（每週固定模式）、`availability_overrides`（一次性時段/例外挖除，同表以 type 區分）、`bookings`（狀態機：requested → confirmed → completed / cancelled / declined）、`one_on_one_records`
- [ ] 1.3 Supabase 專案連接與 RLS 政策（僅登入成員可讀寫分會資料）
- [ ] 1.4 開發模式假登入（`DEV_AUTH=true` 時可選任一 seed 成員身分登入），auth 介面抽象化以便 Phase 3 換成 LINE Login
- [ ] 1.5 Seed 資料：10 名假成員與範例空檔，供開發與展示
- [ ] 1.6 GitHub Actions：lint + test

### Phase 2: 核心功能（MVP 主體）

- [ ] 2.1 **空檔計算引擎**（純函數＋Vitest 完整測試）：輸入固定模式、一次性時段、例外、已成立預約，輸出指定日期範圍的可約時段；含時區（固定 Asia/Taipei）與重疊處理
- [ ] 2.2 成員列表與個人頁：姓名、公司、專業別、頭像、可約時段預覽
- [ ] 2.3 空檔管理 UI：固定模式 CRUD、一次性時段 CRUD、例外挖除，全部可隨時修改（PRD 明確要求）
- [ ] 2.4 預約流程：瀏覽時段 → 送出請求（附留言）→ 對方確認/提議改期/婉拒；已成立預約可改期、取消
- [ ] 2.5 我的預約頁：待我回應、待對方回應、即將到來、歷史紀錄
- [ ] 2.6 站內通知中心（鈴鐺）：LINE 推播上線前的通知底層，事件先落 `notifications` 表
- [ ] 2.7 一對一矩陣：季度視圖（約過/沒約過/進行中）、完成打卡、從矩陣直接發起預約

### Phase 3: LINE 整合

> 前置（需用戶操作）：LINE Developers 建立 Login channel＋Messaging API channel、Supabase 雲端專案（若 Phase 1 用本機）、Vercel 帳號連 GitHub

- [ ] 3.1 LINE Login OAuth 接入，替換假登入；首次登入綁定成員資料（邀請制：管理員預建名單，登入時配對）
- [ ] 3.2 Messaging API 推播：新請求、確認、改期、取消（合併訊息控制用量，單場預約全流程 ≤ 3 則）
- [ ] 3.3 Vercel Cron：每日 20:00 發送「明日約訪提醒」（多場合併為一則）
- [ ] 3.4 推播用量監控：每月用量落表，接近 200 則免費上限時通知管理員

### Phase 4: PALMS 數據模組（PRD v0.2 新增）

> 前置（需用戶操作）：取得一份實際的 PALMS Excel 樣本（欄位格式）

- [ ] 4.1 資料庫擴充：`palms_snapshots`（每週快照）、`palms_member_stats`、`training_sessions`；members 加產業鏈分類與 25 秒順序欄位；schema 預留 `season_id` 維度（賽季競賽模組用，暫不實作）
- [ ] 4.2 幹部權限（role: member / officer）與匯入後台：上傳 Excel → SheetJS/後端解析 → 入庫，含格式驗證與錯誤報告
- [ ] 4.3 會員名錄＋產業服務鏈頁：分類瀏覽、搜尋、25 秒順序表
- [ ] 4.4 紅綠燈表：依中心區計分規則計算燈號，歷月檢視
- [ ] 4.5 預測綠燈＋補救名單：試算達標缺口，列出「補一對一／引薦即轉綠」名單，**名單直接連到預約流程**
- [ ] 4.6 培訓率追蹤（輕量）

### Phase 5: 測試、部署與完善

- [ ] 5.1 核心流程整合測試（預約狀態機、RLS 權限、PALMS 匯入）
- [ ] 5.2 安全檢查：金鑰只在環境變數、RLS 全表覆蓋（特別是 PALMS 個資）、LINE webhook 簽章驗證
- [ ] 5.3 Vercel 正式部署 + `.env.example` 與 README 部署文件
- [ ] 5.4 管理員功能：成員邀請/停用、產業鏈分類維護
- [ ] 5.5 手機實機檢查（LINE in-app browser 開啟流程）
- [ ] 5.6 分會試用（先 3–5 人小圈測試，再全員推廣）

---

## Subagent 分配

| Subagent | 負責階段/任務 | 狀態 |
|----------|---------------|------|
| `/coder` | Phase 1–4 所有開發任務 | 已建立 |
| `/reviewer` | 各 Phase 完成後審查：安全、RLS、手機相容性 | 已建立 |

---

## 進度追蹤

| 階段 | 狀態 | 完成度 |
|------|------|--------|
| Phase 1 基礎建設 | 未開始 | 0% |
| Phase 2 預約核心 | 未開始 | 0% |
| Phase 3 LINE 整合 | 未開始（等 LINE channel） | 0% |
| Phase 4 PALMS 數據模組 | 未開始（等 PALMS Excel 樣本） | 0% |
| Phase 5 測試部署 | 未開始 | 0% |

---

## 風險與注意事項

| 風險 | 影響程度 | 對應策略 |
|------|----------|----------|
| 成員不維護空檔資料 | 高（產品成敗） | 混合制設計已降低維護量；矩陣頁提示「你的空檔已 N 週未更新」 |
| LINE 免費推播 200 則/月不足 | 中 | 合併通知（3.2）、用量監控（3.4）、必要時分會付費升級 |
| LINE in-app browser 相容性問題 | 中 | Phase 4.5 實機測試；避免依賴 in-app browser 不支援的 API |
| 空檔計算邏輯錯誤導致誤約 | 高 | 2.1 純函數＋完整單元測試先行；預約採確認制作為第二道防線 |
| 用戶端外部服務申請延遲 | 低 | Phase 1–2 完全不依賴外部服務，可先完成 |

---

## 變更記錄

| 日期 | 變更內容 |
|------|----------|
| 2026-07-02 | 初版建立：四階段規劃，LINE 整合獨立成階段以避免阻塞 |
| 2026-07-02 | 配合 PRD v0.2（常駐平台）：新增 Phase 4 PALMS 數據模組（匯入後台、名錄／產業鏈、紅綠燈、預測綠燈），原測試部署改為 Phase 5；schema 預留賽季維度 |
