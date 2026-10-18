"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type Choice = "cv" | "portfolio" | "linkedin" | "github";

/* ── Client-side destinations (for instant redirect on repeat visits) */
const CLIENT_DESTINATIONS: Record<Choice, string> = {
  cv:        "/cv/Yosr_Sfaihi_CV.pdf",
  portfolio: "/portfolio/Yosr_Sfaihi_Portfolio.pdf",
  linkedin:  "https://www.linkedin.com/in/yosr-sfaihi/",
  github:    "https://github.com/yosr-sfaihi",
};

/* ── Icons ─────────────────────────────────────────────────── */
const IconCV = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconPortfolio = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IconLinkedIn = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);
const IconGitHub = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
);
const IconClose = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" fill="none" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CARDS = [
  { id: "cv"        as Choice, label: "Download CV",     sub: "PDF · 2 pages",        Icon: IconCV },
  { id: "portfolio" as Choice, label: "See portfolio",   sub: "Selected projects",     Icon: IconPortfolio },
  { id: "linkedin"  as Choice, label: "Yosr's LinkedIn", sub: "Professional profile",  Icon: IconLinkedIn },
  { id: "github"    as Choice, label: "Yosr's GitHub",   sub: "Code & projects",       Icon: IconGitHub },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SESSION_KEY = "ys_recruiter_email";

export default function Home() {
  /* saved email from a previous submission this session */
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  /* drawer state */
  const [active, setActive]               = useState<Choice | null>(null);
  const [email, setEmail]                 = useState("");
  const [emailTouched, setEmailTouched]   = useState(false);
  const [consent, setConsent]             = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl]     = useState<string | null>(null);

  const honeypotRef = useRef<HTMLInputElement>(null);
  const emailRef    = useRef<HTMLInputElement>(null);

  /* Hydrate saved email from sessionStorage */
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSavedEmail(saved);
  }, []);

  /* ── Card click ─────────────────────────────────────────── */
  const handleCardClick = useCallback((choice: Choice) => {
    if (savedEmail) {
      /* Already collected email — fire-and-forget, redirect instantly */
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: savedEmail, choice }),
      }).catch(() => {});
      window.location.href = CLIENT_DESTINATIONS[choice];
      return;
    }
    /* First time — open drawer */
    setActive(choice);
    setEmail("");
    setEmailTouched(false);
    setConsent(false);
    setError(null);
    setFallbackUrl(null);
    setTimeout(() => emailRef.current?.focus(), 300);
  }, [savedEmail]);

  const closeDrawer = useCallback(() => setActive(null), []);

  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeDrawer();
  }, [closeDrawer]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeDrawer();
  }, [closeDrawer]);

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    if (honeypotRef.current?.value) return; /* bot */

    setEmailTouched(true);
    if (!EMAIL_RE.test(email) || !consent) return;

    setLoading(true);
    setError(null);

    try {
      const res  = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), choice: active }),
      });
      const data = await res.json();

      if (res.ok && data.redirect) {
        sessionStorage.setItem(SESSION_KEY, email.trim());
        setSavedEmail(email.trim());
        window.location.href = data.redirect;
      } else {
        setFallbackUrl(data.fallbackUrl || null);
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [active, email, consent]);

  const emailInvalid = emailTouched && !EMAIL_RE.test(email);
  const canSubmit    = EMAIL_RE.test(email) && consent && !loading;

  return (
    <>
      <main className="page">
        <div className="profile-card">
          <div className="card-inner">

            {/* Badge */}
            <div className="badge">
              <span className="badge-dot" />
              Open to a 6-month end-of-studies internship · AI / Cloud and DevOps
            </div>

            {/* Name */}
            <div className="name-wrap">
              <h1 className="name">Yosr Sfaihi</h1>
              <div className="name-underline" aria-hidden />
            </div>

            {/* Tagline */}
            <p className="tagline">
              Building intelligent systems and cloud-native infrastructure,
              from multi-agent AI to Kubernetes-native DevOps.
            </p>
            <p className="school">Final-Year Computer Engineering · ESPRIT, Tunisia</p>

            {/* Cards */}
            <nav className="cards" aria-label="Connect with Yosr">
              {CARDS.map(({ id, label, sub, Icon }) => (
                <button
                  key={id}
                  className="card"
                  onClick={() => handleCardClick(id)}
                  type="button"
                  aria-label={label}
                >
                  <div className="card-icon"><Icon /></div>
                  <div className="card-body">
                    <div className="card-label">{label}</div>
                    <div className="card-sub">{sub}</div>
                  </div>
                  <span className="card-arrow" aria-hidden>→</span>
                </button>
              ))}
            </nav>

            {/* Footer */}
            <footer className="footer">
              +216 97 520 422 · <a href="mailto:yosrsfaihi@gmail.com">yosrsfaihi@gmail.com</a>
            </footer>
          </div>
        </div>
      </main>

      {/* ── Bottom Drawer ────────────────────────────────────── */}
      {active && (
        <div
          className="drawer-backdrop"
          onClick={handleBackdrop}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Enter your email"
        >
          <div className="drawer">
            <div className="drawer-handle" aria-hidden />

            <button
              className="drawer-close"
              onClick={closeDrawer}
              aria-label="Close"
              type="button"
            >
              <IconClose />
            </button>

            <h2 className="drawer-heading">Where should I send my details?</h2>
            <p className="drawer-sub">
              Enter your email and I&apos;ll send you a quick hello with my details.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot */}
              <input
                ref={honeypotRef}
                className="hp"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <label className="field-label" htmlFor="rec-email">
                Your email address
              </label>
              <input
                ref={emailRef}
                id="rec-email"
                className={`email-input${emailInvalid ? " invalid" : ""}`}
                type="email"
                name="email"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                required
                autoComplete="email"
                aria-invalid={emailInvalid}
              />
              {emailInvalid && (
                <p className="field-error">Please enter a valid email address.</p>
              )}

              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  required
                />
                <span className="consent-text">
                  I agree to receive this one email from Yosr.
                </span>
              </label>

              <button
                type="submit"
                className="btn-continue"
                disabled={!canSubmit}
                aria-busy={loading}
              >
                {loading
                  ? <><span className="spinner" aria-hidden /> Sending…</>
                  : "Continue"}
              </button>

              {error && (
                <div className="error-msg" role="alert">
                  <span>{error}</span>
                  {fallbackUrl && (
                    <button
                      type="button"
                      className="continue-link"
                      onClick={() => { window.location.href = fallbackUrl; }}
                    >
                      Continue anyway →
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
