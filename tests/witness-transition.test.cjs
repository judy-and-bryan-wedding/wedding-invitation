const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const script=fs.readFileSync('assets/js/script.js','utf8');
const style=fs.readFileSync('assets/css/style.css','utf8');
const witness=fs.readFileSync('assets/animations/witness-reservation-ticket.html','utf8');

test('witness iframe preserves the regular reservation footprint',()=>{
  assert.match(script,/setAttribute\("scrolling", "no"\)/);
  assert.match(style,/has-witness-ticket #fit,[\s\S]*?visibility: hidden;/);
  assert.match(style,/\.witness-ticket-frame \{[\s\S]*?position: absolute;[\s\S]*?width: 100%;[\s\S]*?max-width: none;/);
  assert.doesNotMatch(style,/has-witness-ticket \{ --phone-tab-scale: 1 !important; \}/);
  assert.match(witness,/html,body\{margin:0;overflow:hidden/);
  assert.match(witness,/#ticketStack\{width:min\(440px,94%\);height:clamp\(128px,32vw,150px\);margin:0 auto 15px/);
  assert.match(witness,/#panelStack\{height:294px\}/);
  assert.match(witness,/@media\(max-width:560px\)\{#panelStack\{height:252px\}/);
});

test('guest and witness states share fixed ticket and RSVP stacks',()=>{
  assert.match(witness,/\.stack>\.layer\{position:absolute;inset:0/);
  assert.match(witness,/id="tGuest"/);
  assert.match(witness,/id="tWit"/);
  assert.match(witness,/id="pGuest"/);
  assert.match(witness,/id="pWit"/);
  assert.match(script,/frame\.hidden = true/);
  assert.match(script,/if \(alreadyAnswered\) \{[\s\S]*?frame\.hidden = false/);
  assert.match(script,/section\.classList\.add\("has-witness-ticket"\)/);
});

test('witness layers copy the live normal ticket and RSVP card dimensions',()=>{
  assert.match(script,/function getWitnessLayout\(\)/);
  assert.match(script,/ticketWidth: normalTicket\.offsetWidth/);
  assert.match(script,/ticketHeight: normalTicket\.offsetHeight/);
  assert.match(script,/panelWidth: normalPanel\.offsetWidth/);
  assert.match(script,/panelHeight: normalPanel\.offsetHeight/);
  assert.match(script,/layout: getWitnessLayout\(\)/);
  assert.match(script,/new ResizeObserver\(\(\) => syncWitnessLayout\(frame\)\)/);
  assert.match(witness,/window\.updateWitnessTicketLayout=applyLayout/);
  assert.match(witness,/ticketStack\.style\.width=layout\.ticketWidth\+'px'/);
  assert.match(witness,/ticketStack\.style\.height=layout\.ticketHeight\+'px'/);
  assert.match(witness,/panelStack\.style\.width=layout\.panelWidth\+'px'/);
  assert.match(witness,/panelStack\.style\.height=layout\.panelHeight\+'px'/);
  assert.doesNotMatch(witness,/Your reply can be updated until the host locks the list/);
});

test('reference holographic design is retained',()=>{
  assert.match(witness,/conic-gradient\(at 60% 50%,#ccc,#ff6bfe,#00f9f8/);
  assert.match(witness,/mix-blend-mode:color-burn/);
  assert.match(witness,/mix-blend-mode:difference/);
  assert.match(witness,/filter:url\(#bump\) drop-shadow/);
});

test('ticket and RSVP card chip away together like petals in the wind',()=>{
  assert.doesNotMatch(witness,/function crack\(/);
  assert.doesNotMatch(witness,/function drawCracks\(/);
  assert.doesNotMatch(witness,/function shatter\(/);
  assert.match(witness,/\.chip-field\{/);
  assert.match(witness,/\.wind-chip\{/);
  assert.match(witness,/function buildWindChips\(outgoing\)/);
  assert.match(witness,/cols=5,rows=4/);
  assert.match(witness,/chip\.style\.clipPath=`polygon/);
  assert.match(witness,/translate3d\(\$\{dx\}px,\$\{dy\}px,0\).*rotateY\(76deg\)/);
  assert.match(witness,/function windChipTransition\(outgoing,incoming\)/);
  assert.match(witness,/windChipTransition\(tOut,tIn\),windChipTransition\(pOut,pIn\)/);
  assert.doesNotMatch(witness,/setTimeout\(\(\)=>windChipTransition/);
});

test('witness transition still uses the parent save callback and final lock',()=>{
  assert.match(witness,/window\.initializeWitnessTicket=options/);
  assert.match(witness,/window\.revealWitnessInvitation=details/);
  assert.match(witness,/await saveResponse\(selected\.value,witnessMessage\.value\.trim\(\)\)/);
  assert.match(witness,/option\.disabled=true/);
  assert.match(witness,/witnessMessage\.readOnly=true/);
  assert.match(witness,/joinOptions\.forEach\(option=>option\.addEventListener\('change'/);
});
