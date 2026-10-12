# Builder's report: the cream video

Answers to `report-questions.md`, same numbers, plus 22–25 asked by the planner afterwards.
Written 2026-10-12 by the builder session, after draft 6 (`1288a53`). The round-by-round record is
in `log.md`; the code is `video/render.py`, `video/transcribe.py` and `video/check_sync.py`.

Read this first: **I cannot hear.** Everything about sound in this report was measured (loudness,
waveform matching, energy charts, a speech model re-hearing the mix), never listened to. Every
fault that reached Selam was a sound or timing fault. That is the main lesson of the trial.

## Workflow

### 1. The real steps, and where the order differed from the plan
**This run.**
1. Acceptance tests written, checked against synthetic fixtures in a scratch repo, locked, committed (`f67fed8`).
2. Transcribed the CapCut export with ffmpeg's whisper filter. Unusable (see 4).
3. The three raw clips arrived mid-work. Plan step 8 (re-time from the export to the raw clips) never happened: I dropped the export and cut from the originals from the first draft.
4. Installed faster-whisper in a venv, transcribed the three raw clips.
5. Looked at contact sheets, found that almost all speech was off-camera direction and only three lines were content. This changed the video from "captioned talking" to "visual process with labels".
6. Wrote `render.py` and `edit.json`, rendered draft 1 with a proposed cut, placeholder title and candidate music. Selam had not been asked anything yet (plan steps 2 and 3 were meant to come first).
7. Rounds 1, 2, 3 of her notes → drafts 2, 3, 4.
8. Sync fault found by Selam in draft 4 → draft 5. Two word cuts found by Yonatan in draft 5 → draft 6.
9. Account check (plan step 5) was answered during round 3, after music had already been tried three times.
10. Not done: the two spikes, `RECOMMENDATION.md` (see 25).

**Carries forward.** Draft first, questions second, worked: she reacted to a real draft faster than she would have answered abstract questions, and round 1 gave title, ingredient list and structure in one message. Keep that order. But ask the three cheap facts before any draft: account type, which music mood, and "is there anything said in the clips you want heard". Never plan around a compressed export when the raw clips exist.

### 2. Steps that needed a person, the waits, and what could be batched
**This run.** Five waits, all on Selam through Yonatan: after draft 1 (round 1), after draft 2 (round 2), after draft 3 (round 3), after draft 4 (sync fault), after draft 5 (word cuts). I have no clock for the waits; don't know the minutes. The raw clips and the account type also came from a person.

**Carries forward.** One sitting before the first render can settle: title wording, the on-screen words (ingredients, in her spelling), music mood, opening preference ("how would you open it?"), and any uncertain word in the transcript. A second sitting is the draft. The last two waits should never reach her: they were defects a check would have caught (see 22, 24).

### 3. Shortest path from clips in a folder to a draft she can watch
**This run.** Not applicable as a path; it was found by trial.

**Carries forward.** About 15 minutes of machine time for 10 minutes of footage:
1. `ffprobe` each clip (size, rotation, length).
2. `video/work/venv/Scripts/python video/transcribe.py Videos/<clip>.mp4 --source <id> --out video/work/<video>/<id>.json` per clip (about 20 s per minute of audio).
3. One contact sheet per clip: `ffmpeg -i clip -vf "fps=1/6,scale=144:-2,tile=9x4" -frames:v 1 sheet.jpg`. Read transcript and sheets together.
4. One-frame-per-second sheets of only the candidate moments (`select='between(t,a,b)*not(mod(n,30))'`).
5. Write `edit.json`; `python video/render.py edit.json --out draft1.mp4 --draft` (about 40 s).
6. `python video/check_sync.py edit.json draft1.mp4`, then look at a sheet of the draft itself before she sees it.

## Transcription

### 4. Engine, model, speed, what failed first
**This run.** Works: faster-whisper 1.2.1 with `ivrit-ai/whisper-large-v3-turbo-ct2`, CPU, `compute_type="int8"`, in `video/work/venv` (Python 3.14, 288 MB; model 1.6 GB, downloaded once to the Hugging Face cache). 27 s for an 83 s clip, about 20 s per minute of audio. Failed first: ffmpeg's built-in `whisper` filter with the ivrit.ai ggml model. With `queue=25` it kept one phrase per 25 s window and split words mid-letter (`max_len`); with the silero voice-activity model it ran slower than real time (10 minutes for under 1 minute of audio) and was killed. Also failed: faster-whisper's own decoder (PyAV) on Python 3.14, `open() got an unexpected keyword argument 'metadata_errors'`; fixed by decoding with ffmpeg to 16 kHz float PCM and passing the array.

**Carries forward.** Use faster-whisper with the ivrit.ai ct2 model; decode audio with ffmpeg; pre-boost quiet speech with `highpass=f=100,dynaudnorm=f=200:g=11`; leave the voice-activity filter off (it dropped her quiet lines). Do not spend time on the ffmpeg whisper filter.

### 5. What it got wrong in her Hebrew, and a correction list
**This run.** Too little content speech to build a list: three lines. It got those words right. What it got wrong was not vocabulary: (a) a quiet "לא" came out as "לא", "ו" or nothing depending on where the audio started, which flips the meaning; (b) word times, which lump the pause after a word into that word (see 23); (c) on the music mix it invents words in the music-only stretches. The ingredient names never came from speech; she typed them.

**Carries forward.** Don't know yet which ingredient or brand words it mishears; not reached. Rule that does carry: any short negation or connective before a verb ("לא", "ו", "גם") with word probability under about 0.7 is a question for Selam, not a transcript line. Her spellings so far, to use verbatim: סלם · רפואת שורש, ילנג ילנג, ג'ל אלוורה, ג'ל פשתן, הידרוסול קמומיל, חמאת שיאה, שמן חוחובה, שמן רוזמרין, קוסגארד, ויטמין אי, Olive 1000, שמן אתרי עץ התה.

### 6. How the transcript was shown to her, and what would be faster
**This run.** It was not shown as a document. She saw her lines as captions in draft 1 and I asked one question about the uncertain word. She confirmed that word; the other two lines drew no correction and were never confirmed in so many words (A7 is only partly confirmed in the log).

**Carries forward.** Captions in a draft are the fastest review for her. Add one message with the lines as plain text and only the doubtful words marked, so her confirmation is explicit and logged.

## Choosing the cut

### 7. How segments were chosen, at what density, at what cost
**This run.** Three passes: one sheet per clip at a frame every 4–10 s (144 px thumbnails); one-per-second sheets of candidate windows (108–150 px); then single stills or 5-per-second strips only where a cut or a look mattered. Roughly 35 images in total across the trial, most of them sheets under 400 KB. Cuts on speech came from sound, not frames. Plan usage: don't know; I have no meter.

**Carries forward.** Coarse sheet → 1 fps on candidates → fine strip only at a disputed moment. Thumbnails of 110–150 px are enough to see what happens and where she looks; they are not enough to read bottle labels (crop at full resolution for that, and get the crop coordinates right before trusting it). After every render, look at a sheet of the render, not just the sources.

### 8. A good first three seconds in her footage
**This run.** My hook (hair result plus her first line) lost to her own: 1.2 s of the jar coming down beside her smiling face, then straight to the bowls, with the title naming the product and who it is for ("קרם פשתן ואלוורה לשיער מתולתל").

**Carries forward.** Open on the finished product in her hands with her face, for about a second, then go straight into the making. Title = what it is + who it is for, in her words, two lines, on screen for the first 3 s. Ask how she would open it before proposing one.

### 9. Lining up raw clips with the CapCut export
**This run.** Never done. The export's metadata named the three source clip ids (`draftInfo.videoMaterialId`), which confirmed the raw clips were the right ones. I matched her opening by eye: a strip of the export's first 2.4 s beside a strip of the raw clip.

**Carries forward.** Not needed when starting from raw clips. Her own edit is still worth one look, as a statement of taste (her opening, her order), not as a timeline.

## Rendering

### 10. What the edit file gained that the plan did not foresee; what to remove
**This run.** Unforeseen fields: `segments[].mute` (most of the footage keeps picture only), `segments[].speed` (a still shot slowed to give labels reading time), `labels` (on-screen words that are not speech, optionally placed with `at` and `size`), `look.lift` (lighter faces), `levels.voice_gain_db`, `closing` with `logo`, `music.start`. The transcript sits outside it, in `video/work/`.

**Carries forward.** Keep all of them; each came from a real note. Remove or rethink: `levels.voice_gain_db` should be measured from the clip, not typed (see 20); `closing.text` is dead weight when `logo` is true; `sources[].recorded_by` exists only for a test.

### 11. ffmpeg problems that cost time, and the fix for each
**This run / Carries forward** (the fixes are the same):
- **Picture sliding behind sound at each cut** (phone clips have uneven frame timing): force every piece to its exact length in both streams, `fps=30:start_time=0,tpad=stop_mode=clone:stop_duration=1,trim=duration=L,setpts=PTS-STARTPTS` and `apad=whole_dur=L,atrim=duration=L,asetpts=PTS-STARTPTS`.
- **Slowed piece short of sound** (the draft 4 fault): `apad=pad_dur=1` is not enough; pad to the whole length. See 22.
- **Windows drive colons in filter arguments** (`ass=`, `whisper=`): run ffmpeg with `cwd` set to a temp folder and use bare file names; pass the graph with `-/filter_complex graph.txt`.
- **`drawtext` crashes** here (no fontconfig file). Don't use it; use the `ass` filter.
- **Hebrew letter order and punctuation**: fine with libass as long as each line starts with U+202B; mixed lines like "מתחלב Olive 1000" come out right. Font by family name ("Frank Ruehl CLM") is found without `fontsdir`.
- **Rotation and HEVC**: no problem; ffmpeg auto-rotates, and scale-then-crop to 1080×1920 handles it.
- **Filter delay**: `afftdn` plus `alimiter` hold the voice back 0.03 s; cut it off again with `atrim=start=0.03`.
- **The test-lock hook** rejects any shell command that both writes a file and names a locked file or `.locked-tests`, including a `>` inside a commit message. Run tests in their own command; pass commit messages with `git commit -F`.

### 12. Caption settings that worked
**This run.** Frank Ruehl CLM bold, cream `#F4EBE2` with a 4.5 px espresso `#2E261F` outline, on a 1080×1920 canvas. Captions 74 px, bottom-centre, baseline 470 px from the bottom, side margins 110. Title 92 px, top, 330 px down, two lines, 3 s. Labels 50 px when placed above an object, up to four short lines. One phrase per caption, at most about 30 characters; on 0.1 s before the first word, off 0.3 s after the last.

**Carries forward.** Her taste: the serif brand face, cream on dark outline, calm phrase captions, no effects, labels next to the thing they name. TikTok's layout: keep text inside the middle 900×1400 or so; the 470 px bottom margin is a guess that nobody has yet checked in TikTok's preview (A9 not confirmed in the log). She never commented on caption size or position, which is weak evidence that they are fine.

### 13. The audio chain and the ducking
**This run.** Voice: `highpass=f=100, afftdn=nr=12:nf=-50:tn=1, volume=18dB, acompressor=threshold=-24dB:ratio=4:attack=10:release=200:makeup=6dB, alimiter=limit=0.7`. Her voice was recorded at about −36 LUFS, hence the 18 dB. A compressor held her two passages within 1 LU; `speechnorm` and `dynaudnorm` left them 3 LU apart. Music: `loudnorm=I=-20:TP=-3:LRA=11`, then `sidechaincompress=threshold=0.015:ratio=8:attack=60:release=900` keyed by the voice, then `amix normalize=0`. Then a 1.2 s fade out and two-pass `loudnorm=I=-14:TP=-2:LRA=7`. Measured result: −14.0 to −14.7 LUFS, range 2.6–3.8 LU, true peak −1.2 to −1.8 dBTP.

**Carries forward.** The chain and the two-pass levelling carry. Nobody has confirmed by ear that the voice is clear over the music (A11 not confirmed). The music level under voice is the first thing to ask her to listen for.

## Working with Selam

### 14. Her notes, and how each became an edit-file change
**This run.** The full table is in `log.md`, rounds 1–3. The pattern:
- A time and a reason ("0:07–0:09 remove, she looks away") → trim or drop one entry in `segments`.
- A word ("no serum", the title) → one string in `captions` or `title`.
- A preference between shots ("the bowls on the table, not her showing them") → replace segments, move `labels`.
- A feeling ("some light in the face", "gypsier", "a frequency that fits what she's doing") → one number (`look.lift`) or a new `music` entry.
Not done as asked: "music that could be more viral", because trending sounds exist only inside TikTok; I rendered a no-music version instead and put the choice to her.

**Carries forward.** Map her seconds to segments from the edit file's timeline before touching anything; her "second 16" was a look that had survived a trim one round earlier. When she names a moment she dislikes, find every other place the same thing happens (looking at the camera unsure, looking away) and remove those too.

### 15. What she cared about that nobody predicted
**This run.** Where she is looking in every shot (three notes across two rounds). Her own opening over a "better" hook. Ingredients as the content of the video. The objects shown plainly on the table rather than presented to the camera. Light on her face. Music described as a feeling, twice, never as a genre she accepted on first try.

**Carries forward.** Before the first draft, scan every kept shot for an uncertain or sideways look and cut around it. Assume she wants the ingredients on screen, in her words. Assume her taste beats reach rules.

## Music and TikTok

### 16. The account check, where the track came from, a repeatable way
**This run.** Her account is not a business account (Yonatan, round 3), so music may be baked in and TikTok's full sound library is also open to her. Tracks tried: "My Little Prince" (Mixkit) → "Lachaim" → "Cattails" (both Kevin MacLeod, incompetech.com, CC BY 4.0, credit required in the description). I could not read Mixkit's licence text from its page, and Pixabay refused automated access (HTTP 403). I chose every track from its written description, unheard. Whether "Cattails" is the final choice is not recorded in the log.

**Carries forward.** incompetech publishes a catalogue file, `https://incompetech.com/music/royalty-free/pieces.json` (title, feel, instruments, tempo, length, file name); files are at `.../mp3-royaltyfree/<filename>`. Filter it by her words, download three, and let her choose by ear: I cannot. Record track, composer, source, licence and the exact credit line in `edit.json` and `log.md`. Ask the account type first. If she wants a trending sound, render with `--no-music` and she adds it in the app.

## The spikes

### 17. The MCP server and the CapCut draft route
**This run.** Not reached. Neither spike was run (see 25).

**Carries forward.** Don't know.

## For the skill itself

### 18. Three things a fresh session would get wrong
**Carries forward.**
1. It would trust the speech model's word times for cuts and captions. They are off by up to a second around pauses. Use the sound itself (see 23).
2. It would check a render by looking at frames. Frames cannot show sound running ahead. Run `check_sync.py` and compare stream lengths before any draft goes out (see 22).
3. It would treat the talking in the clips as content and propose its own hook. Most of her speech is direction to the person filming; the video is carried by picture, labels and music, and she has her own opening.

**This run.** I got all three wrong once.

### 19. What Selam would type to start a video on her own laptop, and what would stop her
**This run.** Not reached; nothing was tried on her laptop.

**Carries forward.** In principle: put the clips in `Videos/`, open Claude Code in the repo, and say what the video is, the title, and the ingredients. What would stop her today: there is no single "start" command; setup needs ffmpeg, Python, a venv, a 1.6 GB model download, the Culmus Frank Ruehl font and the repo; the scripts and their messages are in English; and no step tells her to listen before posting. A hard stop for the workflow as a whole: the machine that edits cannot hear, so she or Yonatan must be the ears every time.

### 20. What is hard-coded to this video
**This run / Carries forward.**
- `tests/video.test.js` and `tests/video-captions.test.js`: the paths `video/trials/cream/...`, `video/out/cream/final.mp4`, `video/work/cream/transcript.json`.
- `edit.json` → `levels.voice_gain_db: 18`: right for one clip recorded at −36 LUFS. Should be measured per source.
- `render.py`: `VOICE_DELAY = 0.03` holds only for this exact filter chain; `LOGO_WIDTH, LOGO_BOTTOM` and the caption margins were set by eye on this footage; brand constants (font, colours, logo path) are deliberately there (plan D13).
- Label positions (`at`) are pixel positions of these two bowls.
- `transcribe.py`: the model name and the pre-boost are general; nothing video-specific.
- The energy-based timing of her lines was done by hand in throwaway scripts and is not in the repo at all. That is the biggest thing to lift into a tool.

### 21. What the trial cost in minutes, and the next bottleneck
**This run.** Selam's minutes: don't know; never recorded, the Minutes table in `log.md` is empty. Yonatan's: don't know. Mine and the planner's: don't know in minutes; the work spanned one evening and into the next day. Machine times I do have: transcription about 20 s per minute of audio; a 720p draft about 40 s; a 1080p render about 2 minutes; a sync check about 1 minute.

**Carries forward.** Log her minutes at the moment she gives notes; they cannot be reconstructed. The next bottleneck is not rendering or cutting. It is that sound faults reach her because the editor cannot hear, and each one costs a full round trip through Yonatan.

## Added by the planner

### 22. The sync fault fixed in `2c15568`
**This run.** Cause: in round 3 I slowed a 2.4 s shot to 6 s. Its picture was stretched, but its sound was only padded by 1 s (`apad=pad_dur=1`), giving 3.4 s. Everything after it, her voice and the music, ran about 2.5 s ahead of picture and captions. How it was noticed: Selam watched draft 4. I had looked at stills and at loudness, both of which were fine; the render's sound was 55.5 s against 58.0 s of picture and I never compared them. Two smaller faults were found while measuring: a 0.03 s filter delay on the voice, and captions timed from the speech model (one came up about a second early).

How `check_sync.py` catches it: it compares stream lengths with the edit file's total, then for every piece finds which source frame the render shows mid-piece, and for pieces with sound cross-correlates the render's waveform with the source's to get the offset. Draft 4 fails on the first line; draft 6 reads 0 frames and 0.00 s throughout. My first version of the check had its own bug (it asked for sound before the start of a clip and reported a false 0.33 s); a measuring tool needs a known-good and a known-bad case before it is believed.

**Carries forward.** Before any draft reaches her: (1) `ffprobe` picture and sound lengths against the edit total; (2) `check_sync.py`; (3) a contact sheet of the render; (4) the speech model re-hearing the mix, compared with the captions; (5) the locked tests. Then a person listens once. Any new render feature that changes a piece's length must be followed by a render that uses it and passes 1 and 2.

### 23. Finding a clean cut point in speech (`bfd47b4`, `1288a53`)
**This run.** Three wrong cuts: one that sliced "לא" (21.40 with a 0.04 s fade), one that began inside the previous word (21.18), one that dropped "שמש" (piece ended 8.4; the word ends 9.00). The speech model's times were the cause each time: it put "בשמש" at 7.52–8.78 and "לא" at 21.54–21.58. What worked was charting the source sound in 20 ms steps in two bands, voiced (200–3000 Hz) and hiss (above 3500 Hz). "שמש" showed as hiss, voiced, hiss, the last ending at 9.00. "בכלל לא" had no pause at all; the only mark was the voiced level dropping about 4 dB at 21.40 where the quiet "לא" begins.

**Carries forward.** The rule:
1. Use the speech model for which words, never for where they start and end.
2. Chart voiced and hiss energy in 20 ms steps for a second either side of the intended cut. Sibilants (ש, ס, צ) are invisible in the voiced band; a word can end in hiss well after the voice stops.
3. Cut in a dip of both bands, at least 0.04 s wide. A word is not finished until both are back at the floor.
4. If there is no dip (words run together), cut where the level steps, keep the fade at about 0.01 s, and flag it for a human ear.
5. Leave 0.05–0.1 s after the last sound of a line before the piece ends.
6. Keep each caption inside its piece (the A8 test rejects 0.02 s outside).
7. After rendering, have the speech model re-hear the passage; if the first or last word changes or vanishes, the cut is wrong.

### 24. Six drafts where the spec allowed three rounds
**This run.** Rounds of her notes were three, as allowed: drafts 2, 3 and 4. Draft 1 was the first proposal. Drafts 5 and 6 were my defects, not her taste: the sync fault, then the two word cuts. Within the three rounds, some notes were repeats I could have prevented: the "look at the camera" note came back in round 3 because I trimmed one shot and missed the same look at the start of the next; music changed in every round because I chose unheard and without asking what she wanted.

**Carries forward.** A checklist would have prevented drafts 5 and 6 entirely (the five checks in 22, the cut rule in 23) and at least two repeated notes: scan every kept shot for where she looks; ask for music mood, title, ingredients and opening before draft 1. It would not have prevented notes of pure taste (her opening, the bowls on the table), and those are what the rounds are for.

### 25. The spikes and RECOMMENDATION.md
**This run.** Neither spike was run and `video/RECOMMENDATION.md` does not exist. Why: both spikes install third-party software on this PC; I asked the user for a go-ahead three times and did not get one, and the work stayed on the video. The recommendation depends on the spikes for two of its methods, so I did not write it on desk research alone. Consequences: five locked tests still fail (A1, A2, A12, A17, A18); the spec's research half (R1–R4, R25) is not met; the `Result` section of `log.md` still says "Not posted yet"; her minutes, her confirmation of sound on her phone speaker (A11), the TikTok preview check (A9) and the watermark and look confirmations are not in the log.

**Carries forward.** The one method that was tried, ffmpeg driven directly with an edit file, did produce a video she is posting. What it needs before it is a way of working she can run: a hearing step that does not depend on the editor, the cut and sync checks built in, and a single start command.
