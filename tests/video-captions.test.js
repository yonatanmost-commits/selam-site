// Run as: node --test tests/video-captions.test.js
// A7 (R9), the part a machine can check: nothing Selam says in the finished video goes without a caption.
// Reads the same files as tests/video.test.js (see its header for their shapes).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
function readJson(f) {
  assert.ok(fs.existsSync(path.join(root, f)), `${f} does not exist yet`);
  return JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
}

const overlaps = (a, b) => a.source === b.source && a.start < b.end && b.start < a.end;

test('A7: every transcript line heard in a kept segment has a caption', () => {
  const edit = readJson('video/trials/cream/edit.json');
  const { lines } = readJson('video/work/cream/transcript.json');
  // A muted segment keeps its picture only, so talk in it is not in the finished video.
  const audible = edit.segments.filter((s) => !s.mute);
  const heard = lines.filter((l) => audible.some((s) => overlaps(l, s)));
  assert.ok(heard.length > 0, 'no transcript line falls inside a kept segment with sound');
  for (const l of heard) {
    assert.ok(edit.captions.some((c) => overlaps(c, l)),
      `no caption for "${l.text}" (${l.source} ${l.start}-${l.end})`);
  }
});
