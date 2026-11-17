const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const script=fs.readFileSync('assets/js/script.js','utf8');
const style=fs.readFileSync('assets/css/style.css','utf8');
const witness=fs.readFileSync('assets/animations/witness-reservation-ticket.html','utf8');

test('witness iframe preserves the compact reference footprint',()=>{
  assert.match(script,/setAttribute\("scrolling", "no"\)/);
  assert.match(style,/\.witness-ticket-frame \{[\s\S]*?max-width: 400px;[\s\S]*?height: 456px;/);
  assert.match(witness,/html,body\{margin:0;overflow:hidden/);
  assert.match(witness,/#ticketStack\{height:134px;margin-bottom:16px\}/);
  assert.match(witness,/#panelStack\{height:296px\}/);
});

test('guest and witness states share fixed ticket and RSVP stacks',()=>{
  assert.match(witness,/\.stack>\.layer\{position:absolute;inset:0/);
  assert.match(witness,/id="tGuest"/);
  assert.match(witness,/id="tWit"/);
  assert.match(witness,/id="pGuest"/);
  assert.match(witness,/id="pWit"/);
  assert.match(script,/frame\.hidden = false/);
  assert.match(script,/section\.classList\.add\("has-witness-ticket"\)/);
});

test('reference holographic design is retained',()=>{
  assert.match(witness,/conic-gradient\(at 60% 50%,#ccc,#ff6bfe,#00f9f8/);
  assert.match(witness,/mix-blend-mode:color-burn/);
  assert.match(witness,/mix-blend-mode:difference/);
  assert.match(witness,/filter:url\(#bump\) drop-shadow/);
});

test('egg-crack transition shatters both ticket and RSVP card',()=>{
  assert.match(witness,/function crack\(/);
  assert.match(witness,/function drawCracks\(/);
  assert.match(witness,/function shatter\(/);
  assert.match(witness,/stack:ts,fx:\$\('fxT'\)/);
  assert.match(witness,/stack:ps,fx:\$\('fxP'\)/);
  assert.match(witness,/t:1900,amp:\.6/);
  assert.match(witness,/t:1900,amp:\.25/);
});

test('witness transition still uses the parent save callback and final lock',()=>{
  assert.match(witness,/window\.initializeWitnessTicket=options/);
  assert.match(witness,/window\.revealWitnessInvitation=details/);
  assert.match(witness,/await saveResponse\(selected\.value,witnessMessage\.value\.trim\(\)\)/);
  assert.match(witness,/option\.disabled=true/);
  assert.match(witness,/witnessMessage\.readOnly=true/);
  assert.match(witness,/joinOptions\.forEach\(option=>option\.addEventListener\('change'/);
});
