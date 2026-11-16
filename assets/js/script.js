const sbReady =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes("PASTE_") &&
  !SUPABASE_ANON_KEY.includes("PASTE_");

const sb = sbReady ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = (id) => document.getElementById(id);

// Fit every post-invitation tab into the part of the phone screen that is
// actually visible. Chrome's address/search bar changes visualViewport.height
// while scrolling, so one uniform scale is applied to every direct component
// in a tab. This keeps type, cards, borders, radii and spacing proportional.
const phoneFitMedia = matchMedia("(max-width: 780px)");
let phoneFitFrame = 0;

function calculatePhoneFitScale(visibleHeight, contentHeight, visibleWidth){
  if(!contentHeight || !visibleHeight) return 1;
  const heightScale = visibleHeight / contentHeight;
  const widthScale = (visibleWidth || 390) / 390;
  return Math.max(.52, Math.min(1, heightScale, widthScale));
}

function phoneFitSpan(elements){
  const visible = elements.filter(element => element && getComputedStyle(element).display !== "none");
  if(!visible.length) return 0;
  let top = Infinity;
  let bottom = -Infinity;
  visible.forEach(element => {
    const style = getComputedStyle(element);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    top = Math.min(top, element.offsetTop - marginTop);
    bottom = Math.max(bottom, element.offsetTop + element.offsetHeight + marginBottom);
  });
  return Math.max(0, bottom - top);
}

function fitPhoneTabs(){
  const targets = [$("reservations"), $("theme"), $("venue")].filter(Boolean);
  const selfie = $("selfie");
  const gallery = selfie?.querySelector(":scope > .my-gallery");

  if(!phoneFitMedia.matches){
    targets.forEach(section => section.style.removeProperty("--phone-tab-scale"));
    selfie?.style.removeProperty("--phone-tab-scale");
    gallery?.style.removeProperty("--phone-gallery-scale");
    return;
  }

  // Measure at the design size first; otherwise each address-bar resize would
  // measure an already-scaled tab and gradually change its proportions.
  targets.forEach(section => section.style.setProperty("--phone-tab-scale", "1"));
  selfie?.style.setProperty("--phone-tab-scale", "1");
  gallery?.style.setProperty("--phone-gallery-scale", "1");

  const viewport = window.visualViewport;
  const visibleHeight = viewport?.height || window.innerHeight;
  const visibleWidth = viewport?.width || window.innerWidth;

  targets.forEach(section => {
    const sectionStyle = getComputedStyle(section);
    const availableHeight = visibleHeight
      - (parseFloat(sectionStyle.paddingTop) || 0)
      - (parseFloat(sectionStyle.paddingBottom) || 0);
    const scale = calculatePhoneFitScale(
      availableHeight,
      phoneFitSpan([...section.children]),
      visibleWidth
    );
    section.style.setProperty("--phone-tab-scale", scale.toFixed(4));
  });

  // Keep the portrait booth at full size. Its controls sit below the camera,
  // and the invitation scroller can move naturally through them.
  selfie?.style.setProperty("--phone-tab-scale", "1");

  if(gallery){
    const galleryStyle = getComputedStyle(gallery);
    const availableHeight = visibleHeight
      - (parseFloat(galleryStyle.paddingTop) || 0)
      - (parseFloat(galleryStyle.paddingBottom) || 0);
    const scale = calculatePhoneFitScale(
      availableHeight,
      phoneFitSpan([...gallery.children]),
      visibleWidth
    );
    gallery.style.setProperty("--phone-gallery-scale", scale.toFixed(4));
  }
}

function schedulePhoneTabFit(){
  cancelAnimationFrame(phoneFitFrame);
  phoneFitFrame = requestAnimationFrame(fitPhoneTabs);
}

window.addEventListener("resize", schedulePhoneTabFit, {passive:true});
window.addEventListener("orientationchange", schedulePhoneTabFit, {passive:true});
window.visualViewport?.addEventListener("resize", schedulePhoneTabFit, {passive:true});
document.fonts?.ready.then(schedulePhoneTabFit);
schedulePhoneTabFit();

// Account for wrapped headings, loaded fonts and changing phone viewport sizes.
const selfieSection = $("selfie");
const selfieHeading = selfieSection?.querySelector(":scope > .heading");
function fitSelfieBooth(){
  if(!selfieHeading) return;
  const sectionStyle=getComputedStyle(selfieSection);
  const headingStyle=getComputedStyle(selfieHeading);
  const space=selfieHeading.getBoundingClientRect().height+
    parseFloat(headingStyle.marginTop)+parseFloat(headingStyle.marginBottom)+
    parseFloat(sectionStyle.paddingTop)+parseFloat(sectionStyle.paddingBottom)+4;
  selfieSection.style.setProperty("--booth-heading-space",`${Math.ceil(space)}px`);
}
if(selfieHeading){
  if(typeof ResizeObserver!=="undefined") new ResizeObserver(fitSelfieBooth).observe(selfieHeading);
  window.addEventListener("resize",fitSelfieBooth);
  document.fonts?.ready.then(fitSelfieBooth);
  fitSelfieBooth();
}

$("partnerOne")?.replaceChildren(weddingConfig.partnerOne);
$("partnerTwo")?.replaceChildren(weddingConfig.partnerTwo);
const weddingDateParts = new Date(weddingConfig.weddingDate.replace(/,/g, "")).toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric"
}).replace(",", "").split(" ");
$("weddingMonth")?.replaceChildren(weddingDateParts[0] || "December");
$("weddingDay")?.replaceChildren(weddingDateParts[1] || "27");
$("weddingYear")?.replaceChildren(weddingDateParts[2] || "2026");
$("venueName").textContent = weddingConfig.venueName;
$("venueAddress").textContent = weddingConfig.venueAddress;
$("letterCouple")?.replaceChildren(`${weddingConfig.partnerOne} & ${weddingConfig.partnerTwo}`);
$("mapLink").href = weddingConfig.mapUrl;
$("venueMap").src = `https://www.google.com/maps?q=${encodeURIComponent(`${weddingConfig.venueName}, ${weddingConfig.venueAddress}`)}&z=12&output=embed`;

const venueSlideshow = $("venueSlideshow");
const venueSlideCount = $("venueSlideCount");
let venueSlideIndex = 0;

function showNextVenueSlide(){
  if(!venueSlideshow) return;
  const slides = [...venueSlideshow.querySelectorAll("img")];
  if(slides.length < 2) return;

  slides[venueSlideIndex].classList.remove("is-active");
  venueSlideIndex = (venueSlideIndex + 1) % slides.length;
  slides[venueSlideIndex].classList.add("is-active");

  if(venueSlideCount){
    venueSlideCount.textContent = `${venueSlideIndex + 1} of ${slides.length}`;
  }
  venueSlideshow.setAttribute(
    "aria-label",
    `Show venue photo ${(venueSlideIndex + 1) % slides.length + 1} of ${slides.length}`
  );
}

venueSlideshow?.addEventListener("click", showNextVenueSlide);
$("footerCouple").textContent = `${weddingConfig.partnerOne} & ${weddingConfig.partnerTwo}`;

/* Tie the invitation flowers to the visitor's scroll position. The original
   bloom plays on arrival; after that, scrolling down closes the flowers and
   scrolling back toward the invitation opens them again. */
const scrollBloomHero = document.querySelector(".hero");
const scrollBloomParts = [...document.querySelectorAll(
  ".invitation-floral .rg, .invitation-floral .lg, .invitation-floral .pop, .invitation-floral .fd, .invitation-floral .st"
)];
let scrollBloomAnimations = [];
let scrollBloomReady = false;
let scrollBloomFrame = 0;
let scrollBloomTimer = 0;

function scheduleScrollBloomControl() {
  window.clearTimeout(scrollBloomTimer);
}

function replayInvitationBloom() {
  if (!scrollBloomHero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  window.clearTimeout(scrollBloomTimer);
  if (scrollBloomFrame) window.cancelAnimationFrame(scrollBloomFrame);
  scrollBloomFrame = 0;
  scrollBloomReady = false;
  scrollBloomAnimations = [];
  document.body.classList.remove("scroll-bloom-active");
  document.body.classList.add("invitation-bloom-reset");
  void scrollBloomHero.offsetWidth;

  window.requestAnimationFrame(() => {
    document.body.classList.remove("invitation-bloom-reset");
    scheduleScrollBloomControl();
  });
}

function updateScrollBloom() {
  scrollBloomFrame = 0;
  if (!scrollBloomReady || !scrollBloomHero) return;

  const travel = Math.max(1, scrollBloomHero.offsetHeight * 0.92);
  const distance = Math.max(0, window.scrollY - scrollBloomHero.offsetTop);
  const bloom = Math.max(0, Math.min(1, 1 - distance / travel));

  scrollBloomAnimations.forEach(({ animation, delay, duration }) => {
    animation.currentTime = delay + duration * bloom;
  });
}

function requestScrollBloomUpdate() {
  if (scrollBloomFrame) return;
  scrollBloomFrame = window.requestAnimationFrame(updateScrollBloom);
}

function enableScrollBloom() {
  if (scrollBloomReady || !scrollBloomHero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  scrollBloomAnimations = scrollBloomParts.flatMap(part =>
    part.getAnimations().map(animation => {
      const timing = animation.effect.getTiming();
      animation.pause();
      return {
        animation,
        delay: Math.max(0, Number(timing.delay) || 0),
        duration: Math.max(1, Number(timing.duration) || 1)
      };
    })
  );

  if (!scrollBloomAnimations.length) return;
  scrollBloomReady = true;
  document.body.classList.add("scroll-bloom-active");
  updateScrollBloom();
}

let invitationWasVisible = false;
if (scrollBloomHero && "IntersectionObserver" in window) {
  const invitationBloomObserver = new IntersectionObserver(entries => {
    const entry = entries[0];
    const isInvitationVisible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= .65);
    if (isInvitationVisible && !invitationWasVisible) replayInvitationBloom();
    invitationWasVisible = isInvitationVisible;
  }, {threshold:[0, .65]});
  invitationBloomObserver.observe(scrollBloomHero);
} else {
  window.requestAnimationFrame(replayInvitationBloom);
}

document.querySelector('.nav a[href="#home"]')?.addEventListener("click", event => {
  event.preventDefault();
  history.replaceState(null, "", "#home");
  window.scrollTo({ top: scrollBloomHero?.offsetTop || 0, behavior: "smooth" });
  if ("IntersectionObserver" in window) return;

  const startedAt = performance.now();
  const replayAtTop = () => {
    const atTop = Math.abs(window.scrollY - (scrollBloomHero?.offsetTop || 0)) < 2;
    if (atTop || performance.now() - startedAt > 1400) {
      replayInvitationBloom();
      return;
    }
    window.requestAnimationFrame(replayAtTop);
  };
  window.requestAnimationFrame(replayAtTop);
});

const guestFloralFloor = document.querySelector(".guest-floral-floor");
if (
  guestFloralFloor &&
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  guestFloralFloor.classList.remove("is-blooming");
  const guestGardenObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        window.requestAnimationFrame(() => guestFloralFloor.classList.add("is-blooming"));
      } else {
        guestFloralFloor.classList.remove("is-blooming");
      }
    });
  }, { threshold: 0.22 });
  guestGardenObserver.observe(guestFloralFloor);
}

const params = new URLSearchParams(location.search);
const token = (params.get("invite") || "").trim();

let guest = {
  id: null,
  name: "Our Dear Guest",
  message: "We would be honored to celebrate this beautiful day with you.",
  reservation_number: "R-001",
  table_number: 1,
  seat_number: 1,
  rsvp_status: "pending",
  rsvp_note: ""
};

const rsvpForm = $("rsvpForm");
const rsvpNote = $("rsvpNote");
const rsvpStatus = $("rsvpStatus");
const witnessGuestNames = new Set([
  "spencer sze", "marc andrew tan", "felicidad abizo", "lorna gotardo"
]);
const isWitnessGuest = () => witnessGuestNames.has(
  String(guest.name || "").trim().replace(/\s+/g, " ").toLowerCase()
);
let witnessSavePending = false;
let pendingWitnessReveal = null;

function revealWitnessInvitation(response) {
  const frame = $("witnessTicketFrame");
  pendingWitnessReveal = { response, note: rsvpNote?.value || "" };
  if (!frame || frame.dataset.ready !== "true") return;
  $("reservations").classList.add("has-witness-ticket");
  frame.hidden = false;
  // Let the iframe become a rendered grid item before fading it in. This
  // prevents the normal RSVP from snapping directly to the witness version.
  window.requestAnimationFrame(() => {
    frame.classList.add("is-visible");
    frame.contentWindow.revealWitnessInvitation(pendingWitnessReveal);
    pendingWitnessReveal = null;
  });
}

async function saveWitnessResponse(response, note) {
  if (!isWitnessGuest() || !token || !sbReady || witnessSavePending ||
      !["accepted", "declined"].includes(response) || note.length > 500) {
    throw new Error("Unable to save witness response.");
  }
  if (["accepted", "declined"].includes(guest.rsvp_status)) {
    return { status: guest.rsvp_status, note: guest.rsvp_note };
  }
  witnessSavePending = true;
  try {
    const { data, error } = await sb.rpc("submit_guest_rsvp", {
      p_invite_token: token, p_status: response, p_note: note || null
    });
    if (error) throw error;
    if (data === true) {
      guest.rsvp_status = response;
      guest.rsvp_note = note;
    } else {
      // A different tab may already have saved the final answer.
      const { data: rows, error: readError } = await sb.rpc("get_guest_by_invite_token", {
        p_invite_token: token
      });
      const saved = Array.isArray(rows) ? rows[0] : rows;
      if (readError || !saved || !["accepted", "declined"].includes(saved.rsvp_status)) {
        throw readError || new Error("Response was not saved.");
      }
      guest.rsvp_status = saved.rsvp_status;
      guest.rsvp_note = saved.rsvp_note || "";
    }
    setRsvpFormFinal(true);
    return { status: guest.rsvp_status, note: guest.rsvp_note };
  } finally {
    witnessSavePending = false;
  }
}

function mountWitnessTicket() {
  if (!isWitnessGuest() || $("witnessTicketFrame")) return;
  const section = $("reservations");
  const frame = document.createElement("iframe");
  frame.id = "witnessTicketFrame";
  frame.title = `Reservation and witness response for ${guest.name}`;
  frame.className = "witness-ticket-frame";
  frame.setAttribute("scrolling", "no");
  const alreadyAnswered = ["accepted", "declined"].includes(guest.rsvp_status);
  frame.hidden = !alreadyAnswered;
  frame.addEventListener("load", () => {
    frame.contentWindow.initializeWitnessTicket({
      name: guest.name,
      reservationNumber: guest.reservation_number,
      status: guest.rsvp_status,
      note: guest.rsvp_note,
      save: saveWitnessResponse,
      resize: height => { frame.style.height = `${height}px`; }
    });
    frame.dataset.ready = "true";
    if (alreadyAnswered) window.requestAnimationFrame(() => frame.classList.add("is-visible"));
    if (pendingWitnessReveal) revealWitnessInvitation(pendingWitnessReveal.response);
  }, { once: true });
  frame.src = "assets/animations/witness-reservation-ticket.html?v=witness-chip-6";
  if (alreadyAnswered) section.classList.add("has-witness-ticket");
  else section.querySelector(".rsvp-card > p").textContent = "Choose an answer to continue to your special invitation.";
  section.querySelector(".reservations-grid").prepend(frame);
}

const ticketAnimation = {
  play: () => $("btn")?.click(),
  reserve: (animate = true) => {
    if (animate) return $("rsv")?.click();
    const reservedStamp = $("stamp");
    const declinedStamp = $("stamp2");
    if (reservedStamp) { reservedStamp.style.opacity = "1"; reservedStamp.style.transform = "rotate(-12deg) scale(1)"; }
    if (declinedStamp) declinedStamp.style.opacity = "0";
  },
  decline: (animate = true) => {
    if (animate) return $("dcl")?.click();
    const reservedStamp = $("stamp");
    const declinedStamp = $("stamp2");
    if (reservedStamp) reservedStamp.style.opacity = "0";
    if (declinedStamp) { declinedStamp.style.opacity = "1"; declinedStamp.style.transform = "rotate(10deg) scale(1)"; }
    const ticketCard = $("card");
    if (ticketCard) ticketCard.style.filter = "grayscale(.9) brightness(.92)";
  },
  reset: () => {
    [$("stamp"), $("stamp2")].forEach(stamp => { if (stamp) stamp.style.opacity = "0"; });
    const ticketCard = $("card");
    if (ticketCard) ticketCard.style.filter = "";
  }
};

rsvpForm?.querySelectorAll('input[name="rsvpStatus"]').forEach(input => {
  input.addEventListener("change", () => {
    if (!input.checked || !ticketAnimation) return;
    if (isWitnessGuest()) {
      revealWitnessInvitation(input.value);
      return;
    }
    if (input.value === "accepted") ticketAnimation.reserve();
    if (input.value === "declined") ticketAnimation.decline();
    void submitRsvp(input.value);
  });
});

function setRsvpStatus(message, type = "") {
  if (!rsvpStatus) return;
  rsvpStatus.textContent = message;
  rsvpStatus.className = `rsvp-status${type ? ` is-${type}` : ""}`;
}

function setRsvpFormFinal(isFinal) {
  if (!rsvpForm) return;
  rsvpForm.dataset.final = String(isFinal);
  rsvpForm.classList.toggle("is-final", isFinal);
  rsvpForm.querySelectorAll('input[name="rsvpStatus"]').forEach(input => {
    input.disabled = isFinal;
  });
  if (rsvpNote) rsvpNote.disabled = isFinal;
}

function setRsvpUI() {
  if (!rsvpForm) return;
  if (isWitnessGuest()) return;
  const selectedResponse = ["accepted", "declined"].includes(guest.rsvp_status)
    ? guest.rsvp_status
    : "";
  const selectedInput = rsvpForm.querySelector(`input[value="${selectedResponse}"]`);
  if (selectedInput) selectedInput.checked = true;
  if (rsvpNote) rsvpNote.value = guest.rsvp_note || "";
  setRsvpFormFinal(Boolean(selectedResponse));

  if (selectedResponse === "accepted") {
    ticketAnimation?.reserve(false);
    window.syncTicketToRsvpChoice?.();
    setRsvpStatus("Your response is saved — we are delighted you can join us!", "success");
  } else if (selectedResponse === "declined") {
    ticketAnimation?.decline(false);
    window.syncTicketToRsvpChoice?.();
    setRsvpStatus("Your response is saved. Thank you for letting us know.", "success");
  } else {
    ticketAnimation?.reset();
  }
}

async function submitRsvp(selectedResponse) {
  if (["accepted", "declined"].includes(guest.rsvp_status)) {
    setRsvpUI();
    return;
  }
  const note = rsvpNote?.value.trim() || "";

  if (!token || !sbReady) {
    setRsvpStatus("RSVP saving is available from your private invitation link.", "error");
    return;
  }

  rsvpForm.setAttribute("aria-busy", "true");
  rsvpForm.querySelectorAll('input[name="rsvpStatus"]').forEach(input => { input.disabled = true; });
  if (rsvpNote) rsvpNote.disabled = true;
  setRsvpStatus("Saving your response…");

  const { data, error } = await sb.rpc("submit_guest_rsvp", {
    p_invite_token: token,
    p_status: selectedResponse,
    p_note: note || null
  });

  rsvpForm.removeAttribute("aria-busy");

  if (!error && data !== true) {
    const { data: savedRows } = await sb.rpc("get_guest_by_invite_token", {
      p_invite_token: token
    });
    const savedResponse=Array.isArray(savedRows)?savedRows[0]:savedRows;

    if (savedResponse && ["accepted", "declined"].includes(savedResponse.rsvp_status)) {
      guest.rsvp_status = savedResponse.rsvp_status;
      guest.rsvp_note = savedResponse.rsvp_note || "";
      setRsvpUI();
      return;
    }
  }

  if (error || data !== true) {
    rsvpForm.querySelectorAll('input[name="rsvpStatus"]').forEach(input => { input.disabled = false; });
    if (rsvpNote) rsvpNote.disabled = false;
    console.error("Could not save RSVP:", error);
    setRsvpStatus("We could not save your response right now. Please try again in a moment.", "error");
    return;
  }

  guest.rsvp_status = selectedResponse;
  guest.rsvp_note = note;
  setRsvpUI();
}

rsvpForm?.addEventListener("submit", event => event.preventDefault());

async function loadGuest() {
  if (!token) {
    setGuestUI();
    $("uploadStatus").textContent = "This preview has no invitation token. Add ?invite=YOUR_TOKEN to the URL.";
    return;
  }

  if (!sbReady) {
    // Preview mode before Supabase is connected.
    guest.name = "Preview Guest";
    guest.message = "This is how a personalized guest invitation will look.";
    guest.reservation_number = "R-017";
    guest.table_number = 2;
    guest.seat_number = 7;
    setGuestUI();
    $("uploadStatus").textContent = "Connect Supabase in assets/js/config.js to enable private photos.";
    return;
  }

  const { data: guestRows, error } = await sb.rpc("get_guest_by_invite_token", {
    p_invite_token: token
  });
  const data=Array.isArray(guestRows)?guestRows[0]:guestRows;

  if (error || !data) {
    document.body.innerHTML = `
      <main class="section">
        <div class="card" style="max-width:680px;margin:auto;text-align:center">
          <h1 style="font-family:'Cormorant Garamond',serif;font-size:50px">Invitation not found</h1>
          <p>This invitation link is invalid or no longer active.</p>
        </div>
      </main>`;
    return;
  }

  guest = data;
  setGuestUI();
  setRsvpUI();
  await loadMyPhotos();
}

function setGuestUI() {
  mountWitnessTicket();
  const guestName = $("guestName");
  const overlayGuestName = $("overlayGuestName");
  const guestMessage = $("guestMessage");
  const reservationNumber = $("reservationNumber");
  const tableNumber = $("tableNumber");
  const seatNumber = $("seatNumber");

  if (guestName) guestName.textContent = guest.name;
  if (overlayGuestName) overlayGuestName.textContent = guest.name;
  if (guestMessage) {
    guestMessage.textContent =
      guest.message || "We would be honored to celebrate this beautiful day with you.";
  }

  if (reservationNumber) reservationNumber.textContent = guest.reservation_number || "R-001";
  if (tableNumber) tableNumber.textContent = guest.table_number || 1;
  if (seatNumber) seatNumber.textContent = guest.seat_number || 1;

}

const guestSearchForm = $("guestSearchForm");
const guestSearchInput = $("guestSearchInput");
const guestSearchResults = $("guestSearchResults");

function showGuestSearchMessage(message) {
  if (!guestSearchResults) return;
  const text = document.createElement("p");
  text.className = "guest-search-hint";
  text.textContent = message;
  guestSearchResults.replaceChildren(text);
}

function renderGuestSearchResults(guests) {
  if (!guestSearchResults) return;

  if (!guests.length) {
    showGuestSearchMessage("No matching guest was found.");
    return;
  }

  const list = document.createElement("div");
  list.className = "guest-search-list";

  guests.forEach(result => {
    const row = document.createElement("div");
    row.className = "guest-search-result";

    const name = document.createElement("strong");
    name.textContent = result.name;

    const details = document.createElement("span");
    const reservation = result.reservation_number || "Not assigned";
    const table = result.table_number || "-";
    const seat = result.seat_number || "-";
    details.textContent = `Reservation ${reservation} · Table ${table} · Seat ${seat}`;

    row.append(name, details);
    list.appendChild(row);
  });

  guestSearchResults.replaceChildren(list);
}

async function searchGuestList(event) {
  event?.preventDefault();
  const query = guestSearchInput?.value.trim() || "";

  if (query.length < 2) {
    showGuestSearchMessage("Enter at least 2 letters to search.");
    guestSearchInput?.focus();
    return;
  }

  if (!sbReady || !sb) {
    showGuestSearchMessage("Guest search will be available when the site is connected to Supabase.");
    return;
  }

  showGuestSearchMessage("Searching…");
  const safeQuery = query.replaceAll("%", "\\%").replaceAll("_", "\\_");
  const { data, error } = await sb
    .from("guests")
    .select("name,reservation_number,table_number,seat_number")
    .eq("active", true)
    .ilike("name", `%${safeQuery}%`)
    .order("name")
    .limit(10);

  if (error) {
    console.error("Could not search the guest list:", error);
    showGuestSearchMessage("Guest search is unavailable right now. Please try again.");
    return;
  }

  renderGuestSearchResults(data || []);
}

guestSearchForm?.addEventListener("submit", searchGuestList);

let stream = null;
let photoBlob = null;
let currentStyle = "accept";
let currentDecor = "flowers";
let faceLandmarker = null;
let faceTrackingFrame = 0;
let faceTrackingActive = false;
let currentFaceEffect = "none";
let latestFaceLandmarks = null;
let lastTrackedVideoTime = -1;
let lastFaceTrackingTimestamp = 0;
let faceTrackingLoading = false;

const faceFilterCanvas = $("faceFilterCanvas");
const faceFilterOptions = [...document.querySelectorAll(".face-filter-option")];
const faceFilterLoading = $("faceFilterLoading");
const faceFilterLoadingText = $("faceFilterLoadingText");

function setFaceFilterLoading(loading,label="Loading face filters..."){
  if(faceFilterLoadingText) faceFilterLoadingText.textContent=label;
  if(faceFilterLoading) faceFilterLoading.hidden=!loading;
  faceFilterOptions.forEach(option=>{option.disabled=loading;});
}

function flowerCrownPoint(landmarks,index,width,height){
  const point=landmarks[index];
  return point ? {x:point.x*width,y:point.y*height} : null;
}

function drawCrownFlower(ctx,x,y,r,petalColor,centerColor){
  ctx.save();
  ctx.translate(x,y);
  for(let i=0;i<6;i+=1){
    const angle=(Math.PI*2*i)/6;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle)*r*.72,Math.sin(angle)*r*.72,r*.54,r*.34,angle,0,Math.PI*2);
    ctx.fillStyle=petalColor;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0,0,r*.34,0,Math.PI*2);
  ctx.fillStyle=centerColor;
  ctx.fill();
  ctx.restore();
}

function faceEffectAnchor(landmarks,mapPoint){
  if(!landmarks?.length) return;
  const left=mapPoint(127);
  const right=mapPoint(356);
  const top=mapPoint(10);
  if(!left||!right||!top) return;

  const dx=right.x-left.x;
  const dy=right.y-left.y;
  const headWidth=Math.hypot(dx,dy);
  if(!Number.isFinite(headWidth)||headWidth<20) return;

  let angle=Math.atan2(dy,dx);
  // Mirrored captures reverse the landmark order. Keep the crown upright while
  // preserving the natural tilt of the guest's head.
  if(angle>Math.PI/2) angle-=Math.PI;
  if(angle<-Math.PI/2) angle+=Math.PI;
  return {left,right,top,headWidth,angle};
}

function drawWeddingCrown(ctx,landmarks,mapPoint){
  const anchor=faceEffectAnchor(landmarks,mapPoint);
  if(!anchor) return;
  const {top,headWidth,angle}=anchor;
  const crownWidth=headWidth*.82;
  const flowerRadius=Math.max(5,crownWidth*.055);

  ctx.save();
  ctx.translate(top.x,top.y-headWidth*.045);
  ctx.rotate(angle);
  ctx.lineCap="round";
  ctx.lineJoin="round";
  ctx.shadowColor="rgba(39,49,41,.22)";
  ctx.shadowBlur=flowerRadius*.65;
  ctx.shadowOffsetY=flowerRadius*.18;

  ctx.beginPath();
  ctx.moveTo(-crownWidth*.5,flowerRadius*.18);
  ctx.quadraticCurveTo(0,-flowerRadius*1.15,crownWidth*.5,flowerRadius*.18);
  ctx.strokeStyle="#71806a";
  ctx.lineWidth=Math.max(2,flowerRadius*.24);
  ctx.stroke();

  [-.42,-.29,-.15,.15,.29,.42].forEach((position,index)=>{
    const leafY=-flowerRadius*(index%2 ? .3 : .05);
    ctx.save();
    ctx.translate(crownWidth*position,leafY);
    ctx.rotate(position<0 ? -.65 : .65);
    ctx.beginPath();
    ctx.ellipse(0,0,flowerRadius*.72,flowerRadius*.3,0,0,Math.PI*2);
    ctx.fillStyle=index%2 ? "#91a08a" : "#687860";
    ctx.fill();
    ctx.restore();
  });

  const flowers=[
    [-.42,.08,.72,"#f8f5ea"],[-.27,-.2,.9,"#dce5e9"],[-.1,-.52,.78,"#f8f5ea"],
    [0,-.68,1.15,"#e7edf0"],[.1,-.52,.78,"#f8f5ea"],[.27,-.2,.9,"#dce5e9"],[.42,.08,.72,"#f8f5ea"]
  ];
  flowers.forEach(([position,y,size,color])=>{
    drawCrownFlower(ctx,crownWidth*position,flowerRadius*y,flowerRadius*size,color,"#c8ad69");
  });
  ctx.restore();
}

function traceHeart(ctx,size){
  ctx.beginPath();
  ctx.moveTo(0,size*.78);
  ctx.bezierCurveTo(-size*1.25,size*.02,-size*.88,-size*.82,0,-size*.34);
  ctx.bezierCurveTo(size*.88,-size*.82,size*1.25,size*.02,0,size*.78);
  ctx.closePath();
}

function drawHeart(ctx,x,y,size,color){
  ctx.save();
  ctx.translate(x,y);
  traceHeart(ctx,size);
  ctx.fillStyle=color;
  ctx.fill();
  ctx.restore();
}

function drawHeartHalo(ctx,landmarks,mapPoint){
  const anchor=faceEffectAnchor(landmarks,mapPoint);
  if(!anchor) return;
  const {top,headWidth,angle}=anchor;
  const radius=Math.max(6,headWidth*.052);
  const positions=[[-.38,.05,.76],[-.21,-.48,.95],[0,-.72,1.15],[.21,-.48,.95],[.38,.05,.76]];
  const colors=["#bd746f","#e4aaa4","#c98680","#e4aaa4","#bd746f"];
  const bob=Math.sin(performance.now()/360)*radius*.08;

  ctx.save();
  ctx.translate(top.x,top.y-headWidth*.08+bob);
  ctx.rotate(angle);
  ctx.shadowColor="rgba(96,52,52,.22)";
  ctx.shadowBlur=radius*.65;
  positions.forEach(([x,y,size],index)=>drawHeart(ctx,headWidth*x,radius*y,radius*size,colors[index]));
  ctx.restore();
}

function drawWeddingVeil(ctx,landmarks,mapPoint){
  const anchor=faceEffectAnchor(landmarks,mapPoint);
  if(!anchor) return;
  const {top,headWidth,angle}=anchor;
  const veilLength=headWidth*1.38;

  ctx.save();
  ctx.translate(top.x,top.y-headWidth*.035);
  ctx.rotate(angle);
  const veilGradient=ctx.createLinearGradient(0,0,0,veilLength);
  veilGradient.addColorStop(0,"rgba(245,248,247,.62)");
  veilGradient.addColorStop(.62,"rgba(224,232,234,.24)");
  veilGradient.addColorStop(1,"rgba(245,248,247,0)");

  ctx.beginPath();
  ctx.moveTo(-headWidth*.18,0);
  ctx.quadraticCurveTo(-headWidth*.72,headWidth*.42,-headWidth*.58,veilLength);
  ctx.quadraticCurveTo(-headWidth*.22,veilLength*.83,-headWidth*.08,headWidth*.1);
  ctx.closePath();
  ctx.fillStyle=veilGradient;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(headWidth*.18,0);
  ctx.quadraticCurveTo(headWidth*.72,headWidth*.42,headWidth*.58,veilLength);
  ctx.quadraticCurveTo(headWidth*.22,veilLength*.83,headWidth*.08,headWidth*.1);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-headWidth*.23,headWidth*.015);
  ctx.quadraticCurveTo(0,-headWidth*.11,headWidth*.23,headWidth*.015);
  ctx.strokeStyle="#d1b875";
  ctx.lineWidth=Math.max(2,headWidth*.012);
  ctx.stroke();
  [-.18,-.09,0,.09,.18].forEach((position,index)=>{
    drawCrownFlower(ctx,headWidth*position,-headWidth*(index===2?.075:.035),headWidth*(index===2?.037:.026),"#f7f5ed","#c8ad69");
  });
  ctx.restore();
}

function drawStar(ctx,x,y,outerRadius,color,rotation){
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for(let i=0;i<8;i+=1){
    const radius=i%2===0 ? outerRadius : outerRadius*.22;
    const angle=-Math.PI/2+(Math.PI*i)/4;
    const px=Math.cos(angle)*radius;
    const py=Math.sin(angle)*radius;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.fillStyle=color;
  ctx.fill();
  ctx.restore();
}

function drawSparkleGlow(ctx,landmarks,mapPoint){
  const anchor=faceEffectAnchor(landmarks,mapPoint);
  if(!anchor) return;
  const {top,headWidth,angle}=anchor;
  const time=performance.now()/700;
  const sparkles=[[-.5,.02,1],[-.35,-.5,.62],[-.12,-.78,.82],[.14,-.72,.58],[.38,-.4,.95],[.51,.12,.6]];

  ctx.save();
  ctx.translate(top.x,top.y-headWidth*.02);
  ctx.rotate(angle);
  ctx.globalCompositeOperation="screen";
  sparkles.forEach(([x,y,size],index)=>{
    const pulse=.8+Math.sin(time+index*1.3)*.2;
    drawStar(ctx,headWidth*x,headWidth*y*.42,Math.max(5,headWidth*.045*size*pulse),index%2?"rgba(255,255,255,.92)":"rgba(239,216,151,.95)",time+index);
  });
  ctx.restore();
}

function drawHeartGlasses(ctx,landmarks,mapPoint){
  if(!landmarks?.length) return;
  const leftOuter=mapPoint(33);
  const leftInner=mapPoint(133);
  const rightInner=mapPoint(362);
  const rightOuter=mapPoint(263);
  if(!leftOuter||!leftInner||!rightInner||!rightOuter) return;

  const leftEye={x:(leftOuter.x+leftInner.x)/2,y:(leftOuter.y+leftInner.y)/2};
  const rightEye={x:(rightOuter.x+rightInner.x)/2,y:(rightOuter.y+rightInner.y)/2};
  const dx=rightEye.x-leftEye.x;
  const dy=rightEye.y-leftEye.y;
  const eyeDistance=Math.hypot(dx,dy);
  if(!Number.isFinite(eyeDistance)||eyeDistance<12) return;

  let angle=Math.atan2(dy,dx);
  if(angle>Math.PI/2) angle-=Math.PI;
  if(angle<-Math.PI/2) angle+=Math.PI;
  const center={x:(leftEye.x+rightEye.x)/2,y:(leftEye.y+rightEye.y)/2};
  const lensSize=eyeDistance*.3;

  ctx.save();
  ctx.translate(center.x,center.y-lensSize*.02);
  ctx.rotate(angle);
  ctx.lineCap="round";
  ctx.lineJoin="round";
  ctx.shadowColor="rgba(75,31,40,.25)";
  ctx.shadowBlur=lensSize*.28;

  ctx.beginPath();
  ctx.moveTo(-eyeDistance*.5-lensSize*1.05,-lensSize*.1);
  ctx.lineTo(-eyeDistance*.5-lensSize*.72,-lensSize*.05);
  ctx.moveTo(eyeDistance*.5+lensSize*.72,-lensSize*.05);
  ctx.lineTo(eyeDistance*.5+lensSize*1.05,-lensSize*.1);
  ctx.moveTo(-eyeDistance*.5+lensSize*.92,-lensSize*.1);
  ctx.quadraticCurveTo(0,-lensSize*.32,eyeDistance*.5-lensSize*.92,-lensSize*.1);
  ctx.strokeStyle="#8f3f51";
  ctx.lineWidth=Math.max(2,lensSize*.13);
  ctx.stroke();

  [-eyeDistance*.5,eyeDistance*.5].forEach(x=>{
    ctx.save();
    ctx.translate(x,0);
    traceHeart(ctx,lensSize);
    ctx.fillStyle="rgba(194,72,98,.48)";
    ctx.fill();
    ctx.strokeStyle="#9d4055";
    ctx.lineWidth=Math.max(2,lensSize*.13);
    ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

function drawSelectedFaceEffect(ctx,landmarks,mapPoint){
  if(currentFaceEffect==="crown") drawWeddingCrown(ctx,landmarks,mapPoint);
  if(currentFaceEffect==="veil") drawWeddingVeil(ctx,landmarks,mapPoint);
  if(currentFaceEffect==="hearts") drawHeartHalo(ctx,landmarks,mapPoint);
  if(currentFaceEffect==="sparkles") drawSparkleGlow(ctx,landmarks,mapPoint);
  if(currentFaceEffect==="heart-glasses") drawHeartGlasses(ctx,landmarks,mapPoint);
}

function renderLiveFaceEffect(){
  const video=$("camera");
  if(!faceFilterCanvas||!video.videoWidth) return;
  if(faceFilterCanvas.width!==video.videoWidth||faceFilterCanvas.height!==video.videoHeight){
    faceFilterCanvas.width=video.videoWidth;
    faceFilterCanvas.height=video.videoHeight;
  }
  const ctx=faceFilterCanvas.getContext("2d");
  ctx.clearRect(0,0,faceFilterCanvas.width,faceFilterCanvas.height);
  if(currentFaceEffect==="none"||!latestFaceLandmarks) return;
  drawSelectedFaceEffect(
    ctx,
    latestFaceLandmarks,
    index=>flowerCrownPoint(latestFaceLandmarks,index,faceFilterCanvas.width,faceFilterCanvas.height)
  );
}

function trackFaceFrame(timestamp=0){
  if(!faceTrackingActive) return;
  // Cap optional face detection near 15fps to keep the preview responsive on
  // lower-powered phones.
  if(timestamp-lastFaceTrackingTimestamp<66){
    faceTrackingFrame=requestAnimationFrame(trackFaceFrame);
    return;
  }
  lastFaceTrackingTimestamp=timestamp;
  const video=$("camera");
  if(faceLandmarker&&video.readyState>=2&&video.currentTime!==lastTrackedVideoTime){
    lastTrackedVideoTime=video.currentTime;
    try {
      const result=faceLandmarker.detectForVideo(video,performance.now());
      latestFaceLandmarks=result.faceLandmarks?.[0]||null;
    } catch(error) {
      console.warn("Face tracking frame skipped:",error);
    }
    renderLiveFaceEffect();
  }
  faceTrackingFrame=requestAnimationFrame(trackFaceFrame);
}

async function startFaceTracking(){
  faceTrackingActive=true;
  lastFaceTrackingTimestamp=0;
  cancelAnimationFrame(faceTrackingFrame);
  faceTrackingFrame=requestAnimationFrame(trackFaceFrame);
  if(faceLandmarker) return true;
  if(faceTrackingLoading) return false;
  faceTrackingLoading=true;

  try {
    const {FaceLandmarker,FilesetResolver}=await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/+esm");
    const vision=await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm"
    );
    const modelAssetPath="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
    const landmarkerOptions={
      baseOptions:{modelAssetPath,delegate:"GPU"},
      runningMode:"VIDEO",
      numFaces:1,
      minFaceDetectionConfidence:.55,
      minFacePresenceConfidence:.55,
      minTrackingConfidence:.55
    };
    try {
      faceLandmarker=await FaceLandmarker.createFromOptions(vision,landmarkerOptions);
    } catch(gpuError) {
      console.warn("GPU face tracking unavailable; using CPU:",gpuError);
      faceLandmarker=await FaceLandmarker.createFromOptions(vision,{
        ...landmarkerOptions,
        baseOptions:{modelAssetPath,delegate:"CPU"}
      });
    }
    faceTrackingLoading=false;
    return true;
  } catch(error) {
    faceTrackingLoading=false;
    faceTrackingActive=false;
    cancelAnimationFrame(faceTrackingFrame);
    if(faceFilterCanvas) faceFilterCanvas.hidden=true;
    console.warn("MediaPipe face filter unavailable:",error);
    $("uploadStatus").textContent="Camera ready. The face filter could not load, but selfies still work.";
  }
}

faceFilterOptions.forEach(option=>{
  option.addEventListener("click",async()=>{
    currentFaceEffect=option.dataset.faceEffect||"none";
    faceFilterOptions.forEach(button=>{
      const isActive=button===option;
      button.classList.toggle("active",isActive);
      button.setAttribute("aria-pressed",String(isActive));
    });
    if(currentFaceEffect==="none"){
      faceTrackingActive=false;
      cancelAnimationFrame(faceTrackingFrame);
      latestFaceLandmarks=null;
      if(faceFilterCanvas){
        faceFilterCanvas.hidden=true;
        faceFilterCanvas.getContext("2d")?.clearRect(0,0,faceFilterCanvas.width,faceFilterCanvas.height);
      }
      $("uploadStatus").textContent="Camera ready. Face filter is off for the smoothest preview.";
      return;
    }

    if(faceFilterCanvas) faceFilterCanvas.hidden=false;
    const needsLoad=!faceLandmarker;
    if(needsLoad){
      setFaceFilterLoading(true);
      $("uploadStatus").textContent="Loading the face filter for your live preview...";
    }
    try {
      const ready=await startFaceTracking();
      if(ready){
        renderLiveFaceEffect();
        $("uploadStatus").textContent="Face filter ready. Center your face to preview it.";
      }
    } finally {
      if(needsLoad) setFaceFilterLoading(false);
    }
  });
});

const filterDefinitions = {
  accept: { small:"With love,", main:"Yes, I do accept the invitation!", decor:"flowers" },
  honored: { small:"So happy for you both,", main:"Honored to be there for your big day!", decor:"sprigs" },
  celebrate: { small:"Celebrating love,", main:"See you at the wedding!", decor:"petals" },
  forever: { small:"A little love note,", main:"Cheers to your forever!", decor:"hearts" },
  garden: { small:"Blooming with joy,", main:"Love is in full bloom!", decor:"garden" },
  lovebirds: { small:"Two hearts, one forever,", main:"Celebrating your love story!", decor:"birds" },
  floralarch: { small:"Under a garden of love,", main:"A beautiful beginning!", decor:"arch" },
  rings: { small:"With all my love,", main:"To forever and always!", decor:"rings" }
};

function applyFilter(style){
  const def = filterDefinitions[style] || filterDefinitions.accept;
  currentStyle = style;
  currentDecor = def.decor;
  $("filterSmall").textContent = def.small;
  $("filterMain").textContent = def.main;
  $("liveOverlay").className = `live-overlay filter-${style}`;

  const select = $("filterSelect");
  if (select && select.value !== style) select.value = style;

  document.querySelectorAll(".filter").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.style === style)
  );
}

if ($("filterSelect")) {
  $("filterSelect").addEventListener("change", () => applyFilter($("filterSelect").value));
}

$("startBtn").addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1080 },
        height: { ideal: 1440 },
        aspectRatio: { ideal: 3 / 4 }
      },
      audio: false
    });
    $("camera").srcObject = stream;
    await $("camera").play();
    $("placeholder").classList.add("hidden");
    $("liveOverlay").hidden=false;
    document.querySelector("#selfie .filter-card")?.removeAttribute("hidden");
    $("captureBtn").disabled = false;
    $("startBtn").disabled = true;
    $("startBtn").textContent = "Camera Ready";
    $("uploadStatus").textContent = "Camera ready. Choose a message or an optional face filter below.";
    schedulePhoneTabFit();
  } catch (e) {
    $("uploadStatus").textContent = "Camera access was blocked. Use HTTPS and allow camera permission.";
  }
});

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => applyFilter(btn.dataset.style));
});

$("captureBtn").addEventListener("click", async () => {
  const video = $("camera");
  if (!video.videoWidth) return;

  const canvas = $("snapshotCanvas");
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  // Fill the portrait photo with the live camera, then overlay the frame copy.
  const portraitWidth = Math.min(sourceWidth, sourceHeight * 4 / 5);
  const cropX = (sourceWidth - portraitWidth) / 2;
  const photoHeight = Math.round(portraitWidth * 5 / 4);
  const cropY = (sourceHeight - photoHeight) / 2;
  canvas.width = Math.max(1, Math.round(portraitWidth));
  canvas.height = Math.max(1, Math.round(photoHeight));
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;

  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, cropX, cropY, portraitWidth, photoHeight, 0, 0, w, h);
  ctx.restore();

  if(currentFaceEffect!=="none"&&latestFaceLandmarks){
    drawSelectedFaceEffect(ctx,latestFaceLandmarks,index=>{
      const point=latestFaceLandmarks[index];
      if(!point) return null;
      return {
        x:w-(point.x*sourceWidth-cropX),
        y:point.y*sourceHeight-cropY
      };
    });
  }

  await document.fonts?.ready;
  ctx.save();
  ctx.scale(w/1080,h/1350);

  const fade=ctx.createLinearGradient(0,0,0,520);
  fade.addColorStop(0,"rgba(25,18,15,.84)");
  fade.addColorStop(.5,"rgba(25,18,15,.38)");
  fade.addColorStop(1,"rgba(25,18,15,0)");
  ctx.fillStyle=fade;
  ctx.fillRect(0,0,1080,520);

  const foil=ctx.createLinearGradient(78,16,1002,1334);
  foil.addColorStop(0,"#b0945c");
  foil.addColorStop(.35,"#e6cf96");
  foil.addColorStop(.6,"#cdb06e");
  foil.addColorStop(1,"#f0dcaa");
  ctx.strokeStyle=foil;
  ctx.globalAlpha=.96;
  ctx.lineWidth=9;
  ctx.beginPath();
  ctx.moveTo(78,16);ctx.lineTo(78,1334);
  ctx.moveTo(1002,16);ctx.lineTo(1002,1334);
  ctx.moveTo(0,66);ctx.lineTo(1080,66);
  ctx.moveTo(0,1284);ctx.lineTo(1080,1284);
  ctx.stroke();

  ctx.fillStyle="#dab670";
  ctx.fillRect(410,256,110,2);
  ctx.fillRect(560,256,110,2);
  ctx.beginPath();
  ctx.moveTo(540,249);ctx.lineTo(548,257);ctx.lineTo(540,265);ctx.lineTo(532,257);
  ctx.closePath();ctx.fill();

  ctx.save();
  ctx.globalAlpha=1;
  ctx.fillStyle="#fffaf0";
  ctx.textAlign="center";
  ctx.textBaseline="alphabetic";
  ctx.shadowColor="rgba(0,0,0,.75)";
  ctx.shadowBlur=5;
  ctx.shadowOffsetY=2;
  const family='"Cormorant Garamond", Georgia, serif';
  const smallText=$("filterSmall").textContent;
  const mainText=$("filterMain").textContent;
  fitCanvasFont(ctx,smallText,900,58,30,"500",family,"italic");
  ctx.fillText(smallText,540,165);
  fitCanvasFont(ctx,mainText,900,34,20,"500",family,"italic");
  ctx.fillText(mainText,540,225);

  const guestName=String(guest.name||"").toLocaleUpperCase();
  let nameSize=fitCanvasFont(ctx,guestName,880,44,18,"500",family);
  ctx.font="500 "+nameSize+"px "+family;
  let spacing=9;
  const nameChars=[...guestName];
  const nameWidth=()=>nameChars.reduce((sum,char)=>sum+ctx.measureText(char).width,0)+Math.max(0,nameChars.length-1)*spacing;
  while(nameWidth()>900&&nameSize>18){
    nameSize--;
    ctx.font="500 "+nameSize+"px "+family;
  }
  spacing=Math.min(spacing,Math.max(0,(900-nameChars.reduce((sum,char)=>sum+ctx.measureText(char).width,0))/Math.max(1,nameChars.length-1)));
  let nameX=540-nameWidth()/2;
  ctx.textAlign="left";
  for(const char of nameChars){
    ctx.fillText(char,nameX,322);
    nameX+=ctx.measureText(char).width+spacing;
  }
  ctx.restore();
  ctx.restore();

  $("camera").style.display="none";
  if(faceFilterCanvas) faceFilterCanvas.style.display="none";
  $("snapshotCanvas").style.display="block";
  $("liveOverlay").style.display="none";
  $("captureBtn").classList.add("hidden");
  $("retakeBtn").classList.remove("hidden");
  $("postBtn").classList.remove("hidden");
  $("downloadBtn").classList.remove("hidden");
  $("downloadBtn").href=canvas.toDataURL("image/png");

  photoBlob = await new Promise(resolve => canvas.toBlob(resolve,"image/png",.94));
});

$("retakeBtn").addEventListener("click", () => {
  $("snapshotCanvas").style.display="none";
  $("camera").style.display="block";
  if(faceFilterCanvas) faceFilterCanvas.style.display="block";
  $("liveOverlay").style.display="flex";
  $("captureBtn").classList.remove("hidden");
  $("retakeBtn").classList.add("hidden");
  $("postBtn").classList.add("hidden");
  $("downloadBtn").classList.add("hidden");
  photoBlob=null;
});

$("postBtn").addEventListener("click", uploadPhoto);

async function uploadPhoto() {
  if (!sbReady) {
    $("uploadStatus").textContent = "Connect Supabase first.";
    return;
  }

  if (!guest.id || !token || !photoBlob) return;

  const { data: count, error: countError } = await sb.rpc("count_guest_photos_by_invite_token", {
    p_invite_token: token
  });

  if (countError) {
    $("uploadStatus").textContent =
      "Could not check photo limit: " + countError.message;
    return;
  }

  if ((count || 0) >= MAX_GUEST_PHOTOS) {
    updatePhotoCounter(count || 0);
    $("uploadStatus").textContent =
      "You have already used all 3 photo slots.";
    return;
  }

  $("postBtn").disabled = true;
  $("uploadStatus").textContent = "Posting your photo...";

  // Keep a local preview URL so the guest sees the new image immediately.
  const localPreviewUrl = URL.createObjectURL(photoBlob);
  const form=new FormData();
  form.append("action","upload");
  form.append("invite_token",token);
  form.append("filter_name",currentStyle);
  form.append("photo",photoBlob,"wedding-selfie.png");
  const {data:uploadData,error:uploadError}=await requestGuestPhotos(form);

  if (uploadError) {
    URL.revokeObjectURL(localPreviewUrl);
    $("uploadStatus").textContent = "Upload failed: " + uploadError;
    $("postBtn").disabled = false;
    return;
  }
  const id=uploadData.photo.id;

  // Show the photo immediately instead of waiting for Storage signed URL propagation.
  prependLocalPhoto(
    localPreviewUrl,
    uploadData.photo.created_at || new Date().toISOString(),
    id
  );

  updatePhotoCounter((count || 0) + 1);

  $("uploadStatus").textContent =
    "Posted to your private invitation gallery.";
  $("postBtn").disabled = false;

  // Refresh from Supabase after a short delay. If the new object is not ready,
  // the local preview remains visible instead of disappearing.
  setTimeout(async () => {
    await loadMyPhotos({ preserveLocalId: id });
    setTimeout(() => URL.revokeObjectURL(localPreviewUrl), 5000);
  }, 900);
}


function prependLocalPhoto(url, createdAt, localId) {
  const gallery = $("myPhotos");
  if (!gallery) return;

  const empty = gallery.querySelector(".empty");
  if (empty) empty.remove();

  const fig = document.createElement("figure");
  fig.dataset.photoId = localId;
  fig.dataset.localPreview = "true";
  fig.innerHTML = `
    <img src="${url}" alt="Wedding selfie">
    <figcaption>
      Just posted · ${new Date(createdAt).toLocaleString()}
    </figcaption>
  `;

  gallery.prepend(fig);
}


function updatePhotoCounter(count) {
  const counter = document.getElementById("photoCounter");
  const postBtn = document.getElementById("postBtn");

  if (!counter) return;

  const remaining = Math.max(0, MAX_GUEST_PHOTOS - count);
  counter.textContent = `${count} / ${MAX_GUEST_PHOTOS} photos uploaded`;

  if (count >= MAX_GUEST_PHOTOS) {
    counter.textContent += " · Gallery complete";
    if (postBtn) {
      postBtn.disabled = true;
      postBtn.textContent = "3 Photo Limit Reached";
    }
  } else {
    counter.textContent += ` · ${remaining} remaining`;
    if (postBtn) {
      postBtn.disabled = false;
      postBtn.textContent = "Post to My Invitation";
    }
  }
}

async function loadMyPhotos(options = {}) {
  if (!sbReady || !guest.id || !token) return;

  const { preserveLocalId = null } = options;

  const {data:photoData,error}=await requestGuestPhotos({action:"list",invite_token:token});
  if(error){
    console.error("Could not load guest photos:",error);
    return;
  }
  const data=photoData.photos || [];

  const gallery = $("myPhotos");
  if (!gallery) return;

  updatePhotoCounter(data?.length || 0);

  if (!data?.length) {
    // Do not wipe an optimistic local image while Supabase is catching up.
    if (!gallery.querySelector("[data-local-preview='true']")) {
      gallery.innerHTML = '<p class="empty">No photos posted yet.</p>';
    }
    return;
  }

  const rendered = [];

  for (const item of data) {
    if(item.signed_url) rendered.push({...item,signedUrl:item.signed_url});
  }

  // If the just-posted photo still has no signed URL, keep its local preview.
  const localFigure = preserveLocalId
    ? gallery.querySelector(`[data-photo-id="${preserveLocalId}"][data-local-preview="true"]`)
    : null;

  gallery.innerHTML = "";

  for (const item of rendered) {
    const fig = document.createElement("figure");
    fig.dataset.photoId = item.id;
    fig.innerHTML = `
      <img src="${item.signedUrl}" alt="Wedding selfie">
      <figcaption>${new Date(item.created_at).toLocaleString()}</figcaption>
    `;
    gallery.appendChild(fig);
  }

  const hasPreservedServerCopy =
    preserveLocalId &&
    rendered.some(item => item.id === preserveLocalId);

  if (localFigure && !hasPreservedServerCopy) {
    gallery.prepend(localFigure);
  }

  if (!gallery.children.length) {
    gallery.innerHTML = '<p class="empty">No photos posted yet.</p>';
  }
}

async function requestGuestPhotos(payload){
  try{
    const isForm=payload instanceof FormData;
    const response=await fetch(`${SUPABASE_URL}/functions/v1/guest-photos`,{
      method:"POST",
      headers:{apikey:SUPABASE_ANON_KEY,...(!isForm?{"Content-Type":"application/json"}:{})},
      body:isForm?payload:JSON.stringify(payload)
    });
    const result=await response.json();
    if(!response.ok) return {error:result.error || "Photo service request failed."};
    return {data:result,error:null};
  }catch(error){
    return {error:error.message || "Could not reach the photo service."};
  }
}


function renderLiveDecor(type){
  const overlay = $("liveOverlay");
  let layer = overlay.querySelector(".decor-layer");
  if(!layer){
    layer = document.createElement("div");
    layer.className = "decor-layer";
    overlay.appendChild(layer);
  }

  const layouts = {
    flowers: [
      ["🌿", "5%", "5%", "30px"], ["🌸", "14%", "4%", "28px"],
      ["🌿", "88%", "5%", "30px"], ["🌷", "80%", "5%", "27px"]
    ],
    sprigs: [
      ["🌿", "6%", "7%", "32px"], ["🤍", "84%", "8%", "25px"]
    ],
    petals: [
      ["🌸", "7%", "7%", "28px"], ["🌸", "84%", "10%", "24px"],
      ["🌼", "12%", "24%", "22px"]
    ],
    hearts: [
      ["🤍", "8%", "8%", "26px"], ["♡", "84%", "9%", "32px"]
    ],
    garden: [
      ["🌸", "3%", "5%", "32px"], ["🌷", "13%", "4%", "30px"],
      ["🌿", "23%", "5%", "29px"], ["🌼", "78%", "5%", "29px"],
      ["🌿", "88%", "6%", "31px"]
    ],
    birds: [
      ["🕊️", "31%", "7%", "38px"], ["❤", "48%", "9%", "22px"],
      ["🕊️", "57%", "7%", "38px"]
    ],
    arch: [
      ["🌿", "3%", "4%", "36px"], ["🌸", "12%", "3%", "30px"],
      ["🌿", "22%", "2%", "34px"], ["🌸", "74%", "3%", "30px"],
      ["🌿", "85%", "4%", "36px"]
    ],
    rings: [
      ["🌹", "7%", "6%", "31px"], ["💍", "44%", "6%", "34px"],
      ["🌹", "84%", "6%", "31px"]
    ]
  };

  layer.innerHTML = "";
  (layouts[type] || layouts.flowers).forEach(([char,left,top,size],i)=>{
    const span = document.createElement("span");
    span.className = "decor-item";
    span.textContent = char;
    span.style.left = left;
    span.style.top = top;
    span.style.fontSize = size;
    if(type === "birds" && i === 2){
      span.style.transform = "scaleX(-1)";
    }
    layer.appendChild(span);
  });
}

function drawCanvasDecor(ctx,type,w,h){
  const size = Math.max(35,w*.05);
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.font = `${size}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;

  const draw = (char,x,y,align="center",flip=false)=>{
    ctx.save();
    ctx.textAlign = align;
    if(flip){
      ctx.translate(x,y);
      ctx.scale(-1,1);
      ctx.fillText(char,0,0);
    }else{
      ctx.fillText(char,x,y);
    }
    ctx.restore();
  };

  if(type === "birds"){
    draw("🕊️",w*.40,h*.09);
    draw("❤",w*.50,h*.095);
    draw("🕊️",w*.60,h*.09,"center",true);
  }else if(type === "garden"){
    draw("🌸",w*.08,h*.08); draw("🌷",w*.17,h*.07);
    draw("🌿",w*.27,h*.08); draw("🌼",w*.83,h*.08);
    draw("🌿",w*.92,h*.08);
  }else if(type === "arch"){
    draw("🌿",w*.07,h*.08); draw("🌸",w*.17,h*.06);
    draw("🌿",w*.28,h*.055); draw("🌿",w*.72,h*.055);
    draw("🌸",w*.83,h*.06); draw("🌿",w*.93,h*.08);
  }else if(type === "rings"){
    draw("🌹",w*.10,h*.08); draw("💍",w*.50,h*.075);
    draw("🌹",w*.90,h*.08);
  }else if(type === "hearts"){
    draw("🤍",w*.10,h*.08); draw("♡",w*.90,h*.08);
  }else if(type === "petals"){
    draw("🌸",w*.10,h*.08); draw("🌸",w*.90,h*.10);
    draw("🌼",w*.15,h*.22);
  }else if(type === "sprigs"){
    draw("🌿",w*.10,h*.08); draw("🤍",w*.90,h*.08);
  }else{
    draw("🌿",w*.08,h*.08); draw("🌸",w*.16,h*.065);
    draw("🌿",w*.92,h*.08); draw("🌷",w*.84,h*.065);
  }
  ctx.restore();
}

function renderSeatingPlan(activeTable, activeSeat){
  const wrap = $("seatingPlan");
  if (!wrap) return;

  const capacities =
    typeof weddingConfig !== "undefined" && Array.isArray(weddingConfig.tableCapacities)
      ? weddingConfig.tableCapacities
      : [13, 24, 13];

  wrap.replaceChildren();
  let overallSeat = 0;

  capacities.forEach((capacity, tableIndex) => {
    const tableNumber = tableIndex + 1;
    const card = document.createElement("section");
    card.className = "seat-table";
    card.dataset.tableCard = tableNumber;
    card.classList.toggle("my-table", tableNumber === Number(activeTable));

    const title = document.createElement("div");
    title.className = "seat-table-title";
    title.innerHTML = `<span>Table · ${capacity} seats</span><strong>${tableNumber}</strong>`;

    const grid = document.createElement("div");
    grid.className = "seat-grid";

    for(let seatNumber = 1; seatNumber <= capacity; seatNumber += 1){
      overallSeat += 1;
      const chip = document.createElement("div");
      chip.className = "seat-chip";
      chip.dataset.table = tableNumber;
      chip.dataset.seat = seatNumber;
      chip.classList.toggle(
        "my-seat",
        tableNumber === Number(activeTable) && seatNumber === Number(activeSeat)
      );
      chip.innerHTML = `<span>${overallSeat}</span><small>S${seatNumber}</small>`;
      grid.appendChild(chip);
    }

    card.append(title, grid);
    wrap.appendChild(card);
  });
}

function roundRect(ctx,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
function canvasTextLines(ctx,text,maxWidth){
  const words=text.split(" ");let line="",lines=[];
  words.forEach(word=>{const test=line?`${line} ${word}`:word;
    if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test;});
  if(line)lines.push(line);
  return lines;
}

function fitCanvasFont(ctx,text,maxWidth,maxSize,minSize,weight,family,style="normal"){
  let size=maxSize;
  do {
    ctx.font=`${style} ${weight} ${size}px ${family}`;
    if(ctx.measureText(text).width<=maxWidth||size<=minSize) break;
    size-=1;
  } while(size>=minSize);
  return size;
}

// Slate-blue attire preview modal.
const attirePreviewTriggers = [...document.querySelectorAll(".attire-preview-trigger")];
const attirePreviewModal = $("attirePreviewModal");
const attireImageSwitcher = $("attireImageSwitcher");
const attireImageHint = $("attireImageHint");
const attireModalAudience = $("attireModalAudience");
const attireModalTitle = $("attireModalTitle");
const attireModalDescription = $("attireModalDescription");
let attireModalCloseTimer = null;
let attireModalLastFocus = null;
let attireModalScrollY = 0;
let activeAttireTrigger = null;

function lockAttireModalScroll(){
  if(document.body.classList.contains("attire-modal-open")) return;
  attireModalScrollY = window.scrollY;
  document.body.style.setProperty("--attire-scroll-lock-top", `-${attireModalScrollY}px`);
  document.documentElement.classList.add("attire-modal-open");
  document.body.classList.add("attire-modal-open");
}

function unlockAttireModalScroll(){
  const root = document.documentElement;
  const previousInlineScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  document.documentElement.classList.remove("attire-modal-open");
  document.body.classList.remove("attire-modal-open");
  document.body.style.removeProperty("--attire-scroll-lock-top");
  window.scrollTo(0, attireModalScrollY);
  requestAnimationFrame(() => {
    root.style.scrollBehavior = previousInlineScrollBehavior;
  });
}

function showNextAttireImage(){
  if(!attireImageSwitcher) return;
  const images = [...attireImageSwitcher.querySelectorAll("img:not(.is-gallery-hidden)")];
  if(images.length < 2) return;

  const activeIndex = Math.max(0, images.findIndex(image => image.classList.contains("is-active")));
  const nextIndex = (activeIndex + 1) % images.length;
  images[activeIndex].classList.remove("is-active");
  images[activeIndex].setAttribute("aria-hidden", "true");
  images[nextIndex].classList.add("is-active");
  images[nextIndex].setAttribute("aria-hidden", "false");
  const followingImage = images[(nextIndex + 1) % images.length];
  attireImageSwitcher.setAttribute(
    "aria-label",
    `Show the next ${followingImage.dataset.viewLabel || "attire outfit view"}`
  );
  if(attireImageHint){
    attireImageHint.textContent = `Tap photo to change view · ${nextIndex + 1} of ${images.length}`;
  }
}

function selectAttireGallery(trigger){
  if(!attireImageSwitcher || !trigger) return;
  const gallery = trigger.dataset.gallery;
  const allImages = [...attireImageSwitcher.querySelectorAll("img")];
  const galleryImages = allImages.filter(image => image.dataset.gallery === gallery);

  allImages.forEach(image => {
    const belongsToGallery = image.dataset.gallery === gallery;
    image.classList.toggle("is-gallery-hidden", !belongsToGallery);
    image.classList.remove("is-active");
    image.setAttribute("aria-hidden", "true");
  });

  const firstImage = galleryImages[0];
  firstImage?.classList.add("is-active");
  firstImage?.setAttribute("aria-hidden", "false");

  if(attireImageHint){
    attireImageHint.textContent = `Tap photo to change view · 1 of ${galleryImages.length}`;
  }
  if(attireModalAudience) attireModalAudience.textContent = trigger.dataset.audience || "Wedding Guest";
  if(attireModalTitle) attireModalTitle.textContent = trigger.dataset.title || "Slate Blue Inspiration";
  if(attireModalDescription) attireModalDescription.textContent = trigger.dataset.description || "";

  const nextImage = galleryImages[1] || firstImage;
  attireImageSwitcher.setAttribute(
    "aria-label",
    `Show the next ${nextImage?.dataset.viewLabel || "attire outfit view"}`
  );
  activeAttireTrigger = trigger;
}

function replayAttireModalFade(){
  if(!attirePreviewModal) return;
  attirePreviewModal.classList.remove("is-changing");
  void attirePreviewModal.offsetWidth;
  attirePreviewModal.classList.add("is-changing");
  window.setTimeout(() => attirePreviewModal.classList.remove("is-changing"), 360);
}

function openAttireModal(event){
  const trigger = event?.currentTarget instanceof HTMLElement ? event.currentTarget : activeAttireTrigger;
  if(!attirePreviewModal || !trigger) return;

  trigger.closest(".palette")?.classList.add("has-been-used");

  window.clearTimeout(attireModalCloseTimer);
  selectAttireGallery(trigger);
  attirePreviewTriggers.forEach(item => item.setAttribute("aria-expanded", "false"));
  trigger.setAttribute("aria-expanded", "true");

  if(!attirePreviewModal.hidden){
    if(attirePreviewModal.classList.contains("is-open")){
      replayAttireModalFade();
    }else{
      attirePreviewModal.setAttribute("aria-hidden", "false");
      lockAttireModalScroll();
      requestAnimationFrame(() => attirePreviewModal.classList.add("is-open"));
    }
    return;
  }

  attireModalLastFocus = document.activeElement;
  attirePreviewModal.hidden = false;
  attirePreviewModal.setAttribute("aria-hidden", "false");
  lockAttireModalScroll();

  requestAnimationFrame(() => {
    attirePreviewModal.classList.add("is-open");
    attirePreviewModal.querySelector(".attire-modal-close")?.focus();
  });
}

function closeAttireModal(){
  if(!attirePreviewModal || attirePreviewModal.hidden) return;

  attirePreviewModal.classList.remove("is-open", "is-changing");
  activeAttireTrigger?.setAttribute("aria-expanded", "false");
  if(attireModalLastFocus instanceof HTMLElement){
    attireModalLastFocus.focus({preventScroll:true});
  }
  attirePreviewModal.setAttribute("aria-hidden", "true");

  attireModalCloseTimer = window.setTimeout(() => {
    attirePreviewModal.hidden = true;
    unlockAttireModalScroll();
  }, 380);
}

if(attirePreviewTriggers.length && attirePreviewModal){
  attirePreviewTriggers.forEach(trigger => trigger.addEventListener("click", openAttireModal));
  attireImageSwitcher?.addEventListener("click", showNextAttireImage);

  attirePreviewModal.querySelectorAll("[data-attire-close]").forEach(control => {
    control.addEventListener("click", closeAttireModal);
  });

  document.addEventListener("keydown", event => {
    const modalIsOpen = !attirePreviewModal.hidden;

    if(event.key === "Escape" && modalIsOpen){
      closeAttireModal();
    }

    if(event.key === "Tab" && modalIsOpen){
      event.preventDefault();
      const controls = [...attirePreviewModal.querySelectorAll("button:not([disabled])")];
      const currentIndex = controls.indexOf(document.activeElement);
      const nextIndex = event.shiftKey
        ? (currentIndex <= 0 ? controls.length - 1 : currentIndex - 1)
        : (currentIndex + 1) % controls.length;
      controls[nextIndex]?.focus();
    }

    const blockedScrollKeys = [" ", "Spacebar", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"];
    if(modalIsOpen && blockedScrollKeys.includes(event.key)){
      const isButtonActivation = (event.key === " " || event.key === "Spacebar") &&
        event.target instanceof HTMLElement && event.target.matches("button");
      if(!isButtonActivation) event.preventDefault();
    }
  });
}

// Keep wheel, trackpad and touch scrolling fully native. The fixed navigation
// is the only control that aligns a complete tab with the visible viewport.
const invitationNav = document.querySelector(".nav");
const invitationScroller = document.querySelector("main");
const invitationNavLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
const invitationNavSections = invitationNavLinks
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function markActiveInvitationTab(activeSection){
  invitationNavLinks.forEach(link => {
    const isActive = link.getAttribute("href") === `#${activeSection?.id}`;
    if(isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function showInvitationTab(link){
  const selector = link?.getAttribute("href");
  const section = selector?.startsWith("#") ? document.querySelector(selector) : null;
  if(!section) return false;
  section.scrollIntoView({behavior:"auto", block:"start"});
  history.replaceState?.(null, "", selector);
  markActiveInvitationTab(section);
  return true;
}

invitationNav?.addEventListener("click", event => {
  const link = event.target instanceof Element
    ? event.target.closest('.nav a[href^="#"]')
    : null;
  if(!link || !showInvitationTab(link)) return;
  event.preventDefault();
});

let activeTabFrame = 0;
function updateActiveInvitationTab(){
  const viewport = window.visualViewport;
  const viewportTop = viewport?.offsetTop || 0;
  const viewportBottom = viewportTop + (viewport?.height || window.innerHeight);
  const navBottom = invitationNav?.getBoundingClientRect?.().bottom || viewportTop;
  const readingLine = navBottom + Math.max(0, viewportBottom - navBottom) * .46;
  let activeSection = invitationNavSections[0];
  let nearestDistance = Infinity;
  invitationNavSections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if(rect.top <= readingLine && rect.bottom > readingLine){
      activeSection = section;
      nearestDistance = 0;
      return;
    }
    if(nearestDistance === 0) return;
    const distance = Math.abs((rect.top + rect.bottom) / 2 - readingLine);
    if(distance < nearestDistance){
      nearestDistance = distance;
      activeSection = section;
    }
  });
  if(activeSection) markActiveInvitationTab(activeSection);
}

function scheduleActiveInvitationTab(){
  cancelAnimationFrame(activeTabFrame);
  activeTabFrame = requestAnimationFrame(updateActiveInvitationTab);
}

window.addEventListener("scroll", scheduleActiveInvitationTab, {passive:true});
invitationScroller?.addEventListener("scroll", scheduleActiveInvitationTab, {passive:true});
window.visualViewport?.addEventListener("resize", scheduleActiveInvitationTab, {passive:true});
scheduleActiveInvitationTab();

loadGuest();
