#!/usr/bin/env python3
"""Bikin 10 latar arena Python: py-1..10.png (assets/backgrounds/), satu per level.

Gaya MENGIKUTI basic.svg asli: bentuk besar dan tebal, warna rata 2-3 nada per benda
(dasar, terang, gelap), lereng bertangga, TANPA garis 1 piksel dan TANPA bintik-bintik
halus. Ukuran 160x60 (sama dengan latar lain), garis tanah di y=52. Semua benda yang
berdiri di tanah (pohon, tenda, tiang) sampai ke y=52, jadi ga ngambang di atas tanah bata.

Pakai helper dari arena_px.py, jadi file ini harus satu folder dengannya.
Pakai: python tools/py_arena_px.py [folder_output]   (butuh Pillow)
"""
import math
import random
import sys
from pathlib import Path

from arena_px import G, H, W, R, P, bands, cloud, ground, itri, mix, new, tri


def sun(d, cx, cy, r, c, hi=None):
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 1:
                P(d, x, y, c)
    if hi:
        R(d, cx - r + 2, cy - r + 2, 2, 2, hi)


def dot(d, x, y, c):
    R(d, x, y, 2, 2, c)


def hills(d, body, top, base, amp, seed, f=14.0, cap=2):
    """Bukit bertangga: badan warna `body`, `cap` baris teratas warna `top`."""
    r = random.Random(seed)
    p1, p2 = r.random() * 6, r.random() * 6
    for x in range(W):
        h = int(amp * (0.55 + 0.32 * math.sin(x / f + p1) + 0.18 * math.sin(x / (f / 2.4) + p2)))
        y = base - h
        R(d, x, y, 1, G - y, body)
        R(d, x, y, 1, cap, top)


def mount(d, cx, w, h, body, shade, cap=None, cap_h=0, base=G):
    """Gunung segitiga bertangga: sisi kanan lebih gelap, puncak bisa diberi topi."""
    for i in range(h):
        half = round((w / 2) * (i + 1) / h)
        y = base - h + i
        R(d, cx - half, y, half + 1, 1, body)
        R(d, cx + 1, y, half, 1, shade)
        if cap and i < cap_h:
            R(d, cx - half, y, half * 2 + 1, 1, cap)
    if cap:
        for x in range(cx - w // 2, cx + w // 2 + 1, 4):          # tepi topi bergerigi
            y = base - h + cap_h
            half = round((w / 2) * (cap_h + 1) / h)
            if abs(x - cx) <= half:
                R(d, x, y, 2, 2, cap)


def blob(d, cx, top, w, h, c, hi, lo):
    """Tajuk pohon: bentuk bertangga 3 nada (terang kiri-atas, gelap kanan)."""
    for i in range(h):
        ww = max(4, round(w * (0.55 + 0.45 * math.sin(math.pi * (i + 0.5) / h))))
        x0 = cx - ww // 2
        R(d, x0, top + i, ww, 1, c)
        R(d, x0 + ww - max(2, ww // 4), top + i, max(2, ww // 4), 1, lo)
        if i < h * 0.45:
            R(d, x0, top + i, max(2, ww // 4), 1, hi)


def tree(d, x, h, trunk, c, hi, lo):
    ch = round(h * 0.62)
    R(d, x - 1, G - (h - ch) - 1, 3, (h - ch) + 1, trunk)
    R(d, x + 1, G - (h - ch) - 1, 1, (h - ch) + 1, mix(trunk, '#000000', 0.3))
    blob(d, x, G - h, max(14, round(h * 0.7)), ch, c, hi, lo)


def pine(d, x, h, c, lo):
    tiers = 3
    th = h // tiers + 2
    R(d, x, G - 3, 2, 3, lo)
    for t in range(tiers):
        base = G - 2 - t * (h // tiers - 1)
        w = 14 - t * 3
        for i in range(th):
            half = round((w / 2) * (i + 1) / th)
            y = base - th + i
            R(d, x - half, y, half + 1, 1, c)
            R(d, x + 1, y, half, 1, lo)


def py_1():   # padang rumput pagi (Print Slime)
    img, d = new()
    bands(d, [(20, '#73c0ea'), (16, '#8dd0f0'), (24, '#a9def5')])
    sun(d, 126, 15, 6, '#ffe66b', '#fff7b8')
    for x, y in ((14, 8), (60, 16), (92, 6), (140, 28)):
        cloud(d, x, y)
    hills(d, '#8fd47a', '#b6ec9a', 42, 18, 5, 15, 3)
    hills(d, '#5fb34c', '#86d36a', 48, 10, 9, 10, 3)
    for x, y, c in ((18, 50, '#ffffff'), (47, 49, '#ffd23f'), (84, 50, '#ff8fb1'), (118, 49, '#ffffff'), (146, 50, '#ffd23f')):
        dot(d, x, y, c)
    return ground(img, d, '#3f8f3a', '#69c24f')


def py_2():   # tepi hutan siang (Var Goblin)
    img, d = new()
    bands(d, [(20, '#73c0ea'), (16, '#8dd0f0'), (24, '#a9def5')])
    cloud(d, 22, 8)
    cloud(d, 104, 12)
    hills(d, '#7fc37a', '#a2dc92', 40, 14, 4, 16, 2)
    spec = ((14, 34), (40, 28), (66, 38), (92, 30), (118, 36), (144, 28))
    for x, h in spec:
        tree(d, x, h, '#7a4e2a', '#2f8a3c', '#4fb34f', '#1f6a30')
    for x in (28, 78, 130):
        R(d, x, 48, 6, 4, '#b57c43')
        R(d, x, 48, 6, 2, '#d6a060')
    return ground(img, d, '#3f8f3a', '#69c24f')


def py_3():   # bukit batu dan perkemahan (Operator Orc)
    img, d = new()
    bands(d, [(14, '#f4c986'), (14, '#f2b27a'), (14, '#ea9a70'), (18, '#dc8470')])
    sun(d, 30, 24, 7, '#ffe9a8', '#fff6d0')
    mount(d, 28, 52, 28, '#b98560', '#9a6a4a', '#e8c9a0', 9)
    mount(d, 128, 60, 30, '#b98560', '#9a6a4a', '#e8c9a0', 9)
    mount(d, 80, 70, 18, '#946648', '#6e4a32')
    for cx, col, dk in ((58, '#b5442f', '#8a2f20'), (108, '#8f3a8a', '#6a2a68')):
        tri(d, cx, G, 26, 18, col)
        for i in range(18):
            half = round(13 * (i + 1) / 18)
            R(d, cx + 1, G - 18 + i, half, 1, dk)
        R(d, cx - 2, G - 7, 5, 7, '#2a1208')
        R(d, cx, G - 28, 2, 10, '#3a2412')
        R(d, cx + 2, G - 28, 7, 4, '#f5c22e')
    for x in (12, 144):
        R(d, x, 44, 3, 8, '#4a2e1c')
        sun(d, x + 1, 42, 3, '#ff9d1a', '#ffd060')
    return ground(img, d, '#74502f', '#a07a4c')


def py_4():   # hutan senja berkabut (Fork Wraith)
    img, d = new()
    bands(d, [(12, '#2a1f55'), (12, '#43307a'), (14, '#6a4a92'), (22, '#a8658f')])
    sun(d, 118, 15, 6, '#f3e6c9', '#ffffff')
    for x, y in ((12, 6), (44, 14), (74, 5), (150, 10)):
        dot(d, x, y, '#cfc8ff')
    hills(d, '#3b2b6a', '#54408a', 40, 12, 6, 15, 2)
    for x, h in ((10, 30), (34, 36), (60, 28), (88, 38), (112, 30), (138, 36)):
        pine(d, x, h, '#2a1f55', '#1d1540')
    for y, xs in ((43, (6, 70, 124)), (47, (30, 96, 146))):
        for x in xs:
            R(d, x, y, 22, 2, '#7d6aa8')
    return ground(img, d, '#1d1540', '#3a2b70')


def py_5():   # rawa (Loop Serpent)
    img, d = new()
    bands(d, [(14, '#2a4944'), (14, '#3a6358'), (24, '#5b8a6b')])
    sun(d, 28, 12, 5, '#d6f0a8', '#f0ffd0')
    hills(d, '#2e5444', '#3f7358', 40, 12, 2, 14, 2)
    R(d, 0, 42, W, 10, '#2a6a64')                               # air
    for y, xs in ((44, (6, 60, 112)), (48, (32, 86, 138))):
        for x in xs:
            R(d, x, y, 12, 2, '#4a9a8a')
    for x in (30, 80, 130):                                     # pohon mati sampai tanah
        R(d, x, 18, 4, G - 18, '#1c2a24')
        R(d, x - 8, 26, 9, 3, '#1c2a24')
        R(d, x + 4, 22, 8, 3, '#1c2a24')
    for x in range(6, W, 20):
        R(d, x, 40, 2, 12, '#2f6a40')
        R(d, x - 1, 36, 4, 5, '#7a4e2a')
    for x, y in ((18, 30), (54, 22), (100, 34), (146, 28)):
        dot(d, x, y, '#e8ff7a')
    return ground(img, d, '#1d3f31', '#37754f')


def py_6():   # reruntuhan batu (Function Golem)
    img, d = new()
    bands(d, [(14, '#47568a'), (14, '#6c6fa0'), (14, '#9a88a6'), (18, '#c4a0a0')])
    sun(d, 126, 22, 7, '#ffe2b0', '#fff2d6')
    mount(d, 30, 60, 26, '#6a6a9a', '#54547f')
    mount(d, 110, 70, 22, '#6a6a9a', '#54547f')
    stone, side, cap = '#c0b79f', '#968d76', '#ddd5bd'
    for x, h in ((10, 28), (34, 18), (60, 32), (96, 24), (126, 30), (148, 14)):
        R(d, x, G - h, 8, h, stone)
        R(d, x + 5, G - h, 3, h, side)
        R(d, x - 1, G - h, 10, 3, cap)
        for y in range(G - h + 8, G - 2, 8):
            R(d, x, y, 8, 2, side)
    R(d, 60, 20, 44, 3, cap)
    R(d, 60, 23, 44, 3, side)
    for x in (22, 48, 80, 110, 138):
        R(d, x, 48, 6, 4, side)
        R(d, x, 48, 6, 2, stone)
    return ground(img, d, '#6e6659', '#9c937d')


def py_7():   # gua rawa hijau (Array Hydra)
    img, d = new()
    bands(d, [(16, '#0b2224'), (16, '#12302e'), (28, '#1b4640')])
    for x, w, h in ((6, 12, 20), (30, 10, 14), (52, 14, 24), (80, 10, 16), (102, 14, 22), (128, 10, 14), (148, 12, 20)):
        itri(d, x, 0, w, h, '#07181a')
    for x, w, h in ((14, 16, 14), (60, 18, 18), (112, 16, 12), (140, 14, 16)):
        tri(d, x, G, w, h, '#0e2c2a')
    R(d, 0, 44, W, 8, '#1f8a62')                                # kolam menyala
    for x in (4, 40, 78, 116, 148):
        R(d, x, 46, 14, 2, '#6bffb0')
    for x, y in ((24, 36), (70, 32), (96, 38), (132, 34)):      # kristal
        R(d, x, y, 3, 6, '#8dffc0')
        R(d, x, y, 1, 6, '#d2ffe6')
    for x, y in ((14, 22), (48, 28), (90, 20), (120, 26), (152, 30)):
        dot(d, x, y, '#b6ffd8')
    return ground(img, d, '#0a1f1e', '#1d6a52')


def py_8():   # lembah api (While Drake)
    img, d = new()
    bands(d, [(12, '#3a1020'), (12, '#6e1f2a'), (14, '#b8422a'), (22, '#f08a3a')])
    mount(d, 80, 84, 40, '#3a1218', '#241014')
    dot(d, 78, 8, '#ffd060')                                    # kepulan di puncak
    R(d, 76, 10, 6, 3, '#ff9a3a')
    R(d, 78, 13, 3, 26, '#ff6a1a')                              # aliran lava di lereng
    R(d, 71, 22, 2, 16, '#ff6a1a')
    R(d, 86, 20, 2, 18, '#ff6a1a')
    hills(d, '#2a1014', '#4a1c1c', 44, 12, 3, 14, 2)
    hills(d, '#1d0c0f', '#3a1618', 49, 8, 6, 9, 2)
    for x, y in ((12, 14), (30, 30), (52, 10), (108, 8), (126, 26), (146, 12), (140, 38)):
        dot(d, x, y, '#ffb040')
    return ground(img, d, '#2a1210', '#8a4a22')


def py_9():   # kastil malam (Class Knight)
    img, d = new()
    bands(d, [(16, '#0d112b'), (16, '#171d46'), (28, '#262f66')])
    sun(d, 24, 14, 6, '#f3efd2', '#ffffff')
    for x, y in ((10, 30), (46, 8), (70, 20), (100, 6), (124, 24), (148, 10), (150, 34)):
        dot(d, x, y, '#e8e8ff')
    hills(d, '#161c42', '#232b5e', 44, 12, 5, 14, 2)
    wall, dark = '#1d2556', '#10163a'
    R(d, 48, 30, 66, 22, wall)
    for x in range(48, 114, 8):
        R(d, x, 26, 4, 4, wall)
    for x, h in ((40, 36), (78, 46), (116, 36)):
        R(d, x, G - h, 12, h, wall)
        R(d, x + 8, G - h, 4, h, dark)
        tri(d, x + 6, G - h, 16, 10, '#2f3a80')
        R(d, x + 6, G - h - 16, 2, 6, '#8a8ad0')
        R(d, x + 8, G - h - 16, 5, 3, '#d94a4a')
        R(d, x + 3, G - h + 8, 3, 5, '#ffd23f')
    R(d, 74, 42, 10, 10, '#0a0e26')
    return ground(img, d, '#141a3c', '#2e3a72')


def py_10():  # gua lava (Traceback Dragon)
    img, d = new()
    bands(d, [(16, '#1a0707'), (16, '#2a0c0a'), (28, '#3d1208')])
    hills(d, '#2c0f0c', '#451812', 40, 16, 4, 14, 2)
    for x, w, h in ((2, 12, 20), (26, 10, 14), (48, 14, 26), (74, 10, 16), (122, 14, 24), (146, 12, 16)):
        itri(d, x, 0, w, h, '#0d0404')
    R(d, 104, 0, 6, 46, '#ff7a1a')                              # air terjun lava
    R(d, 105, 0, 2, 46, '#ffd060')
    for x, w, h in ((14, 14, 14), (60, 16, 18), (130, 14, 12)):
        tri(d, x, G, w, h, '#1a0707')
    R(d, 0, 46, W, 6, '#ff7a1a')
    for x in (6, 36, 66, 98, 128):
        R(d, x, 47, 12, 2, '#ffc23a')
        R(d, x + 4, 50, 8, 2, '#d4400a')
    for x, y in ((12, 14), (44, 30), (80, 12), (120, 28), (140, 8), (60, 38), (150, 36)):
        dot(d, x, y, '#ff9a3a')
    return ground(img, d, '#2a0c0a', '#ff7a1a')


STAGES = [py_1, py_2, py_3, py_4, py_5, py_6, py_7, py_8, py_9, py_10]


def main():
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('assets/backgrounds')
    out.mkdir(parents=True, exist_ok=True)
    for i, fn in enumerate(STAGES, 1):
        fn().save(out / f'py-{i}.png')
    print('ok ->', out)


if __name__ == '__main__':
    main()
