# new_post.ps1 — 建立「今天」的工作回報草稿，並用編輯器開起來。
#
# 平常用法：雙擊 new_post.bat（它會呼叫這支）
# 手動測試：powershell -NoProfile -ExecutionPolicy Bypass -File new_post.ps1 -DryRun
#           （-DryRun 只印出「會做什麼」，不建檔、不開編輯器）

param([switch]$DryRun)

$ErrorActionPreference = 'Stop'

$posts = Join-Path $PSScriptRoot 'posts'
$tpl   = Join-Path $posts '_模板_工作回報.md'
$today = Get-Date -Format 'yyyy-MM-dd'
$dst   = Join-Path $posts ('{0}_工作回報.md' -f $today)

if (-not (Test-Path $tpl)) {
    Write-Host "[ERROR] 找不到模板：$tpl"
    exit 1
}

# 編號 = 目前已發佈的工作回報篇數（#0 已存在 → 下一篇就是 #1）
$n = @(Get-ChildItem $posts -Filter '*工作回報*.md' |
       Where-Object { $_.Name -notlike '_*' }).Count

if (Test-Path $dst) {
    Write-Host "[SKIP] 今天的回報已經存在，直接開啟：$dst"
}
elseif ($DryRun) {
    Write-Host "[DRY] 模板：  $tpl"
    Write-Host "[DRY] 會建立：$dst"
    Write-Host "[DRY] 編號：  #$n"
    exit 0
}
else {
    Copy-Item $tpl $dst
    # 把模板 H1 的 YYYY-MM-DD 與 #N 換成今天的日期與編號
    $text = Get-Content -Raw -Encoding UTF8 $dst
    $text = $text -replace '(?m)^# YYYY-MM-DD — 工作回報 #N', ('# {0} — 工作回報 #{1}' -f $today, $n)
    Set-Content -Path $dst -Value $text -Encoding UTF8 -NoNewline
    Write-Host "[OK] 已建立：$dst   （編號 #$n）"
}

if ($DryRun) { exit 0 }

# 開編輯器：有 VS Code 就用 VS Code，沒有就記事本
if (Get-Command code -ErrorAction SilentlyContinue) {
    & code $dst
}
else {
    Start-Process notepad $dst
}

Write-Host ''
Write-Host '----------------------------------------------------------'
Write-Host ' 寫完、存檔（UTF-8）之後，回來做這兩步：'
Write-Host '   1. 雙擊 gen_posts.bat'
Write-Host "   2. git add . ; git commit -m `"工作回報 #$n`" ; git push"
Write-Host '----------------------------------------------------------'
