# Spec: Video editing trial for Selam's TikTok
From: intent/video-editing-trial/intent.md v1.

## Behaviour

### The research
- R1. The research compares at least three distinct ways Claude Code can be used to edit video, including at least one that works through MCP and at least one that does not.
- R2. Each method is judged against the same criteria: cost, whether footage leaves the machine, whether it avoids AI-generated voice and imagery, Hebrew caption quality, whether it runs on a Windows laptop with no dedicated graphics card, and whether Selam could run it without Yonatan.
- R3. A method that breaks a constraint from the intent is still listed, marked as ruled out, with the constraint it breaks.
- R4. The research ends in one recommended way of working, with the reasons the others lost.

### The trial video
- R5. The trial is cut from full-quality originals taken off Selam's phone, not from the WhatsApp copy.
- R6. The finished video is vertical 9:16 at 1080×1920, and carries no editing-app watermark.
- R7. The finished video runs between 45 and 75 seconds.
- R8. The first three seconds carry a hook: an on-screen Hebrew title and a shot that shows what the video is about.
- R9. Everything Selam says in the finished video appears as Hebrew captions, timed to her speech.
- R10. Hebrew text renders right-to-left with correct letter order, and stays inside the area TikTok's own buttons and caption do not cover.
- R11. Caption and title wording uses Selam's own words and spellings. Nothing is put in her mouth.
- R12. Her voice is levelled so that quiet and loud passages are both comfortable at one phone volume.
- R13. Music runs under the voice throughout, quiet enough that every word stays clear, and lifts in passages with no speech.
- R14. The music comes from a free source whose licence allows this use, and the track name, source and licence are written down.
- R15. Every picture and every voice in the finished video is Selam's real footage and real voice.
- R16. The look stays inside her brand: professional and slow-craft. No meme effects, emoji bursts or clickbait text, even where they would add reach.

### Working with Selam
- R17. Selam directs in plain words and sees a draft. She is never asked to operate the editing itself during the trial.
- R18. She gets up to three rounds of notes. Each round returns a new draft that addresses every note or says why it could not.
- R19. The trial passes when Selam posts the video on TikTok. If she would not post it after three rounds, the trial is reported as not good enough, with the reasons.
- R20. Selam's hands-on minutes and Yonatan's setup and operating minutes are recorded separately for the whole trial.
- R21. Seven days after posting, the video's views, likes, shares and saves are recorded next to the same figures for her five previous videos.

### Limits
- R22. No footage, frame or audio from her videos is sent to any service other than Claude.
- R23. No footage, frame or audio is committed to the repository.
- R24. Nothing used in the trial adds a new paid subscription or a per-video charge.
- R25. The written recommendation states what Selam would need on her own Windows laptop to run the recommended method, and what she would do, step by step, for her next video.

## Acceptance criteria
- A1 (R1, R2, R3). Given the written recommendation, when a reader counts the methods, then there are at least three, at least one MCP-based and one not, each scored on every criterion in R2, and every ruled-out method names the constraint it breaks.
- A2 (R4). Given the written recommendation, when a reader looks for the verdict, then exactly one method is recommended and each other method has a stated reason for losing.
- A3 (R5, R6). Given the finished video file, when its properties are inspected, then it is 1080×1920, and no editing-app watermark is visible in any frame.
- A4 (R5). Given the source files used for the edit, when their properties are inspected, then none is the 478×850 WhatsApp copy.
- A5 (R7). Given the finished video file, when its duration is read, then it is at least 45 and at most 75 seconds.
- A6 (R8). Given the finished video, when the first three seconds are watched muted, then a Hebrew title is on screen and the subject of the video is visible.
- A7 (R9, R11). Given the finished video and a transcript Selam has confirmed, when captions are compared with the transcript, then every spoken sentence has a caption, and Selam finds no word she did not say and no spelling she rejects.
- A8 (R9). Given any caption, when its timing is compared with the speech, then it appears and disappears within half a second of the words it shows.
- A9 (R10). Given frames taken at every caption and title, when viewed on a phone inside TikTok's preview, then Hebrew reads correctly right-to-left and no text is hidden by TikTok's buttons, username or description.
- A10 (R12). Given the finished video's audio, when its loudness is measured, then overall loudness is close to −14 LUFS, the loudness range is under 10 LU (the current cut measures about 24), and peaks do not clip.
- A11 (R13). Given the finished video, when Selam listens on her phone speaker, then she can follow every word with the music playing.
- A12 (R14). Given the written recommendation, when a reader looks for the music, then the track, its source and its licence are named, and the licence permits use in a business's social video at no cost.
- A13 (R15). Given the list of every asset in the edit, when each is traced to its origin, then every picture and voice comes from Selam's own recordings.
- A14 (R16). Given the finished video, when Selam watches it, then she confirms it looks like her brand and names nothing she finds childish or gimmicky.
- A15 (R17, R18). Given each round of Selam's notes, when the next draft is delivered, then each note is listed as done or as not done with a reason, and there are at most three rounds.
- A16 (R19). Given the end of the trial, when its result is reported, then it says either that she posted the video, with the date, or that she would not post it, with her reasons.
- A17 (R20). Given the written recommendation, when a reader looks for the cost in time, then Selam's minutes and Yonatan's minutes are stated separately, next to her usual "few days".
- A18 (R21). Given seven days since posting, when the figures are recorded, then views, likes, shares and saves are listed for this video and for her five previous videos.
- A19 (R22, R24). Given the list of every tool and service used, when each is checked, then none received footage except Claude, and none costs money beyond the Claude subscription.
- A20 (R23). Given the repository's history and tracked files after the trial, when searched for video, audio and frame images from her footage, then none is found.
- A21 (R25). Given the written recommendation, when Yonatan follows its setup list for a Windows laptop with no dedicated graphics card, then nothing on the list is missing or unavailable for that kind of machine, and the steps for the next video are written so Selam can follow them.

## Out of scope
- Selam actually running the method on her own laptop. This trial runs on Yonatan's PC; the recommendation only says what her laptop would need.
- Editing a second video, or building a reusable tool for all future videos.
- Posting, scheduling, hashtags, description text and choice of posting time. Selam does these.
- A numeric views target. Reach is measured after, not required to pass.
- Production, the R&D database, business management, and the choice of account or plan for Selam.
- Any change to the live website.

## Concerns
- "Selam posts it" is the pass test, and the true originals are not here yet. The second file received, `Videos/62076.mp4`, is the CapCut export itself: 720×1280, the same 2:57 cut, with the CapCut logo burned into the top-left corner. It is sharper than the WhatsApp copy but meets neither R5 nor R6.
- That export was assembled from three source clips. Those three clips, straight from her phone's gallery, are what R5 needs. Failing that, a 1080p re-export from CapCut with the watermark switched off is the minimum.
- TikTok limits which music business accounts may use. A free-licensed track that is fine legally may still be muted or restricted by TikTok. This needs checking before a track is chosen, and may reopen the decision to add music inside TikTok instead.
- The video shows a cream being made and used on hair and skin. On-screen claims about what it does to the body can count as cosmetic or health claims. R11 keeps captions to what she actually says; a hook title that promises a result should be her call, made knowingly.
- "Free", "footage stays local" and "Selam can run it alone" may not all be satisfiable by one method. If they are not, the recommendation must say which one gives, and that decision is yours.
- A Claude plan has usage limits. Looking at frames across a whole video uses a lot of it. The recommendation should say roughly how much of a plan one video consumes.
- Her face is in every frame sent to Claude. That was accepted in the intent; it is restated here so it is a decision, not a side effect.
- This repository is public, so this spec and the written recommendation become public when pushed.

## Open questions
- Do the three raw clips behind the CapCut export still exist on her phone? Selam can answer; it decides how much re-cutting is possible.
- If they do not, is a 720×1280 result with the logo cropped or covered acceptable for this one trial? Yonatan and Selam decide; it would relax R5 and R6.
- How will the originals be moved at full quality (cable or Drive)? Yonatan decides.
- What can her Windows laptop do (age, memory, free disk)? Yonatan can look it up on the machine.
- Does her TikTok account type restrict music to TikTok's commercial library? Selam's account settings answer it; the research confirms the rule.
- Who writes the hook title: Selam, or a proposal she approves? Selam decides on the first draft.
- Answered from the intent: length is 45 to 75 seconds; "viral" is built for and measured after, not a pass condition; her brand wins over reach; her time and Yonatan's are both measured.
