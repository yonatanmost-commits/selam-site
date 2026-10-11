"""Is a rendered video in sync with its edit file? Measures, does not judge by eye.

    python video/check_sync.py video/trials/cream/edit.json video/out/cream/final.mp4

For every kept piece it compares the render with the source clip at the place the edit file says:
  picture  which source frame the render shows in the middle of the piece (0 frames off is right)
  sound    how far the render's sound sits from the source's, for pieces that keep their sound
It also checks that picture and sound are the same length. Exits 1 if anything is off.
Render with --no-music first when checking sound: music hides the voice from the comparison.
"""
import json
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render import FPS, ROOT, timeline  # noqa: E402

SMALL = (72, 128)
FRAME_SEARCH = 6            # frames either side of where the picture should be
SOUND_SEARCH = 1.0          # seconds either side of where the sound should be
RATE = 8000


def frame(path, t, extra=""):
    """One small grey frame at time t."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.4f}", "-i", path, "-frames:v", "1",
                          "-vf", f"{extra}scale={SMALL[0]}:{SMALL[1]}:force_original_aspect_ratio=increase,"
                                 f"crop={SMALL[0]}:{SMALL[1]},format=gray",
                          "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.uint8).astype(np.float32)


def sound(path, start, length):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{start:.4f}", "-t", f"{length:.4f}", "-i", path,
                          "-vn", "-ac", "1", "-ar", str(RATE), "-af", "highpass=f=150", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def picture_offset(render, seg, source):
    """Frames between the source frame the render shows mid-piece and the one it should show.
    In a still shot every frame matches, so 0 wins whenever it is about as good as the best."""
    mid = seg["length"] / 2
    shown = frame(render, seg["at"] + mid)
    want = seg["start"] + mid * seg["speed"]
    errors = {k: np.abs(frame(source, want + k / FPS) - shown).mean()
              for k in range(-FRAME_SEARCH, FRAME_SEARCH + 1) if want + k / FPS >= 0}
    best = min(errors, key=errors.get)
    return 0 if errors[0] <= 1.25 * errors[best] else best


def sound_offset(render, seg, source):
    """Seconds the render's sound is late (+) or early (-) against the source's, by matching waveforms."""
    got = sound(render, seg["at"], seg["length"])
    lead = min(SOUND_SEARCH, seg["start"])          # never ask for sound before the clip begins
    ref = sound(source, seg["start"] - lead, seg["length"] + lead + SOUND_SEARCH)
    n = len(ref) + len(got)
    match = np.fft.irfft(np.fft.rfft(ref, n) * np.conj(np.fft.rfft(got, n)), n)[:len(ref) - len(got) + 1]
    return lead - int(np.argmax(np.abs(match))) / RATE


def main():
    edit_path, render = sys.argv[1], sys.argv[2]
    with open(edit_path, encoding="utf-8") as f:
        edit = json.load(f)
    sources = {s["id"]: os.path.join(ROOT, s["path"]) for s in edit["sources"]}
    segs, total = timeline(edit)
    bad = False

    lengths = {}
    for kind in ("v", "a"):
        out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", kind, "-show_entries",
                              "stream=duration", "-of", "csv=p=0", render], capture_output=True, text=True)
        lengths[kind] = float(out.stdout.strip())
    ok = abs(lengths["v"] - total) < 0.1 and abs(lengths["a"] - total) < 0.1
    bad |= not ok
    print(f"{'ok ' if ok else 'BAD'} length: edit {total:.2f} s, picture {lengths['v']:.2f} s, sound {lengths['a']:.2f} s")

    for seg in segs:
        name = f"{seg['at']:6.2f} s  {seg['source']} {seg['start']}-{seg['end']}"
        frames = picture_offset(render, seg, sources[seg["source"]])
        line = f"picture {frames:+d} frames"
        ok = abs(frames) <= 1
        if not seg.get("mute"):
            late = sound_offset(render, seg, sources[seg["source"]])
            line += f", sound {late:+.2f} s"
            ok = ok and abs(late) <= 0.05
        bad |= not ok
        print(f"{'ok ' if ok else 'BAD'} {name}: {line}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
