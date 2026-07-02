# 技術棧 (Tech Stack)

> 由 `/concept` 維護

---

## 總覽

單一分會、≤ 50 名使用者的小型全端應用。原則：**一套框架打全場、全部落在免費方案、部署零維運**。選 Next.js + Supabase + Vercel 的組合，LINE 整合走官方 Messaging API 與 LINE Login。

---

## 前端

### 框架/函式庫
- Next.js（App Router）+ React + TypeScript

### 狀態管理
- React Server Components 為主，客戶端互動用 React 內建 state；規模不需要 Redux/Zustand

### 樣式方案
- Tailwind CSS（手機優先），元件可視需要引入 shadcn/ui

### 建構工具
- Next.js 內建（Turbopack）

---

## 後端

### 語言/框架
- Next.js API Routes / Server Actions（與前端同一個 repo、同一次部署）

### API 風格
- Server Actions 為主，LINE webhook 用 API Route 接收

### 排程任務
- Vercel Cron：每日發送「明日約訪提醒」

---

## 資料庫

### ORM 與資料庫（2026-07-02 變更）
- **Prisma ORM**：開發環境 SQLite（本機無 Docker，Supabase local 不可行）；正式環境改 `provider = "postgresql"` 指向 Supabase Postgres
- 主要資料表：Member、AvailabilityPattern（每週固定模式）、AvailabilityOverride（一次性/例外）、Booking（狀態機）、Notification、PalmsSnapshot/PalmsMemberStat、Season（競賽模組預留）
- **授權模型變更**：原規劃 Supabase RLS → 改為**應用層授權**（每個 server action 驗證 session 與資源所有權；幹部功能 `requireOfficer` 把關）。理由：app 是唯一 DB client、Prisma 直連下 RLS 無作用點；正式上 Supabase 後可再補 RLS 當第二層防線
- 變更屬技術棧偏移，已列入待用戶確認清單

### 快取
- 不需要（規模極小）

---

## 認證與 LINE 整合

- **LINE Login**（OAuth）：唯一登入方式，登入即取得 LINE userId，天然綁定推播對象
- **LINE Messaging API**（官方帳號）：推播預約請求、確認、改期、提醒
  - 注意：LINE Notify 已於 2025-03 停止服務，不可採用
  - 免費方案 200 則/月，用量對策見 PRD 非功能需求

---

## 開發工具

### 程式碼品質
- TypeScript strict、ESLint、Prettier

### 測試框架
- Vitest（核心邏輯：空檔計算「固定模式 + 一次性 − 例外 − 已預約」是主要測試對象）

### 版本控制
- Git + GitHub（`tnfsp/bni-tool`，public）

---

## 部署環境

### 雲端服務
- Vercel（Hobby 免費方案）＋ Supabase（免費方案）

### 容器化
- 不需要

### CI/CD
- Vercel Git 整合（push 即部署）；GitHub Actions 跑 lint + test

---

## 選擇原因

| 技術 | 選擇原因 |
|------|----------|
| Next.js 全端 | 前後端一個 repo、一次部署；LINE webhook、頁面、API 都在同處，維護者只有一人時最省力 |
| Supabase | 免費 PostgreSQL + RLS 權限控管，適合「僅成員可見」的隱私需求；內建後台方便手動管理成員 |
| LINE Login | 成員都有 LINE、免記密碼；登入同時取得推播所需的 userId，一舉兩得 |
| Vercel | 免費、零維運、含 Cron；分會工具沒有預算與專職維運 |
| Tailwind | 手機優先介面快速開發 |

---

## 變更記錄

| 日期 | 變更內容 |
|------|----------|
| 2026-07-02 | 初版建立 |
| 2026-07-02 | 導入 Prisma（dev SQLite / prod Postgres）；授權改應用層；新增 exceljs（PALMS 匯入）；時間策略改台北當地日期字串＋分鐘數 |
