#!/usr/bin/env python3
"""Bikin 20 latar arena: cpp-1..10.png dan js-1..10.png (assets/backgrounds/), satu per level.

Ukuran 160x60 piksel, SAMA dengan grid latar utama (basic/medium/expert.svg, viewBox 0 0 160 60).
Di arena laptop 1040x400, satu piksel gambar jadi sekitar 6,5 piksel layar, jadi kepadatan
pikselnya sama dengan sprite hero/boss dan latar Python. (Versi 520x200 sebelumnya terlalu
halus: piksel latar cuma ~2 piksel layar, jadi kelihatan ga nyambung.)

Gaya mengikuti latar utama: pita langit datar tanpa dither, siluet tebal, warna sedikit.
Tanah bata dari CSS menutup sekitar 14% dasar arena, jadi garis tanah ada di y=52 dan
dasar gambar (y>=52) diisi warna tanah (ga ada celah hitam).

Lobi: lobby-cpp.png dan lobby-js.png (120x60).

Pakai: python tools/arena_px.py [folder_output]   (butuh Pillow)
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

W, H, G = 160, 60, 52


def hexc(h):
    if not isinstance(h, str):
        return tuple(h)
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    a, b = hexc(a), hexc(b)
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def new():
    img = Image.new('RGB', (W, H))
    return img, ImageDraw.Draw(img)


def R(d, x, y, w, h, c):
    if w > 0 and h > 0:
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=c)


def P(d, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        d.point((x, y), fill=c)


def bands(d, spec):
    """spec = [(tinggi, warna), ...]; pita terakhir diperpanjang sampai dasar."""
    y = 0
    for i, (h, c) in enumerate(spec):
        R(d, 0, y, W, (H - y) if i == len(spec) - 1 else h, c)
        y += h


def disc(d, cx, cy, r, c):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + r * 0.4:
                P(d, x, y, c)


def tri(d, cx, base, w, h, c):
    for i in range(h):
        half = round((w / 2) * (i + 1) / h)
        R(d, cx - half, base - h + i, half * 2 + 1, 1, c)


def itri(d, cx, top, w, h, c):
    for i in range(h):
        half = round((w / 2) * (h - i) / h)
        R(d, cx - half, top + i, half * 2 + 1, 1, c)


def ridge(d, c, base, amp, seed, f=9.0):
    r = random.Random(seed)
    p1, p2 = r.random() * 6, r.random() * 6
    for x in range(W):
        h = int(amp * (0.55 + 0.3 * math.sin(x / f + p1) + 0.2 * math.sin(x / (f / 2.3) + p2)))
        R(d, x, base - h, 1, G - (base - h), c)


def cloud(d, x, y, c='#ffffff'):
    R(d, x + 2, y, 6, 1, c)
    R(d, x, y + 1, 10, 1, c)
    R(d, x + 1, y + 2, 8, 1, c)


def ground(img, d, c, line):
    R(d, 0, G, W, H - G, c)
    R(d, 0, G, W, 1, line)
    return img


def stars(d, rng, n, ymax, c='#fff3c4'):
    for _ in range(n):
        P(d, rng.randint(0, W - 1), rng.randint(0, ymax), c)


def gear(d, cx, cy, r, body, dark):
    for k in range(8):
        a = k * math.pi / 4
        R(d, round(cx + math.cos(a) * (r + 1)) - 1, round(cy + math.sin(a) * (r + 1)) - 1, 2, 2, body)
    disc(d, cx, cy, r, body)
    disc(d, cx, cy, r - 2, dark)
    R(d, cx - r + 1, cy, 2 * r - 1, 1, body)
    R(d, cx, cy - r + 1, 1, 2 * r - 1, body)
    disc(d, cx, cy, 1, body)


def block(d, x, y, c, s=4):
    R(d, x, y, s, s, c)
    R(d, x, y, s, 1, mix(c, '#ffffff', 0.35))
    R(d, x, y + s - 1, s, 1, mix(c, '#000000', 0.35))


def building(d, rng, x, w, h, body, side, roof, on, off):
    R(d, x, G - h, w, h, body)
    R(d, x + w - 2, G - h, 2, h, side)
    R(d, x, G - h, w, 1, roof)
    for wy in range(G - h + 3, G - 2, 4):
        for wx in range(x + 2, x + w - 3, 3):
            P(d, wx, wy, on if rng.random() < 0.6 else off)


def chimney(d, x, top, h, body, stripe, smoke, puffs=3):
    R(d, x, top, 3, h, body)
    R(d, x - 1, top, 5, 1, stripe)
    sx, sy = x + 1, top - 2
    for i in range(puffs):
        disc(d, sx, sy, 1 + i // 2, smoke)
        sx += 1 + i % 2
        sy -= 3


# ============================================================ C++ ====

def cpp_1():   # pabrik pagi (Stream Bot)
    img, d = new()
    rng = random.Random(1)
    bands(d, [(18, '#73a4d8'), (14, '#9cc2e8'), (20, '#d6e4ee'), (8, '#f0dcc0')])
    for x, y in ((14, 6), (70, 12), (118, 5)):
        cloud(d, x, y)
    x = 0
    while x < W:                                              # kota jauh
        w, h = rng.randint(6, 11), rng.randint(5, 13)
        R(d, x, G - h, w, h, '#b8c4d8')
        x += w + rng.randint(0, 2)
    front, side, roof = '#5f7399', '#4a5c82', '#7e92b8'
    for x, w, h, ch in ((0, 17, 28, 14), (19, 13, 17, 0), (62, 12, 12, 0), (76, 11, 10, 0),
                        (104, 12, 15, 0), (118, 16, 23, 12), (136, 24, 30, 15)):
        building(d, rng, x, w, h, front, side, roof, '#ffd36b', '#3b4a6e')
        if ch:
            chimney(d, x + w // 2 - 1, G - h - ch, ch, '#6b7ea6', '#d9622b', '#eef2f9')
    gear(d, 7, G - 9, 3, '#e8923a', '#b9672a')
    return ground(img, d, '#34395a', '#4a5078')


def cpp_2():   # gudang kontainer (Box Mimic)
    img, d = new()
    rng = random.Random(2)
    bands(d, [(20, '#7fb2e0'), (16, '#a9d0ec'), (24, '#d9ebf5')])
    for x, y in ((18, 5), (88, 9), (128, 4)):
        cloud(d, x, y)
    R(d, 36, G - 16, 88, 16, '#8a96aa')                       # gudang
    for x in range(36, 124, 11):
        tri(d, x + 5, G - 16, 11, 5, '#6f7c92')
    for x in range(42, 120, 8):
        R(d, x, G - 10, 4, 8, '#5a6680')
    R(d, 78, 12, 2, G - 28, '#e8a23a')                         # crane
    R(d, 62, 12, 42, 2, '#e8a23a')
    R(d, 97, 14, 1, 8, '#2a2a2a')
    R(d, 95, 22, 5, 2, '#d4402e')
    cols = ['#c0452f', '#3f6fb5', '#4a9a5a', '#e0903a', '#d8b43a', '#7a4fa8']
    for sx, rows in ((0, (3, 2, 1)), (24, (2, 1)), (118, (2, 1)), (134, (3, 2, 1))):
        for ri, n in enumerate(rows):
            for i in range(n):
                R(d, sx + i * 12, G - 5 * (ri + 1), 11, 5, c := rng.choice(cols))
                R(d, sx + i * 12, G - 5 * (ri + 1), 11, 1, mix(c, '#ffffff', 0.3))
    for x, s in ((32, 4), (113, 5)):
        R(d, x, G - s, s, s, '#b9803f')
        R(d, x, G - s, s, 1, '#d9a35a')
    return ground(img, d, '#4a4658', '#6a6680')


def cpp_3():   # pelabuhan (Operator Crab)
    img, d = new()
    rng = random.Random(3)
    bands(d, [(14, '#5aa0e0'), (12, '#8cc4ee'), (8, '#cfe6f2')])
    disc(d, 132, 9, 4, '#fff7c0')
    for x, y in ((14, 6), (60, 3)):
        cloud(d, x, y)
    for i, (h, c) in enumerate(((7, '#4a94d0'), (8, '#3f86c8'), (7, '#3578b8'), (H, '#2d6aa8'))):
        R(d, 0, 34 + sum(t[0] for t in ((7,), (8,), (7,))[:i]), W, h, c)
    for _ in range(34):
        R(d, rng.randint(0, W - 3), rng.randint(36, G - 3), rng.randint(2, 4), 1, '#8fc4ee')
    R(d, 58, 29, 44, 4, '#2f3a54')                             # kapal
    P(d, 57, 29, '#2f3a54'); P(d, 102, 29, '#2f3a54')
    for i, c in enumerate(('#c0452f', '#e0903a', '#3f6fb5', '#4a9a5a', '#d8b43a', '#c0452f')):
        R(d, 60 + i * 6, 25, 5, 4, c)
    R(d, 92, 20, 7, 9, '#e8e8f0')
    for cx, dr in ((8, 1), (151, -1)):                         # derek
        R(d, cx - (1 if dr < 0 else 0), 18, 2, G - 18, '#e0523a')
        R(d, cx + dr * 8, 18, 2, G - 18, '#e0523a')
        R(d, min(cx, cx + dr * 30), 17, 30, 2, '#e0523a')
        R(d, cx + dr * 30, 19, 1, 12, '#2a2a2a')
        R(d, cx + dr * 30 - 1, 31, 3, 2, '#e8a23a')
    for x, y in ((38, 12), (46, 16), (122, 10)):
        P(d, x, y, '#ffffff'); P(d, x + 1, y + 1, '#ffffff'); P(d, x + 2, y, '#ffffff')
    R(d, 0, G - 6, W, 6, '#7a6a58')
    for x in range(0, W, 8):
        R(d, x, G - 6, 1, 6, '#5a4a3a')
    return ground(img, d, '#4a3e32', '#7a6a58')


def cpp_4():   # stasiun senja (Branch Mantis)
    img, d = new()
    bands(d, [(12, '#3d2a6e'), (14, '#8a3a7a'), (12, '#d4607a'), (14, '#f08a5a'), (8, '#f8c27a')])
    disc(d, 92, 41, 11, '#ffe0a0')
    ridge(d, '#6a3a6e', 42, 16, 4)
    ridge(d, '#40264f', 47, 11, 9, 7)
    for x in (12, 52, 92, 134):                                # tiang telegraf
        R(d, x, 26, 1, G - 26, '#2a1a30')
        R(d, x - 2, 28, 5, 1, '#2a1a30')
    for x in range(12, 134):
        P(d, x, 29 + int(2 * math.sin((x % 40) / 40 * math.pi)), '#2a1a30')
    d.line([(0, G - 8), (W, G - 12)], fill='#8a7a88')           # cabang jalur
    R(d, 0, G - 4, W, 4, '#4a3a44')
    for x in range(0, W, 4):
        R(d, x, G - 3, 2, 3, '#2a1a1a')
    R(d, 0, G - 4, W, 1, '#c8c0c8')
    for x, on in ((36, 'g'), (124, 'r')):                      # dua sinyal
        R(d, x, G - 20, 1, 16, '#2a2432')
        R(d, x - 1, G - 24, 3, 7, '#1a1420')
        P(d, x, G - 23, '#ff4a4a' if on == 'r' else '#5a2428')
        P(d, x, G - 20, '#6bf08a' if on == 'g' else '#244a30')
    R(d, 72, G - 13, 10, 9, '#5a3a4a')
    tri(d, 77, G - 13, 14, 4, '#3a2438')
    P(d, 76, G - 10, '#ffd36b'); P(d, 77, G - 10, '#ffd36b')
    return ground(img, d, '#2a1a26', '#5a3a4a')


def cpp_5():   # ruang gir (Cycle Beetle)
    img, d = new()
    bands(d, [(20, '#2a1c2a'), (32, '#33242e')])
    for x in range(0, W, 14):
        R(d, x, 0, 1, G, '#241822')
    for cx, cy, r in ((18, 18, 11), (40, 34, 7), (80, 10, 8), (134, 20, 14), (122, 38, 7), (152, 44, 9)):
        gear(d, cx, cy, r, '#b87a3a', '#6a4426')
    R(d, 0, 43, W, 3, '#8a6a3a')
    R(d, 0, 43, W, 1, '#c9a45a')
    for x in range(4, W, 12):
        R(d, x, 42, 1, 5, '#6a4e2a')
    for x, y in ((92, 40), (94, 37), (96, 33)):
        disc(d, x, y, 1, '#d8d4e0')
    return ground(img, d, '#1c1219', '#5a4430')


def cpp_6():   # hangar robot (Function Mech)
    img, d = new()
    bands(d, [(20, '#2d3a56'), (32, '#3a4a68')])
    for y in range(8, G, 7):
        R(d, 0, y, W, 1, '#26324c')
    R(d, 0, 0, W, 4, '#1d2640')
    for x in range(0, W, 8):
        d.line([(x, 0), (x + 4, 4)], fill='#3a4a70')
        d.line([(x + 4, 4), (x + 8, 0)], fill='#3a4a70')
    for x in (28, 80, 132):                                    # lampu dan kerucut cahaya
        R(d, x, 4, 1, 4, '#1d2640')
        R(d, x - 2, 8, 5, 2, '#ffe9a0')
        for i in range(G - 10):
            half = 2 + int(i * 0.32)
            R(d, x - half, 10 + i, half * 2 + 1, 1, '#4a5e82')
    for sx, dr in ((14, 1), (146, -1)):                        # lengan robot
        R(d, sx - 1, 4, 3, 14, '#7a8aa8')
        disc(d, sx, 19, 2, '#c8d2e6')
        d.line([(sx, 19), (sx + dr * 16, 33)], fill='#7a8aa8', width=2)
        disc(d, sx + dr * 16, 33, 2, '#c8d2e6')
        R(d, sx + dr * 16, 34, 1, 5, '#e8a23a')
    for x in range(0, W, 8):
        R(d, x, G - 3, 4, 3, '#e8c030')
        R(d, x + 4, G - 3, 4, 3, '#202a40')
    return ground(img, d, '#202a40', '#e8c030')


def cpp_7():   # ruang server (Array Centipede)
    img, d = new()
    rng = random.Random(7)
    bands(d, [(20, '#141c38'), (32, '#1c284a')])
    R(d, 0, 0, W, 4, '#0f1630')
    for x in range(3, W, 9):
        R(d, x, 1, 4, 1, '#2a3a66')
    leds = ['#6bf08a', '#5fe4f0', '#ffd36b', '#ff6fa8', '#e8923a']
    R(d, 40, 4, 1, 14, '#e8923a')
    R(d, 112, 4, 1, 10, '#5fe4f0')
    for x in range(0, W, 14):
        R(d, x, 8, 13, G - 8, '#232f58')
        R(d, x + 12, 8, 1, G - 8, '#1a2446')
        R(d, x, 8, 13, 1, '#34447a')
        for y in range(11, G - 3, 4):
            R(d, x + 2, y, 9, 2, '#1b2547')
            for k in range(3):
                P(d, x + 3 + k * 2, y, rng.choice(leds) if rng.random() < 0.8 else '#3b4a6e')
    return ground(img, d, '#10172e', '#34447a')


def cpp_8():   # pengecoran (While Scorpion)
    img, d = new()
    rng = random.Random(8)
    bands(d, [(16, '#140808'), (16, '#220c0b'), (20, '#3a140d')])
    for x in (8, 46, 118, 150):
        R(d, x, 0, 6, 8 + rng.randint(0, 8), '#0e0505')
    for y in (14, 22):
        R(d, 0, y, W, 3, '#4a3a3a')
        R(d, 0, y, W, 1, '#6a5656')
        for x in range(4, W, 10):
            R(d, x, y - 1, 1, 5, '#3a2c2c')
    for cx in (16, 80, 144):                                   # tungku
        for w, h, c in ((18, 22, '#0e0505'), (14, 18, '#7a1c0a'), (10, 14, '#e8581c'), (6, 9, '#ffb23c')):
            R(d, cx - w // 2, G - h + w // 2, w, h - w // 2, c)
            disc(d, cx, G - h + w // 2, w // 2, c)
    R(d, 47, 24, 2, G - 28, '#ff9a2c')
    R(d, 47, 24, 1, G - 28, '#ffe08a')
    disc(d, 48, G - 3, 2, '#ff9a2c')
    for _ in range(34):
        P(d, rng.randint(0, W - 1), rng.randint(18, G - 4), '#ffb23c' if rng.random() < 0.5 else '#ff6a1f')
    return ground(img, d, '#1a0a0a', '#ff8a2c')


def cpp_9():   # menara blok data (Struct Colossus)
    img, d = new()
    rng = random.Random(9)
    bands(d, [(20, '#0b1030'), (16, '#141c44'), (20, '#222a5a')])
    stars(d, rng, 30, 28)
    cols = ['#f2c230', '#3b82e0', '#3fc46a', '#ee7a2e', '#a65cd8', '#e0457a', '#38d0e0']
    for x in range(36, 124, 4):                                # blok redup di tengah
        for i in range(rng.randint(1, 2)):
            block(d, x, G - 4 * (i + 1), mix(rng.choice(cols), '#0b1030', 0.65))
    for x0, x1 in ((0, 32), (128, 160)):
        for x in range(x0, x1, 4):
            for i in range(rng.randint(4, 9)):
                block(d, x, G - 4 * (i + 1), rng.choice(cols))
    for px, py, c in ((62, 10, '#e0457a'), (94, 16, '#38d0e0')):
        for ox, oy in ((0, 0), (4, 0), (8, 0), (4, -4)):
            block(d, px + ox, py + oy, c)
    return ground(img, d, '#0a0e28', '#3b82e0')


def cpp_10():  # kernel panic (Segfault Kraken)
    img, d = new()
    rng = random.Random(10)
    bands(d, [(14, '#2a060e'), (14, '#3a0a14'), (14, '#4a0c18'), (10, '#2a060e')])
    for r, c in ((26, '#4d0e1b'), (19, '#661322'), (12, '#7c1828')):
        disc(d, 80, 6, r, c)
    for x in range(1, W, 2):
        top = rng.randint(2, 28)
        for y in range(top, G - 3, 2):
            if rng.random() < 0.7:
                c = '#ff9a3c' if rng.random() < 0.16 else ('#a0302a' if rng.random() < 0.5 else '#6a1d22')
                P(d, x, y, c)
    for x, y, w in ((18, 28, 12), (120, 22, 11), (66, 36, 10), (98, 38, 8)):   # glitch
        R(d, x + 1, y + 1, w, 2, '#d4306c')
        R(d, x, y, w, 2, '#37e6b4')
    return ground(img, d, '#12030a', '#c0344a')


# ============================================================ JS ====

def island(d, x, y, w, depth, trees, rng):
    R(d, x, y, w, 2, '#4fbf6a')
    R(d, x, y, w, 1, '#86e08a')
    for i in range(depth):
        inset = int(i * (w / 2) / depth)
        R(d, x + inset, y + 2 + i, w - 2 * inset, 1, '#93604a' if i % 2 == 0 else '#7c5240')
    for tx, th in trees:
        R(d, x + tx, y - th, 1, th, '#5b3a2a')
        disc(d, x + tx, y - th - 1, 2, '#2f8a4e')
        P(d, x + tx - 1, y - th - 2, '#43b05f')


def js_1():    # pulau melayang senja (Log Jelly)
    img, d = new()
    rng = random.Random(21)
    bands(d, [(10, '#4a2a7e'), (12, '#8a3a96'), (12, '#c4507e'), (10, '#ef8a6e'), (8, '#fbc47e')])
    disc(d, 82, 40, 14, '#ffe08a')
    for x, y in ((8, 20), (128, 10), (52, 6)):
        cloud(d, x, y, '#ffb6cc')
    ridge(d, '#a8508f', 44, 18, 3)
    ridge(d, '#7a3a86', 48, 12, 8, 7)
    island(d, 10, 12, 30, 9, [(7, 4), (14, 3), (24, 4)], rng)
    island(d, 66, 26, 16, 6, [(8, 3)], rng)
    island(d, 118, 18, 30, 9, [(8, 4), (21, 3)], rng)
    return ground(img, d, '#2c1a44', '#44285f')


def js_2():    # laguna berbulan (Const Turtle)
    img, d = new()
    rng = random.Random(22)
    bands(d, [(16, '#1a2a5a'), (14, '#245a80'), (10, '#3a8a9a')])
    stars(d, rng, 28, 24)
    disc(d, 100, 14, 8, '#e4f8ff')
    ridge(d, '#1e4a5a', 36, 12, 6)
    R(d, 0, 36, W, 6, '#1f6a86')
    R(d, 0, 42, W, 10, '#185a76')
    for k in range(4):
        R(d, 98 - k, 38 + k * 3, 4 + k * 2, 1, '#d8f2ff')
    for x, y, w in ((24, 42, 7), (60, 47, 6), (118, 44, 8), (140, 49, 6)):
        R(d, x, y, w, 1, '#3fae6a')
        R(d, x + 1, y - 1, w - 2, 1, '#4ccf80')
    for x, y in ((28, 40), (122, 42)):
        P(d, x, y, '#ff9ac0'); P(d, x + 1, y - 1, '#ffd0e0'); P(d, x + 2, y, '#ff9ac0')
    for x0, dr in ((4, 1), (155, -1)):
        disc(d, x0 + dr * 5, G - 1, 6, '#4a5a6a')
        disc(d, x0 + dr * 5, G - 5, 3, '#3a8a52')
        for k in range(4):
            xx = x0 + dr * (14 + k * 2)
            R(d, xx, G - 10 - k % 3 * 2, 1, 10 + k % 3 * 2, '#2f7a4a')
            P(d, xx, G - 12 - k % 3 * 2, '#6a3a2a')
    for _ in range(10):
        P(d, rng.randint(0, W - 1), rng.randint(20, G - 4), '#fff08a')
    return ground(img, d, '#0c3248', '#2a6a86')


def js_3():    # pasar malam (Operator Imp)
    img, d = new()
    rng = random.Random(23)
    bands(d, [(12, '#2a1a5a'), (14, '#6a2a80'), (14, '#b44a8a'), (12, '#f08a7a')])
    stars(d, rng, 24, 24)
    cx, cy, r = 112, 27, 17                                    # bianglala
    for k in range(8):
        a = k * math.pi / 4
        d.line([(cx, cy), (round(cx + math.cos(a) * r), round(cy + math.sin(a) * r))], fill='#7a5aaa')
    for k in range(24):
        a = k * math.pi / 12
        P(d, round(cx + math.cos(a) * r), round(cy + math.sin(a) * r), ('#ffd36b', '#ff6fa8', '#5fe4f0')[k % 3])
    for k in range(6):
        a = k * math.pi / 3 + 0.3
        R(d, round(cx + math.cos(a) * r) - 1, round(cy + math.sin(a) * r) + 1, 3, 2, ('#d84a4a', '#3b82e0', '#3fc46a')[k % 3])
    d.line([(cx, cy), (cx - 8, G)], fill='#5a3a8a')
    d.line([(cx, cy), (cx + 8, G)], fill='#5a3a8a')
    for tx, tw, th in ((2, 24, 16), (30, 15, 11)):             # tenda belang
        for x in range(tx, tx + tw):
            roof = int(th * (1 - abs((x - tx) / tw - 0.5) * 2)) + 3
            c = '#d84a4a' if ((x - tx) // 2) % 2 == 0 else '#f6e6c0'
            R(d, x, G - 7 - roof, 1, roof, c)
            R(d, x, G - 7, 1, 7, mix(c, '#000000', 0.15))
        R(d, tx + tw // 2, G - 7 - th - 6, 1, 4, '#2a1a40')
        R(d, tx + tw // 2 + 1, G - 7 - th - 6, 3, 2, '#ffd36b')
        R(d, tx + tw // 2 - 2, G - 7, 4, 7, '#2a1a40')
    for x in range(0, W):                                      # untaian lampu
        y = 3 + int(4 * math.sin(math.pi * ((x % 40) / 40)))
        P(d, x, y, '#2a1a40')
        if x % 4 == 0:
            P(d, x, y + 1, ('#ffd36b', '#ff6fa8', '#5fe4f0')[(x // 4) % 3])
    for bx, by, c in ((148, 30, '#ff6fa8'), (153, 36, '#5fe4f0'), (143, 38, '#ffd36b')):
        disc(d, bx, by, 2, c)
        R(d, bx, by + 3, 1, 8, '#2a1a40')
    return ground(img, d, '#2a1440', '#8a3a8a')


def torii(d, cx, h):
    R(d, cx - 7, G - h, 2, h, '#d4402e')
    R(d, cx + 5, G - h, 2, h, '#d4402e')
    R(d, cx - 10, G - h - 2, 21, 2, '#2a1a2a')
    P(d, cx - 11, G - h - 3, '#2a1a2a'); P(d, cx + 11, G - h - 3, '#2a1a2a')
    R(d, cx - 8, G - h + 3, 17, 1, '#d4402e')


def js_4():    # gerbang torii (Ternary Fox)
    img, d = new()
    rng = random.Random(24)
    bands(d, [(12, '#1a1040'), (14, '#4a2070'), (14, '#9a3a86'), (12, '#e0709a')])
    stars(d, rng, 22, 22)
    disc(d, 116, 14, 6, '#fff0d0')
    ridge(d, '#40235e', 42, 14, 7)
    for tx in (5, 22, 50, 108, 138, 154):
        th = rng.randint(10, 15)
        R(d, tx, G - th, 1, th, '#2a1a2a')
        for ox, oy, rr, c in ((0, 0, 4, '#c4503a'), (-3, 2, 3, '#e08a3a'), (3, 2, 3, '#8a3a6a')):
            disc(d, tx + ox, G - th + oy, rr, c)
    torii(d, 34, 24)
    torii(d, 126, 24)
    for i in range(14):                                        # jalan bercabang
        half = 5 + i * 1
        R(d, 80 - half, 38 + i, half * 2, 1, '#e8b0a8')
    d.line([(76, 38), (44, G - 3)], fill='#e8b0a8')
    d.line([(84, 38), (116, G - 3)], fill='#e8b0a8')
    for lx in (62, 98):
        R(d, lx, G - 7, 2, 7, '#6a6078')
        R(d, lx - 1, G - 9, 4, 2, '#8a8098')
        P(d, lx, G - 8, '#ffd36b')
    for _ in range(14):
        P(d, rng.randint(0, W - 1), rng.randint(20, G - 2), '#ffc0d8')
    return ground(img, d, '#241036', '#7a3a7a')


def js_5():    # laut dalam (Iterator Octopus)
    img, d = new()
    rng = random.Random(25)
    bands(d, [(10, '#2a8ac0'), (14, '#1c70aa'), (14, '#14609a'), (14, '#0c4a80')])
    for x0 in (10, 44, 78, 112, 146):                          # sinar dari permukaan
        for y in range(0, G - 2):
            xs = x0 - y // 2
            for x in range(xs, xs + 5):
                if 0 <= x < W:
                    d.point((x, y), fill=mix('#%02x%02x%02x' % img.getpixel((x, y)), '#7ad0f0', 0.13))
    for x, y in ((22, 12), (30, 24), (68, 7), (104, 20), (136, 11), (120, 34)):
        for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
            P(d, x + dx, y + dy, '#bfeaff')
    for x in (4, 12, 146, 154):                                # rumput laut
        h = rng.randint(18, 28)
        for y in range(G - 1, G - h, -1):
            R(d, x + int(1.2 * math.sin(y / 3 + x)), y, 2, 1, '#2f9a62' if (y // 3) % 2 else '#1f7a4a')
    for cx, c in ((32, '#ff7aa8'), (42, '#ff9a4a'), (116, '#ff7aa8'), (128, '#ff9a4a')):
        for k in range(3):
            a = -math.pi / 2 + (k - 1) * 0.6
            d.line([(cx, G - 1), (round(cx + math.cos(a) * 8), round(G - 1 + math.sin(a) * 8))], fill=c)
            P(d, round(cx + math.cos(a) * 8), round(G - 1 + math.sin(a) * 8), '#ffffff' if k == 1 else c)
    for fx, fy, c, dr in ((60, 20, '#ffd36b', 1), (92, 32, '#ff9a4a', -1), (108, 12, '#ffd36b', 1)):
        R(d, fx, fy, 4, 2, c)
        P(d, fx - dr + (0 if dr > 0 else 3), fy, c)
        P(d, fx - dr + (0 if dr > 0 else 3), fy + 1, c)
        P(d, fx + (3 if dr > 0 else 0), fy, '#1a1a2a')
    return ground(img, d, '#c8b080', '#a89060')


def js_6():    # benteng fajar (Function Archer)
    img, d = new()
    bands(d, [(12, '#6a8ad0'), (14, '#b0a0c8'), (14, '#f0b0b0'), (12, '#fbd8a0')])
    disc(d, 40, 38, 9, '#fff0c0')
    for x, y in ((18, 6), (100, 5), (140, 16)):
        cloud(d, x, y, '#fff0f0')
    ridge(d, '#6aaa6a', 44, 10, 5)
    R(d, 54, G - 15, 90, 15, '#a8a0b8')                        # tembok
    for x in range(54, 144, 4):
        R(d, x, G - 18, 2, 3, '#a8a0b8')
    for y in range(G - 12, G, 4):
        R(d, 54, y, 90, 1, '#8a82a0')
    for tx in (48, 134):
        R(d, tx, G - 28, 10, 28, '#b4acc4')
        R(d, tx + 8, G - 28, 2, 28, '#9890ac')
        tri(d, tx + 5, G - 28, 14, 7, '#4a6ac0')
        R(d, tx + 5, G - 41, 1, 6, '#2a2438')
        R(d, tx + 6, G - 41, 4, 2, '#d4402e')
        R(d, tx + 4, G - 22, 2, 4, '#3a3450')
    R(d, 92, G - 11, 12, 11, '#2a2438')
    disc(d, 98, G - 11, 6, '#2a2438')
    for tx in (18, 150):
        R(d, tx, G - 11, 1, 11, '#5a3a2a')
        disc(d, tx, G - 13, 4, '#f6f0e0')
        disc(d, tx, G - 13, 3, '#d4402e')
        disc(d, tx, G - 13, 1, '#f6f0e0')
    return ground(img, d, '#4a7a4a', '#6aaa6a')


def js_7():    # gua kristal (Array Bats)
    img, d = new()
    rng = random.Random(27)
    bands(d, [(20, '#0c0818'), (32, '#1c0f30')])
    disc(d, 28, 40, 13, '#2a1a48')
    disc(d, 132, 38, 13, '#12304a')
    x = 0
    while x < W:
        w, h = rng.randint(5, 9), rng.randint(6, 18)
        itri(d, x + w // 2, 0, w, h, '#1a0f2c')
        if rng.random() < 0.4:
            P(d, x + w // 2, h + 1, '#0a0610'); P(d, x + w // 2 - 1, h, '#0a0610'); P(d, x + w // 2 + 1, h, '#0a0610')
        x += w + rng.randint(0, 3)
    x = 0
    while x < W:
        w, h = rng.randint(5, 9), rng.randint(4, 12)
        tri(d, x + w // 2, G, w, h, '#1a0f2c')
        x += w + rng.randint(0, 4)
    for cx, cy, h, c, hi in ((28, 38, 11, '#b56cf0', '#e4c4ff'), (20, 46, 6, '#b56cf0', '#e4c4ff'),
                             (132, 36, 12, '#5fe4f0', '#c6fbff'), (140, 46, 7, '#5fe4f0', '#c6fbff'),
                             (80, 30, 5, '#5fe4f0', '#c6fbff')):
        for i in range(h):
            half = (i if i < h // 2 else h - i) // 2
            R(d, cx - half, cy + i, half * 2 + 1, 1, c)
        P(d, cx, cy + 2, hi)
    for _ in range(10):
        P(d, rng.randint(0, W - 1), rng.randint(10, G - 4), '#8a6ad0')
    return ground(img, d, '#0e0818', '#3a2060')


def js_8():    # badai (While Tornado)
    img, d = new()
    rng = random.Random(28)
    bands(d, [(14, '#161230'), (14, '#241c44'), (12, '#3a2e60'), (12, '#52427a')])
    for x, y, w, c in ((-4, 2, 40, '#241c40'), (44, 6, 36, '#2a2248'), (86, 1, 42, '#1c1736'),
                       (126, 5, 36, '#2a2248'), (22, 16, 30, '#34295a'), (100, 17, 34, '#34295a')):
        R(d, x + 3, y, w - 6, 2, c)
        R(d, x, y + 2, w, 3, c)
        R(d, x + 4, y + 5, w - 8, 2, mix(c, '#000000', 0.15))
    for bx, by in ((36, 12), (126, 11)):                       # petir
        pts = [(bx, by), (bx - 2, by + 5), (bx + 1, by + 7), (bx - 3, by + 13), (bx - 1, by + 16)]
        d.line(pts, fill='#ffe45c', width=2)
    ridge(d, '#2a2040', 46, 9, 9)
    R(d, 121, G - 24, 4, 16, '#3a2a50')
    tri(d, 123, G - 8, 8, 8, '#3a2a50')
    for k in range(4):
        a = k * math.pi / 2 + 0.5
        d.line([(123, G - 22), (round(123 + math.cos(a) * 9), round(G - 22 + math.sin(a) * 9))], fill='#6a5a8a')
    for _ in range(60):
        x, y = rng.randint(0, W - 1), rng.randint(6, G - 2)
        P(d, x, y, '#8aa0d0'); P(d, x - 1, y + 1, '#8aa0d0')
    return ground(img, d, '#1c1634', '#5a4a8a')


def js_9():    # hutan aurora (Object Treant)
    img, d = new()
    rng = random.Random(29)
    bands(d, [(18, '#0e0b30'), (16, '#181650'), (18, '#221c5c')])
    stars(d, rng, 34, 30)
    for k, (c, base) in enumerate((('#1f7a7a', 10), ('#3b4fa0', 17), ('#5a3a98', 24))):
        for x in range(W):
            y = base + int(3 * math.sin(x / 11 + k * 1.3) + 1.5 * math.sin(x / 4 + k))
            R(d, x, y, 1, 4, c)
    disc(d, 140, 10, 4, '#fff3c4')
    disc(d, 142, 9, 3, '#181650')
    for col, hmin, hmax, step in (('#16204a', 9, 16, 6), ('#0f1838', 12, 22, 8)):
        x = -2
        while x < W:
            h = rng.randint(hmin, hmax)
            tri(d, x, G - 1, h // 2 + 3, h, col)
            R(d, x, G - 2, 1, 2, col)
            x += step + rng.randint(0, 3)
    for cx, cy, h in ((20, 22, 7), (60, 18, 5), (104, 28, 6), (148, 26, 8)):
        for i in range(h):
            half = (i if i < h // 2 else h - i) // 2
            R(d, cx - half, cy + i, half * 2 + 1, 1, '#5fe4f0')
        P(d, cx, cy + 2, '#c6fbff')
    return ground(img, d, '#0b1030', '#2a2a68')


def js_10():   # kota neon (Undefined Dragon)
    img, d = new()
    rng = random.Random(30)
    bands(d, [(14, '#14082e'), (14, '#3a1264'), (14, '#7a1c7e'), (10, '#c4388c')])
    stars(d, rng, 18, 24, '#ffd6f5')
    cx, cy, r = 80, 36, 15
    for y in range(-r, r + 1):
        yy = cy + y
        if yy >= G - 2 or (y > 3 and (y // 2) % 2 == 1):
            continue
        half = int(math.sqrt(r * r - y * y))
        R(d, cx - half, yy, half * 2 + 1, 1, '#ffe45c' if y < 5 else '#ffb23c')
    for x0, w, h in ((0, 9, 26), (10, 7, 17), (18, 9, 30), (28, 6, 14), (124, 7, 16), (132, 9, 28), (142, 7, 19), (150, 10, 31)):
        R(d, x0, G - h, w, h, '#1a0e3c')
        R(d, x0, G - h, w, 1, '#3be0f0')
        for wy in range(G - h + 3, G - 2, 3):
            for wx in range(x0 + 1, x0 + w - 1, 2):
                if rng.random() < 0.6:
                    P(d, wx, wy, '#ffd36b' if rng.random() < 0.7 else '#3be0f0')
    return ground(img, d, '#1a0a38', '#ff4fb0')


# ============================================================ LOBBY ====
# Lobi pakai grid yang sama (tinggi 60 piksel), lebarnya 120 (rasio 2:1) supaya di layar 16:9
# ukuran pikselnya sama dengan lobi Python (basic.svg). Tengah sengaja tenang buat judul dan menu.

def lobby_cpp():
    img, d = new()
    rng = random.Random(41)
    bands(d, [(18, '#73a4d8'), (14, '#9cc2e8'), (20, '#d6e4ee'), (8, '#f0dcc0')])
    cloud(d, 6, 6)
    cloud(d, 98, 4)
    cloud(d, 52, 3, '#e2eef8')
    cloud(d, 74, 11, '#e2eef8')
    x = 0
    while x < W:                                              # kota jauh, tipis dan pucat
        w, h = rng.randint(6, 11), rng.randint(3, 7)
        R(d, x, G - h, w, h, '#d0d4de')
        x += w + rng.randint(0, 2)
    front, side, roof = '#5f7399', '#4a5c82', '#7e92b8'
    for x, w, h, ch in ((0, 15, 30, 14), (16, 12, 18, 0), (28, 8, 10, 0), (86, 9, 10, 0), (96, 11, 20, 12), (108, 12, 32, 14)):
        building(d, rng, x, w, h, front, side, roof, '#ffd36b', '#3b4a6e')
        if ch:
            chimney(d, x + w // 2 - 1, G - h - ch, ch, '#6b7ea6', '#d9622b', '#eef2f9')
    gear(d, 6, G - 9, 3, '#e8923a', '#b9672a')
    return ground(img, d, '#34395a', '#4a5078')


def lobby_js():
    img, d = new()
    rng = random.Random(42)
    bands(d, [(10, '#4a2a7e'), (12, '#8a3a96'), (12, '#c4507e'), (10, '#ef8a6e'), (8, '#fbc47e')])
    stars(d, rng, 26, 26)
    cloud(d, 52, 4, '#d98ac4')
    cloud(d, 70, 10, '#d98ac4')
    cloud(d, 4, 28, '#ffb6cc')
    cloud(d, 100, 24, '#ffb6cc')
    for col, base, amp, seed in (('#a8508f', 46, 18, 3), ('#7a3a86', 49, 12, 8)):
        r = random.Random(seed)
        p1, p2 = r.random() * 6, r.random() * 6
        for x in range(W):
            edge = min(abs(x - W / 2), W / 2) / (W / 2)
            h = int(amp * (0.55 + 0.3 * math.sin(x / 9 + p1) + 0.2 * math.sin(x / 4 + p2)) * (0.25 + 0.9 * edge ** 1.5))
            R(d, x, base - h, 1, G - (base - h), col)
    island(d, 4, 14, 26, 8, [(6, 4), (13, 3), (21, 4)], rng)
    island(d, 94, 20, 24, 8, [(7, 4), (16, 3)], rng)
    return ground(img, d, '#2c1a44', '#44285f')


def with_width(w, fn):
    global W
    old, W = W, w
    try:
        return fn()
    finally:
        W = old


STAGES = {
    'cpp': [cpp_1, cpp_2, cpp_3, cpp_4, cpp_5, cpp_6, cpp_7, cpp_8, cpp_9, cpp_10],
    'js': [js_1, js_2, js_3, js_4, js_5, js_6, js_7, js_8, js_9, js_10],
}


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('assets/backgrounds')
    out.mkdir(parents=True, exist_ok=True)
    for lang, scenes in STAGES.items():
        for i, fn in enumerate(scenes, 1):
            fn().save(out / f'{lang}-{i}.png')
    with_width(120, lobby_cpp).save(out / 'lobby-cpp.png')
    with_width(120, lobby_js).save(out / 'lobby-js.png')
    print('ok ->', out)


if __name__ == '__main__':
    main()
