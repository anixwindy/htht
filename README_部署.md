# pwn_notes 網站 — 使用 & 部署說明

零建置（no build step）靜態站。丟 `.md`、push、自動上線。

## 目錄結構
```
web/
├── index.html          首頁（自動列清單，不用改）
├── post.html           文章檢視器（不用改）
├── posts.json          ★ 唯一要手動維護的清單
├── assets/style.css    樣式
├── assets/app.js       markdown 渲染邏輯
└── posts/              ★ 你的文章都放這（.md）
```

## 新增一篇文章（兩步驟）
1. 把 `.md` 檔丟進 `posts/`，例如 `posts/2026-W31_週進度.md`。
2. 在 `posts.json` 對應陣列加一筆：
   ```json
   { "title": "2026 W31 — 週進度", "file": "posts/2026-W31_週進度.md", "date": "2026-07-30" }
   ```
   - 週進度加到 `"weekly"`；writeup 加到 `"writeups"`（可帶 `"tags": ["heap","pwn"]`）。
   - 清單會自動**依 date 由新到舊排序**，不用自己排。

3. `git add . && git commit -m "w31" && git push` → Cloudflare Pages 自動 build & deploy。

## 本機預覽（重要）
直接雙擊 `index.html` **不會動**（`fetch` 在 `file://` 被瀏覽器擋）。要開本機伺服器：
```powershell
cd D:\Cthis\web
python -m http.server 8000
# 瀏覽器開 http://localhost:8000
```

## Cloudflare Pages 設定
- Framework preset：**None**
- Build command：**留空**
- Build output directory：**/**（或 `web`，看你 repo 根目錄）
- 綁 Cloudflare 網域：Pages 專案 → Custom domains → 加你的網域即可（同帳號 DNS 會自動設好）。

## 說明
- markdown 渲染用 CDN 的 `marked` + `highlight.js`（觀看者連得上網即可，無需你本機安裝）。
- 若想完全離線自帶，可把那兩支 js 下載到 `assets/` 並改 `post.html` 的 `<script src>`。
