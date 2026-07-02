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

- [x] 1.1 建立 Next.js 專案（App Router + TypeScript + Tailwind v4），tsc/Vitest 設定
- [x] 1.2 資料庫 schema（Prisma）：Member、AvailabilityPattern、AvailabilityOverride、Booking、Notification、Palms*、Season（預留）
- [x] 1.3 ~~Supabase RLS~~ → 改 Prisma＋應用層授權（見 TECHSTACK 變更記錄；待用戶確認）
- [x] 1.4 開發模式假登入（`DEV_AUTH=true`），auth 抽象化（session cookie 與登入方式解耦）
- [x] 1.5 Seed：10 名假成員、空檔、預約、PALMS 快照
- [x] 1.6 GitHub Actions：tsc + test + build

### Phase 2: 核心功能（MVP 主體）

- [x] 2.1 **空檔計算引擎**（純函數＋15 個 Vitest 測試）：固定模式＋加開−挖除−占用；60 分時段、殘段處理、今日過時過濾、雙方行程交集
- [x] 2.2 成員列表與個人頁（含最近可約時段預覽、本季狀態標籤）
- [x] 2.3 空檔管理 UI：固定模式/加開/整天挖除 CRUD
- [x] 2.4 預約流程：請求（附留言）→ 確認/婉拒/收回；改期提案→接受/維持原時間；取消；完成打卡（當日起可按）
- [x] 2.5 我的預約頁：四區塊＋歷史
- [x] 2.6 站內通知中心＋未讀 badge（事件落 Notification 表，LINE 為第二管道）
- [x] 2.7 一對一矩陣：季度統計、三色格、點格直達預約

### Phase 3: LINE 整合

> 前置（需用戶操作）：LINE Developers 建立 Login channel＋Messaging API channel、Supabase 雲端專案（若 Phase 1 用本機）、Vercel 帳號連 GitHub

- [x] 3.1 LINE Login OAuth＋邀請碼綁定流程（程式完成，**待 channel 憑證實測**）
- [x] 3.2 Messaging API 推播（單則合併訊息；未設定時自動只走站內通知）＋ webhook 簽章驗證
- [x] 3.3 Vercel Cron 每日提醒（台北 20:00，多場合併一則；`CRON_SECRET` 驗證）
- [ ] 3.4 推播用量監控（待 LINE 上線後實作）

### Phase 4: PALMS 數據模組（PRD v0.2 新增）

> 前置（需用戶操作）：取得一份實際的 PALMS Excel 樣本（欄位格式）

- [x] 4.1 資料庫擴充：PalmsSnapshot/PalmsMemberStat、Member 加產業鏈與 25 秒順序、Season 表預留
- [x] 4.2 幹部權限（member/officer）＋匯入後台：exceljs 解析、欄名寬鬆比對、缺欄警告、姓名對照回報（**欄位別名待實際 PALMS 樣本校準**）
- [x] 4.3 名錄：產業服務鏈分類＋25 秒順序雙視圖
- [x] 4.4 紅綠燈表：六項計分（門檻參數化於 `palms-scoring.ts`，**預設值待與中心區規則核對**）
- [x] 4.5 預測綠燈＋補救名單：80% 目標缺口、「差一級轉綠」名單直連預約、個人補救提示
- [ ] 4.6 培訓率追蹤（延後：需確認分會培訓場次資料來源）

### Phase 5: 測試、部署與完善

- [x] 5.1 核心邏輯 30 個單元測試＋瀏覽器端到端手動驗證（預約→確認→改期→接受、空檔 CRUD、PALMS 解析）
- [x] 5.2 安全檢查：金鑰只在環境變數（.env 不進版控）、所有 action 驗證登入/所有權/角色、webhook 簽章、cron secret
- [x] 5.3 `.env.example`＋README 部署文件（**Vercel 實際部署待帳號**）
- [x] 5.4 管理員功能：成員新增（自動邀請碼）/停用/幹部升降、產業鏈與順序欄位
- [ ] 5.5 手機實機檢查（待部署後）
- [ ] 5.6 分會試用（待部署後）

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
| Phase 1 基礎建設 | 完成 | 100% |
| Phase 2 預約核心 | 完成 | 100% |
| Phase 3 LINE 整合 | 程式完成，待 channel 憑證實測 | 75% |
| Phase 4 PALMS 數據模組 | 完成（欄位別名與燈號門檻待實際資料校準） | 85% |
| Phase 5 測試部署 | 本機驗證完成，待 Vercel/Supabase 部署 | 65% |

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
