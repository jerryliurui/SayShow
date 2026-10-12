#!/usr/bin/env python3
"""旁白：克隆声音整段合成 → 压短过长停顿 → Whisper 逐字对齐稿件 → 连续音轨、字幕与锚点时间线。

在视频的 制作/ 目录下运行（读取 video.json）：
  ~/.venvs/say-show/bin/python voice.py                       # 合成缺失的段落并生成 voice.wav 与 timeline.json
  ~/.venvs/say-show/bin/python voice.py takes fix,date 1,2,3  # 为指定段落各合成多个种子的候选，打印 Whisper 听写
  ~/.venvs/say-show/bin/python voice.py pick fix=2 date=3     # 采用候选：写入 video.json 的 seeds 并放进缓存
  ~/.venvs/say-show/bin/python voice.py clean                 # 删除候选与不再使用的缓存

稿件格式：`## 段落id · 标题` 后接正文；`[[词]]` 为画面锚点，`|` 为字幕强制换条，两者都不进入配音和字幕。
读音：video.json 的 pronounce（全局）与 pronounce_sections（按段）只改送给 TTS 的文字；数字后的 MB/GB 等自动拆成字母。
声音模型不提供词边界，时间来自对最终音频的 Whisper 逐字识别，再与稿件逐字比对，没对上的字插值。
不要把稿件原文作为 Whisper 提示词：实测会让对齐率大幅下降。
"""
import difflib, hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
import numpy as np, soundfile as sf

WHISPER = "mlx-community/whisper-large-v3-turbo"
SR, FPS = 48000, 30
SENT_END = "。！？；"

CFG_PATH = Path("video.json").resolve()
if not CFG_PATH.exists():
    sys.exit("请在含 video.json 的 制作/ 目录下运行")
BASE = CFG_PATH.parent
CFG = json.loads(CFG_PATH.read_text())
V, TM = CFG["voice"], CFG["timing"]
REMOTION = BASE / CFG.get("remotion", "remotion")
CACHE = BASE / CFG.get("cache", "缓存")
TAKES = CACHE / "候选"
OUT_AUDIO = REMOTION / "public" / "video" / "voice.wav"
OUT_TIMELINE = REMOTION / "src" / "video" / "timeline.json"


def norm(s):
    return "".join(c.lower() for c in s if c.isalnum())


def width(s):
    """字幕宽度：汉字记 1，英文、数字和空格约记 0.55。"""
    return sum(1 if ord(c) > 0x2E80 else 0.55 for c in s)


def show(text):
    """字幕显示：口播写“1398 乘 2034”，字幕显示“1398 × 2034”。"""
    return re.sub(r"(\d)\s*乘\s*(\d)", r"\1 × \2", text)


def tts_text(display, sid):
    """送给 TTS 的文字：读音替换（先按段、再全局）、单位缩写拆字母、去掉中英之间的空格。"""
    for table in (CFG.get("pronounce_sections", {}).get(sid, {}), CFG.get("pronounce", {})):
        for k, v in table.items():
            display = display.replace(k, v)
    display = re.sub(r"(\d)\s*([KMGT])B\b", r"\1 \2 B", display)   # 500 MB 读作“五百 M B”，不读“兆比”
    return re.sub(r"(?<=[一-鿿，。：；、！？])\s+(?=[A-Za-z0-9])|(?<=[A-Za-z0-9])\s+(?=[一-鿿，。：；、！？])", "", display)


def parse_script():
    text = (BASE / CFG.get("script", "旁白稿.md")).read_text()
    secs = []
    for m in re.finditer(r"^## (\w+) · (.+?)\n\n(.+?)(?=\n## |\Z)", text, re.S | re.M):
        raw = m.group(3).strip()
        forced = set()
        while "|" in raw:
            i = raw.index("|"); forced.add(len(re.sub(r"\[\[|\]\]", "", raw[:i]))); raw = raw[:i] + raw[i + 1:]
        anchors, display, k = [], "", 0
        for a in re.finditer(r"\[\[(.+?)\]\]", raw):
            display += raw[k:a.start()]; anchors.append((a.group(1), len(display))); display += a.group(1); k = a.end()
        display += raw[k:]
        secs.append({"id": m.group(1), "title": m.group(2).strip(), "display": display, "forced": forced, "anchors": anchors})
    if not secs:
        sys.exit("旁白稿里没有找到 `## id · 标题` 段落")
    return secs


def cache_key(text, seed):
    s = f"{V['model']}|{V['temperature']}|{V['lang']}|{V['ref_text']}|{text}" + (f"|seed{seed}" if seed is not None else "")
    return hashlib.sha256(s.encode()).hexdigest()[:16]


_model = {}


def synth(text, seed, out):
    if "m" not in _model:
        from mlx_audio.tts.utils import load_model
        _model["m"] = load_model(V["model"])
    if seed is not None:
        import mlx.core as mx
        mx.random.seed(seed)
    res = list(_model["m"].generate(text=text, ref_audio=V["ref_audio"], ref_text=V["ref_text"], lang_code=V["lang"], temperature=V["temperature"]))
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out, np.concatenate([np.array(r.audio) for r in res]), res[0].sample_rate)


def compress(x, sr):
    """去掉首尾静音，把长于 max_pause 的静音压到 keep_pause（前后各留一半）。"""
    hop = sr // 100
    fr = x[: len(x) // hop * hop].reshape(-1, hop)
    rms = np.sqrt((fr ** 2).mean(1))
    voiced = rms > np.percentile(rms, 95) * 10 ** (-35 / 20)
    idx = np.nonzero(voiced)[0]
    a, b = max(idx[0] - 3, 0), min(idx[-1] + 8, len(voiced))
    keep, i = [], a
    while i < b:
        j = i
        if not voiced[i]:
            while j < b and not voiced[j]:
                j += 1
            if (j - i) / 100 > TM["max_pause"]:
                half = int(TM["keep_pause"] * 50)
                keep += [(i, i + half), (j - half, j)]
            else:
                keep.append((i, j))
        else:
            while j < b and voiced[j]:
                j += 1
            keep.append((i, j))
        i = j
    return np.concatenate([x[s * hop:e * hop] for s, e in keep])


def prepare(raw_wav, out_wav):
    """压缩停顿并整体加速（保持音高），写出处理后的音频。"""
    x, sr = sf.read(raw_wav)
    sf.write(out_wav, compress(x, sr), sr)
    if TM["speed"] != 1:
        tmp = out_wav.with_suffix(".tmp.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(out_wav), "-af", f"atempo={TM['speed']}", str(tmp)], check=True)
        tmp.replace(out_wav)


def align(audio_path, display):
    import mlx_whisper
    r = mlx_whisper.transcribe(str(audio_path), path_or_hf_repo=WHISPER, language="zh", word_timestamps=True,
                               initial_prompt="以下是普通话的句子，使用简体中文。", condition_on_previous_text=False)
    words = [{"text": w["word"].strip(), "start": w["start"], "end": w["end"]} for s in r["segments"] for w in s.get("words", [])]
    chars = []
    for w in words:
        t = norm(w["text"])
        for k, c in enumerate(t):
            d = (w["end"] - w["start"]) / max(len(t), 1)
            chars.append((c, w["start"] + k * d, w["start"] + (k + 1) * d))
    target = norm(display)
    sm = difflib.SequenceMatcher(None, target, "".join(c for c, _, _ in chars), autojunk=False)
    start = [None] * len(target); end = [None] * len(target)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            _, s, e = chars[blk.b + k]; start[blk.a + k] = s; end[blk.a + k] = e
    matched = sum(v is not None for v in start) / max(len(target), 1)
    known = [i for i, v in enumerate(start) if v is not None]
    for i in range(len(target)):
        if start[i] is None:
            lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
            if lo is None: start[i] = end[i] = start[hi]
            elif hi is None: start[i] = end[i] = end[lo]
            else:
                f = (i - lo) / (hi - lo); start[i] = end[lo] + f * (start[hi] - end[lo]); end[i] = start[i]
    return start, end, matched, words


def split_captions(display, forced=()):
    """单行字幕：句末与 | 必断；逗号、冒号在已有 12 字宽以上时断；超过 22 字宽在最近的顿号、空格或逗号处断。"""
    phrases, cur, start = [], "", 0
    for i, c in enumerate(display):
        if not cur:
            start = i
        if i in forced and cur.strip():
            phrases.append((start, cur)); cur = ""; start = i
        cur += c
        n = width(cur.strip())
        if c in SENT_END or (c in "，：" and n >= 12):
            phrases.append((start, cur)); cur = ""
        elif n >= 22 and not (c.isascii() and c.isalnum()):
            cut = max(cur.rfind("、"), cur.rfind(" "), cur.rfind("，"))
            if cut > 4:
                phrases.append((start, cur[:cut + 1])); start += cut + 1; cur = cur[cut + 1:]
    if cur.strip():
        phrases.append((start, cur))
    return [(s, t.strip().rstrip("，。：；、,").strip()) for s, t in phrases if t.strip()]


def build_section(sec):
    text = tts_text(sec["display"], sec["id"])
    seed = CFG.get("seeds", {}).get(sec["id"])
    raw = CACHE / f"{sec['id']}-{cache_key(text, seed)}.wav"
    if not raw.exists():
        print(f"合成 {sec['id']}（种子 {seed}）…", flush=True)
        synth(text, seed, raw)
    proc = raw.with_name(raw.stem + "-处理.wav")
    prepare(raw, proc)
    start, end, matched, words = align(proc, sec["display"])
    y, sr = sf.read(proc)
    print(f"{sec['id']}: {len(y) / sr:.2f}s，稿件字对齐 {matched * 100:.0f}%" + ("  ⚠ 对齐率偏低，请抽查" if matched < 0.9 else ""), flush=True)
    display = sec["display"]; nidx, n = [], 0
    for c in display:
        nidx.append(n); n += c.isalnum()

    def time_at(ch):
        while ch < len(display) and not display[ch].isalnum():
            ch += 1
        return start[min(nidx[ch] if ch < len(display) else n - 1, n - 1)]

    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(proc), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    proc.unlink()
    return {**sec, "audio": pcm, "dur": len(pcm) / 2 / SR, "words": words, "matched": matched,
            "captions": [{"text": show(t), "start": time_at(s)} for s, t in split_captions(display, sec["forced"])],
            "anchor_times": {name: time_at(ch) for name, ch in sec["anchors"]}}


def build():
    secs = [build_section(s) for s in parse_script()]
    t = TM["head"]; pcm = b"\x00\x00" * int(TM["head"] * SR)
    sections, captions, anchors, words = [], [], {}, []
    for i, s in enumerate(secs):
        st = t; pcm += s["audio"]; t += s["dur"]
        gap = TM["section_gap"] if i < len(secs) - 1 else TM["tail"]
        pcm += b"\x00\x00" * int(gap * SR); t += gap
        sections.append({"id": s["id"], "title": s["title"], "start": st, "voiceEnd": st + s["dur"], "end": t})
        captions += [{"text": c["text"], "start": st + c["start"]} for c in s["captions"]]
        anchors.update({f"{s['id']}.{k}": st + v for k, v in s["anchor_times"].items()})
        words += [{"text": w["text"], "start": st + w["start"], "end": st + w["end"], "section": s["id"]} for w in s["words"]]
    for a, b in zip(captions, captions[1:]):
        a["end"] = b["start"]
    captions[-1]["end"] = sections[-1]["voiceEnd"] + 0.6
    OUT_AUDIO.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", str(OUT_AUDIO)], input=pcm, check=True)
    f = lambda s: round(s * FPS)
    music = REMOTION / "public" / "video" / "music.wav"
    tl = {"fps": FPS, "durationInFrames": f(t), "voice": "video/voice.wav", "music": "video/music.wav" if music.exists() else None,
          "tts": {k: V[k] for k in ("model", "temperature", "lang")} | {"speed": TM["speed"], "seeds": CFG.get("seeds", {})},
          "sections": [{**x, "startFrame": f(x["start"]), "voiceEndFrame": f(x["voiceEnd"]), "endFrame": f(x["end"])} for x in sections],
          "captions": [{"text": c["text"], "startFrame": f(c["start"]), "endFrame": f(c["end"])} for c in captions],
          "anchors": {k: f(v) for k, v in anchors.items()},
          "words": [{**w, "startFrame": f(w["start"])} for w in words]}
    OUT_TIMELINE.write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    han = len(re.sub(r"[^一-鿿]", "", "".join(s["display"] for s in secs)))
    print(f"总长 {t:.2f}s（{tl['durationInFrames']} 帧），{len(captions)} 条字幕；口播约 {han / sum(s['dur'] for s in secs) * 60:.0f} 汉字/分钟；"
          f"最低对齐率 {min(s['matched'] for s in secs) * 100:.0f}%")
    print("下一步：运行 music.py（旁白每次重建后都要重跑，配乐长度和压低位置跟着旁白走）")


def takes(ids, seeds):
    """为指定段落合成多个种子的候选，打印 Whisper 听写，供挑读音最自然、其余字也读对的一版。"""
    secs = {s["id"]: s for s in parse_script()}
    log = TAKES / "takes.jsonl"
    for sid in ids:
        sec = secs[sid]; text = tts_text(sec["display"], sid)
        print(f"== {sid}  送给 TTS：{text}")
        for seed in seeds:
            raw = TAKES / f"{sid}-{seed}-{cache_key(text, seed)}.wav"
            if not raw.exists():
                synth(text, seed, raw)
            proc = raw.with_name(raw.stem + "-处理.wav"); prepare(raw, proc)
            _, _, matched, words = align(proc, sec["display"]); proc.unlink()
            asr = "".join(w["text"] for w in words)
            print(f"  种子 {seed}  对齐 {matched * 100:.0f}%  {asr}", flush=True)
            with open(log, "a") as fh:
                fh.write(json.dumps({"id": sid, "seed": seed, "matched": round(matched, 3), "asr": asr}, ensure_ascii=False) + "\n")


def pick(pairs):
    secs = {s["id"]: s for s in parse_script()}
    seeds = CFG.setdefault("seeds", {})
    for p in pairs:
        sid, seed = p.split("="); seed = int(seed)
        text = tts_text(secs[sid]["display"], sid); key = cache_key(text, seed)
        src = TAKES / f"{sid}-{seed}-{key}.wav"
        if not src.exists():
            sys.exit(f"没有候选 {src.name}；先运行 takes，或稿件／读音已改动")
        for old in CACHE.glob(f"{sid}-*.wav"):
            old.unlink()
        shutil.copy(src, CACHE / f"{sid}-{key}.wav")
        seeds[sid] = seed
        print(f"{sid} 采用种子 {seed}")
    CFG_PATH.write_text(json.dumps(CFG, ensure_ascii=False, indent=2) + "\n")
    print("已写入 video.json；接着运行 voice.py 重建时间线")


def clean():
    """只保留当前稿件与种子对应的缓存，删除候选。"""
    keep = {f"{s['id']}-{cache_key(tts_text(s['display'], s['id']), CFG.get('seeds', {}).get(s['id']))}.wav" for s in parse_script()}
    removed = 0
    for f in CACHE.glob("*.wav"):
        if f.name not in keep:
            f.unlink(); removed += 1
    if TAKES.exists():
        shutil.rmtree(TAKES)
    print(f"删除 {removed} 个旧缓存与全部候选，保留 {len(keep)} 段")


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        build()
    elif args[0] == "takes":
        takes(args[1].split(","), [int(x) for x in args[2].split(",")])
    elif args[0] == "pick":
        pick(args[1:])
    elif args[0] == "clean":
        clean()
    else:
        sys.exit(__doc__)
