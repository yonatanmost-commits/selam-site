# Plan: Video editing trial for Selam's TikTok
From: intent/video-editing-trial/spec.md v1.

## Design
- D1. Trial method: Claude Code drives ffmpeg directly, with a local Hebrew speech model for the transcript. Chosen over a CapCut draft written by Claude (undocumented format that CapCut can break; export stays manual) and over Remotion (heaviest setup, hardest for Selam to run alone) because it is free, keeps footage on the machine, needs nothing beyond what this PC already has, and runs without a graphics card.
- D2. Research depth: one method edits the whole video; an ffmpeg MCP server and the CapCut draft route each get a time-boxed spike of 45 minutes on a 20-second piece. Chosen over desk research only (weak evidence on the untried methods) and a full bake-off (several times the work, several drafts for Selam to judge).
- D3. Methods compared in the recommendation: ffmpeg direct, ffmpeg behind an MCP server, CapCut draft, Remotion, DaVinci Resolve through MCP, and cloud AI editors. The last is listed as ruled out by "footage stays local" and "free only".
- D4. Home: a tracked `video/` folder in this repo. Scripts, the edit file, the trial log and the recommendation are committed; footage, drafts, frames and music stay ignored. Chosen over an ignored folder like `ops/` (no history, no backup) and a separate private repo (splits the work from the repo being expanded).
- D5. One edit file per video, in JSON, is the only description of an edit: source files, kept segments, captions, title, music and levels. Chosen over running commands by hand per draft because three rounds of notes each become a small change and a re-render, and the file records how the video was made.
- D6. Captions and segments are stored against source-clip time, not finished-video time. Trimming a segment then moves its captions with it, and switching from the 720p export to the raw clips changes only the source timings.
- D7. One render module with one entry point: edit file in, finished video out. It hides the ffmpeg filter graph, caption styling and placement, scaling to 1080×1920, loudness levelling and music ducking. Nothing outside it knows ffmpeg arguments.
- D8. One transcribe module: audio in, timed Hebrew transcript out. It hides which speech engine and model are used. First choice is ffmpeg's built-in transcription filter with an ivrit.ai model, since it adds no install; the fallback is faster-whisper with the ivrit.ai model.
- D9. Caption style: calm phrase captions, one short phrase at a time, in the Frank Ruehl family already on this PC, rendered by ffmpeg's subtitle renderer. Chosen over word-by-word highlighting (closer to gimmicky, needs timing Hebrew models do not reliably give).
- D10. Footage sequence: the first draft is cut from `Videos/62076.mp4` (720p, CapCut logo visible, marked as a draft) so Selam can give notes at once. The final is re-rendered from the three raw clips when they arrive.
- D11. Acceptance tests follow the existing pattern in `tests/cart.test.js` and `tests/seo.test.js`: Node's built-in test runner, one file, run by file path. No alternative worth weighing.
- D12. Frames go to Claude as small contact sheets and single stills, not as full video, to keep plan usage low and measurable.

## Files that change
- `.gitignore` (changed): already ignores `Videos/`; adds `video/out/`, `video/work/` and `video/music/`. The pending `ops/` line is committed with it.
- `video/render.py` (new): the render module of D7.
- `video/transcribe.py` (new): the transcribe module of D8.
- `video/trials/cream/edit.json` (new): the edit file for the trial video.
- `video/trials/cream/log.md` (new): minutes for Selam and for Yonatan, each round of notes with done or not done, every tool and service used, every asset and its origin, the music track with source and licence, the posting date, and the seven-day figures.
- `video/RECOMMENDATION.md` (new): the method comparison, the verdict, the laptop setup list, and the step-by-step for Selam's next video.
- `tests/video.test.js` (new): acceptance tests for the criteria a machine can check.
- `video/out/`, `video/work/`, `video/music/` (new, ignored): rendered drafts, transcripts and contact sheets, and downloaded music.

## Order of work
1. Acceptance tests in `tests/video.test.js` for A3, A4, A5, A8, A10, A13 and A20, plus the parts of A1, A2, A12, A17, A18 and A19 that can be read from the recommendation and the log. Run them, confirm each fails because the output does not exist yet, lock them, and commit them with `.gitignore`.
2. Transcribe `Videos/62076.mp4` locally. Selam corrects the transcript; her corrected text is the reference for A7. Her minutes are logged from here on.
3. Selam says in plain words what she wants from the video. Claude views contact sheets and the transcript and proposes the kept segments, the hook shot and the title wording options, in her words.
4. Write the render module and the first edit file. Render draft 1 at 720p from the CapCut export, with captions, levelled voice and no music yet.
5. Check her TikTok account type and what TikTok allows for music baked into an upload. If it is blocked, stop and bring the decision back to Yonatan before choosing a track.
6. Offer Selam three candidate tracks from a free source whose licence allows business use with no fee. Record her choice, the source and the licence in the log.
7. Rounds of notes, at most three. Each note is logged as done or not done with a reason, and each round ends in a new draft.
8. When the three raw clips arrive: line each one up against the export by its audio, rewrite the source timings in the edit file, and render the final at 1080×1920 with no watermark.
9. Spikes, 45 minutes each, on a 20-second piece: an ffmpeg MCP server, and a CapCut draft written by Claude and opened in CapCut on this PC. Read each tool's source before installing it. Log what worked, what failed and how long it took.
10. Write `video/RECOMMENDATION.md`, including how much of a Claude plan one video consumed and what Selam's laptop needs.
11. Selam checks the final in TikTok's own preview on her phone and on her phone speaker, then posts it or says why not. Log the result and the date.
12. Seven days after posting, record views, likes, shares and saves for this video and her five previous ones. Add `Shipped:` to this plan.

## Risks
- Riskiest step: step 8. The draft is cut on the export's timeline and the final comes from different files. If the export used speed changes or the raw clips are gone, the timings cannot simply be carried over. Guard: D6 keeps all timings in one place; the export's metadata shows no slow motion; if the raw clips do not exist, the open question in the spec about a 720p final goes back to Yonatan.
- Hebrew transcription on a processor with no graphics card may be slow or inaccurate, and faster-whisper may not install on Python 3.14. Guard: two engines behind one module (D8), and Selam corrects the transcript before any caption is rendered.
- Hebrew captions may render with wrong letter order, misplaced punctuation or a missing font. Guard: render a five-second caption test before the first full draft and look at the frames.
- No official TikTok safe-zone figures exist. Guard: keep text inside a conservative centre area of about 900×1400, and verify in TikTok's preview in step 11.
- The sources on TikTok's music rules are blogs, not TikTok policy. Guard: step 5 checks her account before a track is chosen.
- The spikes run third-party code, and CapCut desktop can sync projects to its cloud. Guard: read the source first, run in an isolated environment, stay signed out of CapCut, and use only the 20-second piece.
- A title that promises what the cream does can count as a cosmetic claim. Guard: title options use her own words, and the choice is hers, made knowingly.
- Rendered drafts or frames could be committed by accident to a public repo. Guard: the ignore rules are committed in step 1, and A20 is an automated test.
- Not done on purpose: no reusable tool for all future videos, no upload automation, no word-by-word captions, no upscaling of the 720p draft into a final, and no cloud editor.

## Proof
- `node --test tests/video.test.js` covers A3, A4, A5, A8, A10, A13 and A20 against the final render and the edit file.
- The same test file checks that `video/RECOMMENDATION.md` and `video/trials/cream/log.md` contain what A1, A2, A12, A17, A18 and A19 require: at least three methods with one MCP and one not, every criterion scored, one verdict, the music licence, both sets of minutes, the seven-day figures, and the list of tools.
- A6: a still from the first three seconds, shown to Yonatan and Selam.
- A7, A11, A14: Selam confirms the transcript, the audibility on her phone speaker, and the look. Each confirmation is written in the log with the date.
- A9: stills at every caption and the title, checked by Claude for letter order, then by Selam in TikTok's preview on her phone.
- A15, A16: the log shows each round's notes with done or not done, and the final result with its date or her reasons.
- A21: Yonatan reads the laptop setup list against a Windows laptop with no graphics card and confirms nothing is missing.
