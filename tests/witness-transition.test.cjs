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

test('hologram crossfades without moving or scaling the ticket',()=>{
  assert.match(witness,/\.holo \{[\s\S]*?transition: opacity 1\.35s/);
  assert.match(witness,/\.ticket\.on \.holo \{ opacity: 1; \}/);
  assert.doesNotMatch(witness,/maxRadius \* \(on \? smooth/);
  assert.doesNotMatch(style,/\.witness-ticket-frame \{[\s\S]*?transform:/);
  assert.match(witness,/\.pane\.witness \{[\s\S]*?transform: none !important/);
});

test('chipping returns without hover movement or a witness highlight box',()=>{
  assert.match(witness,/paint\(on \? u \* total : \(1 - u\) \* SPAN, on\)/);
  assert.doesNotMatch(witness,/t\.addEventListener\('pointermove'/);
  assert.match(witness,/\.ticket\.on,[\s\S]*?animation: none !important;[\s\S]*?transform: none !important/);
  assert.match(witness,/\.rsvp\.witness \{ border-color: var\(--card-line\); box-shadow: none; \}/);
  assert.match(witness,/\.ticket\.on \.shape > \.content \{[\s\S]*?opacity: 0/);
  assert.match(witness,/\.ticket\.on \.holo \.content\.hv \{ opacity: 1; \}/);
});
