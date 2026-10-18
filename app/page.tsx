"use client";

import { useState, useCallback, useRef } from "react";

/* ── Types ───────────────────────────────────────────────── */
type Choice = "cv" | "portfolio" | "linkedin" | "github";

interface CardDef {
  id: Choice;
  label: string;
  sub: string;
  icon: React.ReactNode;
}

/* ── Icons (inline SVG, no external dep) ────────────────── */
const IconCV = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IconPortfolio = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
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
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ── Card data ───────────────────────────────────────────── */
const CARDS: CardDef[] = [
  { id: "cv",        label: "Download CV",       sub: "PDF · 2 pages",        icon: <IconCV /> },
  { id: "portfolio", label: "See Portfolio",     sub: "Projects overview",     icon: <IconPortfolio /> },
  { id: "linkedin",  label: "Yosr's LinkedIn",   sub: "Professional profile",  icon: <IconLinkedIn /> },
  { id: "github",    label: "Yosr's GitHub",     sub: "Code & open-source",    icon: <IconGitHub /> },
];

/* ── Email validation ────────────────────────────────────── */
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

/* ── Main page ───────────────────────────────────────────── */
export default function Home() {
  const [active, setActive] = useState<Choice | null>(null);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [destinationUrl, setDestinationUrl] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  /* ── Open modal ──────────────────────────────────────── */
  const openModal = useCallback((choice: Choice) => {
    setActive(choice);
    setEmail("");
    setEmailTouched(false);
    setConsent(false);
    setError(null);
    setDestinationUrl(null);
    // focus email input after animation
    setTimeout(() => emailRef.current?.focus(), 320);
  }, []);

  /* ── Close modal ─────────────────────────────────────── */
  const closeModal = useCallback(() => {
    setActive(null);
  }, []);

  /* ── Handle backdrop click ───────────────────────────── */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) closeModal();
    },
    [closeModal]
  );

  /* ── Escape key ──────────────────────────────────────── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    },
    [closeModal]
  );

  /* ── Submit ──────────────────────────────────────────── */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!active) return;

      // Honeypot check (bot trap)
      if (honeypotRef.current?.value) return;

      setEmailTouched(true);
      if (!isValidEmail(email) || !consent) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), choice: active }),
        });

        const data = await res.json();

        if (res.ok && data.redirect) {
          // Redirect to the chosen destination
          window.location.href = data.redirect;
        } else {
          setDestinationUrl(data.fallbackUrl || null);
          setError(data.error || "Something went wrong. Please try again.");
        }
      } catch {
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [active, email, consent]
  );

  /* ── "Continue anyway" handler ───────────────────────── */
  const continueAnyway = useCallback(() => {
    if (destinationUrl) window.location.href = destinationUrl;
  }, [destinationUrl]);

  const emailInvalid = emailTouched && !isValidEmail(email);
  const canSubmit = isValidEmail(email) && consent && !loading;

  return (
    <>
      {/* Decorative background */}
      <div className="bg-animated" aria-hidden />
      <div className="dots" aria-hidden />

      <main className="page">
        {/* ── Header ────────────────────────────────────── */}
        <header className="header">
          <div className="badge">
            <span className="badge-dot" />
            Seeking 6-month end-of-studies internship
          </div>
          <h1 className="name">Yosr Sfaihi</h1>
          <p className="tagline">
            Building intelligent systems and cloud-native infrastructure —
            from multi-agent AI pipelines to Kubernetes-native DevOps.
          </p>
          <p className="school">
            Final-Year Computer Engineering · IT Architecture &amp; Cloud Engineering · ESPRIT, Tunisia
          </p>
        </header>

        {/* ── Cards ─────────────────────────────────────── */}
        <nav className="cards" aria-label="Connect with Yosr">
          {CARDS.map((card) => (
            <button
              key={card.id}
              className="card"
              onClick={() => openModal(card.id)}
              aria-label={`${card.label} — ${card.sub}`}
              type="button"
            >
              <div className="card-icon">{card.icon}</div>
              <span className="card-label">{card.label}</span>
              <span className="card-sub">{card.sub}</span>
            </button>
          ))}
        </nav>

        {/* ── Footer ────────────────────────────────────── */}
        <footer className="footer">
          <p>
            +216 97 520 422 ·{" "}
            <a href="mailto:yosrsfaihi@gmail.com">yosrsfaihi@gmail.com</a>
          </p>
        </footer>
      </main>

      {/* ── Modal ─────────────────────────────────────────── */}
      {active && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Enter your email"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
        >
          <div className="modal">
            <div className="modal-handle" aria-hidden />

            <button
              className="modal-close"
              onClick={closeModal}
              aria-label="Close"
              type="button"
            >
              <IconClose />
            </button>

            <h2 className="modal-heading">
              {CARDS.find((c) => c.id === active)?.label}
            </h2>
            <p className="modal-sub">
              Enter your email and I&rsquo;ll send you a quick hello with my details.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              {/* Honeypot (hidden, must stay empty) */}
              <input
                ref={honeypotRef}
                className="hp"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <label className="field-label" htmlFor="recruiter-email">
                Your email address
              </label>
              <input
                ref={emailRef}
                id="recruiter-email"
                className={`email-input${emailInvalid ? " invalid" : ""}`}
                type="email"
                name="email"
                placeholder="recruiter@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                required
                autoComplete="email"
                aria-describedby={emailInvalid ? "email-error" : undefined}
                aria-invalid={emailInvalid}
              />
              {emailInvalid && (
                <p id="email-error" style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: "-0.6rem", marginBottom: "0.8rem" }}>
                  Please enter a valid email address.
                </p>
              )}

              <label className="consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  aria-required="true"
                />
                <span className="consent-text">
                  I agree to receive this one email from Yosr.
                </span>
              </label>

              <button
                type="submit"
                className="btn-submit"
                disabled={!canSubmit}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden />
                    Sending&hellip;
                  </>
                ) : (
                  "Send &amp; Continue →"
                )}
              </button>

              {error && (
                <div className="error-msg" role="alert">
                  <span>{error}</span>
                  {destinationUrl && (
                    <button
                      type="button"
                      className="continue-link"
                      onClick={continueAnyway}
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
