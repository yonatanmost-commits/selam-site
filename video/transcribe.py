"""Audio in, timed Hebrew transcript out.

    video/work/venv/Scripts/python video/transcribe.py Videos/clip.mp4 --source clip --out video/work/cream/clip.json

Writes {"lines": [{"source", "start", "end", "text"}]} with times in seconds of the source clip.
Runs fully on this machine, CPU only: faster-whisper with the ivrit.ai Hebrew model
(https://huggingface.co/ivrit-ai/whisper-large-v3-turbo-ct2, Apache-2.0; downloaded once, about 1.6 GB).
Which engine and model are used is this module's business; callers only see the lines.

Setup, once:  python -m venv video/work/venv  &&  video/work/venv/Scripts/python -m pip install faster-whisper

ffmpeg's built-in whisper filter was tried first (no install) and dropped: on this footage it kept
one phrase per window and split words mid-letter, and with a voice-activity model it ran slower than real time.
"""
import argparse
import json
import os
import subprocess
import sys

MODEL = "ivrit-ai/whisper-large-v3-turbo-ct2"
# A line is one caption-sized phrase: it ends at a pause, at sentence punctuation, or when it gets long.
PAUSE_SECONDS = 0.45
MAX_CHARS = 38


def phrases(words, source):
    """Group timed words into caption-sized lines."""
    lines, current = [], []

    def close():
        if current:
            lines.append({"source": source,
                          "start": round(current[0].start, 2),
                          "end": round(current[-1].end, 2),
                          "text": "".join(w.word for w in current).strip()})
            current.clear()

    for w in words:
        if current:
            text = "".join(x.word for x in current).strip()
            if (w.start - current[-1].end >= PAUSE_SECONDS or text[-1] in ".?!"
                    or len(text) + len(w.word) > MAX_CHARS):
                close()
        current.append(w)
    close()
    return lines


def transcribe(media, source):
    """The spoken Hebrew in `media` as timed lines, each tagged with the `source` id."""
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("faster-whisper is not installed in this Python. See the setup line in video/transcribe.py.")
    import numpy as np
    # ffmpeg decodes the sound (16 kHz mono); the speech library's own decoder fails on Python 3.14.
    # Quiet speech is lifted first: her phone records her far from the microphone, outdoors.
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-i", media, "-vn", "-ac", "1", "-ar", "16000",
                          "-af", "highpass=f=100,dynaudnorm=f=200:g=11",
                          "-f", "f32le", "-"], check=True, capture_output=True).stdout
    audio = np.frombuffer(pcm, dtype=np.float32)
    model = WhisperModel(MODEL, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio, language="he", word_timestamps=True,
                                   condition_on_previous_text=False)
    words = [w for seg in segments for w in (seg.words or [])]
    return phrases(words, source)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("media")
    ap.add_argument("--source", required=True, help="the source id this clip has in the edit file")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    lines = transcribe(args.media, args.source)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"lines": lines}, f, ensure_ascii=False, indent=1)
    print(f"{len(lines)} lines -> {args.out}")


if __name__ == "__main__":
    main()
