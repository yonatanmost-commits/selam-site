# Trial log: the cream-making video

The running record of the trial in `intent/video-editing-trial`. Times are hands-on minutes.

## Minutes
| Date | Who | Minutes | Doing what |
|---|---|---|---|

## Confirmations
Things only a person can check (A3 watermark, A6, A7, A9, A11, A14), each with who looked and the date.

| Criterion | Who | Date | Result |
|---|---|---|---|
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

## Assets
| Asset | Kind | Origin |
|---|---|---|
| 61697.mp4 | picture (melting, combining, blending); its sound is muted | raw clip from Selam's phone gallery, 1080×1920, received 2026-10-11 |
| 61698.mp4 | picture (oils, pH strip, pouring into the jar); its sound is muted | raw clip from Selam's phone gallery, 1080×1920, received 2026-10-11 |
| 62056.mp4 | picture and Selam's voice (hair, to camera) | raw clip from Selam's phone gallery, 1080×1920, received 2026-10-11 |
| Lachaim (Kevin MacLeod) | music, proposal until Selam chooses | https://incompetech.com/music/royalty-free/music.html, CC BY 4.0, credit required |
| Frank Ruehl CLM | caption font | Culmus project font already installed on this PC |

Not used in the edit: 62076.mp4 (her 720×1280 CapCut export, with logo) and the 478×850 WhatsApp copy.
Other music candidates downloaded for her to hear, all Kevin MacLeod, same source and licence: Duet Musette, Miri's Magic Dance, Tango de Manzana.
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

## Result
Not posted yet.
