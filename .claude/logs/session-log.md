# Session Log

> 每次 CLI 啟動時必讀此檔案，了解專案進度與待辦事項

---

## Session: 2025-12-14 初始化

### 變更摘要
- 建立專案模板框架
- 建立 CLAUDE.md 主要說明文件
- 建立 `/concept` subagent (概念設計師)
- 建立 `/pm` subagent (專案經理)
- 建立文件模板：PRD.md, TECHSTACK.md, IMPLEMENTATION-PLAN.md
- 建立 log 系統

### 決策記錄
- 採用 `.claude/` 目錄結構管理所有 Claude Code 相關檔案
- Subagent 使用 slash command 方式實作，放在 `.claude/commands/`
- Log 使用累積式 Markdown 格式，每次 session 新增一個區塊
- 工作流程：Concept 先行 → PM 接手規劃 → 動態建立其他 Subagent

### 待辦事項
- [ ] 使用此模板開始新專案時，執行 `/concept` 討論專案概念
- [ ] 更新 CLAUDE.md 中的 `[PROJECT_NAME]`
- [ ] 填寫 PRD.md
- [ ] 填寫 TECHSTACK.md
- [ ] 執行 `/pm` 建立實作計畫

---

## Session: 2026-07-02 09:00（/concept 首次概念討論）

### 變更摘要
- 確立專案：BNI 富禮分會一對一約訪排程平台（bni-tool）
- 完成 PRD.md 初版（`.claude/docs/PRD.md`）
- 完成 TECHSTACK.md 初版（`.claude/docs/TECHSTACK.md`）
- 更新 CLAUDE.md 專案名稱與設定欄位
- 初始化 git、建立 GitHub repo `tnfsp/bni-tool`（public）

### 決策記錄
- **空檔模式採混合制**：每週固定模式為基底＋一次性時段登記＋例外挖除，所有內容隨時可修改。理由：純手動時段表容易過期失效，純固定模式又不夠彈性；用戶明確要求保留實體登記與修改能力
- **預約採請求→確認制**（非直接成立）：降低空檔資料稍有過期時的誤約風險
- **載體：手機優先網頁＋LINE 通知**；登入用 LINE Login（免密碼、順帶綁定推播 userId）
- **通知走 LINE Messaging API**（LINE Notify 已於 2025-03 停止服務）；免費 200 則/月可能不足，已在 PRD 記錄合併通知與升級方案的對策
- **MVP 範圍：排程＋一對一矩陣**（誰跟誰約過/沒約過＋完成打卡），解決「約誰、約時間、留記錄」三段痛點
- **技術棧**：Next.js + TypeScript + Tailwind + Supabase(PostgreSQL/RLS) + Vercel，全免費方案、零維運
- **Repo public**：供其他分會參考；成員資料與金鑰一律環境變數/資料庫，絕不進版控

### 待辦事項
- [x] 更新 CLAUDE.md 中的 `[PROJECT_NAME]`
- [x] 填寫 PRD.md
- [x] 填寫 TECHSTACK.md
- [x] 執行 `/pm` 撰寫 IMPLEMENTATION-PLAN、建立 `/coder`、`/reviewer` subagent
- [ ] 申請 LINE Developers channel（LINE Login + Messaging API）——需要用戶操作
- [ ] 建立 Supabase 專案——需要用戶操作

---

## Session: 2026-07-02 09:10（/pm 實作規劃）

### 變更摘要
- 完成 IMPLEMENTATION-PLAN.md 初版：四階段規劃（基礎建設 → 核心功能 → LINE 整合 → 測試部署）
- 建立 `/coder` subagent（全端開發，含領域規則與安全規範）
- 建立 `/reviewer` subagent（安全/正確性/手機相容性三面向審查）
- PRD subagent 狀態更新為已建立

### 決策記錄
- **LINE 整合獨立為 Phase 3**：LINE channel 尚未申請，Phase 1–2 以開發模式假登入（`DEV_AUTH` 環境變數切換）先完成核心功能，不被外部服務阻塞；auth 介面抽象化以便日後替換
- **空檔計算引擎（2.1）列為 Phase 2 首項**：全案最複雜邏輯，做成純函數＋Vitest 測試先行，誤約風險最高的地方用測試守住
- **站內通知中心（2.6）先於 LINE 推播**：通知事件先落表，LINE 推播只是多一個發送管道，避免 Phase 3 重工
- **推播用量控制寫進計畫**（3.2 合併訊息、3.4 用量監控）：因免費方案 200 則/月限制

### 待辦事項
- [ ] 執行 `/coder` 開始 Phase 1（任務 1.1 起）
- [ ] 申請 LINE Developers channel（LINE Login + Messaging API）——需要用戶操作，Phase 3 前完成即可
- [ ] 建立 Supabase 專案——需要用戶操作（或 Phase 1 先用本機 `supabase start`）
- [ ] Phase 1 完成後執行 `/reviewer` 首次審查

---

## Session: 2026-07-02 09:15（互動原型＋競品掃描）

### 變更摘要
- 建立互動原型 `docs/index.html`（單檔、假資料），供分會成員討論需求
- 開啟 GitHub Pages：https://annei0227.github.io/bni-tool/（master /docs）
- 原型已在 Chrome 實測：預約流程、確認、矩陣、空檔管理全部走通
- 掃描富樂分會工具「富樂 LIVE」（lab.lamigifts.com/fule23）並產出功能報告

### 決策記錄
- 原型走純前端單檔（vanilla JS），不用框架：目的只是收斂需求，用完即棄，不會成為正式版程式碼
- 原型放 repo 根目錄 `docs/`（GitHub Pages 慣例），與 `.claude/docs/`（專案文件）分開
- 富樂 LIVE 是「小組競賽/遊戲化」平台，與我們的「約訪排程」定位不同、不衝突；可借鏡：角色分級入口（會員/組長/核心團隊）、一對一目標計算機、遊戲化激勵

### 待辦事項
- [ ] 把原型連結分享到分會 LINE 群收集意見（說明頁已附 5 個討論題）
- [x] 依回饋更新 PRD（已因富樂深度分析升版 v0.2；會員回饋可再迭代）

---

## Session: 2026-07-02 09:35（富樂 LIVE 深度分析 → PRD v0.2 常駐平台）

### 變更摘要
- 深度拆解富樂 LIVE 原始碼（498KB 單檔 React＋Firebase），產出 `ANALYSIS-FULE-LIVE.md`
- PRD 升版 v0.2：定位從「約訪工具」擴大為「**分會常駐營運平台**」
- IMPLEMENTATION-PLAN 新增 Phase 4 PALMS 數據模組，測試部署改 Phase 5

### 決策記錄
- **常駐定位**（用戶明確要求）：不綁屆期，修正富樂最大弱點（fule23 賽季結束即棄置）
- **9999 是 demo 展示密碼**（唯讀角色），真正權限另有密碼——但全部硬編碼在公開 HTML，Firebase 前端直連無防護，85 人 PALMS 個資公開可讀。富禮版以 LINE Login＋RLS 修正，列為一票否決級安全需求
- **納入第一版**：會員名錄／產業服務鏈／25秒順序、PALMS 匯入（幹部上傳 Excel）、紅綠燈、預測綠燈＋補救名單（名單直連預約＝富樂做不到的行動閉環）
- **預留不做**：賽季競賽模組（schema 留 season 維度，富禮確定辦競賽再開發）
- **不做**：匿名留言板（管理風險，先觀察）、公告／行事曆（LINE 群可取代）、資料填寫追蹤（屆期性）

### 待辦事項
- [ ] 向用戶要一份 PALMS Excel 樣本（Phase 4 前置）
- [x] 執行 `/coder` 開始 Phase 1
- [ ] LINE channel／Supabase／Vercel 帳號（時程不變）

---

## Session: 2026-07-02 09:46（/coder 全量實作 Phase 1–5）

### 變更摘要
- 完整實作平台：Next.js 15＋TypeScript＋Tailwind v4＋Prisma，21 條路由
- 核心：空檔引擎（純函數）、預約狀態機、改期提案流、站內通知、一對一矩陣（季度）
- 常駐層：名錄（產業鏈/25秒）、PALMS 匯入（exceljs 寬鬆欄名比對）、紅綠燈六項計分、預測綠燈補救名單（直連預約）、目標計算機
- LINE：Login OAuth＋邀請碼綁定、推播（未設定自動停用）、webhook 簽章驗證、每日提醒 cron
- 品質：30 個 Vitest 單元測試、tsc strict 全過、production build 成功、瀏覽器端到端驗證（請求→確認→改期→接受、空檔 CRUD、權限分級）
- GitHub Actions CI（tsc/test/build）、README 重寫、.env.example

### 決策記錄
- **技術棧偏移（待用戶確認）**：本機無 Docker → Supabase local 不可行，改 Prisma（dev SQLite / prod Supabase Postgres）；RLS 改為應用層授權（每 action 驗證），部署後可補 RLS 第二層
- **時間策略**：捨 UTC 儲存，改台北當地日期字串＋當日分鐘數（分會活動固定台灣，消滅時區換算 bug 面）
- **時段粒度 60 分鐘**、預約視窗 14 天（常數可調）
- **改期＝提案制**：proposed* 欄位存提案，對方接受即改期並直接 confirmed
- **requested 也占用時段**：避免同時段被多人請求撞單
- **燈號門檻參數化**：`palms-scoring.ts` THRESHOLDS 預設值為 Power of One 慣例，待與中心區規則核對

### 已知限制／待辦
- [ ] LINE 三組憑證（Login channel、Messaging API、webhook）→ 實測 3.1–3.3
- [ ] 實際 PALMS Excel 樣本 → 校準匯入欄位別名與燈號門檻
- [ ] Supabase＋Vercel 部署（README 有步驟）
- [ ] 3.4 推播用量監控、4.6 培訓率（延後）
- [ ] Chrome extension 合成點擊與 React 19 表單不相容（真人操作正常，不影響產品）

---

<!-- 新的 session 記錄請加在這裡，格式如下：

## Session: YYYY-MM-DD HH:MM

### 變更摘要
- 完成了什麼

### 決策記錄
- 決定了什麼，為什麼

### 待辦事項
- [ ] 下次要做的事
- [x] 已完成的事（保留追蹤）

-->
