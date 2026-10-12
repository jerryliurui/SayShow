# 时间线格式

本技能的轻量审计格式用于连续、不重叠的讲解段落。若改用跨场景重叠转场，先调整审计规则及字幕偏移，不能强行忽略重叠。

```json
{
  "fps": 30,
  "durationInFrames": 180,
  "scenes": [{
    "id": "Intro",
    "from": 0,
    "durationInFrames": 180,
    "voice": "../public/voice/Intro.wav",
    "alignmentSha256": "对齐所用音频的sha256",
    "captions": [{"text":"一段讲解", "startMs":400, "endMs":2200, "timestampMs":null, "confidence":null}]
  }]
}
```

voice 默认相对于 timeline.json 所在目录。若 JSON 位于 Remotion src/，可用 `--media-root /absolute/project/public` 指定素材根目录。场景 from 为全局帧；字幕为场景内毫秒。音频在场景零点开始，所需开头停顿已经写入音频。

草稿可无音频；使用 `--final` 时必须提供音频与摘要，系统还需能运行 ffprobe。总帧数应等于各场景连续时长之和。字幕不可重叠、越界或为空。较长短句仅发出阅读提醒，不用机械字符阈值替代实际视觉检查。

另一种格式：整片一条连续旁白，`timeline.json` 记录 `sections`（含起止帧）、`captions`（全局帧）、`anchors`（`段落.词` → 帧）与 `words`。它适合按词驱动动画与跨段圆形转场，审计用 `scripts/measure_rhythm.py` 加关键帧抽查；`audit_timeline.py` 只适用于上面的分场景格式。
