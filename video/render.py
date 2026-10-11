"""Edit file in, finished video out.

    python video/render.py video/trials/cream/edit.json --out video/out/cream/final.mp4
    python video/render.py video/trials/cream/edit.json --out video/out/cream/draft1.mp4 --draft

The edit file (JSON) is the only description of an edit:

    sources   [{id, path, recorded_by, origin}]       paths relative to the repo root
    segments  [{source, start, end, mute, speed}]     kept pieces, in order, in source-clip seconds;
                                                      mute drops a piece's own sound (off-camera talk);
                                                      speed below 1 slows a muted piece (0.5 = twice as long)
    captions  [{source, start, end, text}]            what she says; in source-clip seconds, so they move
                                                      with their segment
    labels    [{source, start, end, text, at, size}]  on-screen words that are not speech (ingredients);
                                                      timed like captions. Placed like captions, or with
                                                      at [x, y] centred above that point of the 1080x1920
                                                      canvas, to sit next to the thing they name
    title     {text, seconds}                         shown from the first frame
    closing   {text, seconds, logo}                   optional; shown over the last seconds. With logo true
                                                      her logo (name, tagline and mark) stands in for the text
    music     {path, start, track, source, licence}   optional; runs under the voice, lifts where nobody speaks;
                                                      start is where in the track the video begins
    look      {lift}                                  optional; 0 to 0.2, lightens faces and shadows while
                                                      leaving the bright parts of the picture alone
    levels    {voice_gain_db, music_lufs}             optional; how far to lift her recorded voice before
                                                      levelling, and how loud the music sits when nobody speaks

Everything about ffmpeg lives here: the filter graph, caption styling and placement, scaling,
loudness levelling and music ducking. --draft renders 720x1280 with a "טיוטה" mark. --no-music leaves
the music out, for a version that gets its sound added inside TikTok.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FPS = 30
# Captions are laid out on a 1080x1920 canvas whatever the output size (libass scales them).
# TikTok publishes no safe-zone figures; text stays in a conservative centre area of about 900x1400.
CANVAS = (1080, 1920)
FONT = "Frank Ruehl CLM"          # installed on this PC; the family of the site's Frank Ruhl Libre
PAPER, ESPRESSO = "E2EBF4", "1F262E"  # the site's --paper and --espresso, as ASS BGR
STYLES = f"""[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,{FONT},74,&H00{PAPER},&H00{ESPRESSO},&H80000000,1,1,4.5,1,2,110,110,470,177
Style: Title,{FONT},92,&H00{PAPER},&H00{ESPRESSO},&H80000000,1,1,5,1,8,110,110,330,177
Style: Closing,{FONT},70,&H00{PAPER},&H00{ESPRESSO},&H80000000,1,1,4.5,1,2,110,110,470,177
Style: Draft,{FONT},40,&H60{PAPER},&H60{ESPRESSO},&H80000000,0,1,2,0,9,40,40,40,177
"""
CAPTION_GAP = 0.04
TARGET_LUFS, TARGET_PEAK, TARGET_RANGE = -14, -2, 7
# Voice clean-up: cut rumble, soften hiss, lift, then squeeze quiet and loud speech together before the
# final levelling. (A compressor held her two passages within 1 LU of each other; speechnorm and
# dynaudnorm left them 3 LU apart or pumped the background.)
VOICE = ("highpass=f=100,afftdn=nr=12:nf=-50:tn=1,volume={gain}dB,"
         "acompressor=threshold=-24dB:ratio=4:attack=10:release=200:makeup=6dB,alimiter=limit=0.7")
VOICE_DELAY = 0.03      # the hiss filter and limiter hold the sound back this long (measured); it is cut off again
CUT_FADE = 0.012        # each kept piece of sound fades in and out this long, so cuts do not click;
                        # longer than this swallows a short quiet word at the start of a piece
MUSIC_LUFS = -20        # default levels.music_lufs; every track is first brought to one level,
                        # so tracks can be swapped freely
# Her logo is drawn dark for paper; over footage it is recoloured to the caption colour with a soft shadow.
LOGO = os.path.join("images", "receipt-logo-full.png")
LOGO_WIDTH, LOGO_BOTTOM = 540, 1490   # on the 1080x1920 canvas; the bottom edge sits where captions sit
LOGO_FADE = 0.5
DUCK = "sidechaincompress=threshold=0.015:ratio=8:attack=60:release=900"
END_FADE = 1.2          # the sound fades out over the last moments


def timeline(edit):
    """Each segment with where it starts in the finished video."""
    out, t = [], 0.0
    for seg in edit["segments"]:
        speed = seg.get("speed", 1)
        if speed != 1 and not seg.get("mute"):
            sys.exit(f"Segment {seg['source']} {seg['start']}-{seg['end']}: only a muted piece can change speed.")
        out.append({**seg, "speed": speed, "at": t, "length": (seg["end"] - seg["start"]) / speed})
        t += out[-1]["length"]
    return out, t


def placed_captions(edit, segs):
    """Captions and labels in finished-video time. Each shows only while its own segment plays."""
    out = []
    for cap in edit.get("captions", []) + edit.get("labels", []):
        for seg in segs:
            if seg["source"] != cap["source"]:
                continue
            start, end = max(cap["start"], seg["start"]), min(cap["end"], seg["end"])
            if end > start:
                out.append((seg["at"] + (start - seg["start"]) / seg["speed"],
                            seg["at"] + (end - seg["start"]) / seg["speed"], cap))
    out.sort(key=lambda x: x[:2])
    # Captions in the shared caption position never touch, so one never flashes over the next.
    shared = [i for i, x in enumerate(out) if "at" not in x[2]]
    for i, j in zip(shared, shared[1:]):
        if out[i][1] > out[j][0] - CAPTION_GAP:
            out[i] = (out[i][0], out[j][0] - CAPTION_GAP, out[i][2])
    return out


def ass_time(t):
    cs = max(0, round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def ass_text(text, at=None, size=None):
    # U+202B forces a right-to-left line, so punctuation lands on the correct side in Hebrew.
    body = "\\N".join("\u202b" + line.strip() for line in text.replace("{", "(").replace("}", ")").split("\n"))
    tags = (f"\\an2\\pos({at[0]},{at[1]})" if at else "") + (f"\\fs{size}" if size else "")
    return ("{" + tags + "}" if tags else "") + body


def subtitles(edit, segs, total, draft):
    events = [(0, total, "Draft", "טיוטה")] if draft else []
    title = edit.get("title")
    if title and title.get("text"):
        events.append((0, title.get("seconds", 3), "Title", title["text"]))
    closing = edit.get("closing")
    if closing and closing.get("text") and not closing.get("logo"):
        events.append((total - closing.get("seconds", 3), total, "Closing", closing["text"]))
    lines = [f"Dialogue: 0,{ass_time(s)},{ass_time(e)},{style},,0,0,0,,{ass_text(text)}"
             for s, e, style, text in events]
    lines += [f"Dialogue: 0,{ass_time(s)},{ass_time(e)},Caption,,0,0,0,,"
              f"{ass_text(cap['text'], cap.get('at'), cap.get('size'))}"
              for s, e, cap in placed_captions(edit, segs)]
    return (f"[Script Info]\nScriptType: v4.00+\nPlayResX: {CANVAS[0]}\nPlayResY: {CANVAS[1]}\n"
            f"WrapStyle: 0\nScaledBorderAndShadow: yes\n\n{STYLES}\n[Events]\n"
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
            + "\n".join(lines) + "\n")


def graph(segs, total, size, look, levels, music_input, logo, loudnorm, picture=True):
    """The ffmpeg filter graph. Inputs 0..n-1 are the segments; the music and the logo, if any, follow.
    `logo` is (input number, seconds on screen) or None.
    With picture=False only the sound is built, for the loudness measuring pass."""
    w, h = size
    voice = (VOICE.format(gain=levels.get("voice_gain_db", 0))
             + f",atrim=start={VOICE_DELAY},asetpts=PTS-STARTPTS,apad=whole_dur={total:.3f}")
    lift = look.get("lift", 0)
    # Raise the dark and middle tones; black and white stay put, so skies and steel do not blow out.
    light = (f"curves=all='0/0 0.25/{0.25 + lift:.3f} 0.55/{0.55 + lift:.3f} 1/1',"
             f"eq=saturation={1 + lift / 2:.3f}," if lift else "")
    parts = []
    # Phone clips have uneven frame timing. Every piece is forced to exactly its length in both picture
    # and sound, or the picture slides behind the sound and captions a little more at every cut.
    exact_v = f"fps={FPS}:start_time=0,tpad=stop_mode=clone:stop_duration=1,trim=duration={{:.3f}},setpts=PTS-STARTPTS"
    # (A slowed piece has far less sound than picture, so the sound is padded to the whole length.)
    exact_a = "apad=whole_dur={0:.3f},atrim=duration={0:.3f},asetpts=PTS-STARTPTS"
    n = len(segs)
    for i, seg in enumerate(segs):
        length = seg["length"]
        sound = "volume=0" if seg.get("mute") else (
            f"afade=t=in:d={CUT_FADE},afade=t=out:st={length - CUT_FADE:.3f}:d={CUT_FADE}")
        parts.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,{exact_a.format(length)},{sound}[a{i}]")
    parts.append("".join(f"[a{i}]" for i in range(n)) + f"concat=n={n}:v=0:a=1[acat]")
    if picture:
        for i, seg in enumerate(segs):
            parts.append(f"[{i}:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},"
                         f"setpts=PTS/{seg['speed']},{exact_v.format(seg['length'])},{light}setsar=1,"
                         f"format=yuv420p[v{i}]")
        parts.append("".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0,ass=captions.ass"
                     + ("[vtext]" if logo else "[vout]"))
        if logo:
            k = w / CANVAS[0]
            start = total - logo[1]
            fade = f"fade=t=in:st={start:.3f}:d={LOGO_FADE}:alpha=1"
            parts.append(f"[{logo[0]}:v]format=rgba,scale={round(LOGO_WIDTH * k)}:-1,split[lg0][ls0]")
            parts.append(f"[lg0]lutrgb=r=0x{PAPER[4:6]}:g=0x{PAPER[2:4]}:b=0x{PAPER[0:2]},{fade}[lg]")
            parts.append(f"[ls0]lutrgb=r=0x{ESPRESSO[4:6]}:g=0x{ESPRESSO[2:4]}:b=0x{ESPRESSO[0:2]},"
                         f"pad=iw+40:ih+40:20:20:color=black@0,gblur=sigma={6 * k:.1f},{fade}[ls]")
            where = f"enable='gte(t,{start:.3f})'"
            y = f"{round(LOGO_BOTTOM * k)}-h"
            parts.append(f"[vtext][ls]overlay=x=(W-w)/2:y={y}+20:{where}[vsh]")
            parts.append(f"[vsh][lg]overlay=x=(W-w)/2:y={y}:{where}[vout]")
    if music_input is None:
        parts.append(f"[acat]{voice}[mix]")
    else:
        parts.append(f"[acat]{voice},asplit[voice][key]")
        parts.append(f"[{music_input}:a]aresample=48000,aformat=channel_layouts=stereo,"
                     f"loudnorm=I={levels.get('music_lufs', MUSIC_LUFS)}:TP=-3:LRA=11,aresample=48000[bed]")
        parts.append(f"[bed][key]{DUCK}[ducked]")
        parts.append("[voice][ducked]amix=inputs=2:duration=first:normalize=0[mix]")
    parts.append(f"[mix]afade=t=out:st={total - END_FADE:.3f}:d={END_FADE},{loudnorm}[aout]")
    return ";\n".join(parts)


def loudnorm_filter(measured=None):
    base = f"loudnorm=I={TARGET_LUFS}:TP={TARGET_PEAK}:LRA={TARGET_RANGE}"
    if not measured:
        return base + ":print_format=json"
    return (base + f":measured_I={measured['input_i']}:measured_TP={measured['input_tp']}"
            f":measured_LRA={measured['input_lra']}:measured_thresh={measured['input_thresh']}"
            f":offset={measured['target_offset']},aresample=48000")


def render(edit_path, out_path, draft=False, music=True):
    """Render the edit described in `edit_path` to `out_path`."""
    with open(edit_path, encoding="utf-8") as f:
        edit = json.load(f)
    sources = {s["id"]: os.path.join(ROOT, s["path"]) for s in edit["sources"]}
    segs, total = timeline(edit)
    size = (720, 1280) if draft else CANVAS
    out_path = os.path.abspath(out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    inputs = []
    for seg in segs:
        inputs += ["-ss", f"{seg['start']:.3f}", "-t", f"{seg['end'] - seg['start']:.3f}", "-i", sources[seg["source"]]]
    music = edit.get("music") if music else None
    music_input = None
    if music and music.get("path"):
        music_input = len(segs)
        inputs += ["-stream_loop", "-1", "-ss", f"{music.get('start', 0):.3f}", "-t", f"{total:.3f}",
                   "-i", os.path.join(ROOT, music["path"])]
    closing = edit.get("closing") or {}
    logo = None
    if closing.get("logo"):
        # The logo file is not in the repository, so a fresh copy of the repo does not have it.
        if not os.path.isfile(os.path.join(ROOT, LOGO)):
            sys.exit(f"The closing asks for the logo, but {LOGO} is missing. "
                     "Put the file back, or set closing.logo to false to close on the text line.")
        logo = (len(segs) if music_input is None else music_input + 1, closing.get("seconds", 3))
        inputs += ["-loop", "1", "-t", f"{total:.3f}", "-i", os.path.join(ROOT, LOGO)]

    # ffmpeg filter arguments choke on Windows drive colons, so work inside a folder with bare file names.
    with tempfile.TemporaryDirectory() as tmp:
        with open(os.path.join(tmp, "captions.ass"), "w", encoding="utf-8") as f:
            f.write(subtitles(edit, segs, total, draft))

        def run(loudnorm, tail, picture=True):
            with open(os.path.join(tmp, "graph.txt"), "w", encoding="utf-8") as f:
                f.write(graph(segs, total, size, edit.get("look", {}), edit.get("levels", {}), music_input, logo,
                              loudnorm, picture))
            return subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-y", "-nostats", *inputs,
                                   "-/filter_complex", "graph.txt", "-t", f"{total:.3f}", *tail],
                                  cwd=tmp, check=True, capture_output=True, text=True, encoding="utf-8",
                                  errors="replace")

        # Pass 1 measures the mixed sound; pass 2 levels it to the target and writes the video.
        measure = run(loudnorm_filter(), ["-map", "[aout]", "-f", "null", "-"], picture=False)
        found = re.findall(r"\{[^{}]*\"input_i\"[^{}]*\}", measure.stderr)
        if not found:
            sys.exit("ffmpeg gave no loudness measurement:\n" + measure.stderr[-2000:])
        run(loudnorm_filter(json.loads(found[-1])),
            ["-map", "[vout]", "-map", "[aout]",
             "-c:v", "libx264", "-preset", "veryfast" if draft else "slow", "-crf", "23" if draft else "18",
             "-pix_fmt", "yuv420p", "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
             "-movflags", "+faststart", out_path])
    return total


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("edit")
    ap.add_argument("--out", required=True)
    ap.add_argument("--draft", action="store_true", help="720x1280, fast encode, marked טיוטה")
    ap.add_argument("--no-music", action="store_true", help="leave the music out")
    args = ap.parse_args()
    try:
        total = render(args.edit, args.out, args.draft, music=not args.no_music)
    except subprocess.CalledProcessError as e:
        sys.exit("ffmpeg failed:\n" + (e.stderr or "")[-3000:])
    print(f"{total:.1f} s -> {args.out}")


if __name__ == "__main__":
    main()
