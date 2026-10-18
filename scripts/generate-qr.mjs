#!/usr/bin/env node
/**
 * QR Code Generator for Yosr Sfaihi's Recruiter Landing Page
 * Usage: npm run qr
 *
 * Reads NEXT_PUBLIC_SITE_URL from .env.local and generates:
 *   public/qr/qr-code.png   — high-res PNG (1200×1200)
 *   public/qr/qr-code.svg   — scalable SVG
 *   public/qr/qr-print.png  — print-ready PNG (clean white bg, 600×600)
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/* ── Load .env.local ────────────────────────────────────── */
function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) {
    console.warn("⚠  .env.local not found – falling back to NEXT_PUBLIC_SITE_URL env var");
    return;
  }
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const url = `${baseUrl.replace(/\/$/, "")}/?src=cv-qr`;

console.log(`\n🔗  Generating QR for: ${url}\n`);

/* ── Create output directory ────────────────────────────── */
const outDir = join(ROOT, "public", "qr");
mkdirSync(outDir, { recursive: true });

/* ── Shared QR options ──────────────────────────────────── */
const SHARED_OPTS = {
  errorCorrectionLevel: /** @type {const} */ ("H"),   // 30% damage tolerance
  margin: 4,
  color: { dark: "#0F172A", light: "#F8FAFC" },
};

/* ── 1. High-res PNG (1200×1200) ────────────────────────── */
const pngPath = join(outDir, "qr-code.png");
await QRCode.toFile(pngPath, url, {
  ...SHARED_OPTS,
  type: "png",
  width: 1200,
});
console.log(`✅  PNG  → public/qr/qr-code.png`);

/* ── 2. SVG ─────────────────────────────────────────────── */
const svgPath = join(outDir, "qr-code.svg");
const svgStr  = await QRCode.toString(url, {
  ...SHARED_OPTS,
  type: "svg",
  width: 400,
});
writeFileSync(svgPath, svgStr, "utf8");
console.log(`✅  SVG  → public/qr/qr-code.svg`);

/* ── 3. Print-ready PNG (white bg, black code, 600px) ───── */
const printPath = join(outDir, "qr-print.png");
await QRCode.toFile(printPath, url, {
  errorCorrectionLevel: "H",
  margin: 6,           // generous quiet zone for print
  width: 600,
  type: "png",
  color: { dark: "#000000", light: "#FFFFFF" },
});
console.log(`✅  PRINT → public/qr/qr-print.png (use this on your CV)\n`);

/* ── Summary ─────────────────────────────────────────────── */
console.log("─────────────────────────────────────────────");
console.log("  QR code points to:");
console.log(`  ${url}`);
console.log("");
console.log("  Files generated in public/qr/:");
console.log("   • qr-code.png   — digital use (1200px, navy/cyan)");
console.log("   • qr-code.svg   — scalable vector");
console.log("   • qr-print.png  — print on CV (600px, black/white)");
console.log("─────────────────────────────────────────────");
console.log("\n⚡  After deploying, update NEXT_PUBLIC_SITE_URL in .env.local");
console.log("   and run `npm run qr` again to regenerate.\n");
