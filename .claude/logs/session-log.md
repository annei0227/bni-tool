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
- [ ] 執行 `/pm` 撰寫 IMPLEMENTATION-PLAN、建立 `/coder`、`/reviewer` subagent
- [ ] 申請 LINE Developers channel（LINE Login + Messaging API）——需要用戶操作
- [ ] 建立 Supabase 專案——需要用戶操作

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
