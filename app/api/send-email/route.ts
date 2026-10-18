import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

/* ── Rate limiter (in-memory, resets on cold start) ───── */
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000");
  const maxReqs  = parseInt(process.env.RATE_LIMIT_MAX || "5");

  const record = rateLimitMap.get(ip);
  if (!record || record.reset < now) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
    return { allowed: true };
  }
  if (record.count >= maxReqs) {
    return { allowed: false, retryAfter: Math.ceil((record.reset - now) / 1000) };
  }
  record.count++;
  return { allowed: true };
}

/* Clean up stale entries every 5 min to avoid memory leak */
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (val.reset < now) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

/* ── Destination map (server-side, never exposed to client) */
const DESTINATIONS: Record<string, string> = {
  cv:        "/cv/Yosr_Sfaihi_CV.pdf",
  portfolio: "/portfolio/Yosr_Sfaihi_Portfolio.pdf",
  linkedin:  "https://www.linkedin.com/in/yosr-sfaihi/",
  github:    "https://github.com/yosr-sfaihi",
};

/* ── Email validation ───────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ── HTML email body ────────────────────────────────────── */
function buildHtmlBody(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Application – End-of-Studies Internship</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
    .wrap { max-width:600px; margin:2rem auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
    .header { background:#0F172A; padding:2rem 2rem 1.5rem; }
    .header h1 { color:#06B6D4; font-size:1.3rem; margin:0 0 0.3rem; }
    .header p { color:rgba(248,250,252,0.7); font-size:0.85rem; margin:0; }
    .body { padding:2rem; color:#1e293b; line-height:1.7; font-size:0.95rem; }
    .body p { margin:0 0 1rem; }
    h2 { font-size:0.95rem; font-weight:700; color:#0F172A; margin:1.5rem 0 0.5rem; border-left:3px solid #06B6D4; padding-left:0.6rem; }
    ul { margin:0.3rem 0 0.8rem 1.2rem; padding:0; }
    li { margin-bottom:0.25rem; }
    .sig { margin-top:2rem; padding-top:1.5rem; border-top:1px solid #e2e8f0; }
    .sig p { margin:0 0 0.2rem; }
    .sig strong { color:#0F172A; }
    a { color:#06B6D4; text-decoration:none; }
    a:hover { text-decoration:underline; }
    .footer-bar { background:#f1f5f9; padding:1rem 2rem; font-size:0.78rem; color:#64748b; text-align:center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Yosr Sfaihi</h1>
      <p>Final-Year Computer Engineering Student · ESPRIT School of Engineering</p>
    </div>
    <div class="body">
      <p>Hello,</p>
      <p>I am a final-year Computer Engineering student specializing in <strong>IT Architecture &amp; Cloud Engineering</strong> at ESPRIT School of Engineering, and I am looking for a <strong>6-month end-of-studies internship in AI / Cloud and DevOps</strong>.</p>
      <p>My experience covers both fields:</p>

      <h2>Artificial Intelligence</h2>
      <ul>
        <li><strong>At Talan:</strong> I built a multi-agent system and RAG pipelines using LangChain, LangGraph and FastAPI.</li>
        <li><strong>During research internships:</strong> I developed NLP models for Tunisian and Arabic sentiment analysis, and a deep learning system for brain tumor classification from MRI.</li>
      </ul>

      <h2>Cloud &amp; DevOps</h2>
      <ul>
        <li><strong>At Talan:</strong> built a ChatOps assistant for Kubernetes and AWS that automates infrastructure operations and incident analysis, reducing diagnosis time. I deployed it through a GitOps CI/CD pipeline with ArgoCD.</li>
        <li><strong>At ESPRIT:</strong> I designed and deployed a private cloud from A to Z with OpenStack, automated Docker and Kubernetes with Ansible, and set up monitoring with Prometheus and Grafana.</li>
        <li><strong>At TMI:</strong> I designed an enterprise network infrastructure and deployed Zabbix for monitoring.</li>
      </ul>

      <p>Please find my CV attached. I would be grateful for the opportunity to discuss my application with you in an interview.</p>
      <p>Thank you for your time and consideration.</p>

      <div class="sig">
        <p><strong>Kind regards,</strong></p>
        <p><strong>Yosr Sfaihi</strong></p>
        <p>Final-Year Computer Engineering Student – IT Architecture &amp; Cloud Engineering</p>
        <p>ESPRIT School of Engineering, Tunisia</p>
        <p>
          Tel: <a href="tel:+21697520422">+216 97 520 422</a> ·
          Email: <a href="mailto:yosrsfaihi@gmail.com">yosrsfaihi@gmail.com</a>
        </p>
        <p>LinkedIn: <a href="https://www.linkedin.com/in/yosr-sfaihi/">https://www.linkedin.com/in/yosr-sfaihi/</a></p>
      </div>
    </div>
    <div class="footer-bar">This email was sent from a professional landing page. One-time contact only.</div>
  </div>
</body>
</html>`;
}

/* ── Plain-text fallback ────────────────────────────────── */
function buildTextBody(): string {
  return `Hello,

I am a final-year Computer Engineering student specializing in IT Architecture & Cloud Engineering at ESPRIT School of Engineering, and I am looking for a 6-month end-of-studies internship in AI / Cloud and DevOps.

My experience covers both fields:

ARTIFICIAL INTELLIGENCE
- At Talan: I built a multi-agent system and RAG pipelines using LangChain, LangGraph and FastAPI.
- During research internships, I developed NLP models for Tunisian and Arabic sentiment analysis, and a deep learning system for brain tumor classification from MRI.

CLOUD & DEVOPS
- At Talan: built a ChatOps assistant for Kubernetes and AWS that automates infrastructure operations and incident analysis, reducing diagnosis time. I deployed it through a GitOps CI/CD pipeline with ArgoCD.
- At ESPRIT: I designed and deployed a private cloud from A to Z with OpenStack, automated Docker and Kubernetes with Ansible, and set up monitoring with Prometheus and Grafana.
- At TMI: I designed an enterprise network infrastructure and deployed Zabbix for monitoring.

Please find my CV attached. I would be grateful for the opportunity to discuss my application with you in an interview.

Thank you for your time and consideration.

Kind regards,

Yosr Sfaihi
Final-Year Computer Engineering Student – IT Architecture & Cloud Engineering
ESPRIT School of Engineering, Tunisia
Tel: +216 97 520 422 | Email: yosrsfaihi@gmail.com
LinkedIn: https://www.linkedin.com/in/yosr-sfaihi/`;
}

/* ── Append to submission log ───────────────────────────── */
function logSubmission(email: string, choice: string): void {
  try {
    const logPath = path.join(process.cwd(), "logs", "submissions.csv");
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    if (!fs.existsSync(logPath)) {
      fs.writeFileSync(logPath, "timestamp,email,choice\n", "utf8");
    }
    const row = `"${new Date().toISOString()}","${email.replace(/"/g, '""')}","${choice}"\n`;
    fs.appendFileSync(logPath, row, "utf8");
  } catch (err) {
    console.error("[log] Failed to write submission log:", err);
  }
}

/* ── CORS helper ────────────────────────────────────────── */
function corsHeaders(req: NextRequest): Record<string, string> {
  const allowed = process.env.ALLOWED_ORIGIN;
  const origin  = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin":  allowed ? (origin === allowed ? origin : "") : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/* ── OPTIONS pre-flight ─────────────────────────────────── */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

/* ── POST handler ───────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const headers = {
    ...corsHeaders(req),
    "X-Content-Type-Options":    "nosniff",
    "X-Frame-Options":           "DENY",
    "Referrer-Policy":           "strict-origin-when-cross-origin",
  };

  /* ── Rate limit ─────────────────────────────────────── */
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${rl.retryAfter}s before trying again.` },
      { status: 429, headers: { ...headers, "Retry-After": String(rl.retryAfter) } }
    );
  }

  /* ── Parse body ─────────────────────────────────────── */
  let body: { email?: unknown; choice?: unknown; website?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400, headers });
  }

  /* ── Honeypot check ─────────────────────────────────── */
  if (body.website) {
    // Bot detected — return 200 to fool it
    return NextResponse.json({ redirect: "/" }, { status: 200, headers });
  }

  /* ── Validate inputs ────────────────────────────────── */
  const email  = typeof body.email  === "string" ? body.email.trim().toLowerCase()  : "";
  const choice = typeof body.choice === "string" ? body.choice.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 422, headers });
  }

  if (!DESTINATIONS[choice]) {
    return NextResponse.json({ error: "Invalid choice." }, { status: 422, headers });
  }

  const destination = DESTINATIONS[choice];

  /* ── Build attachment ───────────────────────────────── */
  const attachCv = (process.env.ATTACH_CV || "true").toLowerCase() !== "false";
  const attachments: { filename: string; path: string; contentType: string }[] = [];
  if (attachCv) {
    const cvPath = path.join(process.cwd(), "public", "cv", "Yosr_Sfaihi_CV.pdf");
    if (fs.existsSync(cvPath)) {
      attachments.push({ filename: "Yosr_Sfaihi_CV.pdf", path: cvPath, contentType: "application/pdf" });
    }
  }

  /* ── Send email via Gmail SMTP ──────────────────────── */
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.error("[email] Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars");
    return NextResponse.json(
      { error: "Email service is not configured.", fallbackUrl: destination },
      { status: 503, headers }
    );
  }

  const transporter = nodemailer.createTransport({
    host:   "smtp.gmail.com",
    port:   465,
    secure: true,
    auth:   { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      from:        `"Yosr Sfaihi" <${gmailUser}>`,
      to:          email,
      subject:     "Application – End-of-Studies Internship (AI / Cloud & DevOps) – Yosr Sfaihi",
      html:        buildHtmlBody(),
      text:        buildTextBody(),
      attachments,
    });

    /* ── Log submission ───────────────────────────────── */
    if ((process.env.LOG_SUBMISSIONS || "true").toLowerCase() !== "false") {
      logSubmission(email, choice);
    }

    console.log(`[email] Sent to ${email} (choice: ${choice})`);
    return NextResponse.json({ redirect: destination }, { status: 200, headers });

  } catch (err) {
    console.error("[email] Failed to send:", err);
    return NextResponse.json(
      {
        error: "Failed to send email. Please try again, or continue directly.",
        fallbackUrl: destination,
      },
      { status: 500, headers }
    );
  }
}
