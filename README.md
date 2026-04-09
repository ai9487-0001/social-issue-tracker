# social-issue-tracker

版本：v1.2（2026-04-09）

## 調整內容（v1.2）

- Threads 改為「開關 + 模式」控制，避免在 token / usernames 都有值時仍顯示誤導性的權限錯誤。
- 先支援 `accounts` 模式：依 `THREADS_USERNAMES` 帳號逐一 lookup 後抓貼文。
- 強化 debug 回傳：包含 `threadsEnabled`、`threadsMode`、`trackedUsernames`、`hasToken`、`threadsStatus`、`threadsProfileLookups`、`threadsRawPreview`。
- News RSS 與 Threads 流程補上更完整錯誤處理。

## 功能

- Google News RSS
- Threads API（accounts 模式）
- 關鍵字搜尋
- 原文連結

## 環境變數

```text
THREADS_ENABLED=true
THREADS_MODE=accounts
THREADS_USERNAMES=account_a,account_b
THREADS_ACCESS_TOKEN=your_token
```

### 安全建議（重要）

- 不要把真實帳號清單與 token 寫入 Git（包含 README、程式碼、commit message）。
- 帳號名單請只放在部署平台環境變數（例如 Netlify UI）。
- 若曾經誤提交過敏感內容，請更換 token 並考慮做 Git 歷史清理。

### 環境變數說明

- `THREADS_ENABLED`：是否啟用 Threads 功能（`true` / `false`）。
- `THREADS_MODE`：目前支援 `accounts`（關閉可用 `off`）。
- `THREADS_USERNAMES`：要追蹤的 Threads 帳號清單（逗號分隔、不含空白）。
- `THREADS_ACCESS_TOKEN`：Threads Graph API token。

## 部署方式

### 1) Netlify（推薦）

1. 連接 GitHub repo。
2. Build 設定：
   - Publish directory：`.`
   - Functions directory：`netlify/functions`
3. 在 Netlify 設定上述環境變數。
4. 觸發 redeploy。

> 專案內建 `netlify.toml`：
>
> ```toml
> [build]
>   functions = "netlify/functions"
>   publish = "."
> ```


### 2) Vercel（替代方案）

可把 `netlify/functions/feed.js` 改成 Vercel Serverless Function（例如放到 `api/feed.js`），前端 `fetch` 路徑改為 `/api/feed`。環境變數同名設定於 Vercel Project Settings。

### 3) Cloudflare Pages + Functions（替代方案）

將函式遷移到 `functions/feed.js`（Cloudflare 格式），前端路徑改為 `/feed` 或自定 API 路由；環境變數設在 Pages 專案的 Variables。

### 4) 自架 Node 服務（替代方案）

以 Express/fastify 包一層 API（`/api/feed`），靜態檔案與 API 同機部署到 VPS / Render / Fly.io。適合需要自訂快取、排程與監控時使用。

### 5) GitHub Actions 自動部署（可選）

可以，**可直接自動部署**：只要你已設定好 secrets，`main` 每次 push 都會自動上線到 Netlify Production。

- 檔案：`.github/workflows/netlify-deploy.yml`
- 觸發：
  - push 到 `main`（自動部署）
  - 手動執行（workflow_dispatch）
- 失敗保護：若缺少必要 secrets，workflow 會直接失敗並提示缺少項目。

請在 GitHub Repository Settings → Secrets and variables → Actions 新增：

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

設定完成後，push 到 `main` 即會直接執行：

```bash
git push origin main
```

可在 GitHub 的 Actions 頁面查看每次部署結果。


## 驗證上線

部署後可先檢查：

- 首頁標題是否顯示 `v1.2 · 2026-04-09`
- 若查無資料，debug 是否含：
  - `threadsEnabled`
  - `threadsMode`
  - `trackedUsernames`
  - `hasToken`
