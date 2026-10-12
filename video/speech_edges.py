"""Where can speech be cut cleanly near a given moment? Charts the sound itself, in 20 ms steps.

    python video/speech_edges.py Videos/clip.mp4 21.4
    python video/speech_edges.py Videos/clip.mp4 9.0 --span 1.5

A speech model says which words were spoken, but its word times are off by up to a second around
pauses, so cuts and caption times are taken from here instead. Two bands are charted, because a word
is not over until both are quiet:
  voiced  200-3000 Hz   vowels and most consonants
  hiss    above 3500 Hz the sibilants (ש ס צ), which do not show in the voiced band at all
It prints the chart, then the quiet gaps wide enough to cut in. A gap under 0.1 s is marked narrow:
it may be a stop consonant inside a word. Where words run together there is no pause to find; the
chart then has to be read by eye and the cut heard by a person.
"""
import argparse
import subprocess

import numpy as np

RATE = 16000
STEP = 0.02
FLOOR_SPAN = 3.0        # seconds either side used to find how quiet the clip gets
QUIET_DB = 6            # a step is quiet when both bands are within this of their floor
MIN_GAP = 0.04          # a gap narrower than this is too tight to cut in
PAUSE = 0.1             # a gap at least this wide is a pause between words
BANDS = {"voiced": "highpass=f=200,lowpass=f=3000", "hiss": "highpass=f=3500"}


def levels(path, start, length, band):
    """Level in dB for every 20 ms step of one band."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-ss", f"{start:.3f}", "-t", f"{length:.3f}",
                          "-i", path, "-vn", "-ac", "1", "-ar", str(RATE), "-af", BANDS[band],
                          "-f", "f32le", "-"], check=True, capture_output=True).stdout
    sound = np.frombuffer(raw, dtype=np.float32)
    n = int(RATE * STEP)
    steps = sound[:len(sound) // n * n].reshape(-1, n)
    return 20 * np.log10(np.sqrt((steps ** 2).mean(axis=1)) + 1e-9)


def edges(path, at, span=1.0):
    """The chart around `at`: step times, each band's level above its floor, and which steps are quiet."""
    start = max(0.0, at - FLOOR_SPAN)
    above = {}
    for band in BANDS:
        db = levels(path, start, at + FLOOR_SPAN - start, band)
        above[band] = db - np.percentile(db, 10)
    times = start + np.arange(len(above["voiced"])) * STEP
    shown = (times >= at - span) & (times <= at + span)
    quiet = (above["voiced"] < QUIET_DB) & (above["hiss"] < QUIET_DB)
    return times[shown], above["voiced"][shown], above["hiss"][shown], quiet[shown]


def gaps(times, quiet):
    """Runs of quiet steps at least MIN_GAP wide, as (start, end)."""
    out, begin = [], None
    for t, q in zip(list(times) + [times[-1] + STEP], list(quiet) + [False]):
        if q and begin is None:
            begin = t
        elif not q and begin is not None:
            if t - begin >= MIN_GAP - 1e-9:
                out.append((begin, t))
            begin = None
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("media")
    ap.add_argument("at", type=float, help="the moment of interest, in seconds of the clip")
    ap.add_argument("--span", type=float, default=1.0, help="seconds charted either side (default 1)")
    args = ap.parse_args()

    times, voiced, hiss, quiet = edges(args.media, args.at, args.span)
    bar = lambda db: "#" * int(max(0, min(db, 40)) / 2)
    print(f"{'time':>7}  {'voiced':<20}  {'hiss':<20}")
    for t, v, h, q in zip(times, voiced, hiss, quiet):
        print(f"{t:7.2f}  {bar(v):<20}  {bar(h):<20}{'  quiet' if q else ''}")

    found = gaps(times, quiet)
    if found:
        print("\nQuiet gaps to cut in (start-end, middle):")
        for a, b in found:
            # A stop consonant (כ ק ט ת פ ב ד ג) closes the mouth for a moment in the middle of a word.
            narrow = "   narrow: may be a consonant inside a word, not a pause" if b - a < PAUSE else ""
            print(f"  {a:.2f}-{b:.2f}  cut at {(a + b) / 2:.2f}{narrow}")
    if not any(b - a >= PAUSE for a, b in found):
        # No tool picks this point reliably: a quiet word after a loud one shows only as a small step
        # (about 4 dB) in the voiced column, smaller than the falls inside ordinary words.
        print("\nNo real pause here: the words run together. Read the voiced column for a small step down "
              "where a quieter word begins, cut at that step with a fade of about 0.01 s, re-hear the "
              "render with the speech model, and have a person listen.")


if __name__ == "__main__":
    main()
