# 富禮一對一（bni-tool）

BNI 富禮分會的**常駐營運平台**：一對一約訪引擎＋會員名錄＋PALMS 紅綠燈儀表板。

## 功能

- **一對一預約**：混合制空檔登記（每週固定模式＋一次性加開＋例外挖除）、請求確認制、改期提案、完成打卡
- **一對一矩陣**：每季「約過誰／還沒約誰」一目瞭然，直接從矩陣發起預約
- **會員名錄**：產業服務鏈分類、25 秒報告順序
- **PALMS 數據**：幹部上傳中心區 Excel → 紅綠燈表＋預測綠燈補救名單（名單直連預約）
- **LINE 整合**：LINE Login 登入、預約通知推播、每日行程提醒（設定環境變數後啟用）
- **目標計算機**：年營業額反推每週一對一次數

## 開發

```bash
npm install
cp .env.example .env       # 填 SESSION_SECRET；DEV_AUTH=true 啟用假登入
npm run db:push            # 建立 SQLite 資料庫
npm run db:seed            # 假資料（10 名成員）
npm run dev                # http://localhost:3300
```

品質檢查：`npm run lint`（tsc）、`npm test`（Vitest，空檔引擎／狀態機／PALMS 計分）。

## 部署（Vercel + Supabase）

1. Supabase 建專案，取得 Postgres 連線字串
2. `prisma/schema.prisma` 的 `provider` 改為 `postgresql`，`npx prisma db push`
3. Vercel 匯入 GitHub repo，設定環境變數（見 `.env.example`；`DEV_AUTH` 不要設）
4. LINE Developers 建立 Login channel 與 Messaging API channel，填入對應變數；webhook 指向 `/api/line/webhook`
5. `vercel.json` 已含每日 20:00（台北）提醒 Cron，需設 `CRON_SECRET`

## 架構

- Next.js 15（App Router、Server Actions）＋ TypeScript ＋ Tailwind v4
- Prisma ORM：開發 SQLite／正式 Postgres（Supabase）
- 授權：HMAC 簽署 session cookie；所有 server action 驗證登入與資源所有權；幹部功能雙重把關
- 時間策略：台北當地日期字串＋當日分鐘數（分會活動固定於台灣）

`docs/` 為早期需求討論用的靜態互動原型（GitHub Pages），與正式程式碼無關。

## 專案文件

`.claude/docs/`：PRD、TECHSTACK、IMPLEMENTATION-PLAN、富樂 LIVE 競品分析。
