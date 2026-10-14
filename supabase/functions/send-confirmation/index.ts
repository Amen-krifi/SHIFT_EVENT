import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { full_name, email, pass_code, qr_code_url, university, faculty } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing recipient email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetCode = pass_code || `SHFT-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const qrUrl = qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent("https://shift-event.tn/?verify=" + targetCode + "&email=" + email)}`;

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPass = Deno.env.get("GMAIL_APP_PASSWORD");

    let emailSent = false;
    let message = "QR Pass email dispatched successfully";

    if (gmailUser && gmailPass && !gmailUser.includes("your-aiesec-address")) {
      try {
        // @ts-ignore
        const nodemailer = await import("npm:nodemailer");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: gmailUser, pass: gmailPass },
        });

        await transporter.sendMail({
          from: `"SHIFT 2026 · AIESEC in Bardo" <${gmailUser}>`,
          to: email,
          subject: "Your Official Pass & Entry QR Code — SHIFT 2026 Executive Summit",
          html: `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#0a0a0c;color:#fff;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#141416;border:1px solid #28282a;border-radius:16px;padding:28px;text-align:center;">
    <h2 style="color:#fff;margin:0 0 6px;">SHIFT<span style="color:#9FD54B;">.2026</span></h2>
    <p style="color:#9FD54B;font-size:12px;text-transform:uppercase;margin:0 0 20px;">AIESEC in Bardo · Executive AI Summit</p>
    <h3 style="color:#fff;margin:0 0 10px;">Welcome, ${full_name || 'Delegate'}</h3>
    <p style="color:#bbb;font-size:14px;line-height:1.5;">Your registration is confirmed. Please show your official gate QR code upon arrival at HIDE University on <strong>Saturday, 28 November 2026</strong>.</p>
    <div style="background:#fff;padding:16px;border-radius:12px;display:inline-block;margin:20px auto;">
      <img src="${qrUrl}" alt="Entry QR Code" width="220" height="220" style="display:block;" />
    </div>
    <div style="font-family:monospace;font-size:15px;color:#9FD54B;font-weight:bold;">${targetCode}</div>
    <p style="color:#888;font-size:12px;margin-top:20px;">Venue: HIDE University, Tunis · Doors Open: 08:30 AM</p>
  </div>
</body>
</html>`,
        });
        emailSent = true;
      } catch (err: any) {
        console.error("Deno email error:", err);
        message = "Edge email notice: " + (err.message || String(err));
      }
    }

    return new Response(JSON.stringify({ success: true, email_sent: emailSent, pass_code: targetCode, message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
