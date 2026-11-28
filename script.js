"use strict";
/* ====== CONFIG: change these before uploading to GitHub ====== */
const CONTACT_EMAIL = "powerpuffgirls@example.com";   // your team's real email
const FORMSPREE_ENDPOINT = "";                        // optional: "https://formspree.io/f/xxxxxxx" sends messages without opening an email app

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

function toast(msg, type = "", ms = 6000) {
  const t = document.createElement("div");
  t.className = "toast " + type; t.textContent = msg;
  $("#toasts").append(t); setTimeout(() => t.remove(), ms);
}

/* ---------- Theme, menu, nav ---------- */
const root = document.documentElement;
root.dataset.theme = store.get("theme", "light");
$("#themeBtn").onclick = () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  store.set("theme", root.dataset.theme);
};
$("#menuBtn").onclick = e => {
  const open = $("#nav").classList.toggle("open");
  e.currentTarget.setAttribute("aria-expanded", open);
};
const closeMenu = () => { $("#nav").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded", "false"); };
$$("#nav a").forEach(a => a.addEventListener("click", closeMenu));
document.addEventListener("click", e => { if (!e.target.closest("#nav, #menuBtn")) closeMenu(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
$("#topBtn").onclick = () => scrollTo({ top: 0, behavior: "smooth" });
const secs = $$("main section[id]");
addEventListener("scroll", () => {
  let cur = "";
  secs.forEach(s => { if (scrollY + 120 >= s.offsetTop) cur = s.id; });
  $$("#nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + cur));
}, { passive: true });

/* ---------- Segmented controls ---------- */
function seg(el, cb) {
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || !el.contains(b)) return;
    $$("button", el).forEach(x => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
    cb(b);
  });
}

/* ---------- Tools tabs ---------- */
const TOOLS = {
  "UTP cable": ["UTP Ethernet Cable (Cat5e/Cat6)", "Contains 8 color-coded wires used to connect network devices.", "Cut it a little longer than you need. Maximum run: 100 meters (328 ft)."],
  "Closed-end plug": ["RJ45 / 8P8C Connector: Closed-End", "The wires are inserted into the connector but do not pass through its front.", "Buy a few extra, because mistakes happen. Boots (strain-relief covers) go on before crimping."],
  "Pass-through plug": ["RJ45 / 8P8C Connector: Pass-Through", "The wires extend through the front of the connector so their order can be checked before trimming/crimping. Use a compatible pass-through crimper.", "Easier to verify the color order, but it needs the right tool."],
  "Pass-through crimper": ["Pass-Through Crimping Tool", "Designed for pass-through plugs; some models can also crimp standard closed-end plugs.", "Check the tool's compatibility guide."],
  "Standard crimper": ["Standard Crimping Tool", "Designed for standard closed-end RJ45 plugs; it may not support pass-through connectors.", "Use the compatibility check below if you are not sure."],
  "Stripper / cutter": ["Wire Stripper / Cutter", "Removes the cable jacket and trims wires to the needed length. Some crimpers include these functions.", "Rotate gently so you do not nick the copper conductors."],
  "LAN tester": ["LAN Cable Tester", "Checks continuity and pin sequence from pin 1 through pin 8; useful for identifying wiring mistakes.", "Plug each end in and watch the lights 1 to 8."]
};
const tt = $("#toolTabs"), tp = $("#toolPanel");
function showTool(k) {
  const [name, purpose, tip] = TOOLS[k];
  tp.innerHTML = "<strong></strong><p></p><p class='tool-tip'></p>";
  tp.children[0].textContent = name; tp.children[1].textContent = purpose; tp.children[2].textContent = tip;
}
Object.keys(TOOLS).forEach((k, i) => {
  const b = document.createElement("button");
  b.className = "tab" + (i ? "" : " active"); b.textContent = k;
  b.onclick = () => { $$(".tab", tt).forEach(x => x.classList.toggle("active", x === b)); showTool(k); };
  tt.append(b);
});
showTool("UTP cable");

/* compatibility checker */
const COMPAT = {
  "closed-std": ["ok", "Good match. A standard crimper is designed for standard closed-end plugs."],
  "closed-pass": ["warn", "Maybe. Some pass-through crimpers can also crimp standard closed-end plugs. Check the tool's compatibility guide."],
  "pass-pass": ["ok", "Good match. The wires extend through the front, so you can check their order before trimming/crimping."],
  "pass-std": ["bad", "Probably not. A standard crimper may not support pass-through connectors. Use a compatible pass-through crimper."]
};
const cp = { plug: "closed", tool: "std" };
function showCompat() {
  const [lvl, msg] = COMPAT[cp.plug + "-" + cp.tool], o = $("#compatOut");
  o.className = "compat-out " + lvl; o.textContent = msg;
}
$$("#compat .seg").forEach(g => seg(g, b => { cp[g.dataset.k] = b.dataset.v; showCompat(); }));
showCompat();

/* ---------- Wiring ---------- */
const C = {
  wo: ["White/Orange", "linear-gradient(#fff 50%,#f97316 50%)"], o: ["Orange", "#f97316"],
  wg: ["White/Green", "linear-gradient(#fff 50%,#22c55e 50%)"], g: ["Green", "#22c55e"],
  b: ["Blue", "#2563eb"], wb: ["White/Blue", "linear-gradient(#fff 50%,#2563eb 50%)"],
  wn: ["White/Brown", "linear-gradient(#fff 50%,#92400e 50%)"], n: ["Brown", "#92400e"]
};
const SEQ_A = ["wg", "g", "wo", "b", "wb", "o", "wn", "n"];
const SEQ_B = ["wo", "o", "wg", "b", "wb", "g", "wn", "n"];
const STD = {
  B: { seq: SEQ_B, note: "T568A and T568B are both accepted standards. T568B is shown here. Use it on both ends (B\u2013B) for a straight-through cable." },
  A: { seq: SEQ_A, note: "T568A is just as valid. Use it on both ends (A\u2013A) for a straight-through cable. Do not mix standards on one cable unless you want a crossover." },
  X: { seq: SEQ_A, note: "A crossover cable has T568A on one end and T568B on the other (A\u2013B). Each row shows End A (T568A) and End B (T568B). Many modern devices support Auto-MDI/MDI-X, so a straight-through cable often works too." }
};
const dot = bg => '<span class="dot" style="background:' + bg + '"></span>';
function drawWires(std) {
  const s = STD[std], strip = $("#wireStrip"), list = $("#pinList");
  strip.innerHTML = ""; list.innerHTML = "";
  s.seq.forEach((k, i) => {
    const [name, bg] = C[k];
    const w = document.createElement("div");
    w.className = "wire"; w.style.background = bg; w.innerHTML = "<b>" + (i + 1) + "</b>";
    const li = document.createElement("li");
    let html = dot(bg) + "<span>Pin " + (i + 1) + ": " + name + "</span>";
    if (std === "X") {
      const [n2, bg2] = C[SEQ_B[i]];
      html += '<span class="arrow" aria-hidden="true">\u21c4</span>' + dot(bg2) + "<span>" + n2 + "</span>";
      if (SEQ_B[i] !== k) li.classList.add("diff");
    }
    li.innerHTML = html;
    const sel = () => { $$(".sel", $("#wiring")).forEach(x => x.classList.remove("sel")); w.classList.add("sel"); li.classList.add("sel"); };
    w.onclick = li.onclick = sel;
    strip.append(w); list.append(li);
  });
  $("#wireNote").textContent = s.note;
}
$$("#wireTabs .tab").forEach(b => b.onclick = () => {
  $$("#wireTabs .tab").forEach(x => x.classList.toggle("active", x === b)); drawWires(b.dataset.std);
});
drawWires("B");

/* A vs B table */
(function () {
  const tb = $("#stdTable tbody");
  SEQ_A.forEach((a, i) => {
    const b = SEQ_B[i], tr = document.createElement("tr");
    if (a !== b) tr.className = "diff";
    tr.innerHTML = "<th scope='row'>" + (i + 1) + "</th><td>" + dot(C[a][1]) + C[a][0] + "</td><td>" + dot(C[b][1]) + C[b][0] + "</td>";
    tb.append(tr);
  });
})();

/* cable-type pin maps (inline SVG) */
const XMAP = [2, 5, 0, 3, 4, 1, 6, 7];            // crossover: 1<->3, 2<->6
const STRAIGHT = [0, 1, 2, 3, 4, 5, 6, 7];
const HEX = { o: "#f97316", g: "#22c55e", b: "#2563eb", n: "#92400e" };
function drawMap(el, map, seq, endA, endB) {
  const NS = "http://www.w3.org/2000/svg", y = i => 28 + i * 19;
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 260 190"); svg.setAttribute("aria-hidden", "true"); svg.style.width = "100%"; svg.style.height = "auto";
  const add = (tag, attrs, txt) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (txt != null) n.textContent = txt; svg.append(n); return n; };
  add("text", { x: 2, y: 12, "text-anchor": "start", class: "map-t" }, endA);
  add("text", { x: 258, y: 12, "text-anchor": "end", class: "map-t" }, endB);
  seq.forEach((k, i) => {
    const col = HEX[k.slice(-1)] || HEX.n, striped = k.length === 2 && k[0] === "w";
    const d = "M44," + y(i) + " C130," + y(i) + " 130," + y(map[i]) + " 216," + y(map[i]);
    add("path", { d, fill: "none", stroke: col, "stroke-width": 4, "stroke-linecap": "round", "stroke-dasharray": striped ? "7 5" : "none", opacity: .95 });
    add("path", { d, fill: "none", class: "pulse", "stroke-width": 2, "stroke-linecap": "round" });
  });
  for (let i = 0; i < 8; i++) {
    add("text", { x: 28, y: y(i) + 4, "text-anchor": "end", class: "map-n" }, i + 1);
    add("circle", { cx: 44, cy: y(i), r: 4, class: "map-d" });
    add("circle", { cx: 216, cy: y(i), r: 4, class: "map-d" });
    add("text", { x: 232, y: y(i) + 4, "text-anchor": "start", class: "map-n" }, i + 1);
  }
  el.append(svg);
}
drawMap($("#mapStraight"), STRAIGHT, SEQ_B, "End A \u00b7 T568B", "End B \u00b7 T568B");
drawMap($("#mapCross"), XMAP, SEQ_A, "End A \u00b7 T568A", "End B \u00b7 T568B");

/* ---------- Steps ---------- */
const SETS = {
  straight: {
    note: "Use the same wiring standard on both ends: T568A at both ends or T568B at both ends.",
    steps: [
      ["Strip the cable jacket", "Prepare", "Remove about 1\u20132 inches (2.5\u20135 cm) of the outer jacket carefully to expose the twisted pairs. Avoid nicking the copper conductors.", "If you see bare copper on a wire, you cut too deep. Cut the end off and start again."],
      ["Arrange the wires", "Wiring", "Untwist and arrange all 8 wires in the chosen T568A or T568B color order.", "Do not untwist the pairs more than necessary. Pinch the wires flat between your fingers so they stay in order.", "std"],
      ["Straighten and trim", "Wiring", "Straighten the conductors and cut them evenly so they are the proper length for the connector.", "Too long and the jacket will not reach the clip. Too short and the pins miss the copper."],
      ["Insert into the RJ45 plug", "Crimp", "Place the wires in the correct slots. For a closed-end plug, check that each wire reaches the front. For a pass-through plug, confirm the order as the wires emerge.", "Check the color sequence before crimping. Hold the plug the way your connector manufacturer shows."],
      ["Crimp the connector", "Crimp", "Use a crimping tool compatible with the connector type. Press firmly as instructed by the tool manufacturer.", "Pass-through plugs need a compatible pass-through crimper."],
      ["Repeat the same standard on the other end", "Crimp", "If the first end is T568A, use T568A on the other end. If the first end is T568B, use T568B on the other end.", "A\u2013A or B\u2013B is straight-through. Mixing A and B makes a crossover.", "std"],
      ["Test the cable", "Test", "Use a LAN cable tester. Check that all 8 pins show the correct sequence and that there are no missing, crossed, or shorted connections.", 'Not sure what a result means? Try the <a href="#fix">virtual tester</a>.']
    ]
  },
  cross: {
    note: "A crossover cable uses T568A on one end and T568B on the other. Preparation and crimping are the same as straight-through; only the color order at the second end changes.",
    steps: [
      ["Prepare the cable", "Prepare", "Strip the jacket and carefully separate the 8 conductors.", "Avoid nicking the copper conductors."],
      ["Wire End A using T568A", "End A", "Arrange, trim, insert into the connector, and crimp using the T568A sequence.", "Check the color sequence before crimping.", "A"],
      ["Wire End B using T568B", "End B", "Arrange the other end using the T568B sequence, then insert and crimp.", "This is the only difference from a straight-through cable.", "B"],
      ["Test the cable", "Test", "Use a cable tester to confirm the intended crossover wiring and check for faults.", 'On a crossover, expect pins 1\u21943 and 2\u21946 to swap. That is correct. See the <a href="#fix">virtual tester</a>.']
    ]
  }
};
let mode = "straight", stdSel = "B", cur = 0;
const userKey = () => "steps_" + (store.get("session", null)?.email || "guest") + "_" + mode;
let done = store.get(userKey(), []);
function chips(which) {
  const seq = which === "std" ? STD[stdSel].seq : STD[which].seq;
  const label = which === "std" ? "T568" + stdSel : "T568" + which;
  return '<div class="chips" role="img" aria-label="' + label + ' order: ' + seq.map(k => C[k][0]).join(", ") + '"><small>' + label + " order</small><ol>" +
    seq.map((k, i) => '<li title="' + C[k][0] + '"><i style="background:' + C[k][1] + '"></i><span>' + (i + 1) + "</span></li>").join("") + "</ol></div>";
}
function renderSteps() {
  const STEPS = SETS[mode].steps, L = $("#stepList"); L.innerHTML = "";
  STEPS.forEach((s, i) => {
    const li = document.createElement("li");
    li.className = (i === cur ? "active " : "") + (done.includes(i) ? "done" : "");
    li.innerHTML = '<input type="checkbox" aria-label="Mark step ' + (i + 1) + ' done"' + (done.includes(i) ? " checked" : "") + '><span class="n">' + (i + 1) + '</span><span class="t">' + s[0] + "</span>";
    li.onclick = e => { if (e.target.tagName !== "INPUT") { cur = i; renderSteps(); } };
    $("input", li).onchange = e => {
      done = e.target.checked ? [...new Set([...done, i])] : done.filter(x => x !== i);
      store.set(userKey(), done); renderSteps();
      if (done.length === STEPS.length) toast("All steps complete. Your cable is ready.", "ok");
    };
    L.append(li);
  });
  const s = STEPS[cur];
  $("#stepDetail").innerHTML = '<span class="tag">' + s[1] + "</span><h3>Step " + (cur + 1) + " of " + STEPS.length + ": " + s[0] + "</h3><p>" + s[2] + "</p>" + (s[4] ? chips(s[4]) : "") + '<p class="tip"><strong>Tip:</strong> ' + s[3] + "</p>";
  $("#progressBar").style.width = (done.length / STEPS.length * 100) + "%";
  $("#progressLabel").textContent = done.length + " of " + STEPS.length + " steps done";
  $("#prevStep").disabled = cur === 0; $("#nextStep").disabled = cur === STEPS.length - 1;
  $("#modeNote").innerHTML = "<strong>" + (mode === "straight" ? "Straight-through" : "Crossover") + ":</strong> " + SETS[mode].note;
  $("#stdWrap").hidden = mode !== "straight";
}
function setMode(m) {
  mode = m; cur = 0; done = store.get(userKey(), []);
  $$("#modeSeg button").forEach(x => { const on = x.dataset.mode === m; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on); });
  renderSteps();
}
seg($("#modeSeg"), b => setMode(b.dataset.mode));
seg($("#stdSeg"), b => { stdSel = b.dataset.std; renderSteps(); });
$("#prevStep").onclick = () => { cur = Math.max(0, cur - 1); renderSteps(); };
$("#nextStep").onclick = () => { cur = Math.min(SETS[mode].steps.length - 1, cur + 1); renderSteps(); };
$("#resetSteps").onclick = () => { done = []; cur = 0; store.set(userKey(), done); renderSteps(); toast("Progress reset."); };

/* ---------- Reminders checklist ---------- */
const REMIND = [
  "Check the wire color sequence before crimping.",
  "T568A and T568B are both valid wiring standards.",
  "Straight-through cables can use A\u2013A or B\u2013B.",
  "Crossover cables use A\u2013B.",
  "Use connectors and crimping tools that are compatible with each other.",
  "Do not nick the copper wires or untwist the pairs more than necessary.",
  "Test the finished cable before using it."
];
const remKey = () => "remind_" + (store.get("session", null)?.email || "guest");
function renderRemind() {
  const got = store.get(remKey(), []), ul = $("#remindList"); ul.innerHTML = "";
  REMIND.forEach((t, i) => {
    const li = document.createElement("li"); li.className = got.includes(i) ? "done" : "";
    const lb = document.createElement("label"), cb = document.createElement("input");
    cb.type = "checkbox"; cb.checked = got.includes(i);
    cb.onchange = () => {
      const g = store.get(remKey(), []), n = cb.checked ? [...new Set([...g, i])] : g.filter(x => x !== i);
      store.set(remKey(), n); renderRemind();
      if (n.length === REMIND.length) toast("Checklist complete. You are ready to crimp.", "ok");
    };
    const sp = document.createElement("span"); sp.textContent = t;
    lb.append(cb, sp); li.append(lb); ul.append(li);
  });
  $("#remindLabel").textContent = got.length + " of " + REMIND.length + " reminders checked";
}

/* ---------- Virtual cable tester ---------- */
const SCEN = [
  { label: "Good straight-through", want: XMAP.map((_, i) => i), map: i => [i] },
  { label: "Good crossover", want: XMAP, map: i => [XMAP[i]] },
  { label: "Missing wire", want: STRAIGHT, map: i => i === 3 ? [] : [i] },
  { label: "Crossed wires", want: STRAIGHT, map: i => [i === 2 ? 5 : i === 5 ? 2 : i] },
  { label: "Shorted pins", want: STRAIGHT, map: i => i >= 6 ? [6, 7] : [i] }
];
let scen = 0, tTimer = null;
const ledsA = $("#ledsA"), ledsB = $("#ledsB");
for (let i = 1; i <= 8; i++) for (const box of [ledsA, ledsB]) { const d = document.createElement("i"); d.textContent = i; box.append(d); }
SCEN.forEach((s, i) => {
  const b = document.createElement("button"); b.type = "button"; b.textContent = s.label;
  b.className = i ? "" : "on"; b.setAttribute("aria-pressed", i === 0); $("#scenSeg").append(b);
});
function resetLeds(msg) {
  clearInterval(tTimer); tTimer = null; $("#runTest").disabled = false;
  $$("i", ledsA).concat($$("i", ledsB)).forEach(l => l.className = "");
  $("#verdict").className = "verdict"; $("#verdict").textContent = msg || "Pick a scenario, then press Run test.";
}
seg($("#scenSeg"), b => { scen = $$("#scenSeg button").indexOf(b); resetLeds(); });
function verdict() {
  const S = SCEN[scen], miss = [], short = [], swap = [];
  for (let i = 0; i < 8; i++) {
    const got = S.map(i);
    if (!got.length) miss.push(i + 1);
    else if (got.length > 1) short.push(got.map(x => x + 1).join(" & "));
    else if (got[0] !== S.want[i]) swap.push((i + 1) + "\u2192" + (got[0] + 1));
  }
  const bad = miss.length || short.length || swap.length;
  const out = $("#verdict"); out.className = "verdict " + (bad ? "bad" : "ok");
  if (!bad) out.textContent = scen === 1 ? "Pass. Pins 1\u21943 and 2\u21946 swap, which is correct for a crossover cable." : "Pass. All 8 lights flashed in order from 1 to 8.";
  else {
    const parts = [];
    if (miss.length) parts.push("pin " + miss.join(", ") + " never lit on the remote unit (a wire is not making contact)");
    if (short.length) parts.push("pins " + [...new Set(short)].join(" and ") + " lit together (two conductors are shorted)");
    if (swap.length) parts.push("wires are crossed (" + swap.join(", ") + ")");
    out.textContent = "Fail: " + parts.join("; ") + ". Cut off the plug and crimp a new one, checking the color order.";
  }
}
$("#runTest").onclick = () => {
  resetLeds(); const S = SCEN[scen], a = $$("i", ledsA), b = $$("i", ledsB);
  const fast = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finish = () => {
    clearInterval(tTimer); tTimer = null; $("#runTest").disabled = false;
    a.concat(b).forEach(l => l.classList.remove("on", "badled"));
    for (let i = 0; i < 8; i++) if (!S.map(i).length) b[i].classList.add("miss");
    verdict();
  };
  if (fast) return finish();
  $("#runTest").disabled = true; $("#verdict").textContent = "Testing\u2026";
  let i = 0;
  tTimer = setInterval(() => {
    a.concat(b).forEach(l => l.classList.remove("on", "badled"));
    if (i >= 8) return finish();
    a[i].classList.add("on");
    S.map(i).forEach(t => b[t].classList.add(t === S.want[i] && S.map(i).length === 1 ? "on" : "badled"));
    i++;
  }, 480);
};

/* ---------- Troubleshooting ---------- */
const FAQ = [
  ["The tester skips a light", "One wire is not touching its pin, or a wire is missing. Cut off the plug and crimp a new one. Make sure each wire reaches the front of the plug."],
  ["Lights flash in the wrong order", "The color order is wrong, or the two ends use different standards. Compare each end to the T568A or T568B chart. A straight-through cable should use the same standard on both ends."],
  ["Two lights come on together", "That points to a shorted connection, where two conductors are touching. Re-do the plug and check that the wires sit in their own slots."],
  ["The cable is slow or drops", "Untwisting the pairs more than necessary causes interference. Keep the pairs twisted up to the plug, and test the finished cable before using it."],
  ["The pass-through plug will not crimp", "Pass-through plugs need a compatible pass-through crimper. A standard crimper may not support them. Use the compatibility check in the Basics section."],
  ["T568A or T568B?", "Both are valid. For a straight-through cable, pick either one and use it on both ends. If you already have cables in your building, match what they use."],
  ["Do I need a crossover cable?", "Rarely. A crossover (A\u2013B) was traditionally used to connect similar devices directly, but many modern devices support Auto-MDI/MDI-X and work with a straight-through cable."],
  ["Cat5e or Cat6?", "The crimping process is the same. Both carry gigabit Ethernet, and Cat6 gives more headroom. Make sure your plugs are rated for the cable you buy."]
];
FAQ.forEach(([q, a]) => { const d = document.createElement("details"); d.innerHTML = "<summary>" + q + "</summary><p>" + a + "</p>"; $("#accordion").append(d); });

/* ---------- Auth ---------- */
const dlg = $("#authDialog");
const users = () => store.get("users", {});
const session = () => store.get("session", null);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function hash(pw, salt) {
  const data = new TextEncoder().encode(salt + pw);
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 5381; for (const b of data) h = ((h << 5) + h + b) >>> 0; return String(h);
}
function setErr(id, msg) { const e = $('.err[data-for="' + id + '"]'); if (e) e.textContent = msg || ""; }
function clearErrs(form) { $$(".err", form).forEach(e => e.textContent = ""); }

let capAns = 0;
function newCaptcha() {
  const r = n => 1 + Math.floor(Math.random() * n);
  let a = r(9), b = r(9); const sub = Math.random() < 0.5;
  if (sub && a < b) [a, b] = [b, a];
  capAns = sub ? a - b : a + b;
  $("#capQ").textContent = a + (sub ? " \u2212 " : " + ") + b + " = ?";
  $("#liCap").value = "";
}
$("#capNew").onclick = newCaptcha;

function pane(name) {
  $("#loginForm").hidden = name !== "login";
  $("#regForm").hidden = name !== "register";
  $("#authTitle").textContent = name === "login" ? "Log in" : "Create an account";
  if (name === "login") newCaptcha();
}
function openAuth(p = "login") { pane(p); if (!dlg.open) dlg.showModal(); }
$$("[data-go]").forEach(b => b.onclick = () => { clearErrs(dlg); pane(b.dataset.go); });
$("#closeAuth").onclick = () => dlg.close();
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
$$(".show").forEach(b => b.onclick = () => {
  const i = b.previousElementSibling; i.type = i.type === "password" ? "text" : "password"; b.textContent = i.type === "password" ? "Show" : "Hide";
});

function strength(p) {
  let s = 0;
  if (p.length >= 8) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
$("#rgPass").oninput = e => {
  const s = strength(e.target.value), bar = $("#meterBar");
  bar.style.width = s * 25 + "%"; bar.style.background = ["#ef4444", "#ef4444", "#f59e0b", "#0ea5e9", "#22c55e"][s];
  $("#meterText").textContent = e.target.value ? ["Very weak", "Weak", "Fair", "Good", "Strong"][s] : "Use 8+ characters with upper and lower case letters, a number and a symbol.";
};

$("#regForm").onsubmit = async e => {
  e.preventDefault(); clearErrs(e.target);
  const name = $("#rgName").value.trim(), email = $("#rgEmail").value.trim().toLowerCase(), p1 = $("#rgPass").value, p2 = $("#rgPass2").value;
  let ok = true; const bad = (id, m) => { setErr(id, m); ok = false; };
  if (name.length < 2) bad("rgName", "Enter your full name.");
  if (!EMAIL_RE.test(email)) bad("rgEmail", "Enter a valid email, like name@example.com.");
  else if (users()[email]) bad("rgEmail", "This email is already registered. Log in instead.");
  if (strength(p1) < 3 || p1.length < 8) bad("rgPass", "Password needs 8+ characters with upper and lower case letters, a number and a symbol.");
  if (p1 !== p2) bad("rgPass2", "Passwords do not match.");
  if (!$("#rgTerms").checked) bad("rgTerms", "Agree to the terms to continue.");
  if (!ok) return toast("Fix the highlighted fields.", "bad", 3500);
  const salt = (window.crypto && crypto.getRandomValues) ? [...crypto.getRandomValues(new Uint8Array(8))].join("") : String(Math.random());
  const u = users(); u[email] = { name, email, salt, hash: await hash(p1, salt) }; store.set("users", u);
  e.target.reset(); $("#meterBar").style.width = 0;
  toast("Account created. Log in with your new email and password.", "ok");
  $("#liEmail").value = email; pane("login");
};

$("#loginForm").onsubmit = async e => {
  e.preventDefault(); clearErrs(e.target);
  const email = $("#liEmail").value.trim().toLowerCase(), pw = $("#liPass").value, cap = $("#liCap").value.trim();
  let ok = true; const bad = (id, m) => { setErr(id, m); ok = false; };
  if (!EMAIL_RE.test(email)) bad("liEmail", "Enter a valid email.");
  if (!pw) bad("liPass", "Enter your password.");
  if (cap === "") bad("liCap", "Solve the math question.");
  else if (Number(cap) !== capAns) { bad("liCap", "Wrong answer. Try the new question."); newCaptcha(); }
  if (!ok) return;
  const rec = users()[email];
  if (!rec) { setErr("liEmail", "No account with this email. Create an account first."); return newCaptcha(); }
  if (await hash(pw, rec.salt) !== rec.hash) { setErr("liPass", "Incorrect password."); return newCaptcha(); }
  store.set("session", { email, name: rec.name }); e.target.reset(); dlg.close();
  refreshAuth(); toast("Welcome back, " + rec.name.split(" ")[0] + ".", "ok");
};

function refreshAuth() {
  const s = session();
  $("#authBtn").textContent = s ? "Log out" : "Log in";
  $("#userChip").hidden = !s; if (s) { const c = $("#userChip"); c.textContent = s.name.trim().charAt(0).toUpperCase(); c.title = s.name; c.setAttribute("aria-label", "Logged in as " + s.name); }
  done = store.get(userKey(), []); renderSteps(); renderRemind();
}
$("#authBtn").onclick = () => {
  if (session()) { store.del("session"); refreshAuth(); toast("Logged out."); } else openAuth("login");
};
refreshAuth();

/* ---------- Contact ---------- */
$("#mailLink").textContent = CONTACT_EMAIL;
$("#mailLink").href = "mailto:" + CONTACT_EMAIL;
$("#mailBtn").onclick = () => { location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("CrimpLab inquiry"); };
$("#copyMail").onclick = async () => {
  try { await navigator.clipboard.writeText(CONTACT_EMAIL); toast("Email copied: " + CONTACT_EMAIL, "ok", 3500); }
  catch { const t = document.createElement("textarea"); t.value = CONTACT_EMAIL; document.body.append(t); t.select(); document.execCommand("copy"); t.remove(); toast("Email copied: " + CONTACT_EMAIL, "ok", 3500); }
};
$("#contactForm").onsubmit = async e => {
  e.preventDefault(); clearErrs(e.target);
  const name = $("#ctName").value.trim(), email = $("#ctEmail").value.trim(), subject = $("#ctSubject").value, message = $("#ctMsg").value.trim();
  let ok = true; const bad = (id, m) => { setErr(id, m); ok = false; };
  if (name.length < 2) bad("ctName", "Enter your name.");
  if (!EMAIL_RE.test(email)) bad("ctEmail", "Enter a valid email so we can reply.");
  if (message.length < 10) bad("ctMsg", "Write at least 10 characters.");
  if (!ok) return;
  if (FORMSPREE_ENDPOINT) {
    try {
      const r = await fetch(FORMSPREE_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ name, email, subject, message }) });
      if (!r.ok) throw 0;
      e.target.reset(); return toast("Message sent. We will reply to " + email + ".", "ok");
    } catch { return toast("Could not send. Check your connection or email us directly.", "bad"); }
  }
  location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("[CrimpLab] " + subject) + "&body=" + encodeURIComponent(message + "\n\nFrom: " + name + " (" + email + ")");
  toast("Opening your email app. Press send there to deliver your message.", "ok");
};

/* ---------- Tech effects: binary rain + terminal typing ---------- */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cv = $("#binaryBg");
  if (cv) {
    const ctx = cv.getContext("2d"), fs = 16;
    let w = 0, h = 0, drops = [], visible = true, last = 0;
    const size = () => {
      w = cv.width = cv.parentElement.offsetWidth; h = cv.height = cv.parentElement.offsetHeight;
      drops = Array.from({ length: Math.ceil(w / fs) }, () => Math.random() * (h / fs));
    };
    const draw = t => {
      requestAnimationFrame(draw);
      if (!visible || document.hidden || t - last < 60) return;
      last = t;
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,.14)"; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
      ctx.font = fs + "px ui-monospace, Consolas, monospace";
      ctx.fillStyle = root.dataset.theme === "dark" ? "rgba(125,211,252,.85)" : "rgba(14,165,233,.9)";
      drops.forEach((y, i) => {
        ctx.fillText(Math.random() < .5 ? "0" : "1", i * fs, y * fs);
        drops[i] = y * fs > h && Math.random() > .975 ? 0 : y + 1;
      });
    };
    size();
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(size, 200); });
    new IntersectionObserver(e => visible = e[0].isIntersecting).observe(cv.parentElement);
    if (reduce) { // one still frame, no animation
      ctx.font = fs + "px ui-monospace, Consolas, monospace"; ctx.fillStyle = "rgba(14,165,233,.5)";
      for (let x = 0; x < w; x += fs) for (let y = fs; y < h; y += fs * 1.4) if (Math.random() < .25) ctx.fillText(Math.random() < .5 ? "0" : "1", x, y);
    } else requestAnimationFrame(draw);
  }

  const out = $("#typed");
  if (out) {
    const lines = ["$ strip --jacket 1-2in", "$ arrange --standard T568B", "$ crimp --connector rj45", "$ test --pins 1-8 --ok"];
    if (reduce) { out.textContent = lines[2]; return; }
    let li = 0, ci = 0, del = false;
    (function tick() {
      const s = lines[li];
      out.textContent = s.slice(0, ci);
      let wait = del ? 25 : 70;
      if (!del && ci === s.length) { del = true; wait = 1400; }
      else if (del && ci === 0) { del = false; li = (li + 1) % lines.length; wait = 350; }
      else ci += del ? -1 : 1;
      setTimeout(tick, wait);
    })();
  }
})();


/* ---------- Modern UI layer: scroll bar, reveal, counters, command palette ---------- */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* scroll progress */
  const bar = $("#scrollBar");
  const upd = () => { const m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = "scaleX(" + (m > 0 ? Math.min(1, scrollY / m) : 0) + ")"; };
  addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();

  /* reveal on scroll (classes are removed afterwards so hover effects keep working) */
  if (!reduce && "IntersectionObserver" in window) {
    const targets = $$(".section .card, .tool-panel, .compat, .wire-box, .tbl-wrap, .quick > div, .stepper, .remind, .tester, .acc details, .members li, .contact-grid > *, .callout");
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in"); io.unobserve(e.target);
      setTimeout(() => e.target.classList.remove("reveal", "in"), 900);
    }), { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    targets.forEach(t => {
      const sibs = [...t.parentElement.children].filter(c => targets.includes(c));
      t.style.setProperty("--d", Math.min(sibs.indexOf(t), 4) * 0.08 + "s");
      t.classList.add("reveal"); io.observe(t);
    });
  }

  /* count-up stats */
  const stats = $$("#stats b[data-count]");
  if (stats.length && !reduce && "IntersectionObserver" in window) {
    stats.forEach(b => b.textContent = "0");
    new IntersectionObserver((es, o) => {
      if (!es[0].isIntersecting) return; o.disconnect();
      const t0 = performance.now();
      (function f(t) {
        const p = Math.min(1, (t - t0) / 1000);
        stats.forEach(b => b.textContent = Math.round(+b.dataset.count * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(f);
      })(t0);
    }).observe($("#stats"));
  }

  /* command palette (Ctrl/Cmd + K) */
  const pal = $("#palette"), q = $("#palQ"), list = $("#palList");
  const go = sel => () => $(sel).scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  const ITEMS = [
    ...$$("#nav a").map(a => ({ t: a.textContent, s: "Section", run: go(a.getAttribute("href")) })),
    { t: "Cable types", s: "Wiring", run: go("#cableTypes") },
    { t: "Virtual cable tester", s: "Testing", run: go("#tester") },
    { t: "Straight-through steps", s: "Guide", run: () => { setMode("straight"); go("#steps")(); } },
    { t: "Crossover steps", s: "Guide", run: () => { setMode("cross"); go("#steps")(); } },
    { t: "Toggle light / dark theme", s: "Action", run: () => $("#themeBtn").click() }
  ];
  let shown = [], idx = 0;
  function render() {
    const k = q.value.trim().toLowerCase();
    shown = ITEMS.filter(i => !k || (i.t + " " + i.s).toLowerCase().includes(k));
    idx = Math.min(idx, Math.max(0, shown.length - 1));
    list.innerHTML = "";
    if (!shown.length) { list.innerHTML = '<li class="none">No matches</li>'; return; }
    shown.forEach((it, i) => {
      const li = document.createElement("li"); li.setAttribute("role", "option");
      li.className = i === idx ? "on" : ""; li.setAttribute("aria-selected", i === idx);
      li.innerHTML = "<span></span><small></small>"; li.children[0].textContent = it.t; li.children[1].textContent = it.s;
      li.onclick = () => pick(i); li.onmousemove = () => { if (idx !== i) { idx = i; render(); } };
      list.append(li);
    });
  }
  function pick(i) { const it = shown[i]; if (!it) return; pal.close(); setTimeout(it.run, 30); }
  function openPal() { q.value = ""; idx = 0; render(); if (!pal.open) pal.showModal(); q.focus(); }
  q.oninput = () => { idx = 0; render(); };
  pal.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); idx = (idx + 1) % Math.max(1, shown.length); render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); idx = (idx - 1 + shown.length) % Math.max(1, shown.length); render(); }
    else if (e.key === "Enter") { e.preventDefault(); pick(idx); }
  });
  pal.addEventListener("click", e => { if (e.target === pal) pal.close(); });
  $("#palBtn").onclick = openPal;
  addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pal.open ? pal.close() : openPal(); }
  });
})();
