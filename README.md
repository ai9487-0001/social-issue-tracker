# social-issue-tracker

社會議題追蹤站 MVP。

## 部署

建議使用 Netlify 連 GitHub 部署。

若 Netlify 已連接此 repo，push 新 commit 後通常會自動重新部署。

## 功能

- Google News RSS 真實資料
- Threads 關鍵字搜尋（需設定環境變數）
- 原文來源顯示
- 查看原文連結

## Netlify 環境變數

若要啟用 Threads，請在 Netlify Site configuration → Environment variables 設定：

- `THREADS_ACCESS_TOKEN`：Threads API access token

目前程式會在未設定 `THREADS_ACCESS_TOKEN` 時，自動只使用新聞來源，不會把 token 寫進 repo。
