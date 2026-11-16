#!/usr/bin/env node
// equinox-agent: EQUINOX in your terminal. It only reads the public EQUINOX API. It holds no keys and signs nothing.
"use strict";
const BASE = (process.env.EQUINOX_URL || "https://eqnxagent.com").replace(/\/+$/, "");
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const gold = c("38;5;179"), moon = c("38;5;111"), ember = c("38;5;208"), dim = c("2"), bold = c("1"), green = c("32"), red = c("31");
const zoneCol = (k) => (k === "night" ? moon : k === "midsummer" ? ember : gold);
const pct = (v, d = 2) => (v == null || !Number.isFinite(+v) ? "–" : (v >= 0 ? "+" : "") + (+v).toFixed(d) + "%");
const signed = (v, d = 2) => (v == null ? dim("–") : (v >= 0 ? green : red)(pct(v, d)));
const usd = (v, d = 2) => (v == null ? "–" : "$" + (+v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));
const pad = (s, n) => { s = String(s); const vis = s.replace(/\x1b\[[0-9;]*m/g, "").length; return s + " ".repeat(Math.max(0, n - vis)); };
const bar = (h, w = 20) => { const n = Math.round(Math.max(0, Math.min(1, h ?? 0)) * w); return (h > 0.6 ? ember : h < 0.4 ? moon : gold)("█".repeat(n)) + dim("░".repeat(w - n)); };
const LABEL = { nightVolume: "Night volume", nightBuying: "Night buying", launches: "Launch rate", eth: "ETH 24 h", stocks: "SPY/QQQ 24 h", news: "News tone" };

async function get(path) {
  let r;
  try { r = await fetch(BASE + path, { signal: AbortSignal.timeout(20000), headers: { "user-agent": "equinox-agent/0.1" } }); }
  catch (e) { throw new Error(`cannot reach ${BASE} (${e.cause?.code || e.message}). Set EQUINOX_URL to point at another server.`); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

function dial(score) {
  const w = 30, pos = Math.round(((score - 1) / 9) * (w - 1));
  let s = "";
  for (let i = 0; i < w; i++) { const z = i / (w - 1) * 9 + 1; const ch = i === pos ? "●" : "─"; s += (z <= 3 ? moon : z < 8 ? gold : ember)(i === pos ? bold(ch) : ch); }
  return `${moon("1")} ${s} ${ember("10")}`;
}

async function season() {
  const s = await get("/api/state");
  console.log();
  if (s.score == null) { console.log(gold("  EQUINOX"), dim(s.backfill ? "is reading the last three days of the chain…" : "first score in a few minutes")); return; }
  console.log(`  ${gold("EQUINOX")}  ${dim("season score")}`);
  console.log(`  ${bold(zoneCol(s.zone.key)(s.score.toFixed(2)))}  ${zoneCol(s.zone.key)(s.zone.label)}  ${dim("· " + s.zone.act)}`);
  console.log(`  ${dial(s.score)}`);
  console.log();
  for (const [k, p] of Object.entries(s.parts || {})) {
    const v = k === "eth" || k === "stocks" ? pct(p.value) : k === "nightBuying" ? p.value + "%" : k === "news" ? (p.value >= 0 ? "+" : "") + p.value : p.value;
    console.log(`  ${pad(LABEL[k] || k, 14)} ${pad(dim(Math.round(s.weights[k] * 100) + "%"), 5)} ${bar(p.heat)} ${pad(bold(v), 9)} ${dim(p.unit + (p.vs != null ? ` · normal ${p.vs}` : ""))}`);
  }
  if (s.why) { console.log(); console.log("  " + wrap(s.why, 88).join("\n  ")); }
  if (s.eth) console.log(dim(`\n  ETH ${usd(s.eth, 0)} ${pct(s.eth24h, 1)} · updated ${ago(s.scoreAt)} · ${BASE}`));
  console.log();
}

async function record() {
  const s = await get("/api/state");
  const H = s.house?.books || {};
  console.log();
  if (!Object.keys(H).length) { console.log(dim("  The house books open once the first night picks pass the scan.\n")); return; }
  console.log(`  ${gold("House books")} ${dim(`· opened ${new Date(s.house.started).toLocaleString()} with ${usd(s.house.start, 0)} each · paper, nothing is sent`)}`);
  console.log();
  for (const [k, b] of Object.entries(H)) console.log(`  ${pad(k === "equinox" ? gold(bold(b.name)) : b.name, 16)} ${pad(usd(b.equity), 11)} ${pad(signed(b.ret), 9)} ${dim(b.note)}`);
  const t = (H.equinox?.trades || []).slice(0, 8);
  if (t.length) {
    console.log(`\n  ${gold("What EQUINOX did")}`);
    for (const x of t) console.log(`  ${dim(new Date(x.t).toLocaleString())}  ${pad(x.side, 6)} ${pad(usd(x.usd), 10)} ${x.what}  ${dim(x.why || "")}`);
  }
  console.log();
}

async function picks() {
  const s = await get("/api/state");
  console.log();
  console.log(`  ${gold("Night picks")} ${dim(`· rug risk under 30, no high flag, 6 h+ old, still on the curve · scanned ${ago(s.picksAt)}`)}`);
  console.log();
  const rows = s.scanned?.length ? s.scanned : s.picks || [];
  if (!rows.length) { console.log(dim("  Nothing scanned yet.\n")); return; }
  const isPick = new Set((s.picks || []).map((p) => p.curve));
  for (const p of rows.slice(0, 12)) {
    const tag = isPick.has(p.curve) ? green("PICK") : p.high || p.risk >= 30 ? red("SKIP") : dim("pass");
    console.log(`  ${pad(tag, 5)} ${pad(bold("$" + p.symbol), 12)} risk ${pad(p.risk >= 30 || p.high ? red(p.risk) : green(p.risk), 4)} ${pad(dim(`${p.volEth} ETH 24h`), 15)} ${pad(dim(`${p.buyers24h} buyers`), 12)} ${dim((p.flags || []).map((f) => f.why).join(", ") || "no flags")}`);
    console.log(dim(`        ${p.token}`));
  }
  console.log();
}

async function look(addr, target) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr || "")) throw new Error("give a full 0x wallet address: equinox look 0x…");
  const q = `/api/look?address=${addr}` + (target != null ? `&target=${encodeURIComponent(target)}` : "");
  const j = await get(q);
  const h = j.holdings || {};
  console.log();
  console.log(`  ${gold("Wallet")} ${addr}`);
  const dayRows = (h.day || []).filter((x) => x.usd > 0.01);
  const nightRows = (h.night || []).filter((x) => x.usd > 0.01);
  console.log(`  ${pad(gold("Day side"), 18)} ${usd(h.dayUsd)}   ${pad(moon("Night side"), 18)} ${usd(h.nightUsd)}   ${dim("ETH " + (h.eth?.amount != null ? h.eth.amount.toFixed(4) + " (" + usd(h.eth.usd) + ", gas)" : "–"))}`);
  for (const x of dayRows) console.log(`    ${pad(x.sym || x.symbol, 8)} ${usd(x.usd)}`);
  for (const x of nightRows) console.log(`    ${pad("$" + (x.symbol || "?"), 8)} ${usd(x.usd)} ${dim(x.passes === false ? "· no longer passes the scan" : "")}`);
  for (const x of h.unpriced || []) console.log(dim(`    ${x.symbol || "?"} not counted: ${x.why}`));
  const p = j.plan || {};
  console.log(`\n  ${gold("Plan")} ${dim(`· target ${Math.round((j.policy?.target ?? 0.2) * 100)}% night`)}  ${bold(p.action || "hold")}${p.usd ? " " + usd(p.usd) : ""}`);
  if (p.reason) console.log("  " + wrap(p.reason, 88).join("\n  "));
  (p.steps || []).forEach((s, i) => console.log(`   ${dim(i + 1 + ".")} ${s}`));
  console.log(dim(`\n  Sign these steps in your own wallet at ${BASE}/app. This CLI never signs anything.\n`));
}

async function watch() {
  const loop = async () => { process.stdout.write("\x1b[2J\x1b[H"); await season().catch((e) => console.error(red("  " + e.message))); console.log(dim("  refreshing every minute · ctrl+c to stop")); };
  await loop(); setInterval(loop, 60_000);
}

function ago(t) { if (!t) return "–"; const s = Math.round((Date.now() - t) / 1000); return s < 60 ? s + "s ago" : s < 3600 ? Math.round(s / 60) + "m ago" : Math.round(s / 3600) + "h ago"; }
function wrap(t, n) { const out = []; let line = ""; for (const w of String(t).split(/\s+/)) { if ((line + " " + w).trim().length > n) { out.push(line); line = w; } else line = (line + " " + w).trim(); } if (line) out.push(line); return out; }

const HELP = `
  ${gold("equinox")} ${dim("· EQUINOX in your terminal (read-only)")}

  equinox                  the season score, its six readings and the note
  equinox record           the four house books and what EQUINOX did
  equinox picks            memes that pass the rug scan right now
  equinox garden 0x… [20]  day side, night side and the plan for any wallet (optional target %)
  equinox watch            the score, refreshed every minute

  EQUINOX_URL=http://127.0.0.1:4300 equinox   point at another EQUINOX server
`;

(async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  try {
    if (!cmd || cmd === "season" || cmd === "score") await season();
    else if (cmd === "record" || cmd === "books") await record();
    else if (cmd === "picks") await picks();
    else if (cmd === "look" || cmd === "wallet" || cmd === "garden" || cmd === "balance") await look(rest[0], rest[1]);
    else if (cmd === "watch") await watch();
    else if (cmd === "-v" || cmd === "--version") console.log(require("../package.json").version);
    else console.log(HELP);
  } catch (e) { console.error(red("\n  " + e.message + "\n")); process.exitCode = 1; }
})();
