#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_posts.py — 掃描「本檔所在資料夾」底下的 posts\ 自動產生 posts.json，免手動編清單。

路徑可攜：用 __file__ 定位，放到哪個資料夾都能跑（不寫死 D:\...）。

分類規則（靠檔名，不用你標任何東西）：
  • 工作回報  檔名 = 日期開頭 + 含「工作回報」   例: 2026-07-27_工作回報.md  → 日期直接取檔名
  • 已完成專案 檔名結尾  _project.md            例: snake_project.md
  • 其它（_模板_*.md、任何 nav 獨立頁）一律忽略

標題：自動抓檔案第一個 `# ` 開頭的標題。
已完成專案的日期/標籤（可選）：在檔案任一處放一行註解，例：
    <!-- date: 2026-07-27; tags: monogame, 2d, roguelike -->
  沒放的話，日期用檔案修改時間、標籤留空。

用法：
    python gen_posts.py
    然後 git add . && git commit -m "..." && git push
"""

import re
import json
import datetime
from pathlib import Path

WEB = Path(__file__).resolve().parent
POSTS = WEB / "posts"


def first_heading(text: str) -> str:
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("# "):
            return s[2:].strip()
    return "(未命名)"


def read_meta(text: str):
    """從 <!-- date: ...; tags: ... --> 抓日期與標籤（都可選）。"""
    date, tags = None, []
    m = re.search(r"<!--(.*?)-->", text, re.S)
    if m:
        body = m.group(1)
        d = re.search(r"date:\s*(\d{4}-\d{2}-\d{2})", body)
        if d:
            date = d.group(1)
        t = re.search(r"tags:\s*([^\n>]+)", body)
        if t:
            tags = [x.strip() for x in re.split(r"[,;]", t.group(1)) if x.strip()]
    return date, tags


def main():
    if not POSTS.is_dir():
        raise SystemExit(f"找不到資料夾：{POSTS}")

    weekly, projects = [], []
    for f in sorted(POSTS.glob("*.md")):
        name = f.name
        if name.startswith("_"):          # 模板等，跳過
            continue
        text = f.read_text(encoding="utf-8")
        title = first_heading(text)
        rel = f"posts/{name}"

        mw = re.match(r"(\d{4}-\d{2}-\d{2})", name)
        if mw and "工作回報" in name:        # 工作回報：檔名 = 日期開頭
            weekly.append({"title": title, "file": rel, "date": mw.group(1)})
        elif name.endswith("_project.md"):  # 已完成專案
            date, tags = read_meta(text)
            if not date:
                date = datetime.date.fromtimestamp(f.stat().st_mtime).isoformat()
            entry = {"title": title, "file": rel, "date": date}
            if tags:
                entry["tags"] = tags
            projects.append(entry)
        # 其它檔名 → 忽略

    weekly.sort(key=lambda x: x["date"], reverse=True)
    projects.sort(key=lambda x: x["date"], reverse=True)

    out = {"weekly": weekly, "writeups": projects}
    (WEB / "posts.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"[OK] posts.json 已更新：{len(weekly)} 篇工作回報 + {len(projects)} 個已完成專案")
    for p in weekly + projects:
        print("     -", p["file"], "→", p["title"])


if __name__ == "__main__":
    main()
