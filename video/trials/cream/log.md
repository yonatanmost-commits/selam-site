# Trial log: the cream-making video

The running record of the trial in `intent/video-editing-trial`. Times are hands-on minutes.

## Minutes
| Date | Who | Minutes | Doing what |
|---|---|---|---|

## Confirmations
Things only a person can check (A3 watermark, A6, A7, A9, A11, A14), each with who looked and the date.

| Criterion | Who | Date | Result |
|---|---|---|---|
| The whole video, by watching and listening | Selam, relayed by Yonatan | 2026-10-12 | Accepts draft 6. The join between "בכלל" and "לא" is fine as it is. Not recorded separately: the check in TikTok's preview (A9) and on her phone speaker (A11). |
| A7 (transcript), in part | Selam, relayed by Yonatan | 2026-10-11 | Confirmed "לא שמתי סרום או שמן אחר כך". The other two lines were shown in draft 1 and drew no correction; not yet confirmed in so many words. |

## Rounds of notes
At most three rounds. Each note is done, or not done with the reason.

### Round 1, 2026-10-11 (on draft 1, relayed by Yonatan) → draft 2
| Note | Result |
|---|---|
| The uncertain word: she did not use serum | Done. The caption reads "לא שמתי סרום או שמן אחר כך", and the cut starts a little earlier so the "לא" is not clipped. |
| Title: "קרם פשתן ואלוורה לשיער מתולתל" | Done, her wording, on two lines. |
| The closing is good | Kept: "סלם · רפואת שורש" over the last three seconds. |
| Prefers her own edit's opening | Done. Opens as her CapCut cut does: the jar coming down beside her face (1.2 s), then straight to the bowls. The hair result and her three lines moved to the end. |
| More focus on the process and the ingredients | Done. The making is now 12 shots and 44 s (was 10 shots and 30 s), with her ingredient names on screen: oil phase, emulsifier, water phase, preservative and vitamin E, essential oils. |
| Less shaking the bottles | Done. Two short bottle shots remain (6.6 s together), each carrying a label. |
| Different music, something gypsier | Done as a proposal: "Lachaim" (klezmer band, Kevin MacLeod). Three more to choose from: "Duet Musette", "Miri's Magic Dance", "Tango de Manzana". Claude cannot hear them; the choice is hers. |

Open after round 1:
- The labels sit on the shots where the bowls and bottles are shown, but which bottle holds which ingredient cannot be read from the footage. The preservative and vitamin E share one label, and the two essential oils share another. If she wants each on its own bottle, she says which is which.
- Which bowl is the oil phase and which the water phase was read from the colour (yellow = oils). She should confirm.
- These tracks are CC BY 4.0: free for business use, but the credit must appear in the TikTok description.

### Round 2, 2026-10-11 (on draft 2, relayed by Yonatan) → draft 3
"Doing good."

| Note | Result |
|---|---|
| 0:07–0:09: remove, she looks away | Done. The shot of her standing at the bowls is gone, and the next shot now starts when she lifts the bowl. The Olive 1000 label moved onto the oil-phase shot, as a third line. |
| Around 0:19: she looks at the camera unsure, because the electricity was disconnected | Done. The blender shot ends before she looks up (2.1 s instead of 3.5 s); the next blending shot runs 2 s longer. |
| 0:42–0:44: she does not like that snippet | Done. The jar-to-camera shot is removed; the pour into the jar now cuts straight to the hair. |
| Some light in the face | Done. Dark and middle tones are raised across the whole video (look.lift 0.12); bright areas are left alone. |
| Maybe music that could be more viral | Not done as asked, with the reason: what is viral on TikTok is its own trending sounds, and those can only be added inside TikTok, not baked into a file. Draft 3 keeps "Lachaim"; a second file, draft3-no-music.mp4, has her voice and captions only, so a TikTok sound can be laid over it in the app. Which way to go is Selam's and Yonatan's decision, and it changes what the spec says about music (R13, R14). |

Draft 3 runs 60 s. One round of notes is left.

### Round 3, 2026-10-11 (on draft 3, relayed by Yonatan) → draft 4
| Note | Result |
|---|---|
| Second 16 is the same look to the camera she wanted out | Done. The blending shot now starts 0.7 s later, after she has looked down, and runs 0.7 s longer at its end. |
| Use the footage of the bowls on the table showing their contents, not her holding them up (the water and oil phases were labelled correctly) | Done. Both holding-up shots are gone. In their place is the opening of clip 61697: the two bowls alone on the table, before she walks in. It is 2.4 s of footage slowed to 6 s so the ingredients can be read; nothing moves in it but leaves. Each ingredient list sits above its own bowl. |
| Add her logo at the end | Done. The horizontal logo Yonatan pointed to (name, tagline and hand mark) fades in over the last three seconds in place of the text line, recoloured to the caption colour so it reads over footage. |
| Music with a frequency that fits what she is doing | Done as a proposal: "Cattails" (Kevin MacLeod): acoustic guitar and banjo with accordion, described by its composer as calming and relaxed. Also downloaded: "Sardana" (solo guitar). Claude cannot hear them; the choice is hers. |

Draft 4 runs 58 s. The three rounds are used.

Open after round 3:
- With the music playing, a speech model re-hearing the finished video catches "שמתי סרום" but drops the short "לא" before it. The caption carries it, but Selam should listen for it on her phone speaker (A11).
- The logo is a picture that is not her footage. The spec says every picture is her real footage (R15); the question is with the planner.

### Fault found by Selam in draft 4: captions, sound and picture out of sync (2026-10-11) → draft 5
Not a round of notes; a defect in the render. Three causes, all fixed and now measured by `video/check_sync.py`:
- The slowed table shot had 6 s of picture but only 3.4 s of sound, so her voice and the music ran 2.5 s ahead of the picture and captions from there on. Every piece's sound is now padded to its full length. Picture and sound are both 57.9 s.
- The voice clean-up delayed her voice by 0.03 s. That delay is now cut off again. Measured against the source clips: picture 0 frames off in all 13 pieces, sound 0.00 s off in both spoken passages.
- Caption times came from the speech model, which lumps pauses into words: "והשיער התייבש לי בשמש" came up about a second before she says it, and "זה המרקם של הקרם" stayed 0.85 s after. Her lines are now timed from the sound energy of the source clip in 20 ms steps; each caption appears 0.1 s before the first word and stays 0.3 s after the last.
- The cut into "לא שמתי סרום" was at 21.40 s, inside a syllable. It is now at 21.18 s, in the pause before it.

Yonatan on draft 5 (2026-10-12): the cut before "לא" now began in the end of the word before it, and the word "שמש" was cut off. Both fixed in draft 6, from a chart of the voiced sound and the hiss in 20 ms steps:
- "בשמש": she says "שמש" after a pause, ending at 9.00 s (sh at 8.40, vowel 8.56–8.84, final sh 8.88–9.00). The piece ended at 8.4; it now ends at 9.08.
- "לא שמתי": "בכלל" runs straight into a quiet "לא" with no pause; the level drops at 21.40 s where "לא" begins. The piece now starts at 21.39, and the fade at every cut is 0.012 s instead of 0.04 s, which had been swallowing half of that short word.

Still true after the fix: the "לא" in that line is very faint in her recording. The speech model hears "שמתי סרום", "ושמתי סרום" or "לא שמתי סרום" depending on where the clip starts, with low confidence on that word every time. A viewer who does not read the caption may hear the opposite of what she means. Hers to decide: keep it with the caption, drop the line, or say it again.

### TikTok account and music (plan step 5), 2026-10-11
Yonatan: her account is not a business account. A personal account can post a video with music already in it, and can also use TikTok's whole sound library, so either route is open.

## Assets
| Asset | Kind | Origin |
|---|---|---|
| 61697.mp4 | picture (melting, combining, blending); its sound is muted | raw clip from Selam's phone gallery, 1080×1920, received 2026-10-11 |
| 61698.mp4 | picture (oils, pH strip, pouring into the jar); its sound is muted | raw clip from Selam's phone gallery, 1080×1920, received 2026-10-11 |
| 62056.mp4 | picture and Selam's voice (hair, to camera) | raw clip from Selam's phone gallery, 1080×1920, received 2026-10-11 |
| Cattails (Kevin MacLeod) | music, proposal until Selam confirms | https://incompetech.com/music/royalty-free/music.html, CC BY 4.0, credit required |
| receipt-logo-full.png | her logo, over the last three seconds | Selam's own brand logo, images/ folder on this PC |
| Frank Ruehl CLM | caption font | Culmus project font already installed on this PC |

Not used in the edit: 62076.mp4 (her 720×1280 CapCut export, with logo) and the 478×850 WhatsApp copy.
Other music candidates downloaded for her to hear, all Kevin MacLeod, same source and licence: Sardana, Lachaim, Duet Musette, Miri's Magic Dance, Tango de Manzana.
Round-0 candidates she turned down as not her style (Mixkit): My Little Prince, Beautiful Dream, Chillax, A Baby Story.

## Tools and services
| Tool or service | Received footage | Cost | Used for |
|---|---|---|---|
| Claude Code | yes (small contact sheets and stills, transcript) | existing subscription | choosing cuts, writing the edit file, checking frames |
| ffmpeg 8.1.1 | no (runs on this PC) | free | cutting, captions, sound, rendering |
| faster-whisper 1.2.1 | no (runs on this PC) | free (MIT) | Hebrew transcript with word timing |
| ivrit.ai whisper-large-v3-turbo | no (model downloaded once, runs on this PC) | free (Apache-2.0) | the Hebrew speech model |
| Hugging Face | no (model download only) | free | hosting the model file |
| Mixkit | no (music download only) | free | first music candidates, not used |
| incompetech.com | no (music download only) | free (CC BY 4.0, credit required) | music candidates |

Tried and dropped: ffmpeg's built-in whisper filter with the ivrit.ai ggml model. It kept one phrase per window and split words mid-letter; with a voice-activity model it ran slower than real time on this CPU.

## What the footage turned out to be
- About 10 minutes of raw footage in three clips. Nearly all the talking is Selam and the person filming directing each other; none of it is content.
- Selam says three things to camera, all in 62056: "ככה השיער נראה אחרי חפיפה, שמתי את הקרם והשיער התייבש לי בשמש", "לא שמתי סרום או שמן אחר כך" and "זה המרקם של הקרם".
- Her voice is recorded very quietly (about −36 LUFS) outdoors; she says so herself in the clip.
- One word was uncertain: the speech model heard "לא שמתי סרום" in one pass and "ושמתי סרום" in another, which mean opposite things. Selam settled it in round 1: no serum.

## Drafts
| Draft | Date | What it is |
|---|---|---|
| draft1.mp4 | 2026-10-11 | 55 s, cut from the three originals. Hair result and her first line as the hook, the making in ten short silent shots under music, then her two lines about serum and texture, closing on the hair. Title and closing line were proposals. Selam's notes on it are round 1. |
| draft2.mp4 | 2026-10-11 | 64 s, after round 1. Her opening, her title, the making with ingredient labels, the hair and her lines at the end, klezmer-style music. |
| draft3.mp4 | 2026-10-11 | 60 s, after round 2. Three snippets removed, faces lightened. draft3-no-music.mp4 is the same cut without music. |
| draft4.mp4 | 2026-10-11 | 58 s, after round 3. Bowls on the table with a label above each, logo in the closing, calmer music. final.mp4 is the same cut at 1080×1920. |
| draft5.mp4 | 2026-10-11 | 58 s. Draft 4's cut with the sync fault fixed and captions re-timed to her voice. final.mp4 is the same at 1080×1920. |
| draft6.mp4 | 2026-10-12 | 58 s. Draft 5 with the two word cuts corrected. final.mp4 is the same at 1080×1920. |

## Result
Accepted. On 2026-10-12 Yonatan relayed that Selam accepts draft 6 (final.mp4 is the same cut at 1080×1920).
She heard the "בכלל לא" join, where the two words run together, and said it is fine as it is.
The planner relayed the same day that she is posting it that day. The posting itself, its date, and the
seven-day figures are not recorded here yet.
