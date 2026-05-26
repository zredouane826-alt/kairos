import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KAIROS <onboarding@resend.dev>",
        to: ["rzoubiri826@gmail.com"],
        subject: `Nouvelle demande PRO — ${record.restaurant_name || record.name || "Inconnu"}`,
        html: `
          <h2>Nouvelle demande d'accès PRO</h2>
          <table cellpadding="8" style="border-collapse:collapse">
            <tr><td><b>Nom :</b></td><td>${record.name || "—"}</td></tr>
            <tr><td><b>Restaurant :</b></td><td>${record.restaurant_name || "—"}</td></tr>
            <tr><td><b>Téléphone :</b></td><td>${record.phone || "—"}</td></tr>
            <tr><td><b>Email :</b></td><td>${record.email || "—"}</td></tr>
            <tr><td><b>Date :</b></td><td>${new Date(record.created_at).toLocaleString("fr-FR")}</td></tr>
          </table>
        `,
      }),
    });

    const data = await res.json();
    console.log("Resend response:", JSON.stringify(data));
    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
