// Run as: node --test tests/video.test.js
// NOT `node --test tests/` — the apostrophe in the folder name breaks the directory form.
//
// Acceptance tests for intent/video-editing-trial (spec.md A1-A21), the parts a machine can check.
// A6, A7, A9, A11, A14, A15, A16 and A21 are confirmed by Selam or Yonatan and written in the log.
//
// What these tests read (the contract the build has to meet):
//   video/trials/cream/edit.json     the one description of the edit (tracked)
//     { sources:  [{ id, path, recorded_by, origin }],
//       segments: [{ source, start, end }],              kept pieces, in source-clip seconds
//       captions: [{ source, start, end, text }],        in source-clip seconds
//       music:    { path, track, source, licence } }
//   video/work/cream/transcript.json the transcript Selam corrected (ignored)
//     { lines: [{ source, start, end, text }] }          in source-clip seconds, in spoken order
//   video/out/cream/final.mp4        the finished video (ignored)
//   video/trials/cream/log.md        sections "## Assets", "## Tools and services", "## Seven-day figures"
//   video/RECOMMENDATION.md          sections "## Methods compared", "## Music", "## Time"
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const abs = (f) => path.join(root, f);

const EDIT = 'video/trials/cream/edit.json';
const TRANSCRIPT = 'video/work/cream/transcript.json';
const FINAL = 'video/out/cream/final.mp4';
const LOG = 'video/trials/cream/log.md';
const REC = 'video/RECOMMENDATION.md';

function read(f) {
  assert.ok(fs.existsSync(abs(f)), `${f} does not exist yet`);
  return fs.readFileSync(abs(f), 'utf8');
}
const readJson = (f) => JSON.parse(read(f));

function mustExist(f) {
  assert.ok(fs.existsSync(abs(f)), `${f} does not exist yet`);
  return abs(f);
}

/** Width, height and duration of a media file, with phone rotation ignored (callers compare sides). */
function probe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json',
    '-show_format', '-show_streams', file], { encoding: 'utf8' });
  const info = JSON.parse(out);
  const v = info.streams.find((s) => s.codec_type === 'video');
  return {
    width: v && v.width,
    height: v && v.height,
    sar: v && v.sample_aspect_ratio,
    hasAudio: info.streams.some((s) => s.codec_type === 'audio'),
    duration: Number(info.format.duration),
  };
}

/** The body of a "## heading" section, up to the next "## ". */
function section(md, heading, file) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  assert.ok(start >= 0, `${file} has no "## ${heading}" section`);
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end < 0) end = lines.length;
  return lines.slice(start + 1, end).join('\n');
}

/** The first pipe table in a block, as rows keyed by lower-cased header. */
function table(block, what) {
  const rows = block.split(/\r?\n/).filter((l) => l.trim().startsWith('|'))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()));
  assert.ok(rows.length >= 3, `${what} has no table with at least one row`);
  const header = rows[0].map((h) => h.toLowerCase());
  return rows.slice(2).map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] || ''])));
}

/** The value of a "Label: value" line in a block. */
function field(block, label, what) {
  const m = block.match(new RegExp(`^[-*\\s]*${label}:[ \\t]*(\\S.*)$`, 'mi'));
  assert.ok(m, `${what} has no "${label}:" line with a value`);
  return m[1].trim();
}

const VIDEO_AUDIO = /\.(mp4|mov|m4v|webm|mkv|avi|3gp|mts|mp3|m4a|wav|aac|ogg|opus|flac)$/i;
const IMAGE = /\.(png|jpe?g|webp|gif|bmp|heic|tiff?)$/i;

// --- the finished video ---

test('A3: the finished video is 1080x1920 with sound', () => {
  const p = probe(mustExist(FINAL));
  assert.strictEqual(`${p.width}x${p.height}`, '1080x1920');
  assert.ok(!p.sar || p.sar === '1:1', `pixels are not square (${p.sar})`);
  assert.ok(p.hasAudio, 'the finished video has no audio stream');
});

test('A3: the finished video was rendered from the current edit file', () => {
  const edit = fs.statSync(mustExist(EDIT)).mtimeMs;
  const final = fs.statSync(mustExist(FINAL)).mtimeMs;
  assert.ok(final >= edit, `${FINAL} is older than ${EDIT} — render again`);
});

test('A3, A4: every source is a full-quality original, not the WhatsApp copy or the 720p CapCut export', () => {
  const edit = readJson(EDIT);
  assert.ok(Array.isArray(edit.sources) && edit.sources.length > 0, 'the edit file lists no sources');
  for (const s of edit.sources) {
    const p = probe(mustExist(s.path));
    const short = Math.min(p.width, p.height);
    const long = Math.max(p.width, p.height);
    assert.ok(!(short === 478 && long === 850), `${s.path} is the 478x850 WhatsApp copy`);
    // The watermarked CapCut export is 720x1280; originals off her phone are 1080 or more.
    assert.ok(short >= 1080, `${s.path} is ${p.width}x${p.height} — not a full-quality original`);
  }
});

test('A5: the finished video runs 45 to 75 seconds', () => {
  const { duration } = probe(mustExist(FINAL));
  assert.ok(duration >= 45 && duration <= 75, `it runs ${duration.toFixed(1)} s`);
});

test('A10: loudness is near -14 LUFS, range under 10 LU, peaks do not clip', () => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', mustExist(FINAL),
    '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = r.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/);
  assert.ok(m, 'ffmpeg printed no loudness measurement');
  const l = JSON.parse(m[0]);
  const integrated = Number(l.input_i), range = Number(l.input_lra), peak = Number(l.input_tp);
  assert.ok(Math.abs(integrated + 14) <= 1, `integrated loudness is ${integrated} LUFS`);
  assert.ok(range < 10, `loudness range is ${range} LU`);
  assert.ok(peak <= -1, `true peak is ${peak} dBTP`);
});

// --- captions ---

const words = (text) => text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

function isSubsequence(needle, hay) {
  let i = 0;
  for (const w of hay) if (i < needle.length && w === needle[i]) i++;
  return i === needle.length;
}

test('A8: every caption sits within half a second of the words it shows', () => {
  const edit = readJson(EDIT);
  const { lines } = readJson(TRANSCRIPT);
  assert.ok(Array.isArray(edit.captions) && edit.captions.length > 0, 'the edit file has no captions');
  assert.ok(Array.isArray(lines) && lines.length > 0, 'the transcript has no lines');

  for (const c of edit.captions) {
    const label = `caption "${c.text}" (${c.source} ${c.start}-${c.end})`;
    assert.ok(c.end > c.start, `${label} has no length`);

    // It is on screen only if a kept segment of its clip contains it.
    assert.ok(edit.segments.some((s) => s.source === c.source && s.start <= c.start && c.end <= s.end),
      `${label} is not inside a kept segment`);

    // It starts with a transcript line and ends with the same or a later one, each within 0.5 s,
    // and shows only words Selam says in those lines, in her order and her spelling.
    const own = lines.filter((l) => l.source === c.source);
    const shown = words(c.text);
    assert.ok(shown.length > 0, `${label} has no words`);
    const ok = own.some((first, i) => Math.abs(first.start - c.start) <= 0.5 &&
      own.some((last, j) => j >= i && Math.abs(last.end - c.end) <= 0.5 &&
        isSubsequence(shown, words(own.slice(i, j + 1).map((l) => l.text).join(' ')))));
    assert.ok(ok, `${label} does not match the transcript within 0.5 s`);
  }
});

// --- assets ---

test('A13: every picture and voice is Selam\'s own recording, and every asset is logged with its origin', () => {
  const edit = readJson(EDIT);
  const ids = new Set();
  for (const s of edit.sources) {
    assert.ok(s.id && !ids.has(s.id), `source id "${s.id}" is missing or repeated`);
    ids.add(s.id);
    assert.strictEqual(s.recorded_by, 'Selam', `${s.path} is not marked as recorded by Selam`);
    assert.ok(s.origin && s.origin.trim(), `${s.path} has no origin`);
  }
  for (const part of [...edit.segments, ...edit.captions]) {
    assert.ok(ids.has(part.source), `"${part.source}" is not a listed source`);
  }
  assert.ok(edit.music && edit.music.path, 'the edit file names no music');

  // No other media file may be pulled into the edit: every media path is a source or the music.
  const allowed = new Set([...edit.sources.map((s) => s.path), edit.music.path]);
  (function walk(v) {
    if (typeof v === 'string') {
      if (VIDEO_AUDIO.test(v) || IMAGE.test(v)) assert.ok(allowed.has(v), `unlisted media in the edit file: ${v}`);
    } else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  })(edit);

  const assets = section(read(LOG), 'Assets', LOG);
  for (const s of edit.sources) {
    assert.ok(assets.includes(path.basename(s.path)), `${LOG} Assets does not list ${path.basename(s.path)}`);
  }
  assert.ok(assets.includes(edit.music.track), `${LOG} Assets does not list the music track`);
});

test('A20: no video, audio or frame from her footage is tracked or in the history', () => {
  const git = (...args) => execFileSync('git', ['-c', 'core.quotepath=off', ...args],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const tracked = git('ls-files').split('\n').filter(Boolean);
  const everCommitted = git('log', '--all', '--format=', '--name-only').split('\n').filter(Boolean);
  for (const f of new Set([...tracked, ...everCommitted])) {
    assert.ok(!VIDEO_AUDIO.test(f), `video or audio in the repository: ${f}`);
    if (/^(video|Videos|intent\/video-editing-trial)\//.test(f)) {
      assert.ok(!IMAGE.test(f), `image from the trial in the repository: ${f}`);
    }
  }
  // The folders that hold footage, drafts, frames and music can never be added by accident.
  for (const f of ['Videos/clip.mp4', 'video/out/cream/final.mp4', 'video/work/cream/sheet.jpg', 'video/music/track.mp3']) {
    const r = spawnSync('git', ['check-ignore', '-q', f], { cwd: root });
    assert.strictEqual(r.status, 0, `${f} is not ignored`);
  }
});

// --- the written recommendation ---

const CRITERIA = ['cost', 'footage stays local', 'no ai voice or imagery', 'hebrew captions',
  'no graphics card', 'selam alone'];

function methods() {
  return table(section(read(REC), 'Methods compared', REC), `${REC} Methods compared`);
}

test('A1: at least three methods, one through MCP and one not, each scored on every criterion', () => {
  const rows = methods();
  assert.ok(rows.length >= 3, `only ${rows.length} methods compared`);
  for (const r of rows) {
    assert.ok(r.method, 'a method has no name');
    assert.match(r['works through mcp'], /^(yes|no)\b/i, `"${r.method}" does not say whether it works through MCP`);
    for (const c of CRITERIA) assert.ok(r[c], `"${r.method}" has no score for "${c}"`);
  }
  assert.ok(rows.some((r) => /^yes\b/i.test(r['works through mcp'])), 'no method works through MCP');
  assert.ok(rows.some((r) => /^no\b/i.test(r['works through mcp'])), 'every method works through MCP');
  for (const r of rows.filter((x) => /^ruled out/i.test(x.verdict))) {
    assert.match(r.verdict, /^ruled out:\s*\S{3,}/i, `"${r.method}" is ruled out without naming the constraint it breaks`);
  }
});

test('A2: exactly one method is recommended and every other has a reason for losing', () => {
  const rows = methods();
  assert.strictEqual(rows.filter((r) => /^recommended\b/i.test(r.verdict)).length, 1,
    'there must be exactly one recommended method');
  for (const r of rows.filter((x) => !/^recommended\b/i.test(x.verdict))) {
    assert.match(r.verdict, /^(lost|ruled out):\s*\S{3,}/i, `"${r.method}" has no stated reason for losing`);
  }
});

test('A12: the music track, its source and its licence are named, free for business use', () => {
  const music = section(read(REC), 'Music', REC);
  const track = field(music, 'Track', `${REC} Music`);
  assert.match(field(music, 'Source', `${REC} Music`), /https?:\/\//, 'the music source has no link');
  field(music, 'Licence', `${REC} Music`);
  assert.match(field(music, 'Business use at no cost', `${REC} Music`), /^yes\b/i);
  // The track written down is the one in the video.
  const edit = readJson(EDIT);
  assert.strictEqual(track, edit.music.track);
  for (const k of ['source', 'licence']) assert.ok(edit.music[k], `the edit file's music has no ${k}`);
});

test('A17: Selam\'s minutes and Yonatan\'s minutes are stated separately, next to her usual few days', () => {
  const time = section(read(REC), 'Time', REC);
  assert.match(field(time, 'Selam', `${REC} Time`), /\d+\s*min/i);
  assert.match(field(time, 'Yonatan', `${REC} Time`), /\d+\s*min/i);
  assert.match(time, /few days/i, 'the comparison with her usual "few days" is missing');
});

// --- the trial log ---

test('A18: seven days after posting, views, likes, shares and saves are listed for this video and five earlier ones', () => {
  const block = section(read(LOG), 'Seven-day figures', LOG);
  const posted = Date.parse(field(block, 'Posted', `${LOG} Seven-day figures`));
  const recorded = Date.parse(field(block, 'Recorded', `${LOG} Seven-day figures`));
  assert.ok(!Number.isNaN(posted) && !Number.isNaN(recorded), 'Posted and Recorded must be dates (YYYY-MM-DD)');
  assert.ok(recorded - posted >= 7 * 86400e3, 'the figures were recorded less than seven days after posting');

  const rows = table(block, `${LOG} Seven-day figures`);
  assert.strictEqual(rows.filter((r) => /trial/i.test(r.video)).length, 1, 'exactly one row must be the trial video');
  assert.ok(rows.length >= 6, `figures for only ${rows.length} videos`);
  for (const r of rows) {
    for (const k of ['views', 'likes', 'shares', 'saves']) {
      assert.match(r[k], /^[\d,]+$/, `"${r.video}" has no ${k} figure`);
    }
  }
});

test('A19: no tool but Claude received footage, and none costs money beyond the Claude subscription', () => {
  const rows = table(section(read(LOG), 'Tools and services', LOG), `${LOG} Tools and services`);
  for (const r of rows) {
    const name = r['tool or service'];
    assert.ok(name, 'a tool has no name');
    assert.match(r['received footage'], /^(yes|no)\b/i, `"${name}" does not say whether it received footage`);
    assert.ok(r.cost, `"${name}" has no cost`);
    if (/claude/i.test(name)) continue;
    assert.match(r['received footage'], /^no\b/i, `"${name}" received footage`);
    assert.match(r.cost, /^free\b/i, `"${name}" costs money`);
  }
});
