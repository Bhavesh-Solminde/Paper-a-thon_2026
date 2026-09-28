"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { PassData } from "@/lib/pass";

const QR_OPTS = { errorCorrectionLevel: "M" as const, margin: 1, color: { dark: "#06070a", light: "#ecebe4" } };

export function QrPass({ pass }: { pass: PassData }) {
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(pass.qrText, { ...QR_OPTS, width: 480 }).then(setSrc);
  }, [pass.qrText]);

  async function download() {
    setBusy(true);
    try {
      await document.fonts.ready;
      const blob = await renderTicket(pass);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `paper-a-thon-pass-${pass.id}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-dashed border-line px-6 py-4">
        <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-muted">Team pass</p>
        <p className="font-display text-xs font-bold tracking-[0.2em] text-blue-bright">{pass.id}</p>
      </div>
      <div className="p-6">
        <div className="mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-2xl bg-paper p-3">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={`QR pass for ${pass.name}`} className="h-full w-full [image-rendering:pixelated]" />
          ) : (
            <div className="h-full w-full animate-pulse rounded-xl bg-paper-2" />
          )}
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          Show this at the registration desk on the 29th. It carries your team details and a signed verification link.
        </p>
        <button className="btn btn-primary mt-5 w-full" onClick={download} disabled={!src || busy}>
          {busy ? "Preparing…" : "Download pass (PNG)"}
        </button>
      </div>
    </div>
  );
}

/** Draws a shareable 1080×1500 ticket with the QR code onto a canvas. */
async function renderTicket(pass: PassData): Promise<Blob> {
  const W = 1080;
  const H = 1500;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  const display = css.getPropertyValue("--font-montserrat").trim() || "Arial";
  const brush = css.getPropertyValue("--font-marker").trim() || display;

  // background
  ctx.fillStyle = "#06070a";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, 420, 50, W / 2, 420, 800);
  g.addColorStop(0, "rgba(31,107,255,0.35)");
  g.addColorStop(1, "rgba(31,107,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ecebe4";
  ctx.font = `800 30px ${display}`;
  ctx.fillText("MICROSOFT LEARN STUDENTS CLUB", W / 2, 110);

  // torn-paper title strip
  ctx.save();
  ctx.translate(W / 2, 230);
  ctx.rotate(-0.03);
  ctx.fillStyle = "#ecebe4";
  ctx.beginPath();
  const sw = 960;
  const sh = 150;
  ctx.moveTo(-sw / 2, -sh / 2);
  for (let x = -sw / 2; x <= sw / 2; x += 20) ctx.lineTo(x, -sh / 2 + ((x * 7919) % 13) / 1.5);
  for (let x = sw / 2; x >= -sw / 2; x -= 20) ctx.lineTo(x, sh / 2 - ((x * 104729) % 11) / 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#06070a";
  ctx.font = `100px ${brush}`;
  ctx.fillText("PAPER-A-THON", 0, 40);
  ctx.restore();

  ctx.fillStyle = "#4a90ff";
  ctx.font = `800 30px ${display}`;
  ctx.fillText("29 SEPTEMBER · SEMINAR HALL, GROUND FLOOR", W / 2, 370);

  // QR
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, pass.qrText, { ...QR_OPTS, width: 560 });
  ctx.fillStyle = "#ecebe4";
  roundRect(ctx, W / 2 - 310, 420, 620, 620, 36);
  ctx.fill();
  ctx.drawImage(qr, W / 2 - 280, 450, 560, 560);

  // details
  ctx.fillStyle = "#4a90ff";
  ctx.font = `800 30px ${display}`;
  ctx.fillText(pass.id, W / 2, 1110);
  ctx.fillStyle = "#ecebe4";
  ctx.font = `900 64px ${display}`;
  ctx.fillText(fit(ctx, pass.name.toUpperCase(), W - 120), W / 2, 1185);
  ctx.fillStyle = "#8b909b";
  // Track names are long: shrink the type until it fits on one line.
  let size = 32;
  do ctx.font = `500 ${size}px ${display}`;
  while (ctx.measureText(pass.track).width > W - 120 && --size > 22);
  ctx.fillText(fit(ctx, pass.track, W - 120), W / 2, 1240);
  ctx.font = `500 32px ${display}`;
  ctx.fillText(fit(ctx, pass.members.join(" · "), W - 120), W / 2, 1290);

  ctx.fillStyle = "#1f6bff";
  roundRect(ctx, W / 2 - 260, 1340, 520, 80, 40);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = `900 32px ${display}`;
  ctx.fillText(pass.status.toUpperCase(), W / 2, 1392);

  return new Promise((res) => c.toBlob((b) => res(b!), "image/png"));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
  return t + "…";
}
