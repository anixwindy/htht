# game_log 工作回報站 — 使用 & 部署說明

零建置（no build step）靜態站。丟 `.md`、push、自動上線。由 `D:\Cthis\web`（原 pwn 站）複製改寫而來，改成 **C# + MonoGame 遊戲開發的工作回報**。

## 目錄結構
```
web/
├── index.html          首頁（自動列清單，不用改）
├── post.html           文章檢視器（不用改）
├── posts.json          ★ 清單（可手動維護，或跑 gen_posts.bat 自動生）
├── assets/style.css    樣式（終端綠主題，沿用原站）
├── assets/app.js       markdown 渲染邏輯
├── gen_posts.py        掃 posts/ 自動生 posts.json（路徑可攜）
├── gen_posts.bat       雙擊執行上面那支
└── posts/              ★ 你的文章都放這（.md）
```

## 兩種內容（靠檔名自動分類）
1. **工作回報**（每個休息日2 收尾寫一篇）
   檔名：`YYYY-MM-DD_工作回報.md`（日期開頭 + 含「工作回報」）→ 自動歸「工作回報」區，依日期排序。
2. **已完成專案**（做完一個小遊戲時）
   檔名：`<name>_project.md`（結尾 `_project.md`）→ 自動歸「已完成專案」區。
   可在檔案任一處放一行：`<!-- date: 2026-07-27; tags: monogame, 2d, snake -->`

`_` 開頭的檔（如 `_模板_工作回報.md`）會被忽略。

## 新增一篇（兩種做法，擇一）
**A. 自動（推薦）**：把 `.md` 丟進 `posts/` → 雙擊 `gen_posts.bat` → `posts.json` 自動更新。
**B. 手動**：把 `.md` 丟進 `posts/`，自己在 `posts.json` 加一筆。

然後：`git add . && git commit -m "..." && git push` → Cloudflare Pages 自動 build & deploy。

## 本機預覽（重要）
直接雙擊 `index.html` **不會動**（`fetch` 在 `file://` 被瀏覽器擋）。要開本機伺服器：
```powershell
cd D:\MonoGame\web
python -m http.server 8000
# 瀏覽器開 http://localhost:8000
```

## 首次接上 Cloudflare Pages（這份是全新 repo，沒帶舊 .git）
1. 在這個資料夾 `git init && git add . && git commit -m "init game_log"`。
2. 到 GitHub 開一個**新的** repo，`git remote add origin <新repo網址> && git push -u origin main`。
   （★ 不要接到舊 pwn 站那個 repo，兩個要各自獨立。）
3. Cloudflare Pages → Create project → 連這個新 repo：
   - Framework preset：**None**
   - Build command：**留空**
   - Build output directory：**/**（或 `web`，看 repo 根目錄）
4. 綁網域：Pages 專案 → Custom domains → 加網域即可。

## 說明
- markdown 渲染用 CDN 的 `marked` + `highlight.js`（觀看者連得上網即可，無需你本機安裝）。
- 想完全離線自帶，可把那兩支 js 下載到 `assets/` 並改 `post.html` 的 `<script src>`。
