# 心田農場

一個純 HTML/CSS/JavaScript 的精緻風農場與聖山遊戲原型。玩家可以註冊、培育健康樹樹 / 智慧樹樹 / 財富樹樹，完成每日任務取得對應數數，並透過公德數數在聖山排行中前進。

## 線上網址

https://hamkchang.github.io/spirit-farm-game/

正式首頁已套用 AL 精緻版全站介面。

## 新畫面原型

https://hamkchang.github.io/spirit-farm-game/concept/

## AL 精緻版畫面

https://hamkchang.github.io/spirit-farm-game/concept-v2/

## 開啟方式

直接開啟 `index.html` 即可遊玩。

若要測試 PWA 安裝與 service worker，可在此資料夾執行：

```bash
python3 -m http.server 5173
```

再打開 `http://localhost:5173`。

若要測試 OP / GE AI proxy，請改用 Node dev server：

```bash
cp .env.example .env
npm start
```

再打開 `http://localhost:5173`。

## OP / GE AI 串接

本專案已加入安全後端 proxy：

- `GET /api/ai/agents`：查看 OP / GE 設定狀態。
- `POST /api/ai/chat`：呼叫指定 agent。

Agent 對應：

| 名稱 | Provider | Model | Key env |
| --- | --- | --- | --- |
| OP | Anthropic-compatible | `opus-4.8` | `OP_API_KEY` / `ANTHROPIC_API_KEY` / `METACLAW_ADS_ANTHROPIC_TOKEN` |
| GE | Google Gemini | `gemini-3.5-flash` | `GE_API_KEY` / `GEMINI_API_KEY` / `METACLAW_ADS_GEMINI_TOKEN` |

範例：

```bash
curl -s http://localhost:5173/api/ai/chat \
  -H 'content-type: application/json' \
  -d '{"agent":"GE","message":"請用一句話說明今日任務設計方向"}'
```

API key 必須存在 `.env` 或雲端平台 Secrets，不能放進前端 HTML/JS。GitHub Pages 只能部署靜態檔，無法安全保存或執行 API key；正式上線 AI 功能時需部署到 Vercel、Render、Cloud Run 或其他有後端 runtime 的平台。

## 原型範圍

- 帳號、綠洲、任務、排行榜與 GM 發放紀錄目前存在瀏覽器 `localStorage`。
- 內建範例帳號：`yuna / demo`、`kai / demo`、`mei / demo`。
- GM 後台範例帳號：`gm / demo`。
- 新玩家註冊後會得到三種新手數數。
- 任務每天依本機日期重置。

## 轉成 iOS / Android 的方向

這個專案已經用 PWA 友善的結構拆分，未來可用 Capacitor 包裝：

```bash
npm create @capacitor/app
npx cap add ios
npx cap add android
```

正式多人版需要把 `app.js` 內的 localStorage 資料層換成後端 API，例如 Firebase、Supabase 或自建 REST/GraphQL 服務，並改用安全的登入驗證。
