# 心田農場

一個純 HTML/CSS/JavaScript 的農場遊戲原型。玩家可以註冊、種五種樹、完成每日任務取得肥料，並在世界頁看到其他玩家的農場狀態。

## 開啟方式

直接開啟 `index.html` 即可遊玩。

若要測試 PWA 安裝與 service worker，可在此資料夾執行：

```bash
python3 -m http.server 5173
```

再打開 `http://localhost:5173`。

## 原型範圍

- 帳號、農場、任務與社群狀態目前存在瀏覽器 `localStorage`。
- 內建範例帳號：`yuna / demo`、`kai / demo`。
- 新玩家註冊後會得到 1 份新手肥料。
- 任務每天依本機日期重置。

## 轉成 iOS / Android 的方向

這個專案已經用 PWA 友善的結構拆分，未來可用 Capacitor 包裝：

```bash
npm create @capacitor/app
npx cap add ios
npx cap add android
```

正式多人版需要把 `app.js` 內的 localStorage 資料層換成後端 API，例如 Firebase、Supabase 或自建 REST/GraphQL 服務，並改用安全的登入驗證。
