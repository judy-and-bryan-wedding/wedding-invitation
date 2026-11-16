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

test('witness iframe enters without changing position or fading',()=>{
  assert.doesNotMatch(style,/\.witness-ticket-frame \{[^}]*transition: opacity/);
  assert.match(script,/requestAnimationFrame\(\(\) => \{[\s\S]*?classList\.add\("is-visible"\)/);
});

test('iridescent invitation is revealed by a fixed-position wipe',()=>{
  assert.match(witness,/const HIDDEN = 'inset\(0 100% 0 0\)'/);
  assert.match(witness,/class="bg iridescent"/);
  assert.match(witness,/setClip\(on \? 'inset\(0 0 0 0\)' : HIDDEN\)/);
  assert.doesNotMatch(witness,/paint\(on \? u \* total/);
  assert.doesNotMatch(style,/\.witness-ticket-frame \{[\s\S]*?transform:/);
  assert.match(witness,/\.rsvp\.witness \.pane\.witness \{[\s\S]*?transition: clip-path 1\.05s/);
});

test('wipe returns without hover movement or a witness highlight box',()=>{
  assert.match(witness,/setClip\('inset\(0 0 0 0\)'\)/);
  assert.doesNotMatch(witness,/t\.addEventListener\('pointermove'/);
  assert.match(witness,/\.ticket\.on,[\s\S]*?animation: none !important;[\s\S]*?filter: none !important/);
  assert.match(witness,/\.rsvp\.witness \{ border-color: var\(--card-line\); box-shadow: none; \}/);
  assert.doesNotMatch(witness,/querySelector\('h2'\)\.focus/);
  assert.match(witness,/\.ticket\.accepted \.rim \{ opacity: 0 !important/);
});

test('RSVP card and ticket use a soft prismatic treatment',()=>{
  assert.match(witness,/\.bg \{[^}]*saturate\(1\.18\) contrast\(1\.02\)/);
  assert.match(witness,/\.iridescent \{/);
  assert.match(witness,/soft prismatic light pass/);
  assert.doesNotMatch(witness,/\.holo \{[^}]*transition: opacity/);
  assert.doesNotMatch(witness,/\.rsvp\.witness \.pane\.witness \{[^}]*transition: opacity/);
});

test('embedded witness cards inherit the original measured footprint',()=>{
  assert.match(script,/const sourceLayout = getWitnessLayout\(\)/);
  assert.match(script,/layout: sourceLayout/);
  assert.match(witness,/--source-ticket-width/);
  assert.match(witness,/--source-ticket-height/);
  assert.match(witness,/--source-card-height/);
  assert.match(witness,/--source-gap/);
});

test('witness guests answer both questions in one rendered card document',()=>{
  assert.match(script,/frame\.hidden = true/);
  assert.match(script,/frame\.hidden = false;[\s\S]*?section\.classList\.add\("has-witness-ticket"\)/);
  assert.doesNotMatch(script,/frame\.hidden = !alreadyAnswered/);
});

test('witness pane is opaque above the first question during the wipe',()=>{
  assert.match(witness,/\.pane\.plain \{ z-index: 0/);
  assert.match(witness,/\.pane\.witness \{[\s\S]*?z-index: 1[\s\S]*?background: linear-gradient/);
  assert.match(witness,/\.rsvp::after \{[\s\S]*?z-index: 3/);
});
