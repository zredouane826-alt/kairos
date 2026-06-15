import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ULTRAMSG_INSTANCE = Deno.env.get("ULTRAMSG_INSTANCE_ID")!;
const ULTRAMSG_TOKEN    = Deno.env.get("ULTRAMSG_TOKEN")!;

function algerianToInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0"))   return "213" + digits.slice(1);
  return "213" + digits;
}

async function sendWhatsApp(
  phone: string,
  message: string,
  reservationId: string,
): Promise<boolean> {
  try {
    const to   = algerianToInternational(phone);
    const body = new URLSearchParams({ token: ULTRAMSG_TOKEN, to, body: message });

    const res  = await fetch(
      `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() },
    );
    const json = await res.json();
    const ok   = json?.sent === true || res.ok;

    await supabase.from("notification_logs").insert({
      reservation_id: reservationId,
      channel:        "whatsapp",
      status:         ok ? "sent" : "failed",
      error_message:  ok ? null : JSON.stringify(json),
    });
    return ok;
  } catch (e) {
    await supabase.from("notification_logs").insert({
      reservation_id: reservationId,
      channel:        "whatsapp",
      status:         "failed",
      error_message:  String(e),
    });
    return false;
  }
}

async function sendPush(
  pushToken: string | null,
  restaurantName: string,
  timeSlot: string,
  reservationId: string,
): Promise<boolean> {
  if (!pushToken) return false;

  try {
    const res  = await fetch("https://exp.host/--/api/v2/push/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        to:    pushToken,
        title: "Rappel Mida 🍽️",
        body:  `Votre réservation chez ${restaurantName} est demain à ${timeSlot}`,
        data:  { reservation_id: reservationId },
      }),
    });
    const json = await res.json();
    const ok   = json?.data?.status === "ok" || res.ok;

    await supabase.from("notification_logs").insert({
      reservation_id: reservationId,
      channel:        "push",
      status:         ok ? "sent" : "failed",
      error_message:  ok ? null : JSON.stringify(json),
    });
    return ok;
  } catch (e) {
    await supabase.from("notification_logs").insert({
      reservation_id: reservationId,
      channel:        "push",
      status:         "failed",
      error_message:  String(e),
    });
    return false;
  }
}

Deno.serve(async (_req) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: reservations, error } = await supabase
      .from("reservations")
      .select(`
        id, time_slot, nb_adults, nb_children,
        users!user_id (first_name, phone, expo_push_token),
        restaurants!restaurant_id (name)
      `)
      .eq("date", tomorrowStr)
      .eq("status", "confirmed")
      .or("reminder_whatsapp_sent.eq.false,reminder_push_sent.eq.false");

    if (error) throw error;

    if (!reservations?.length) {
      return new Response(
        JSON.stringify({ ok: true, processed: 0, message: "Aucune réservation à rappeler." }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    let processed = 0;

    for (const resa of reservations) {
      const user:       any = resa.users;
      const restaurant: any = resa.restaurants;

      const firstName      = user?.first_name  ?? "Cher client";
      const phone          = user?.phone        ?? "";
      const pushToken      = user?.expo_push_token ?? null;
      const restaurantName = restaurant?.name   ?? "votre restaurant";
      const timeSlot       = resa.time_slot     ?? "";
      const total          = (resa.nb_adults ?? 0) + (resa.nb_children ?? 0);

      const whatsappMsg =
        `Bonjour ${firstName} 👋\n` +
        `Rappel : votre réservation chez ${restaurantName} est demain à ${timeSlot}\n` +
        `pour ${total} personne(s).\n` +
        `À demain ! 🍽️\n— L'équipe Mida`;

      const [waResult, pushResult] = await Promise.allSettled([
        phone ? sendWhatsApp(phone, whatsappMsg, resa.id) : Promise.resolve(false),
        sendPush(pushToken, restaurantName, timeSlot, resa.id),
      ]);

      const waSent   = waResult.status   === "fulfilled" && waResult.value   === true;
      const pushSent = pushResult.status === "fulfilled" && pushResult.value === true;

      const updates: Record<string, boolean> = {};
      if (waSent)   updates.reminder_whatsapp_sent = true;
      if (pushSent) updates.reminder_push_sent     = true;

      if (Object.keys(updates).length > 0) {
        await supabase.from("reservations").update(updates).eq("id", resa.id);
      }

      processed++;
      console.log(`[${resa.id}] wa=${waSent} push=${pushSent}`);
    }

    return new Response(
      JSON.stringify({ ok: true, processed }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-reminders error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
