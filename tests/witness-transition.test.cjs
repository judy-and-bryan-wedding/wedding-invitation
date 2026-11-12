const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const script=fs.readFileSync('assets/js/script.js','utf8');
const style=fs.readFileSync('assets/css/style.css','utf8');
const witness=fs.readFileSync('assets/animations/witness-reservation-ticket.html','utf8');

test('witness iframe cannot show its own scrollbar',()=>{
  assert.match(script,/setAttribute\("scrolling", "no"\)/);
  assert.match(witness,/html \{[^}]*overflow: hidden/);
  assert.match(witness,/body \{[^}]*overflow: hidden/);
});

test('witness iframe enters without changing its position',()=>{
  assert.match(style,/\.witness-ticket-frame \{[\s\S]*?transition: opacity \.65s ease/);
  assert.match(style,/\.witness-ticket-frame\.is-visible \{[\s\S]*?opacity: 1/);
  assert.match(script,/requestAnimationFrame\(\(\) => \{[\s\S]*?classList\.add\("is-visible"\)/);
});

test('hologram is revealed by chipping without moving or fading the ticket',()=>{
  assert.match(witness,/const HIDDEN = 'inset\(0 0 100% 0\)'/);
  assert.match(witness,/setClip\(clip \? `path\('\$\{clip\}'\)` : HIDDEN\)/);
  assert.doesNotMatch(witness,/transition: opacity 1\.35s/);
  assert.doesNotMatch(style,/\.witness-ticket-frame \{[\s\S]*?transform:/);
  assert.match(witness,/\.rsvp\.witness \.pane\.witness \{[\s\S]*?transition: opacity \.65s ease \.12s/);
});

test('chipping returns without hover movement or a witness highlight box',()=>{
  assert.match(witness,/paint\(on \? u \* total : \(1 - u\) \* SPAN, on\)/);
  assert.doesNotMatch(witness,/t\.addEventListener\('pointermove'/);
  assert.match(witness,/\.ticket\.on,[\s\S]*?animation: none !important;[\s\S]*?filter: none !important/);
  assert.match(witness,/\.rsvp\.witness \{ border-color: var\(--card-line\); box-shadow: none; \}/);
  assert.doesNotMatch(witness,/querySelector\('h2'\)\.focus/);
  assert.match(witness,/\.ticket\.accepted \.rim \{ opacity: 0 !important/);
});

test('only the RSVP panes fade and the hologram keeps strong color',()=>{
  assert.match(witness,/\.bg \{[^}]*saturate\(1\.75\) contrast\(1\.08\)/);
  assert.match(witness,/rgba\(253,251,245,\.62\)/);
  assert.match(witness,/\.glint \{[^}]*opacity: \.72/);
  assert.doesNotMatch(witness,/\.holo \{[^}]*transition: opacity/);
});
