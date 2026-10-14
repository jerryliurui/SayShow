#!/usr/bin/env python3
"""配乐：程序原创合成，或使用现成授权曲目；按旁白自动压低，片头柔和起音、结尾淡出。

在视频的 制作/ 目录下运行（读取 video.json 与时间线、voice.wav）：
  ~/.venvs/say-show/bin/python music.py                    # 合成：video.json 的 music.bpm（默认 124）
  ~/.venvs/say-show/bin/python music.py --track 曲目.mp3     # 现成曲目：循环或截到片长，再压低与淡入淡出

默认合成风格（124 BPM 科技感电子律动）：四拍底鼓＋拍手、十六分音符踩镲与琶音、反拍贝斯、锯齿铺底随底鼓起伏，
换章前一小节上扬噪声、落点重音，结尾重音余响。全部程序合成，不使用采样，也不是音乐生成模型的产物。
现成曲目须在发布文案写明曲名、作者、来源与授权。
输出 remotion/public/video/music.wav，并把路径写进时间线。
"""
import argparse, json, subprocess, sys, wave
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
CFG_PATH = Path("video.json").resolve()
if not CFG_PATH.exists():
    sys.exit("请在含 video.json 的 制作/ 目录下运行")
CFG = json.loads(CFG_PATH.read_text())
M = CFG.get("music", {})
REMOTION = CFG_PATH.parent / CFG.get("remotion", "remotion")
TL_PATH = REMOTION / "src" / "video" / "timeline.json"
T = json.loads(TL_PATH.read_text())
dur = T["durationInFrames"] / T["fps"]
n = int(dur * SR)
tt = np.arange(n) / SR


def lp(x, fc): return sosfilt(butter(2, fc, "low", fs=SR, output="sos"), x)
def hp(x, fc): return sosfilt(butter(2, fc, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def saw(f, t): return 2 * ((f * t) % 1) - 1


def synth(bpm):
    rng = np.random.default_rng(11)
    L = np.zeros(n); R = np.zeros(n)
    beat = 60 / bpm; bar = beat * 4; six = beat / 4

    def add(sig, start, pan=0.0, gain=1.0):
        a = int(start * SR); b = min(n, a + len(sig))
        if a >= n or b <= a or a < 0: return
        s = sig[: b - a] * gain
        L[a:b] += s * (1 - pan) ** 0.5; R[a:b] += s * (1 + pan) ** 0.5

    chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]   # Am – F – C – G
    roots = [45, 41, 48, 43]

    def kick():
        t = np.arange(int(0.22 * SR)) / SR; f = 45 + 110 * np.exp(-t * 38)
        return np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14))

    def clap():
        x = rng.standard_normal(int(0.18 * SR)); t = np.arange(len(x)) / SR
        return bp(x, 900, 5000) * (np.exp(-t * 28) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) * 40) * (t > 0.012))

    def hat(open_=False):
        x = rng.standard_normal(int((0.16 if open_ else 0.04) * SR)); t = np.arange(len(x)) / SR
        return hp(x, 7000) * np.exp(-t * (18 if open_ else 90))

    def pluck(m, length):
        t = np.arange(int(length * SR)) / SR
        x = 0.6 * np.sign(np.sin(2 * np.pi * hz(m) * t)) + 0.4 * saw(hz(m) * 1.004, t)
        return lp(x, 3800) * np.minimum(t / 0.002, 1) * np.exp(-t * 16)

    def bassnote(m, length):
        t = np.arange(int(length * SR)) / SR
        return lp(saw(hz(m), t) + 0.5 * np.sin(2 * np.pi * hz(m) / 2 * t), 900) * np.minimum(t / 0.004, 1) * np.exp(-t * 7)

    pad = np.zeros(n); bass = np.zeros(n); k = 0; start = 0.0
    while start < dur:
        ci = k % 4; ch = chords[ci]
        ln = min(bar, dur - start); t = np.arange(int(ln * SR)) / SR
        a = int(start * SR); pad[a:a + len(t)] += lp(sum(saw(hz(m) * d, t) for m in ch for d in (0.996, 1.004)) / 8, 2400)[: n - a]
        for j in range(4):
            add(kick(), start + j * beat, 0, 0.9)
            if j % 2: add(clap(), start + j * beat, 0.05, 0.32)
            b0 = start + j * beat + beat / 2
            s = bassnote(roots[ci], beat * 0.45); a = int(b0 * SR); e = min(n, a + len(s))
            if a < n: bass[a:e] += s[: e - a]
            add(hat(True), b0, -0.2, 0.08)
        for j in range(16):
            add(hat(), start + j * six, 0.3 if j % 2 else -0.3, 0.07 if j % 4 == 2 else 0.04)
            m = (ch + [c + 12 for c in ch])[[0, 2, 1, 3, 4, 2, 5, 3][j % 8]] + 12
            add(pluck(m, six * 1.6), start + j * six, 0.45 if j % 2 else -0.45, 0.22)
        k += 1; start += bar
    pump = 1 - 0.75 * np.exp(-((tt % beat) / 0.09))
    L += pad * pump * 0.35 + bass * pump * 0.55; R += pad * pump * 0.35 + bass * pump * 0.55

    def impact():
        t2 = np.arange(int(1.2 * SR)) / SR
        boom = np.sin(2 * np.pi * np.cumsum(38 + 60 * np.exp(-t2 * 9)) / SR) * np.exp(-t2 * 3.2)
        return np.tanh(1.4 * boom) + 0.4 * lp(rng.standard_normal(len(t2)), 2500) * np.exp(-t2 * 6)
    for sct in T["sections"][1:]:
        t2 = np.arange(int(bar * SR)) / SR; sweep = np.zeros(len(t2)); x = rng.standard_normal(len(t2))
        for i, fc in enumerate(np.geomspace(400, 9000, 8)):
            seg = slice(i * len(t2) // 8, (i + 1) * len(t2) // 8)
            sweep[seg] = bp(x, fc * 0.7, min(fc * 1.4, 20000))[seg]
        add(sweep * (t2 / bar) ** 2 * 0.35, sct["start"] - bar + 0.05, -0.1)
        add(impact(), sct["start"], 0, 0.5)
    add(impact(), T["sections"][-1]["voiceEnd"] + 0.25, 0, 0.55)
    return np.stack([L, R], 1)


def track(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, "<i2").astype(float).reshape(-1, 2) / 32768
    reps = int(np.ceil(n / len(x)))
    return np.tile(x, (reps, 1))[:n]   # 曲目短于片长时整首循环；需要更自然的接缝时在剪辑软件里处理


ap = argparse.ArgumentParser()
ap.add_argument("--track", help="现成授权曲目文件；不给则程序合成")
a = ap.parse_args()
music = track(a.track) if a.track else synth(M.get("bpm", 124))

with wave.open(str(REMOTION / "public" / T["voice"]), "rb") as wv:
    voice = np.frombuffer(wv.readframes(wv.getnframes()), "<i2").astype(float) / 32768
active = np.zeros(n, bool)
hold = M.get("duck_hold", 0.0)   # 旁白停下后保持压低的秒数；短停顿不回升，避免配乐一抽一抽
for w in T["words"]:
    active[int(max(0, w["start"] - 0.05) * SR): int((w["end"] + 0.08 + hold) * SR)] = True
target = np.where(active, 10 ** (M.get("duck_db", -13) / 20), 1.0)
gain = np.empty(n); g = 1.0
att, rel = 1 - np.exp(-1 / (0.05 * SR)), 1 - np.exp(-1 / (M.get("duck_release", 0.25) * SR))
for i in range(n):
    g += (target[i] - g) * (att if target[i] < g else rel); gain[i] = g
ramp = np.clip(tt / M.get("fade_in", 1.5), 0, 1)
fade = ramp * ramp * (3 - 2 * ramp) * np.clip((dur - tt) / M.get("fade_out", 2.5), 0, 1)
v_rms = np.sqrt(np.mean(voice[voice != 0] ** 2)); m_rms = np.sqrt(np.mean(music ** 2)) + 1e-9
music = music * (v_rms * 10 ** (-4 / 20) / m_rms) * (gain * fade)[:, None]   # 不压低时比人声低约 4 dB
music = np.tanh(music * 1.2) / 1.2

out = REMOTION / "public" / "video" / "music.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(music, -0.98, 0.98) * 32767).astype("<i2").tobytes())
T["music"] = "video/music.wav"
TL_PATH.write_text(json.dumps(T, ensure_ascii=False, indent=1))
print(f"配乐 {'曲目 ' + a.track if a.track else '合成 ' + str(M.get('bpm', 124)) + ' BPM'}，{dur:.2f} 秒 → {out.relative_to(CFG_PATH.parent)}")
