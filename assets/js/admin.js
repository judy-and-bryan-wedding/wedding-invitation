const ready =
  typeof SUPABASE_URL !== "undefined" &&
  typeof SUPABASE_ANON_KEY !== "undefined" &&
  !SUPABASE_URL.includes("PASTE_") &&
  !SUPABASE_ANON_KEY.includes("PASTE_") &&
  SUPABASE_URL.trim() !== "" &&
  SUPABASE_ANON_KEY.trim() !== "";

const status=document.getElementById("adminStatus");
const authStatus=document.getElementById("adminAuthStatus");
const loginCard=document.getElementById("adminLogin");
const workspace=document.getElementById("adminWorkspace");
const tableInput=document.getElementById("tableInput");
const seatInput=document.getElementById("seatInput");
const seatingCapacities =
  typeof weddingConfig !== "undefined" && Array.isArray(weddingConfig.tableCapacities)
    ? weddingConfig.tableCapacities
    : [13, 24, 13];

function updateSeatLimit(){
  const tableNumber=Number(tableInput.value);
  const capacity=seatingCapacities[tableNumber-1];
  seatInput.max=capacity || Math.max(...seatingCapacities);
  seatInput.placeholder=capacity ? `Seat 1-${capacity}` : "Seat for table";
}

tableInput.addEventListener("input",updateSeatLimit);
updateSeatLimit();

let sb=null;

if(!ready){
  authStatus.textContent="Supabase is not configured for this site.";
}else{
  sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
  sb.auth.getSession().then(({data})=>showAdminIfAuthorized(data.session));
  sb.auth.onAuthStateChange((_event,session)=>{
    setTimeout(()=>showAdminIfAuthorized(session),0);
  });
}

document.getElementById("adminSignIn").addEventListener("click",async()=>{
  if(!sb)return;
  authStatus.textContent="Signing in…";
  const {error}=await sb.auth.signInWithPassword({
    email:document.getElementById("adminEmail").value.trim(),
    password:document.getElementById("adminPassword").value
  });
  if(error)authStatus.textContent=error.message;
});

document.getElementById("adminSignOut").addEventListener("click",()=>sb?.auth.signOut());

async function showAdminIfAuthorized(session){
  if(!session){
    loginCard.hidden=false;
    workspace.hidden=true;
    return;
  }
  const {data,error}=await sb.rpc("is_wedding_admin");
  if(error||data!==true){
    authStatus.textContent="This account is not authorized for the couple dashboard.";
    await sb.auth.signOut();
    return;
  }
  authStatus.textContent="";
  loginCard.hidden=true;
  workspace.hidden=false;
  await Promise.all([loadGuests(),loadPhotos()]);
}

document.getElementById("addGuestBtn").addEventListener("click",async()=>{
  if(!sb){
    status.textContent="Supabase is not configured for this site.";
    return;
  }

  const name=document.getElementById("guestInput").value.trim();
  const reservation=document.getElementById("reservationInput").value.trim();
  const tableValue=tableInput.value.trim();
  const seatValue=seatInput.value.trim();
  const tableNumber=Number(tableValue);
  const seatNumber=Number(seatValue);

  if(!name){
    status.textContent="Enter the guest name.";
    return;
  }

  if((tableValue && !seatValue) || (!tableValue && seatValue)){
    status.textContent="Enter both a table and seat, or leave both blank.";
    return;
  }

  if(tableValue){
    const capacity=seatingCapacities[tableNumber-1];
    if(!Number.isInteger(tableNumber) || !capacity){
      status.textContent=`Choose a table from 1 to ${seatingCapacities.length}.`;
      return;
    }
    if(!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > capacity){
      status.textContent=`Table ${tableNumber} has seats 1 to ${capacity}.`;
      return;
    }
  }

  const token=crypto.randomUUID().replaceAll("-","");

  const {error}=await sb.from("guests").insert({
    name,
    invite_token:token,
    reservation_number: reservation || null,
    table_number: tableValue ? tableNumber : null,
    seat_number: seatValue ? seatNumber : null
  });

  status.textContent=error?error.message:"Guest created.";

  if(!error){
    document.getElementById("guestInput").value="";
    document.getElementById("reservationInput").value="";
    tableInput.value="";
    seatInput.value="";
    updateSeatLimit();
    await loadGuests();
  }
});

async function loadGuests(){
  if(!sb)return;

  const {data,error}=await sb
    .from("guests")
    .select("id,name,invite_token,active,reservation_number,table_number,seat_number,rsvp_status,rsvp_note,rsvp_responded_at")
    .order("name");

  if(error){
    status.textContent=error.message;
    return;
  }

  const box=document.getElementById("guestList");
  box.innerHTML="";

  const accepted=data.filter(g=>g.rsvp_status==="accepted").length;
  const declined=data.filter(g=>g.rsvp_status==="declined").length;
  const pending=data.length-accepted-declined;
  status.textContent=`RSVP totals: ${accepted} accepted · ${declined} declined · ${pending} awaiting response`;

  data.forEach(g=>{
    const url=`${location.origin}${location.pathname.replace("admin.html","index.html")}?invite=${g.invite_token}`;

    const row=document.createElement("div");
    row.style.cssText="padding:14px 0;border-top:1px solid rgba(0,0,0,.08);display:grid;gap:6px";
    row.innerHTML=`
      <strong>${escapeHtml(g.name)}</strong>
      <span class="admin-rsvp admin-rsvp-${escapeHtml(g.rsvp_status || "pending")}">${formatRsvpStatus(g.rsvp_status)}</span>
      ${g.rsvp_note ? `<em class="admin-rsvp-note">&ldquo;${escapeHtml(g.rsvp_note)}&rdquo;</em>` : ""}
      ${g.rsvp_responded_at ? `<small>Responded ${escapeHtml(new Date(g.rsvp_responded_at).toLocaleString())}</small>` : ""}
      <code style="word-break:break-all">${url}</code>
      <button class="btn secondary copy" data-url="${url}" style="width:max-content">Copy Invitation Link</button>`;

    box.appendChild(row);
  });

  document.querySelectorAll(".copy").forEach(b=>{
    b.onclick=async()=>{
      await navigator.clipboard.writeText(b.dataset.url);
      status.textContent="Invitation link copied.";
    };
  });
}

function formatRsvpStatus(value){
  if(value === "accepted") return "Joyfully accepted";
  if(value === "declined") return "Regretfully declined";
  return "Awaiting response";
}

async function loadPhotos(){
  if(!sb)return;

  const {data,error}=await sb
    .from("guest_photos")
    .select("id,storage_path,created_at,filter_name,guests(name)")
    .order("created_at",{ascending:false});

  if(error){
    status.textContent=error.message;
    return;
  }

  const box=document.getElementById("allPhotos");
  box.innerHTML="";

  if(!data.length){
    box.innerHTML='<p class="empty">No guest photos yet.</p>';
    return;
  }

  for(const p of data){
    const {data:u}=await sb.storage
      .from("wedding-photos")
      .createSignedUrl(p.storage_path,3600);

    const f=document.createElement("figure");
    f.innerHTML=`
      <img src="${u?.signedUrl||""}" alt="">
      <figcaption>
        <strong>${escapeHtml(p.guests?.name||"Guest")}</strong><br>
        ${new Date(p.created_at).toLocaleString()}
      </figcaption>`;

    box.appendChild(f);
  }
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}
