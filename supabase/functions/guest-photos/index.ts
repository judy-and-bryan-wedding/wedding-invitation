import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
  const serviceKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !serviceKey) return json({ error: "Photo service is not configured." }, 500);

  const admin = createClient(projectUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const contentType = request.headers.get("content-type") || "";
    const isForm = contentType.includes("multipart/form-data");
    const form = isForm ? await request.formData() : null;
    const body = form ? null : await request.json();
    const action = String(form?.get("action") ?? body?.action ?? "");
    const token = String(form?.get("invite_token") ?? body?.invite_token ?? "");
    if (!/^[a-f0-9]{20,64}$/i.test(token)) return json({ error: "Invitation link is invalid." }, 400);

    const { data: guest, error: guestError } = await admin
      .from("guests")
      .select("id")
      .eq("invite_token", token)
      .eq("active", true)
      .maybeSingle();
    if (guestError || !guest) return json({ error: "Invitation link is invalid or inactive." }, 404);

    if (action === "list") {
      const { data: photos, error } = await admin
        .from("guest_photos")
        .select("id,storage_path,created_at,filter_name")
        .eq("guest_id", guest.id)
        .order("created_at", { ascending: false });
      if (error) return json({ error: "Could not load photos." }, 500);

      const withUrls = await Promise.all((photos || []).map(async (photo) => {
        const { data } = await admin.storage.from("wedding-photos")
          .createSignedUrl(photo.storage_path, 3600);
        return { ...photo, signed_url: data?.signedUrl || null };
      }));
      return json({ photos: withUrls });
    }

    if (action !== "upload" || !form) return json({ error: "Unsupported photo request." }, 400);
    const file = form.get("photo");
    if (!(file instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return json({ error: "Choose a PNG, JPG, or WEBP image." }, 400);
    }
    if (file.size > 8 * 1024 * 1024) return json({ error: "Photo must be 8 MB or smaller." }, 413);

    const { count, error: countError } = await admin.from("guest_photos")
      .select("id", { count: "exact", head: true }).eq("guest_id", guest.id);
    if (countError) return json({ error: "Could not check the photo limit." }, 500);
    if ((count || 0) >= 3) return json({ error: "This invitation has reached its 3 photo limit." }, 409);

    const id = crypto.randomUUID();
    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
    const path = `${guest.id}/${id}.${extension}`;
    const { error: uploadError } = await admin.storage.from("wedding-photos").upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) return json({ error: "Photo upload failed." }, 500);

    const { data: photo, error: insertError } = await admin.from("guest_photos").insert({
      id,
      guest_id: guest.id,
      invite_token: token,
      storage_path: path,
      filter_name: String(form.get("filter_name") || "accept").slice(0, 40),
    }).select("id,storage_path,created_at,filter_name").single();
    if (insertError) {
      await admin.storage.from("wedding-photos").remove([path]);
      return json({ error: "Could not save the photo record." }, 500);
    }

    const { data: signed } = await admin.storage.from("wedding-photos")
      .createSignedUrl(path, 3600);
    return json({ photo: { ...photo, signed_url: signed?.signedUrl || null } }, 201);
  } catch {
    return json({ error: "Photo service request failed." }, 500);
  }
});
