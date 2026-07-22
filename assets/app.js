/* =========================================================
   app.js — 首頁清單渲染 + 文章 markdown 渲染
   依賴（CDN）：marked（markdown → HTML）、highlight.js（程式碼高亮）
   都用 <script> 在 HTML 引入，這裡直接使用全域 marked / hljs
   ========================================================= */

/* ---------- 共用：安全跳脫 ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));
}

/* ---------- 首頁：讀 posts.json，渲染兩個區塊 ---------- */
async function renderIndex() {
  const weeklyEl  = document.getElementById('weekly-list');
  const writeEl   = document.getElementById('writeup-list');
  if (!weeklyEl && !writeEl) return;

  let data;
  try {
    const res = await fetch('posts.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    if (weeklyEl) weeklyEl.innerHTML = '<li class="status error">讀取 posts.json 失敗</li>';
    return;
  }

  const byDateDesc = (a, b) => String(b.date).localeCompare(String(a.date));

  const itemHTML = (p) => {
    const tags = (p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join(' ');
    const url = `post.html?p=${encodeURIComponent(p.file)}`;
    return `<li>
      <a href="${url}">${esc(p.title)}</a>
      <div class="post-meta">
        <span class="date">${esc(p.date || '')}</span>
        ${tags}
      </div>
    </li>`;
  };

  if (weeklyEl) {
    const arr = (data.weekly || []).slice().sort(byDateDesc);
    weeklyEl.innerHTML = arr.length
      ? arr.map(itemHTML).join('')
      : '<li class="status">（還沒有週進度）</li>';
  }
  if (writeEl) {
    const arr = (data.writeups || []).slice().sort(byDateDesc);
    writeEl.innerHTML = arr.length
      ? arr.map(itemHTML).join('')
      : '<li class="status">（還沒有 writeup）</li>';
  }
}

/* ---------- 文章頁：讀 ?p=posts/xxx.md，渲染 ---------- */
async function renderPost() {
  const el = document.getElementById('post-body');
  if (!el) return;

  const params = new URLSearchParams(location.search);
  const path = params.get('p');

  // 安全：只允許 posts/ 底下、.md 結尾、無跳目錄（支援中文檔名）
  if (!path || !path.startsWith('posts/') || !path.endsWith('.md') || path.includes('..')) {
    el.innerHTML = '<div class="status error">無效的文章路徑</div>';
    return;
  }

  let md;
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    md = await res.text();
  } catch (e) {
    el.innerHTML = `<div class="status error">找不到文章：${esc(path)}</div>`;
    return;
  }

  // marked 設定：交給 highlight.js 上色
  marked.setOptions({
    highlight: (code, lang) => {
      try {
        if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
        return hljs.highlightAuto(code).value;
      } catch { return esc(code); }
    },
    breaks: false,
    gfm: true,
  });

  el.innerHTML = marked.parse(md);

  // 標題同步到分頁
  const h1 = el.querySelector('h1');
  if (h1) document.title = h1.textContent + ' · pwn notes';
}

/* ---------- 進入點 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderIndex();
  renderPost();
});
