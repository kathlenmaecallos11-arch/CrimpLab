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

/* ---------- Tools tabs ---------- */
const TOOLS = {
  "Cable": "Cat5 or Cat5e UTP cable. Cut it a little longer than you need. Maximum run: 100 meters (328 ft).",
  "Connectors": "RJ45 (8P8C) plugs, one per cable end. Buy a few extra because mistakes happen. Optional: boots (strain-relief covers) that you slide on before crimping.",
  "Crimping tool": "A crimper with an RJ45 die. It crushes the pins into the wires and presses the clip onto the jacket. Many models also have a built-in cutter and stripper.",
  "Stripper and cutter": "A cable stripper or small scissors to remove the outer jacket without nicking the wires, and a flush cutter to trim the wire ends even.",
  "Cable tester": "A two-piece LAN tester. Plug each end in and watch the lights 1 to 8 go in order. This proves the cable works before you use it."
};
const tt = $("#toolTabs");
Object.keys(TOOLS).forEach((k, i) => {
  const b = document.createElement("button");
  b.className = "tab" + (i ? "" : " active"); b.textContent = k;
  b.onclick = () => { $$(".tab", tt).forEach(x => x.classList.toggle("active", x === b)); $("#toolPanel").textContent = TOOLS[k]; };
  tt.append(b);
});
$("#toolPanel").textContent = TOOLS["Cable"];

/* ---------- Wiring ---------- */
const C = {
  wo: ["White/Orange", "linear-gradient(#fff 50%,#f97316 50%)"], o: ["Orange", "#f97316"],
  wg: ["White/Green", "linear-gradient(#fff 50%,#22c55e 50%)"], g: ["Green", "#22c55e"],
  b: ["Blue", "#2563eb"], wb: ["White/Blue", "linear-gradient(#fff 50%,#2563eb 50%)"],
  wn: ["White/Brown", "linear-gradient(#fff 50%,#92400e 50%)"], n: ["Brown", "#92400e"]
};
const STD = {
  B: { seq: ["wo", "o", "wg", "b", "wb", "g", "wn", "n"], note: "T568B is the most common standard. Use it on both ends for a normal straight-through cable (computer to switch or router)." },
  A: { seq: ["wg", "g", "wo", "b", "wb", "o", "wn", "n"], note: "T568A is also valid and common in some regions. Use it on both ends for a straight-through cable. Never mix standards on one cable unless you want a crossover." },
  X: { seq: ["wg", "g", "wo", "b", "wb", "o", "wn", "n"], note: "A crossover cable uses T568A on one end and T568B on the other. It connects two similar devices directly (PC to PC). Most modern devices auto-detect, so a straight-through cable works almost everywhere." }
};
function drawWires(std) {
  const s = STD[std];
  const strip = $("#wireStrip"), list = $("#pinList");
  strip.innerHTML = ""; list.innerHTML = "";
  const seqs = std === "X" ? [STD.B.seq] : [s.seq];
  s.seq.forEach((k, i) => {
    const [name, bg] = C[k];
    const w = document.createElement("div");
    w.className = "wire"; w.style.background = bg; w.innerHTML = "<b>" + (i + 1) + "</b>";
    const li = document.createElement("li");
    li.innerHTML = '<span class="dot" style="background:' + bg + '"></span><span>Pin ' + (i + 1) + ': ' + name + "</span>";
    const sel = () => { $$(".sel", $("#wiring")).forEach(x => x.classList.remove("sel")); w.classList.add("sel"); li.classList.add("sel"); };
    w.onclick = li.onclick = sel;
    strip.append(w); list.append(li);
  });
  $("#wireNote").textContent = s.note + (std === "X" ? " Shown here: the T568A end. The other end uses T568B." : "");
}
$$("#wireTabs .tab").forEach(b => b.onclick = () => {
  $$("#wireTabs .tab").forEach(x => x.classList.toggle("active", x === b)); drawWires(b.dataset.std);
});
drawWires("B");

/* ---------- Steps ---------- */
const STEPS = [
  ["Gather your tools", "Prepare", "Lay out the cable, RJ45 plugs, crimper, stripper, cutter and tester. Slide the boot onto the cable now if you use one.", "Boots can't be added after crimping."],
  ["Cut the cable", "Prepare", "Cut the cable to the length you need with a clean, straight cut. Add a few centimeters for mistakes.", "Measure twice. Keep it under 100 m."],
  ["Strip the jacket", "Prepare", "Remove about 2.5 cm (1 inch) of the outer jacket. Rotate the stripper gently around the cable and pull the jacket off.", "If you see copper, you cut too deep. Cut and start again."],
  ["Untwist and arrange the wires", "Wiring", "Separate the four pairs and untwist them. Straighten each wire and line them up flat in the T568B order: white/orange, orange, white/green, blue, white/blue, green, white/brown, brown.", "Pinch the wires flat between your fingers so they stay in order."],
  ["Trim the wires even", "Wiring", "Cut across all eight wires so they are the same length, leaving about 1.2 cm (half inch) from the jacket edge.", "Too long and the jacket won't reach the clip. Too short and pins miss the copper."],
  ["Insert into the RJ45 plug", "Crimp", "Hold the plug with the clip side down. Push the wires in until each one touches the front end of the plug and the jacket sits inside the back.", "Look at the front. You should see eight copper tips."],
  ["Crimp the connector", "Crimp", "Place the plug in the crimper's RJ45 slot and squeeze firmly until it clicks or bottoms out. The pins cut through the wire insulation.", "Crimp once, firmly. Don't press repeatedly."],
  ["Test the cable", "Test", "Repeat on the other end, then plug both ends into the cable tester. Lights 1 to 8 should flash in order on both units.", "If a light is skipped or out of order, cut off the plug and redo it."]
];
let cur = 0;
const userKey = () => "steps_" + (store.get("session", null)?.email || "guest");
let done = store.get(userKey(), []);
function renderSteps() {
  const L = $("#stepList"); L.innerHTML = "";
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
  $("#stepDetail").innerHTML = '<span class="tag">' + s[1] + "</span><h3>Step " + (cur + 1) + ": " + s[0] + "</h3><p>" + s[2] + '</p><p class="tip"><strong>Tip:</strong> ' + s[3] + "</p>";
  $("#progressBar").style.width = (done.length / STEPS.length * 100) + "%";
  $("#progressLabel").textContent = done.length + " of " + STEPS.length + " steps done";
  $("#prevStep").disabled = cur === 0; $("#nextStep").disabled = cur === STEPS.length - 1;
}
$("#prevStep").onclick = () => { cur = Math.max(0, cur - 1); renderSteps(); };
$("#nextStep").onclick = () => { cur = Math.min(STEPS.length - 1, cur + 1); renderSteps(); };
$("#resetSteps").onclick = () => { done = []; cur = 0; store.set(userKey(), done); renderSteps(); toast("Progress reset."); };

/* ---------- Troubleshooting ---------- */
const FAQ = [
  ["The tester skips a light", "One wire isn't touching its pin. Cut off the plug and crimp a new one. Make sure wires reach the front of the plug."],
  ["Lights flash in the wrong order", "The color order is wrong or the two ends use different standards. Compare each end to the T568B chart."],
  ["The cable works but is slow or drops", "Untwisting too much (more than 1.3 cm) causes interference. Keep the pairs twisted up to the plug."],
  ["The plug pulls off the cable", "The jacket wasn't inside the plug when crimped, so the clip had nothing to grip. Leave the jacket inside the back of the plug."],
  ["Cat5 or Cat5e?", "The crimping process is the same. Cat5e is better for gigabit speeds, so choose it when you can."]
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
  done = store.get(userKey(), []); renderSteps();
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
    const lines = ["$ strip --jacket 2.5cm", "$ arrange --standard T568B", "$ crimp --connector rj45", "$ test --cable all-pins-ok"];
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