#!/usr/bin/env python3
"""测量讲解视频的画面运动、字幕切换、语速停顿与响度，用于和参考视频对比。

用法：
  ~/.venvs/say-show/bin/python measure_rhythm.py 视频.mp4 [--audio 音轨.m4a] [--sub-band 940 1035] [--asr]

依赖：ffmpeg、numpy；--asr 需要 mlx_whisper。固定环境 ~/.venvs/say-show 已安装，模型 whisper-large-v3-turbo 已在 HuggingFace 缓存中。
数值只描述节奏特征，不能代替观看和听感复审。Whisper 的字时间有约 ±0.2 秒误差。
"""
import argparse, json, re, subprocess, sys
import numpy as np

W, H, FPS = 480, 270, 30


def frames_gray(path):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps={FPS},scale={W}:{H},format=gray",
                          "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(W * H)
        if len(b) < W * H:
            break
        yield np.frombuffer(b, np.uint8).reshape(H, W).astype(np.int16)


def runs(mask):
    out, r = [], 0
    for x in mask:
        if x:
            r += 1
        elif r:
            out.append(r); r = 0
    if r:
        out.append(r)
    return np.array(out or [0]) / FPS


def video_stats(path, band):
    y0, y1 = int(H * band[0] / 1080), int(H * band[1] / 1080)
    prev, main, sig = None, [], []
    for f in frames_gray(path):
        sig.append((f[y0:y1] < 75).mean(0))
        main.append(0.0 if prev is None else float(np.abs(f - prev)[:y0 - 4].mean()))
        prev = f
    a, sig = np.array(main), np.array(sig)
    holds = runs(a <= 0.25)
    ch = np.abs(np.diff(sig, axis=0)).mean(1)
    ev = np.where(ch > 0.02)[0] + 1
    cues, last = [], -99
    for e in ev:
        if e - last > 6:
            cues.append(e)
        last = e
    clusters, cur = [], ([ev[0]] if len(ev) else [])
    for e in ev[1:]:
        if e - cur[-1] <= 2:
            cur.append(e)
        else:
            clusters.append(len(cur)); cur = [e]
    if cur:
        clusters.append(len(cur))
    dur = np.diff(cues) / FPS if len(cues) > 1 else np.array([0])
    return {
        "时长s": round(len(a) / FPS, 1),
        "有动静帧%": round(float(np.mean(a > 0.03) * 100)),
        "明显运动帧%": round(float(np.mean(a > 0.25) * 100)),
        "完全静止帧%": round(float(np.mean(a < 0.01) * 100)),
        "静止停留>=1s 中位s": round(float(np.median(holds[holds >= 1])) if np.any(holds >= 1) else 0, 2),
        "最长静止s": round(float(holds.max()), 1),
        "字幕条数": len(cues),
        "字幕时长中位s": round(float(np.median(dur)), 2),
        "字幕切换为1帧硬切%": round(float(np.mean(np.array(clusters) == 1) * 100)) if clusters else None,
        "字幕框可见%": round(float(np.mean(sig.mean(1) > 0.05) * 100)),
    }


def audio_stats(path):
    lu = subprocess.run(["ffmpeg", "-v", "info", "-i", path, "-af", "ebur128", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", lu)
    L = re.findall(r"LRA:\s+([\d.]+) LU", lu)
    return {"响度LUFS": float(I[-1]) if I else None, "LRA": float(L[-1]) if L else None}


def asr_stats(path):
    import mlx_whisper
    wav = "/tmp/_rhythm.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-vn", "-ac", "1", "-ar", "16000", wav], check=True)
    r = mlx_whisper.transcribe(wav, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="zh",
                               word_timestamps=True, initial_prompt="以下是普通话的句子，使用简体中文。",
                               condition_on_previous_text=False)
    words = [w for s in r["segments"] for w in s.get("words", [])]
    txt = "".join(w["word"] for w in words)
    ws = np.array([w["start"] for w in words]); we = np.array([w["end"] for w in words])
    g = ws[1:] - we[:-1]; span = we[-1] - ws[0]
    han = len(re.sub(r"[^\u4e00-\u9fff]", "", txt))
    return {"汉字/分钟": round(han / span * 60), "停顿>0.3s 每分钟": round(np.sum(g > 0.3) / span * 60, 1),
            "停顿>0.6s 每分钟": round(np.sum(g > 0.6) / span * 60, 1),
            "停顿占比%": round(float(g[g > 0.15].sum() / span * 100)),
            "开头静音s": round(float(ws[0]), 2)}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("--audio")
    ap.add_argument("--sub-band", nargs=2, type=int, default=[940, 1035], help="字幕框所在的 y 范围（按 1080 高度）")
    ap.add_argument("--asr", action="store_true")
    a = ap.parse_args()
    out = video_stats(a.video, a.sub_band)
    out.update(audio_stats(a.audio or a.video))
    if a.asr:
        out.update(asr_stats(a.audio or a.video))
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1); print()
