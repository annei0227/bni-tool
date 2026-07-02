# Project: BNI 富禮一對一預約平台 (bni-tool)

> BNI 富禮分會成員一對一約訪排程平台：混合制空檔登記（每週固定模式＋一次性時段＋例外挖除）、請求確認制預約、LINE 通知、一對一矩陣。詳見 `.claude/docs/PRD.md`。

## 專案設定（Git + GitHub 自動初始化）

> 此區塊由 Claude 在首次啟動時自動處理

| 項目 | 值 |
|-----|---|
| 類型 | `general` |
| GitHub | `tnfsp` |
| Visibility | `Public` |
| Repo | `bni-tool` |
| 狀態 | `done` |

### 啟動檢查（狀態為 `pending` 時自動執行）

1. **Git 檢查**
   - 無 `.git` → 執行 `git init`
   - 無 `.gitignore` → 建立基本 .gitignore

2. **命名轉換**
   - 讀取資料夾名稱
   - 前綴轉換：
     - `學習_` → `learning-`
     - `工具_` → `tool-`
     - `開發中_` → （無前綴）
   - 轉小寫，空格/底線改連字號
   - 範例：`學習_cardiac-surgery` → `learning-cardiac-surgery`

3. **Visibility 確認**
   - 詢問用戶：Public 或 Private？
   - 考量：是否適合開源？有無隱私資料？

4. **GitHub 建立**
   - 執行：`gh repo create tnfsp/{repo名稱} --public/--private`
   - 設定 remote 並 push

5. **完成後**
   - 更新上方設定欄位
   - 將狀態改為 `done`

---

## 專案概述

此專案使用 Claude Code 的 Subagent 架構進行開發。主要透過兩個核心 subagent 協作：
- **Concept** (`/concept`): 專案概念設計師，負責需求分析與架構設計
- **Project Manager** (`/pm`): 專案經理，負責規劃執行與協調

---

## 啟動時必讀

**每次 CLI 啟動時，請先執行以下步驟：**

1. 讀取 `.claude/logs/session-log.md` 了解專案進度與待辦事項
2. 檢視最近的決策記錄
3. 根據待辦事項繼續工作

---

## Subagent 架構

### 工作流程

```
用戶需求 → /concept → PRD + TECHSTACK + Subagent 設計
                ↓
         /pm → IMPLEMENTATION-PLAN + 建立 Subagent + 調度執行
                ↓
         完成任務 → 更新 Log → Git Push
```

### 核心 Subagent

| Command | 角色 | 職責 |
|---------|------|------|
| `/concept` | 概念設計師 | 討論需求、撰寫 PRD/TECHSTACK、設計 subagent |
| `/pm` | 專案經理 | 撰寫實作計畫、建立/調動 subagent、追蹤進度 |

### 動態 Subagent

PM 可根據需求建立新的 subagent，存放於 `.claude/commands/` 目錄。

---

## Log 系統

### 檔案位置
`.claude/logs/session-log.md`

### 記錄內容
每次 session 結束前，必須更新 log，包含：
- **變更摘要**: 本次完成了什麼
- **決策記錄**: 做了什麼決定、為什麼
- **待辦事項**: 下次需要繼續的工作

### 格式範例
```markdown
## Session: YYYY-MM-DD HH:MM

### 變更摘要
- 完成了 XXX 功能
- 修改了 YYY 檔案

### 決策記錄
- 決定使用 ZZZ 技術，因為...

### 待辦事項
- [ ] 待完成項目 1
- [ ] 待完成項目 2
- [x] 已完成項目（保留追蹤）
```

---

## Git 工作流程

每次 session 結束或有重大變更時：

```bash
git add .
git commit -m "描述變更內容"
git push
```

**Commit Message 規範：**
- `feat:` 新功能
- `fix:` 修復問題
- `docs:` 文件更新
- `refactor:` 重構
- `chore:` 雜項維護

---

## 目錄結構

```
.claude/
├── commands/           # Slash commands (subagents)
│   ├── concept.md      # 概念設計師
│   ├── pm.md           # 專案經理
│   └── [動態建立]       # PM 建立的其他 subagent
├── docs/               # 專案文件
│   ├── PRD.md          # 產品需求文件
│   ├── TECHSTACK.md    # 技術棧說明
│   └── IMPLEMENTATION-PLAN.md  # 實作計畫
└── logs/
    └── session-log.md  # Session 記錄

CLAUDE.md               # 本檔案（給 Claude 讀取）
README.md               # 給人類開發者
```

---

## 重要提醒

1. **永遠先讀 Log**: 確保了解專案當前狀態
2. **任務完成即更新 Log**: 不要等到最後才記錄
3. **保持文件同步**: PRD/TECHSTACK 有變動要通知相關 subagent
4. **Git 常態化**: 有意義的變更就 commit

---

## Security Guidelines

### 禁止事項
- **絕對禁止** 在程式碼中寫入 API keys、密碼、tokens
- **絕對禁止** commit 含有敏感資訊的檔案

### 正確做法
```javascript
// ❌ 錯誤
const API_KEY = "sk-abc123...";

// ✅ 正確
const API_KEY = process.env.API_KEY;
```

### 環境變數
- 使用 `.env` 存放敏感設定
- 確保 `.env` 已加入 `.gitignore`
- 提供 `.env.example` 範例檔（不含實際值）

### 若不慎 commit 敏感資訊
1. **立即** 撤銷該 key（在服務商後台）
2. 重新產生新的 key
3. 更新 `.env`
4. 注意：Git 歷史中的資訊無法完全清除

---

## Code Quality Standards

### 命名規範
- 變數/函數：`camelCase`
- 類別：`PascalCase`
- 常數：`UPPER_SNAKE_CASE`
- 檔案：`kebab-case.js`

### 程式碼品質
- 函數保持單一職責
- 有意義的變數名稱
- 複雜邏輯加上註解
- 保持程式碼可讀性

### 完成前檢查
- [ ] 程式碼符合命名規範
- [ ] 無安全性問題
- [ ] 文件已更新
- [ ] 測試通過（若有）

---

## NG Words/Phrases（避免 AI 感用語）

以下詞彙與句型在 AI 生成文字中出現頻率過高，應避免使用或以更自然的替代方案取代。

### 🚫 NG 動詞
| 避免使用 | 建議替代 |
|---------|---------|
| delve (into) | examine, study, investigate, look at |
| underscore | highlight, emphasize, show |
| harness | use, apply, leverage → use |
| illuminate | clarify, explain, show |
| facilitate | help, enable, allow |
| bolster | strengthen, support |
| streamline | simplify, improve |
| revolutionize | change, improve, transform |
| empower | enable, help, support |
| navigate | handle, manage, deal with |
| embark (on) | start, begin |
| unpack | explain, analyze |
| leverage | use, apply |

### 🚫 NG 形容詞
| 避免使用 | 建議替代 |
|---------|---------|
| pivotal | important, key, central |
| crucial / vital | important, essential |
| robust | strong, reliable, solid |
| comprehensive | complete, thorough, full |
| intricate | complex, detailed |
| seamless | smooth, easy |
| cutting-edge | new, advanced, modern |
| game-changing | significant, important |
| transformative | significant, influential |
| innovative | new, novel |
| groundbreaking | new, significant |

### 🚫 NG 名詞
| 避免使用 | 建議替代 |
|---------|---------|
| realm | field, area, domain |
| landscape | field, area, context |
| tapestry | mix, combination, variety |
| beacon | example, model, guide |
| paradigm | model, framework, approach |
| synergy | combination, cooperation |
| space (as in "this space") | field, area, industry |

### 🚫 NG 句型與轉折語
- ❌ "It's important to note that..." → ✅ 直接陳述重點
- ❌ "At its core..." → ✅ "Essentially," 或直接說明
- ❌ "From a broader perspective..." → ✅ "More broadly," 或省略
- ❌ "That being said..." → ✅ "However," "But,"
- ❌ "This underscores the importance of..." → ✅ "This shows that..."
- ❌ "A key takeaway is..." → ✅ 直接陳述結論
- ❌ "In today's fast-paced world..." → ✅ 刪除，直接切入主題
- ❌ "In the ever-evolving landscape of..." → ✅ 刪除或簡化
- ❌ "It is worth noting that..." → ✅ 直接陳述
- ❌ "Without further ado..." → ✅ 刪除
- ❌ "Here's the kicker..." → ✅ 刪除或用更正式表達
- ❌ "Generally speaking..." → ✅ "Generally," 或省略
- ❌ "To put it simply..." → ✅ 直接簡單說明
- ❌ "In light of this..." → ✅ "Therefore," "Thus,"
- ❌ "From X to Y..." (e.g., "From bustling cities to serene landscapes") → ✅ 避免此結構

### 🚫 NG 結構模式
- ❌ 過度使用 em-dash (—) — 雖然有效但 AI 會過度使用
- ❌ 固定的「主題句 + 三個支持點 + 總結句」結構
- ❌ 句長過於一致（缺乏 burstiness）
- ❌ 過度使用對比結構 "It's not just X, it's also Y"
- ❌ 每段開頭都用轉折詞 (Moreover, Furthermore, Additionally)
- ❌ 過度使用粗體強調
- ❌ 完全避免縮寫 (don't, can't, won't)，適度使用更自然

### ✅ 寫作原則
1. **簡潔直接** — 刪除不必要的轉折語和開場白
2. **變化句長** — 長短句交替，增加節奏感
3. **具體明確** — 用具體詞彙取代抽象概念
4. **保持人味** — 適度使用縮寫、口語化表達（視情境調整）
5. **避免過度修飾** — 一個形容詞勝過三個
6. **情境適應** — 技術文件需嚴謹，但不必僵硬
