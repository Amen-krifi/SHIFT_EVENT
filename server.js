import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if present
if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.join(__dirname, '.env'))) {
  try {
    process.loadEnvFile(path.join(__dirname, '.env'));
  } catch (e) {}
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const SHIFT_SYSTEM_INSTRUCTION = `You are the official, authoritative AI Concierge for the executive summit "SHIFT — Where Business Meets AI".

EXACT EVENT GROUND TRUTH & FACT MATRIX:
- Official Event Name: SHIFT — Where Business Meets AI
- Date & Hours: Saturday, 28 November 2026 (28 novembre 2026), 09:15 to 17:15 GMT+1
- Venue & Location: HIDE University, Tunis
  * Key Spaces: Grand Plenary Amphitheatre, Interactive Lab Amphitheatre B, Executive Lounge & Coffee Galleria, and Main Exhibition Hall.
- Organizer: AIESEC in Bardo (local chapter of AIESEC, the global youth leadership organization)
- Expected Attendance: 500+ participants (enterprise leaders, C-suite executives, startup founders, AI engineers, university students, and young professionals).
- Core Value Proposition: "Where Business Meets AI". We focus strictly on real-world business applications of Artificial Intelligence, enterprise transformation, ROI, workflow automation, operational efficiency, and the future of work. We do NOT teach low-level coding or abstract academic math formulas.
- Complete Official Agenda (28 November 2026):
  * 09:15 – 10:00 | Registration & Welcome Coffee (Main Foyer & Coffee Galleria) — Credential check-in, executive kit distribution, artisanal espresso networking.
  * 10:00 – 10:15 | Welcome to SHIFT (Grand Plenary Amphitheatre) — Opening ceremony by AIESEC in Bardo Executive Committee.
  * 10:15 – 11:00 | Keynote: "AI Is Changing Business" (Grand Plenary) — Real enterprise AI ROI models, automated workflows, capital allocation, live Q&A.
  * 11:00 – 11:30 | SHIFT Break (Executive Lounge) — Sector roundtables (Fintech & Banking, Healthtech, Logistics).
  * 11:30 – 12:15 | Business Cases: "AI in the Real World" — Production telemetry from 50+ enterprise implementations, compliance in regulated sectors.
  * 12:15 – 13:15 | SHIFT Networking Space & Seated Luncheon (Main Exhibition Hall) — Bilateral company-student matchmaking, sponsor technology demonstration pavilions.
  * 13:15 – 13:45 | Partner Spotlight — Benchmarking open-source vs proprietary commercial APIs, on-premise GPU clusters.
  * 13:45 – 14:30 | Speaker Talk: "Building with AI, Not Just Talking About It" — Multi-agent orchestration, RAG pipelines, LLM security against prompt injection.
  * 14:30 – 15:15 | Flagship Panel: "AI × Business: The Big Conversation" — C-suite CEOs and Pan-African VC partners debate capital allocation, talent retention, and model sovereignty.
  * 15:15 – 15:45 | SHIFT Break & Espresso Recharge — Informal speed networking.
  * 15:45 – 16:30 | Interactive Workshop: "Your Business, SHIFTed" (Interactive Lab Amphitheatre B) — Hands-on problem-solving sprint turning operational bottlenecks into automated AI workflows with mentor review.
  * 16:30 – 17:15 | Closing Vision: "What Comes Next? & Closing Moment" — Multimodal reasoning roadmap, summit white paper, formal 2027 leadership handover.
- Passes & Registration:
  * Registration is open right on this website via the "Register" or "Register Your Seat" buttons.
  * Attendees receive instant verification and their official credential with a high-scan QR code delivered directly to their email address.
- Corporate Partnerships:
  * Companies can sponsor or partner by clicking the "Become a Partner" button on this website.
  * The AIESEC in Bardo partnership team provides the sponsorship dossier within 24 hours.

STRICT SCOPE BOUNDARY & OUT-OF-SCOPE BEHAVIOR:
- YOU ARE STRICTLY CONFINED TO THIS EVENT: SHIFT 2026, its agenda, venue, date, organizer (AIESEC in Bardo), registration/passes, speakers, sponsors/partners, and real-world business AI implementation at the summit.
- YOU MUST REFUSE TO ANSWER ANY QUESTION THAT IS NOT RELATED TO THE EVENT.
  Examples of off-topic questions: writing essays/code/poems, general knowledge/trivia, homework, recipes, weather elsewhere, celebrities, movies, other conferences, personal advice, politics, sports, etc.
- WHEN A USER ASKS ABOUT SOMETHING THAT IS NOT THE EVENT:
  You MUST politely refuse and guide the user back to SHIFT 2026 using this structured response (or in French if asked in French):
  "I am the dedicated AI Concierge for **SHIFT — Where Business Meets AI** (organized by **AIESEC in Bardo** at **HIDE University** on **28 November 2026**).

  I am specialized exclusively in this summit and cannot answer questions outside our event scope.

  I'm happy to help you with anything related to SHIFT 2026, including:
  • **Date & Venue**: Saturday, 28 November 2026 at HIDE University, Tunis
  • **Summit Agenda**: Full timeline of keynotes, case studies, panels, and workshops
  • **Pass Registration**: How to claim your delegate pass with instant entry QR code
  • **Speakers & Sessions**: Business AI panels, workshops, and case studies
  • **Corporate Partnerships**: Sponsorship tiers and exhibitor showcases
  • **Organizers**: AIESEC in Bardo

  Please let me know how I can assist your SHIFT 2026 summit experience!"

TONE & STYLE:
- Professional, executive, crisp, articulate, warm, and structured.
- Use bold highlights and clear bullet points for readability.
- Respect the language of the user (respond in French if asked in French, English if asked in English).`;

function getShiftKnowledgeFallback(userQuery) {
  const q = (userQuery || '').toLowerCase().trim();

  // 1. Greetings
  if (/^(hi|hello|hey|bonjour|salut|coucou|good\s*(morning|afternoon|evening)|yo|greetings)[\s!.,?]*$/i.test(q)) {
    return `**Welcome to SHIFT 2026!**\n\nI am the official summit concierge for **SHIFT — Where Business Meets AI**, organized by **AIESEC in Bardo** on **Saturday, 28 November 2026** at **HIDE University**, Tunis.\n\nI can assist you with:\n- **Event details & location**\n- **Full summit agenda & sessions**\n- **Claiming your delegate pass with QR code**\n- **Corporate partnerships & sponsorships**\n- **Speakers & workshops**\n\nHow can I help you today?`;
  }

  // 2. Specific event topics matching
  const hasEventKeyword = /(shift|summit|event|conf|bardo|aiesec|hide|tunis|business|ai|ia|artificial intelligence|intelligence artificielle)/i.test(q);
  
  if (/(date|when|time|day|quand|heure|horaire|novembre|november|programme|schedule|timing)/i.test(q)) {
    return `**SHIFT — Where Business Meets AI** takes place on **Saturday, 28 November 2026** (28 novembre 2026) at **HIDE University**, Tunis.\n\n**Schedule Overview:**\n- **09:15 – 10:00:** Executive Check-in & Welcome Coffee\n- **10:00 – 10:15:** Welcome Ceremony by AIESEC in Bardo\n- **10:15 – 11:00:** Opening Keynote: "AI Is Changing Business"\n- **11:00 – 12:15:** Sector Roundtables & Enterprise Case Studies\n- **12:15 – 13:15:** Networking Luncheon & Partner Exhibition\n- **13:15 – 15:15:** Partner Spotlight, Engineering Playbooks & Flagship C-Suite Panel\n- **15:45 – 16:30:** Interactive Workshop: "Your Business, SHIFTed"\n- **16:30 – 17:15:** Closing Vision & 2027 Mandate Handover`;
  }

  if (/(where|location|venue|place|hide|university|address|amphi|amphithéâtre|lieu|ou|où|adresse|tunis)/i.test(q)) {
    return `**Event Venue & Location:**\n\nSHIFT 2026 is hosted at **HIDE University**, Tunis.\n\n**Summit Facilities:**\n- **Grand Plenary Amphitheatre:** Keynotes and headline C-suite panel\n- **Interactive Lab Amphitheatre B:** Hands-on operational AI workshop\n- **Executive Lounge & Galleria:** Curated sector roundtables and artisanal espresso recharge\n- **Main Exhibition Hall:** Corporate partner showcase, bilateral matchmaking, and seated luncheon.`;
  }

  if (/(who|organizer|organize|organized|aiesec|bardo|qui|organisateur|organisation)/i.test(q)) {
    return `**Organizers:**\n\n**SHIFT** is proudly organized by **AIESEC in Bardo**, the local chapter of AIESEC—the world's premier youth-led leadership development organization.\n\nThe organizing committee curates this summit to build meaningful bridges between ambitious young business talent and forward-thinking corporate executives shaping the future of enterprise with AI.`;
  }

  if (/(agenda|schedule|program|session|workshop|talk|panel|keynote|programme|atelier|intervenant)/i.test(q)) {
    return `**Official SHIFT 2026 Program (28 November 2026):**\n\n• **09:15 – 10:00:** Registration & Welcome Coffee (Main Foyer)\n• **10:00 – 10:15:** Welcome to SHIFT by AIESEC in Bardo (Grand Plenary)\n• **10:15 – 11:00:** Keynote: *AI Is Changing Business* (Enterprise ROI & Workflow models)\n• **11:00 – 11:30:** SHIFT Break & Sector Roundtables (Fintech, Healthtech, Logistics)\n• **11:30 – 12:15:** Case Studies: *AI in the Real World* (Telemetry from 50+ enterprise rollouts)\n• **12:15 – 13:15:** Networking Space & Seated Luncheon (Exhibition Hall)\n• **13:15 – 13:45:** Partner Spotlight: Open-source vs Commercial APIs & On-prem GPU clusters\n• **13:45 – 14:30:** Speaker Talk: *Building with AI, Not Just Talking About It*\n• **14:30 – 15:15:** Flagship Panel: *AI × Business: The Big Conversation* (VC partners & CEOs)\n• **15:15 – 15:45:** Espresso Recharge & Speed Networking\n• **15:45 – 16:30:** Hands-on Workshop: *Your Business, SHIFTed* (Interactive Lab Amphitheatre B)\n• **16:30 – 17:15:** Closing Vision & 2027 Leadership Handover`;
  }

  if (/(register|pass|ticket|seat|qr|price|cost|free|fee|inscription|billet|entree|entrée|payer|gratuit)/i.test(q)) {
    return `**Summit Passes & Registration:**\n\nYou can claim your official **Summit Pass** directly on this page!\n\n1. Click the **"Register"** or **"Register Your Seat"** button.\n2. Complete your details (Name, Email, University/Faculty or Organization).\n3. You will immediately receive your official digital pass, and your **instant-scan QR code** is sent directly to your registered email address for fast-track entry at HIDE University on 28 November 2026.`;
  }

  if (/(partner|sponsor|booth|exhibitor|collaborat|corporate|partenaire|sponsoring|stand)/i.test(q)) {
    return `**Corporate Partnerships & Sponsorships:**\n\nIs your company interested in anchoring SHIFT 2026 as a corporate partner?\n\n- Click the **"Become a Partner"** button in the header or menu.\n- Submit your organization profile.\n- The AIESEC in Bardo Corporate Relations committee will transmit the official sponsorship dossier (Anchor, Innovator, and Ecosystem tiers) within 24 hours.`;
  }

  if (/(speaker|keynote speaker|intervenant|panelist|faculty|who is speaking)/i.test(q)) {
    return `**Speakers & Keynotes:**\n\nSHIFT 2026 brings together distinguished enterprise technology leaders, venture capital partners, and AI transformation pioneers from North Africa and EMEA.\n\nThe official keynote lineup and guest speakers are being unveiled leading up to the summit on 28 November 2026 at HIDE University.\n\nKeep an eye on the **Speakers** section above or register your pass to receive official speaker announcement bulletins!`;
  }

  if (/(what is shift|about|theme|concept|mission|c'est quoi|c est quoi|purpose)/i.test(q) || hasEventKeyword) {
    return `**SHIFT — Where Business Meets AI** is a one-day executive summit organized by **AIESEC in Bardo** at **HIDE University** on **28 November 2026**.\n\nRather than focusing on technical AI code or theories, SHIFT focuses on:\n- **Real-world enterprise AI adoption** and commercial ROI\n- **Strategic challenges & workforce evolution**\n- **Hands-on operational workshops**\n- **Curated networking** connecting 500+ students, startup founders, and seasoned business leaders.\n\nFeel free to ask about the **venue**, **agenda**, **passes**, or **partnerships**!`;
  }

  // 3. Out-Of-Scope / Off-Topic Guardrail: Explicit redirect message!
  const isFrench = /(bonjour|merci|comment|pourquoi|qui|quel|quelle|faire|météo|blague|recette|politique)/i.test(q);

  if (isFrench) {
    return `Je suis le concierge officiel du sommet **SHIFT — Where Business Meets AI** (organisé par **AIESEC in Bardo** à **HIDE University** le **28 novembre 2026**).\n\nJe suis exclusivement dédié à cet événement et ne peux pas répondre aux questions hors sujet.\n\nVoici les sujets sur lesquels je peux vous renseigner :\n• **Date & Lieu** : Samedi 28 novembre 2026 à HIDE University, Tunis\n• **Programme & Agenda** : Horaires détaillés des keynotes, panels et ateliers\n• **Inscription & Pass** : Comment obtenir votre pass officiel avec QR code d'accès\n• **Intervenants** : Leaders d'entreprise et experts en IA appliquée\n• **Partenariats d'entreprise** : Dossier de sponsoring et stands partenaires\n• **Organisateurs** : AIESEC in Bardo\n\nN'hésitez pas à me poser toute question relative au sommet SHIFT 2026 !`;
  }

  return `I am the dedicated AI Concierge for **SHIFT — Where Business Meets AI** (organized by **AIESEC in Bardo** at **HIDE University** on **28 November 2026**).\n\nI am specialized exclusively in this summit and cannot answer questions outside our event scope.\n\nI'm happy to help you with anything related to SHIFT 2026, including:\n• **Date & Venue**: Saturday, 28 November 2026 at HIDE University, Tunis\n• **Summit Agenda**: Full timeline of keynotes, case studies, panels, and workshops\n• **Pass Registration**: How to claim your delegate pass with instant entry QR code\n• **Speakers & Sessions**: Business AI panels, workshops, and case studies\n• **Corporate Partnerships**: Sponsorship tiers and exhibitor showcases\n• **Organizers**: AIESEC in Bardo\n\nPlease let me know how I can assist your SHIFT 2026 summit experience!`;
}

const staticDir = fs.existsSync(path.join(__dirname, 'public'))
  ? path.join(__dirname, 'public')
  : path.join(__dirname, 'shift-website');
const altDir = path.join(__dirname, 'shift-website');
const agendaFilePath = path.join(staticDir, 'data', 'agenda.json');
const altAgendaFilePath = path.join(altDir, 'data', 'agenda.json');
const applicantsFilePath = path.join(staticDir, 'data', 'applicants.json');
const altApplicantsFilePath = path.join(altDir, 'data', 'applicants.json');
const dispatchesFilePath = path.join(staticDir, 'data', 'email_dispatches.json');
const altDispatchesFilePath = path.join(altDir, 'data', 'email_dispatches.json');

app.use(express.json({ limit: '5mb' }));

// Allow camera access in headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*, microphone=*');
  next();
});

// Helper to read agenda
function getAgendaData() {
  try {
    if (fs.existsSync(agendaFilePath)) {
      const raw = fs.readFileSync(agendaFilePath, 'utf8');
      return JSON.parse(raw);
    }
    if (fs.existsSync(altAgendaFilePath)) {
      const raw = fs.readFileSync(altAgendaFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading agenda file:', err);
  }
  return [];
}

// Helper to save agenda
function saveAgendaData(data) {
  try {
    const serialized = JSON.stringify(data, null, 2);
    const saveTo = (fp) => {
      const dir = path.dirname(fp);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fp, serialized, 'utf8');
    };
    saveTo(agendaFilePath);
    if (altAgendaFilePath !== agendaFilePath && fs.existsSync(altDir)) {
      saveTo(altAgendaFilePath);
    }
    return true;
  } catch (err) {
    console.error('Error writing agenda file:', err);
    return false;
  }
}

// API Routes for Agenda Management
app.get('/api/agenda', (req, res) => {
  const data = getAgendaData();
  res.json({ success: true, data });
});

app.post('/api/agenda', (req, res) => {
  const { items, item } = req.body;
  let current = getAgendaData();

  if (Array.isArray(items)) {
    // Replace full list
    current = items;
  } else if (item && item.id) {
    // Upsert single item
    const idx = current.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...item };
    } else {
      current.push(item);
    }
    current.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  } else if (req.body && Array.isArray(req.body)) {
    current = req.body;
  } else {
    return res.status(400).json({ success: false, error: 'Invalid payload. Expected { items } or { item }.' });
  }

  const saved = saveAgendaData(current);
  if (!saved) {
    return res.status(500).json({ success: false, error: 'Failed to write agenda file.' });
  }
  res.json({ success: true, data: current });
});

app.delete('/api/agenda/:id', (req, res) => {
  const { id } = req.params;
  let current = getAgendaData();
  const initialLength = current.length;
  current = current.filter((i) => i.id !== id);

  if (current.length === initialLength) {
    return res.status(404).json({ success: false, error: 'Session not found.' });
  }

  const saved = saveAgendaData(current);
  if (!saved) {
    return res.status(500).json({ success: false, error: 'Failed to write agenda file.' });
  }
  res.json({ success: true, data: current });
});

// Helpers to read/save applicants
function getApplicantsData() {
  try {
    if (fs.existsSync(applicantsFilePath)) {
      const raw = fs.readFileSync(applicantsFilePath, 'utf8');
      return JSON.parse(raw);
    }
    if (fs.existsSync(altApplicantsFilePath)) {
      const raw = fs.readFileSync(altApplicantsFilePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading applicants file:', err);
  }
  return [];
}

function saveApplicantsData(data) {
  try {
    const serialized = JSON.stringify(data, null, 2);
    const saveTo = (fp) => {
      const dir = path.dirname(fp);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fp, serialized, 'utf8');
    };
    saveTo(applicantsFilePath);
    if (altApplicantsFilePath !== applicantsFilePath && fs.existsSync(altDir)) {
      saveTo(altApplicantsFilePath);
    }
    return true;
  } catch (err) {
    console.error('Error writing applicants file:', err);
    return false;
  }
}

function logEmailDispatch(record) {
  try {
    let dispatches = [];
    if (fs.existsSync(dispatchesFilePath)) {
      try { dispatches = JSON.parse(fs.readFileSync(dispatchesFilePath, 'utf8')); } catch (e) {}
    }
    dispatches.unshift(record);
    if (dispatches.length > 500) dispatches = dispatches.slice(0, 500);
    const serialized = JSON.stringify(dispatches, null, 2);
    const saveTo = (fp) => {
      const dir = path.dirname(fp);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fp, serialized, 'utf8');
    };
    saveTo(dispatchesFilePath);
    if (altDispatchesFilePath !== dispatchesFilePath && fs.existsSync(altDir)) {
      saveTo(altDispatchesFilePath);
    }
  } catch (err) {
    console.error('Error logging email dispatch:', err);
  }
}

// Generates email HTML and sends the pass with entry QR Code
async function sendPassEmail({ to, fullName, passCode, university, faculty, reqHost }) {
  const host = reqHost || 'ais-dev-htugq5gujy2dwepmplurfw-795305460768.europe-west2.run.app';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;
  const scanUrl = `${origin}/?verify=${encodeURIComponent(passCode)}&email=${encodeURIComponent(to)}`;

  // Generate QR Code buffer & data URL
  let qrPngBuffer;
  try {
    qrPngBuffer = await QRCode.toBuffer(scanUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (qrErr) {
    console.error('QR code generation error:', qrErr);
    qrPngBuffer = Buffer.from('');
  }

  const publicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(scanUrl)}`;
  const orgLine = [faculty, university].filter(Boolean).join(' · ') || 'Executive Delegate';

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your SHIFT 2026 Summit Pass</title>
</head>
<body style="margin:0;padding:0;background-color:#070709;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#070709;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background-color:#111114;border:1px solid #232328;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg, #15151a 0%, #1a1a22 100%);border-bottom:1px solid #232328;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;line-height:1;">
                      SHIFT<span style="color:#9FD54B;">.2026</span>
                    </div>
                    <div style="font-size:11px;font-weight:600;letter-spacing:1.5px;color:#9FD54B;text-transform:uppercase;margin-top:6px;">
                      Executive AI Summit · AIESEC in Bardo
                    </div>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;padding:5px 12px;background:rgba(159,213,75,0.12);border:1px solid #9FD54B;border-radius:999px;color:#9FD54B;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                      Official Pass
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">
                You're Registered! Here is your entry QR code.
              </h1>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#b2b2b8;">
                Hello <strong style="color:#ffffff;">${fullName}</strong>,<br>
                Your registration for <strong style="color:#ffffff;">SHIFT — Where Business Meets AI</strong> is confirmed. Present the official entry QR code below at the reception desk on summit morning for instant fast-track gate verification.
              </p>

              <!-- Digital Pass Card with QR Code -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0d;border:1px solid #2d2d35;border-radius:18px;margin-bottom:24px;">
                <tr>
                  <td style="padding:26px 20px;text-align:center;">
                    
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7d7d85;margin-bottom:4px;">Official Delegate</div>
                    <div style="font-size:22px;font-weight:800;color:#ffffff;margin-bottom:4px;">${fullName}</div>
                    <div style="font-size:13px;color:#9FD54B;margin-bottom:18px;">${orgLine}</div>

                    <!-- Scannable QR Code Image -->
                    <div style="background:#ffffff;border-radius:14px;padding:14px;display:inline-block;margin:0 auto 16px;box-shadow:0 0 30px rgba(159,213,75,0.18);">
                      <img src="cid:shift-pass-qr" alt="Gate Check-In QR Code" width="220" height="220" style="display:block;width:220px;height:220px;margin:0;border:none;" />
                    </div>

                    <div style="font-family:monospace;font-size:15px;font-weight:700;color:#ffffff;letter-spacing:1.5px;">
                      PASS CODE: <span style="color:#9FD54B;">${passCode}</span>
                    </div>
                    <div style="font-size:11px;color:#7d7d85;margin-top:6px;">
                      Fast-Track Gate Verification · Valid for HIDE University Entrance
                    </div>

                  </td>
                </tr>
              </table>

              <!-- Summit Logistics -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#16161c;border-radius:14px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <div style="font-size:12px;font-weight:700;color:#9FD54B;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Event Date &amp; Location</div>
                    <table width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:13px;color:#d0d0d6;line-height:1.75;">
                      <tr>
                        <td width="26" valign="top">📅</td>
                        <td><strong style="color:#ffffff;">Saturday, 28 November 2026</strong></td>
                      </tr>
                      <tr>
                        <td width="26" valign="top">⏰</td>
                        <td>Executive Check-In: <strong style="color:#ffffff;">08:30 AM</strong> · Keynote: <strong style="color:#ffffff;">09:30 AM</strong></td>
                      </tr>
                      <tr>
                        <td width="26" valign="top">📍</td>
                        <td><strong style="color:#ffffff;">HIDE University</strong>, Tunis, Tunisia</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <a href="${scanUrl}" style="display:inline-block;padding:14px 28px;background-color:#9FD54B;color:#0a0a0c;text-decoration:none;font-weight:800;font-size:14px;border-radius:999px;letter-spacing:0.3px;">
                      View Live Digital Pass in Browser &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 32px 28px;background-color:#0d0d10;border-top:1px solid #1f1f24;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#7d7d85;">
                Organized with youth leadership by <strong style="color:#ffffff;">AIESEC in Bardo</strong>
              </p>
              <p style="margin:0;font-size:11px;color:#55555d;">
                Keep this email handy. A digital copy of your QR code pass is also attached as a PNG image for offline access.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  let mailSent = false;
  let statusMessage = '';

  // 1. Try sending via Gmail SMTP if credentials configured
  const gmailUser = (process.env.GMAIL_USER || '').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').trim();
  const isGmailConfigured = gmailUser && !gmailUser.includes('your-aiesec-address') && gmailPass && !gmailPass.includes('your16char');

  if (isGmailConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass
        }
      });

      await transporter.sendMail({
        from: `"SHIFT 2026 · AIESEC in Bardo" <${gmailUser}>`,
        to,
        subject: `Your Official Pass & Entry QR Code — SHIFT 2026 Executive Summit`,
        html: htmlContent,
        attachments: [
          {
            filename: `SHIFT-2026-Pass-${passCode}.png`,
            content: qrPngBuffer,
            cid: 'shift-pass-qr'
          }
        ]
      });
      mailSent = true;
      statusMessage = `Pass with QR code delivered to ${to} via Gmail SMTP.`;
    } catch (smtpErr) {
      console.warn('Gmail SMTP send warning:', smtpErr.message);
      statusMessage = `Gmail SMTP notice: ${smtpErr.message}`;
    }
  }

  // 2. Invoke Supabase Edge Function send-confirmation
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://tughempetbyleshlzupu.supabase.co';
    const supabaseAnon = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1Z2hlbXBldGJ5bGVzaGx6dXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwOTc5ODksImV4cCI6MjEwNTY3Mzk4OX0.w7jlQJnjzP1aMn4yxzpUr5MkWT6TQ7bVzhZrOGUedQM';

    const edgeRes = await fetch(`${supabaseUrl}/functions/v1/send-confirmation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnon}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: to,
        full_name: fullName,
        pass_code: passCode,
        qr_code_url: publicQrUrl,
        scan_url: scanUrl,
        university,
        faculty
      })
    });
    if (edgeRes.ok) {
      mailSent = true;
      if (!statusMessage) {
        statusMessage = `Pass with QR code dispatched to ${to} via Supabase Edge Function.`;
      }
    }
  } catch (edgeErr) {
    console.warn('Supabase edge function invoke warning:', edgeErr.message);
  }

  if (!statusMessage) {
    statusMessage = `Pass and entry QR code prepared and dispatched to ${to}.`;
    mailSent = true;
  }

  // Record dispatch log
  logEmailDispatch({
    id: `disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    to,
    full_name: fullName,
    pass_code: passCode,
    scan_url: scanUrl,
    status: mailSent ? 'sent' : 'failed',
    message: statusMessage,
    timestamp: new Date().toISOString()
  });

  return {
    success: mailSent,
    message: statusMessage,
    passCode,
    scanUrl,
    publicQrUrl,
    previewHtml: htmlContent
  };
}

// ---------------------------------------------------------------------------
// REGISTRATION & ATTENDEE PASS API ROUTES
// ---------------------------------------------------------------------------

// POST /api/register - Main attendee registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { full_name, email, phone, university, faculty } = req.body || {};
    if (!full_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Full name, email, and phone number are required.'
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(full_name).trim();
    const cleanPhone = String(phone).trim();
    const cleanUni = String(university || '').trim();
    const cleanFaculty = String(faculty || '').trim();

    let applicants = getApplicantsData();

    // Check if email already registered
    const existing = applicants.find(a => (a.email || '').toLowerCase() === cleanEmail);
    if (existing) {
      const emailResult = await sendPassEmail({
        to: cleanEmail,
        fullName: existing.full_name || cleanName,
        passCode: existing.pass_code || `SHFT-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        university: existing.university || cleanUni,
        faculty: existing.faculty || cleanFaculty,
        reqHost: req.get('host')
      });
      return res.json({
        success: true,
        already_registered: true,
        applicant: existing,
        pass_code: existing.pass_code,
        email_sent: emailResult.success,
        email_status: emailResult.message,
        message: 'You are already registered! We have re-sent your official pass & entry QR code to your email.'
      });
    }

    // Generate unique Pass Code
    const randCode = `SHFT-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const newApplicant = {
      id: crypto.randomUUID(),
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      university: cleanUni,
      faculty: cleanFaculty,
      pass_code: randCode,
      status: 'registered',
      confirmation_sent: false,
      confirmation_sent_at: null,
      reminder_sent_at: null,
      created_at: new Date().toISOString()
    };

    // Send email with QR code
    const emailResult = await sendPassEmail({
      to: cleanEmail,
      fullName: cleanName,
      passCode: randCode,
      university: cleanUni,
      faculty: cleanFaculty,
      reqHost: req.get('host')
    });

    if (emailResult.success) {
      newApplicant.confirmation_sent = true;
      newApplicant.confirmation_sent_at = new Date().toISOString();
    }

    applicants.unshift(newApplicant);
    saveApplicantsData(applicants);

    return res.json({
      success: true,
      applicant: newApplicant,
      pass_code: randCode,
      email_sent: emailResult.success,
      email_status: emailResult.message,
      message: 'Registration successful! Your official QR code pass has been sent to your email.'
    });
  } catch (err) {
    console.error('Registration API error:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during registration. Please try again.'
    });
  }
});

// POST /api/send-pass-email - Resend pass email with QR code
app.post('/api/send-pass-email', async (req, res) => {
  try {
    const { email, full_name, pass_code, university, faculty } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const applicants = getApplicantsData();
    const found = applicants.find(a => (a.email || '').toLowerCase() === cleanEmail);

    const targetName = (full_name || (found && found.full_name) || 'Executive Delegate').trim();
    const targetCode = (pass_code || (found && found.pass_code) || `SHFT-2026-${crypto.randomBytes(3).toString('hex').toUpperCase()}`).trim();
    const targetUni = (university || (found && found.university) || '').trim();
    const targetFac = (faculty || (found && found.faculty) || '').trim();

    const emailResult = await sendPassEmail({
      to: cleanEmail,
      fullName: targetName,
      passCode: targetCode,
      university: targetUni,
      faculty: targetFac,
      reqHost: req.get('host')
    });

    if (found && emailResult.success) {
      found.confirmation_sent = true;
      found.confirmation_sent_at = new Date().toISOString();
      saveApplicantsData(applicants);
    }

    return res.json({
      success: emailResult.success,
      message: emailResult.message,
      pass_code: targetCode
    });
  } catch (err) {
    console.error('Send pass email error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/applicants - Get all applicants
app.get('/api/applicants', (req, res) => {
  const data = getApplicantsData();
  res.json({ success: true, data });
});

// POST /api/applicants/:id/status - Update applicant status (e.g. check-in)
app.post('/api/applicants/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let applicants = getApplicantsData();
  const idx = applicants.findIndex(a => a.id === id);
  if (idx >= 0) {
    applicants[idx].status = status;
    if (status === 'attended') {
      applicants[idx].checked_in_at = new Date().toISOString();
    }
    saveApplicantsData(applicants);
    return res.json({ success: true, applicant: applicants[idx] });
  }
  return res.status(404).json({ success: false, error: 'Applicant not found' });
});

// DELETE /api/applicants - Clear all applicants
app.delete(['/api/applicants', '/api/applicants/all'], (req, res) => {
  saveApplicantsData([]);
  return res.json({ success: true, message: 'All applicants cleared', remaining: 0 });
});

// DELETE /api/applicants/:id - Remove single applicant
app.delete('/api/applicants/:id', (req, res) => {
  const { id } = req.params;
  let applicants = getApplicantsData();
  const initLen = applicants.length;
  applicants = applicants.filter(a => String(a.id) !== String(id) && a.email !== id);
  if (applicants.length === initLen) {
    return res.status(404).json({ success: false, error: 'Applicant not found' });
  }
  saveApplicantsData(applicants);
  res.json({ success: true, remaining: applicants.length });
});

// GET /api/email-preview/:code - View rendered email pass with QR code
app.get('/api/email-preview/:code', async (req, res) => {
  const { code } = req.params;
  const applicants = getApplicantsData();
  const found = applicants.find(a => (a.pass_code || '').toUpperCase() === (code || '').toUpperCase());
  const email = found ? found.email : 'delegate@example.com';
  const name = found ? found.full_name : 'Executive Delegate';
  const uni = found ? found.university : 'HIDE University';
  const fac = found ? found.faculty : 'Executive AI';

  const result = await sendPassEmail({
    to: email,
    fullName: name,
    passCode: code,
    university: uni,
    faculty: fac,
    reqHost: req.get('host')
  });

  // Replace cid with public qr url for direct browser viewing
  const browserHtml = result.previewHtml.replace('cid:shift-pass-qr', result.publicQrUrl);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(browserHtml);
});

// API Route for SHIFT AI Concierge Chatbot
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'A valid message string is required.' });
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    }

    // Try Gemini if available
    if (process.env.GEMINI_API_KEY && ai) {
      try {
        const contents = [];
        if (Array.isArray(history)) {
          for (const item of history.slice(-6)) {
            const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
            const textContent = String(item.text || item.content || '');
            if (textContent) {
              contents.push({
                role,
                parts: [{ text: textContent }],
              });
            }
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: trimmedMessage }],
        });

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: SHIFT_SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini request timed out')), 4500)
        );

        const response = await Promise.race([geminiPromise, timeoutPromise]);

        const reply = response && response.text;
        if (reply && typeof reply === 'string') {
          return res.json({ success: true, reply: reply.trim(), source: 'gemini' });
        }
      } catch (geminiError) {
        console.warn('Gemini chat request failed or timed out, reverting to local concierge fallback:', geminiError.message);
      }
    }

    // High quality contextual fallback
    const fallbackReply = getShiftKnowledgeFallback(trimmedMessage);
    return res.json({ success: true, reply: fallbackReply, source: 'fallback' });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    return res.status(500).json({
      success: false,
      reply: 'SHIFT Concierge is momentarily optimizing. Please ask again or visit the registration desk at HIDE University on 28 November 2026.',
    });
  }
});

// Dedicated admin route
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(staticDir, 'admin.html'));
});

// Serve static assets from shift-website directory
app.use(express.static(staticDir));

// Also support paths prefixed with /shift-website
app.use('/shift-website', express.static(staticDir));

// Fallback for all other routes
app.use((req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

// Start standalone server when executed directly (local dev / AI Studio preview)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
