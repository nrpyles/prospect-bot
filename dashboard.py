"""
PROSPECT DASHBOARD SERVER
Run this and open http://localhost:8080 in your browser.
Reads/writes to prospects.json in the same folder.

USAGE:
  python3 dashboard.py

Then open http://localhost:8080
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import time
import random
import subprocess
import threading

DATA_FILE = "prospects.json"
PORT = int(os.environ.get("PORT", 8080))

def load_prospects():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return []

def save_prospects(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

class DashboardHandler(SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path == "/api/prospects":
            prospects = load_prospects()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(prospects).encode())

        elif self.path == "/" or self.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(DASHBOARD_HTML.encode())

        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/search":
            # Run prospect finder in background thread
            def run_search():
                try:
                    subprocess.run(["python3", "prospect-finder-v2.py"], cwd=os.path.dirname(os.path.abspath(__file__)) or ".")
                except Exception as e:
                    print(f"Search error: {e}")
            
            thread = threading.Thread(target=run_search)
            thread.start()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "searching", "message": "Prospect search started. New leads will appear in 2 to 5 minutes."}).encode())
            return

        if self.path == "/api/prospects":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            prospects = load_prospects()

            body["id"] = f"p_{int(time.time()*1000)}_{random.randint(100,999)}"
            prospects.append(body)
            save_prospects(prospects)

            self.send_response(201)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(body).encode())

    def do_PUT(self):
        if self.path.startswith("/api/prospects/"):
            pid = self.path.split("/")[-1]
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            prospects = load_prospects()

            for i, p in enumerate(prospects):
                if p.get("id") == pid:
                    body["id"] = pid
                    prospects[i] = body
                    break

            save_prospects(prospects)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(body).encode())

    def do_DELETE(self):
        if self.path.startswith("/api/prospects/"):
            pid = self.path.split("/")[-1]
            prospects = load_prospects()
            prospects = [p for p in prospects if p.get("id") != pid]
            save_prospects(prospects)

            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"ok":true}')

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress terminal spam


DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prospect Pipeline Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg: #08080A; --raised: #111114; --hover: #18181C; --border: #1E1E24;
  --text: #EDEDEF; --dim: #8E8E96; --muted: #55555C;
  --accent: #FF6B2C; --green: #10b981; --blue: #3b82f6;
  --yellow: #f59e0b; --red: #ef4444; --purple: #6366f1;
}
html { scroll-behavior: smooth; }
body {
  font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text);
  line-height: 1.6; -webkit-font-smoothing: antialiased;
}
body::after {
  content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
}

/* NAV */
.nav {
  position: sticky; top: 0; z-index: 50; padding: 16px 24px;
  background: rgba(8,8,10,0.9); backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.nav-logo { font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 700; }
.nav-logo span { color: var(--accent); }
.nav-tabs { display: flex; gap: 4px; }
.nav-tab {
  background: transparent; border: 1px solid transparent; color: var(--muted);
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all 0.2s;
}
.nav-tab.active { background: rgba(255,107,44,0.12); color: var(--accent); border-color: rgba(255,107,44,0.2); }
.nav-right { display: flex; gap: 10px; align-items: center; }
.badge {
  padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 700;
}
.btn {
  padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit; border: none; transition: all 0.2s;
}
.btn-accent { background: var(--accent); color: #fff; }
.btn-accent:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,107,44,0.2); }
.btn-ghost { background: transparent; color: var(--dim); border: 1px solid var(--border); }
.btn-ghost:hover { border-color: var(--muted); background: var(--raised); }

/* STATS */
.stats-bar {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px; padding: 20px 24px;
}
.stat-card {
  background: var(--raised); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px 14px;
}
.stat-num {
  font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700;
  letter-spacing: -1px;
}
.stat-label {
  font-size: 10px; color: var(--muted); text-transform: uppercase;
  letter-spacing: 1.5px; margin-top: 4px; font-weight: 600;
}

/* FILTERS */
.filters {
  padding: 0 24px 16px; display: flex; gap: 10px; flex-wrap: wrap;
}
.filter-input, .filter-select {
  background: var(--raised); border: 1px solid var(--border); border-radius: 10px;
  padding: 10px 16px; color: var(--text); font-size: 13px; font-family: inherit; outline: none;
}
.filter-input { min-width: 220; flex: 1; }
.filter-input:focus, .filter-select:focus { border-color: var(--accent); }

/* PIPELINE */
.pipeline {
  display: grid; gap: 10px; padding: 0 24px 40px;
  overflow-x: auto;
}
.pipeline-cols {
  display: grid; grid-template-columns: repeat(6, minmax(210px, 1fr));
  gap: 10px; min-width: 900px;
}
.col {
  background: #0D0D10; border-radius: 14px; border: 1px solid var(--border);
  overflow: hidden; display: flex; flex-direction: column;
}
.col-head {
  padding: 14px 16px 10px; border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.col-title {
  font-size: 12px; font-weight: 700; color: var(--dim);
  text-transform: uppercase; letter-spacing: 1px;
}
.col-count {
  font-family: 'JetBrains Mono'; font-size: 13px; font-weight: 700; color: var(--muted);
}
.col-body {
  padding: 8px; display: flex; flex-direction: column; gap: 8px;
  max-height: 520px; overflow-y: auto; flex: 1;
}
.col-body::-webkit-scrollbar { width: 4px; }
.col-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.col-empty { padding: 24px; text-align: center; font-size: 12px; color: #333; }

/* CARDS */
.card {
  background: var(--raised); border: 1px solid var(--border); border-radius: 12px;
  padding: 14px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;
}
.card:hover { border-color: var(--accent); transform: translateY(-2px); }
.card-stripe { position: absolute; top: 0; left: 0; right: 0; height: 2px; opacity: 0.5; }
.card-name { font-size: 14px; font-weight: 700; margin-bottom: 6px; line-height: 1.3; }
.card-tags { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px; }
.tag-sm {
  font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.card-meta { display: flex; justify-content: space-between; align-items: center; }
.card-quality { font-size: 10px; font-weight: 600; }
.card-rating { font-size: 11px; color: var(--yellow); font-family: 'JetBrains Mono'; font-weight: 700; }
.card-value {
  margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border);
  font-family: 'JetBrains Mono'; font-size: 14px; font-weight: 700; color: var(--green);
}

/* TABLE */
.table-wrap { padding: 0 24px 40px; overflow-x: auto; }
.table {
  background: var(--raised); border: 1px solid var(--border); border-radius: 14px;
  overflow: hidden; min-width: 900px; width: 100%;
}
.table-head {
  display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr 1fr 1fr 0.8fr;
  padding: 12px 18px; border-bottom: 1px solid var(--border); gap: 10px;
}
.table-th {
  font-size: 10px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: 1.5px;
}
.table-row {
  display: grid; grid-template-columns: 2fr 1.2fr 1fr 1fr 1fr 1fr 0.8fr;
  padding: 12px 18px; border-bottom: 1px solid #141418; gap: 10px;
  cursor: pointer; transition: background 0.15s;
}
.table-row:hover { background: var(--hover); }
.table-cell { font-size: 13px; display: flex; align-items: center; }

/* STATS VIEW */
.stats-view { padding: 0 24px 40px; display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 14px; }
.stats-card {
  background: var(--raised); border: 1px solid var(--border); border-radius: 16px; padding: 24px;
}
.stats-title {
  font-size: 12px; font-weight: 700; color: var(--dim);
  text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 18px;
}
.bar-row { margin-bottom: 14px; }
.bar-label { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
.bar-label span:first-child { font-weight: 600; }
.bar-label span:last-child { color: var(--muted); font-family: 'JetBrains Mono'; font-size: 12px; }
.bar-track { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
.big-stat {
  margin-top: 16px; padding: 14px 16px; border-radius: 10px;
}
.big-stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 4px; }
.big-stat-num { font-family: 'JetBrains Mono'; font-size: 28px; font-weight: 700; }

/* MODAL */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px;
}
.modal {
  background: var(--raised); border: 1px solid var(--border); border-radius: 20px;
  padding: 28px; max-width: 540px; width: 100%; max-height: 85vh; overflow-y: auto; position: relative;
}
.modal-close {
  position: absolute; top: 14px; right: 14px; background: rgba(255,255,255,0.05);
  border: none; color: var(--dim); font-size: 18px; cursor: pointer;
  width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
}
.modal h2 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
.modal-sub { font-size: 14px; color: var(--dim); margin-bottom: 20px; }
.modal-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.modal-field { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1A1A1E; }
.modal-field-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
.modal-field-value { font-size: 14px; font-weight: 500; text-align: right; max-width: 60%; word-break: break-all; }
.modal-notes {
  margin-top: 16px; padding: 14px 16px; background: rgba(255,255,255,0.02);
  border-radius: 10px; border: 1px solid var(--border);
}
.modal-notes-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 600; }
.modal-notes-text { font-size: 13px; color: var(--dim); line-height: 1.7; }
.modal-actions { display: flex; gap: 10px; margin-top: 20px; }

/* EDIT FORM */
.form-group { margin-bottom: 14px; }
.form-label { font-size: 11px; color: var(--dim); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 6px; display: block; }
.form-input, .form-select {
  width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
  padding: 12px 16px; color: var(--text); font-size: 14px; font-family: inherit; outline: none;
}
.form-input:focus, .form-select:focus { border-color: var(--accent); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

@media (max-width: 768px) {
  .stats-bar { grid-template-columns: repeat(2, 1fr); }
  .nav { flex-wrap: wrap; gap: 10px; }
  .nav-right { display: none; }
  .pipeline-cols { grid-template-columns: repeat(6, 240px); }
  .stats-view { grid-template-columns: 1fr; }
}
</style>
</head>
<body>

<div id="app"></div>

<script>
const STATUS_COLORS = {
  "New Lead": "#6366f1", "Email Sent": "#3b82f6", "DM Sent": "#3b82f6",
  "Text Sent": "#3b82f6", "Called": "#8b5cf6", "Follow Up 1": "#f59e0b",
  "Follow Up 2": "#f59e0b", "Breakup Sent": "#ef4444", "Interested": "#22c55e",
  "Call Scheduled": "#22c55e", "Proposal Sent": "#f97316", "Closed Won": "#10b981",
  "Closed Lost": "#64748b", "Not Interested": "#64748b"
};
const QUALITY_COLORS = { "No Website": "#ef4444", "Terrible": "#f97316", "Outdated": "#f59e0b", "Decent": "#3b82f6", "Good": "#22c55e" };
const STAGES = [
  { key: "new", label: "New Leads", statuses: ["New Lead"] },
  { key: "outreach", label: "Outreach", statuses: ["Email Sent","DM Sent","Text Sent","Called"] },
  { key: "followup", label: "Follow Up", statuses: ["Follow Up 1","Follow Up 2","Breakup Sent"] },
  { key: "warm", label: "Warm", statuses: ["Interested","Call Scheduled"] },
  { key: "closing", label: "Closing", statuses: ["Proposal Sent"] },
  { key: "won", label: "Closed Won", statuses: ["Closed Won"] },
];
const ALL_STATUSES = ["New Lead","Email Sent","DM Sent","Text Sent","Called","Follow Up 1","Follow Up 2","Breakup Sent","Interested","Call Scheduled","Proposal Sent","Closed Won","Closed Lost","Not Interested"];
const ALL_INDUSTRIES = ["Roofing","HVAC","Fencing","Plumbing","Landscaping","Garage Doors","Auto Detailing","Med Spa","Dentist","Pest Control","Concrete","Pool Builder","Painting","Electrical","Tree Service","Pressure Washing","Flooring","Window Cleaning","Moving","Junk Removal","Other"];
const ALL_QUALITIES = ["No Website","Terrible","Outdated","Decent","Good"];
const ALL_SOURCES = ["Google Maps Bot","Google Maps","Facebook Group","Google Page 2","Yelp","Thumbtack","Nextdoor","Drive By","County Filing","Referral","Cold Search","Other"];
const ALL_PACKAGES = ["","Starter $500","Growth $1500","Authority $2500","Custom"];

let state = { prospects: [], view: "pipeline", filter: { search: "", industry: "All", city: "All" }, modal: null, editing: false };

async function loadData() {
  try {
    const r = await fetch("/api/prospects");
    state.prospects = await r.json();
  } catch(e) { state.prospects = []; }
  render();
}

async function saveProspect(p) {
  if (p.id) {
    await fetch(`/api/prospects/${p.id}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(p) });
  } else {
    const r = await fetch("/api/prospects", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(p) });
    const saved = await r.json();
    p.id = saved.id;
  }
  await loadData();
}

async function deleteProspect(id) {
  if (!confirm("Delete this prospect?")) return;
  await fetch(`/api/prospects/${id}`, { method: "DELETE" });
  state.modal = null;
  await loadData();
}

function getFiltered() {
  return state.prospects.filter(p => {
    if (state.filter.industry !== "All" && p.industry !== state.filter.industry) return false;
    if (state.filter.city !== "All" && p.city !== state.filter.city) return false;
    if (state.filter.search && !p.name.toLowerCase().includes(state.filter.search.toLowerCase()) && !(p.owner||"").toLowerCase().includes(state.filter.search.toLowerCase())) return false;
    return true;
  });
}

function getStats() {
  const p = state.prospects;
  const t = p.length;
  return {
    total: t,
    newLeads: p.filter(x => x.status === "New Lead").length,
    contacted: p.filter(x => ["Email Sent","DM Sent","Text Sent","Called","Follow Up 1","Follow Up 2"].includes(x.status)).length,
    interested: p.filter(x => ["Interested","Call Scheduled"].includes(x.status)).length,
    proposals: p.filter(x => x.status === "Proposal Sent").length,
    won: p.filter(x => x.status === "Closed Won").length,
    revenue: p.filter(x => x.status === "Closed Won").reduce((s,x) => s + (parseInt(x.value)||0), 0),
    pipeline: p.filter(x => ["Interested","Call Scheduled","Proposal Sent"].includes(x.status)).reduce((s,x) => s + (parseInt(x.value)||0), 0),
    needsEmail: p.filter(x => !x.email && x.status === "New Lead").length,
    closeRate: t > 0 ? ((p.filter(x=>x.status==="Closed Won").length / t) * 100).toFixed(1) : "0",
  };
}

function render() {
  const app = document.getElementById("app");
  const f = getFiltered();
  const s = getStats();
  const industries = ["All", ...new Set(state.prospects.map(p=>p.industry).filter(Boolean))];
  const cities = ["All", ...new Set(state.prospects.map(p=>p.city).filter(Boolean))];

  let html = `
    <nav class="nav">
      <div class="nav-logo">PROSPECT<span>.</span>BOT</div>
      <div class="nav-tabs">
        <button class="nav-tab ${state.view==='pipeline'?'active':''}" onclick="state.view='pipeline';render()">Pipeline</button>
        <button class="nav-tab ${state.view==='list'?'active':''}" onclick="state.view='list';render()">List</button>
        <button class="nav-tab ${state.view==='stats'?'active':''}" onclick="state.view='stats';render()">Stats</button>
      </div>
      <div class="nav-right">
        ${s.needsEmail > 0 ? `<div class="badge" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15);color:#ef4444">${s.needsEmail} need emails</div>` : ''}
        <button class="btn btn-accent" onclick="runSearch()" id="search-btn">🔍 Find Prospects</button>
        <button class="btn btn-accent" onclick="openAddModal()">+ Add</button>
        <button class="btn btn-ghost" onclick="loadData()">↻</button>
      </div>
    </nav>

    <div class="stats-bar">
      ${[
        {l:"Total Prospects",v:s.total,c:"#EDEDEF"},
        {l:"New Leads",v:s.newLeads,c:"#6366f1"},
        {l:"Contacted",v:s.contacted,c:"#3b82f6"},
        {l:"Interested",v:s.interested,c:"#22c55e"},
        {l:"Proposals Out",v:s.proposals,c:"#f97316"},
        {l:"Closed Won",v:s.won,c:"#10b981"},
        {l:"Revenue",v:"$"+s.revenue.toLocaleString(),c:"#FF6B2C"},
        {l:"Pipeline",v:"$"+s.pipeline.toLocaleString(),c:"#f59e0b"},
      ].map(x => `<div class="stat-card"><div class="stat-num" style="color:${x.c}">${x.v}</div><div class="stat-label">${x.l}</div></div>`).join('')}
    </div>

    <div class="filters">
      <input class="filter-input" placeholder="Search by name or owner..." value="${state.filter.search}" oninput="state.filter.search=this.value;render()">
      <select class="filter-select" onchange="state.filter.industry=this.value;render()">
        ${industries.map(i => `<option ${state.filter.industry===i?'selected':''}>${i === 'All' ? 'All Industries' : i}</option>`).join('')}
      </select>
      <select class="filter-select" onchange="state.filter.city=this.value;render()">
        ${cities.map(c => `<option ${state.filter.city===c?'selected':''}>${c === 'All' ? 'All Cities' : c}</option>`).join('')}
      </select>
    </div>
  `;

  // PIPELINE VIEW
  if (state.view === "pipeline") {
    html += `<div class="pipeline"><div class="pipeline-cols">`;
    STAGES.forEach(stage => {
      const cards = f.filter(p => stage.statuses.includes(p.status));
      html += `<div class="col"><div class="col-head"><span class="col-title">${stage.label}</span><span class="col-count">${cards.length}</span></div><div class="col-body">`;
      if (cards.length === 0) {
        html += `<div class="col-empty">No prospects</div>`;
      } else {
        cards.forEach(p => {
          const sc = STATUS_COLORS[p.status] || "#8E8E96";
          const qc = QUALITY_COLORS[p.quality] || "#8E8E96";
          html += `<div class="card" onclick='openDetailModal("${p.id}")'>
            <div class="card-stripe" style="background:${sc}"></div>
            <div class="card-name">${esc(p.name)}</div>
            <div class="card-tags">
              <span class="tag-sm" style="background:rgba(255,107,44,0.1);color:#FF6B2C">${esc(p.industry)}</span>
              <span class="tag-sm" style="background:rgba(255,255,255,0.04);color:#8E8E96">${esc(p.city)}</span>
            </div>
            <div class="card-meta">
              <span class="card-quality" style="color:${qc}">${esc(p.quality)}</span>
              <span class="card-rating">${esc(p.rating)}★</span>
            </div>
            ${p.value ? `<div class="card-value">$${parseInt(p.value).toLocaleString()}</div>` : ''}
          </div>`;
        });
      }
      html += `</div></div>`;
    });
    html += `</div></div>`;
  }

  // LIST VIEW
  if (state.view === "list") {
    html += `<div class="table-wrap"><div class="table">
      <div class="table-head">
        ${["Business","Owner","Industry","City","Status","Quality","Rating"].map(h => `<div class="table-th">${h}</div>`).join('')}
      </div>`;
    f.forEach(p => {
      const sc = STATUS_COLORS[p.status] || "#8E8E96";
      const qc = QUALITY_COLORS[p.quality] || "#8E8E96";
      html += `<div class="table-row" onclick='openDetailModal("${p.id}")'>
        <div class="table-cell" style="font-weight:600;font-size:14px">${esc(p.name)}</div>
        <div class="table-cell" style="color:var(--dim)">${esc(p.owner||'—')}</div>
        <div class="table-cell"><span class="tag-sm" style="background:rgba(255,107,44,0.1);color:#FF6B2C">${esc(p.industry)}</span></div>
        <div class="table-cell" style="color:var(--dim)">${esc(p.city)}</div>
        <div class="table-cell"><span class="tag-sm" style="background:${sc}18;color:${sc}">${esc(p.status)}</span></div>
        <div class="table-cell" style="color:${qc};font-weight:600;font-size:12px">${esc(p.quality)}</div>
        <div class="table-cell card-rating">${esc(p.rating)}★</div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // STATS VIEW
  if (state.view === "stats") {
    const p = state.prospects;
    html += `<div class="stats-view">`;

    // By Industry
    html += `<div class="stats-card"><div class="stats-title">By Industry</div>`;
    [...new Set(p.map(x=>x.industry))].filter(Boolean).sort((a,b) => p.filter(x=>x.industry===b).length - p.filter(x=>x.industry===a).length).forEach(ind => {
      const cnt = p.filter(x=>x.industry===ind).length;
      const won = p.filter(x=>x.industry===ind&&x.status==="Closed Won").length;
      const pct = (cnt/p.length)*100;
      html += `<div class="bar-row"><div class="bar-label"><span>${ind}</span><span>${cnt} total · ${won} won</span></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg,#FF6B2C,#f97316)"></div></div></div>`;
    });
    html += `</div>`;

    // By City
    html += `<div class="stats-card"><div class="stats-title">By City</div>`;
    [...new Set(p.map(x=>x.city))].filter(Boolean).sort((a,b) => p.filter(x=>x.city===b).length - p.filter(x=>x.city===a).length).forEach(city => {
      const cnt = p.filter(x=>x.city===city).length;
      const pct = (cnt/p.length)*100;
      html += `<div class="bar-row"><div class="bar-label"><span>${city}</span><span>${cnt}</span></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg,#6366f1,#8b5cf6)"></div></div></div>`;
    });
    html += `</div>`;

    // Website Quality
    html += `<div class="stats-card"><div class="stats-title">Website Quality</div>`;
    ALL_QUALITIES.forEach(q => {
      const cnt = p.filter(x=>x.quality===q).length;
      const pct = p.length > 0 ? (cnt/p.length)*100 : 0;
      html += `<div class="bar-row"><div class="bar-label"><span style="color:${QUALITY_COLORS[q]}">${q}</span><span>${cnt} (${pct.toFixed(0)}%)</span></div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${QUALITY_COLORS[q]}"></div></div></div>`;
    });
    html += `</div>`;

    // Conversion Funnel
    html += `<div class="stats-card"><div class="stats-title">Conversion Funnel</div>`;
    [{l:"Total",v:s.total,c:"#EDEDEF"},{l:"Contacted",v:s.contacted+s.interested+s.proposals+s.won,c:"#3b82f6"},{l:"Interested",v:s.interested,c:"#22c55e"},{l:"Proposals",v:s.proposals,c:"#f97316"},{l:"Won",v:s.won,c:"#10b981"}].forEach(x => {
      const pct = s.total > 0 ? Math.max((x.v/s.total)*100, 2) : 0;
      html += `<div class="bar-row"><div class="bar-label"><span>${x.l}</span><span style="color:${x.c};font-weight:700">${x.v}</span></div><div class="bar-track" style="height:8px"><div class="bar-fill" style="width:${pct}%;background:${x.c}"></div></div></div>`;
    });
    html += `<div class="big-stat" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.15)"><div class="big-stat-label">Close Rate</div><div class="big-stat-num" style="color:#10b981">${s.closeRate}%</div></div></div>`;

    // Revenue
    html += `<div class="stats-card"><div class="stats-title">Revenue by Package</div>`;
    ["Starter $500","Growth $1500","Authority $2500"].forEach(pkg => {
      const rev = p.filter(x=>x.package===pkg&&x.status==="Closed Won").reduce((s,x)=>s+(parseInt(x.value)||0),0);
      const pipe = p.filter(x=>x.package===pkg&&["Interested","Call Scheduled","Proposal Sent"].includes(x.status)).reduce((s,x)=>s+(parseInt(x.value)||0),0);
      html += `<div style="padding:10px 0;border-bottom:1px solid #1A1A1E"><div style="font-size:14px;font-weight:700;margin-bottom:6px">${pkg}</div><div style="display:flex;gap:16px"><span style="font-size:12px;color:#10b981">Won: $${rev.toLocaleString()}</span><span style="font-size:12px;color:#f59e0b">Pipeline: $${pipe.toLocaleString()}</span></div></div>`;
    });
    html += `<div class="big-stat" style="background:rgba(255,107,44,0.08);border:1px solid rgba(255,107,44,0.15)"><div class="big-stat-label">Total Revenue</div><div class="big-stat-num" style="color:#FF6B2C">$${s.revenue.toLocaleString()}</div></div></div>`;

    // Sources
    html += `<div class="stats-card"><div class="stats-title">Lead Sources</div>`;
    [...new Set(p.map(x=>x.source))].filter(Boolean).forEach(src => {
      const cnt = p.filter(x=>x.source===src).length;
      const won = p.filter(x=>x.source===src&&x.status==="Closed Won").length;
      html += `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #1A1A1E"><span style="font-size:13px;font-weight:600">${src}</span><div style="display:flex;gap:12px;align-items:center"><span style="font-size:12px;color:var(--muted);font-family:'JetBrains Mono'">${cnt} leads</span>${won>0?`<span class="tag-sm" style="color:#10b981;background:rgba(16,185,129,0.1)">${won} won</span>`:''}</div></div>`;
    });
    html += `</div></div>`;
  }

  // MODAL
  if (state.modal) {
    const p = state.modal;
    if (state.editing) {
      html += renderEditModal(p);
    } else {
      html += renderDetailModal(p);
    }
  }

  app.innerHTML = html;
}

function renderDetailModal(p) {
  const sc = STATUS_COLORS[p.status] || "#8E8E96";
  const qc = QUALITY_COLORS[p.quality] || "#8E8E96";
  const fields = [
    {l:"Phone",v:p.phone},{l:"Email",v:p.email},{l:"Website",v:p.website},
    {l:"Google Rating",v:p.rating?p.rating+"★":""},{l:"Source",v:p.source},
    {l:"Channel",v:p.channel},{l:"Last Contact",v:p.lastContact},
    {l:"Next Follow Up",v:p.nextFollowUp},{l:"Package",v:p.package},
    {l:"Deal Value",v:p.value?"$"+parseInt(p.value).toLocaleString():""},
    {l:"Date Added",v:p.dateAdded||""},
  ].filter(f=>f.v);

  return `<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2>${esc(p.name)}</h2>
    <div class="modal-sub">${esc(p.owner||"No owner name")} · ${esc(p.city)}</div>
    <div class="modal-tags">
      <span class="tag-sm" style="background:rgba(255,107,44,0.1);color:#FF6B2C;padding:4px 12px;border-radius:6px;font-size:12px">${esc(p.industry)}</span>
      <span class="tag-sm" style="background:${sc}18;color:${sc};padding:4px 12px;border-radius:6px;font-size:12px">${esc(p.status)}</span>
      <span class="tag-sm" style="background:rgba(255,255,255,0.04);color:${qc};padding:4px 12px;border-radius:6px;font-size:12px">${esc(p.quality)}</span>
    </div>
    ${fields.map(f => `<div class="modal-field"><span class="modal-field-label">${f.l}</span><span class="modal-field-value">${esc(f.v)}</span></div>`).join('')}
    ${p.notes ? `<div class="modal-notes"><div class="modal-notes-label">Notes</div><div class="modal-notes-text">${esc(p.notes)}</div></div>` : ''}
    <div class="modal-actions">
      <button class="btn btn-accent" onclick="startEdit()">Edit</button>
      <button class="btn btn-ghost" onclick="deleteProspect('${p.id}');" style="color:#ef4444;border-color:rgba(239,68,68,0.2)">Delete</button>
    </div>
  </div></div>`;
}

function renderEditModal(p) {
  return `<div class="modal-overlay" onclick="closeModal()"><div class="modal" onclick="event.stopPropagation()">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h2>${p.id ? 'Edit' : 'Add'} Prospect</h2>
    <div style="margin-top:16px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Business Name</label><input class="form-input" id="f-name" value="${esc(p.name||'')}"></div>
        <div class="form-group"><label class="form-label">Owner Name</label><input class="form-input" id="f-owner" value="${esc(p.owner||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Industry</label><select class="form-select" id="f-industry">${ALL_INDUSTRIES.map(i=>`<option ${p.industry===i?'selected':''}>${i}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">City</label><input class="form-input" id="f-city" value="${esc(p.city||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="f-phone" value="${esc(p.phone||'')}"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="f-email" value="${esc(p.email||'')}"></div>
      </div>
      <div class="form-group"><label class="form-label">Website</label><input class="form-input" id="f-website" value="${esc(p.website||'')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Website Quality</label><select class="form-select" id="f-quality">${ALL_QUALITIES.map(q=>`<option ${p.quality===q?'selected':''}>${q}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Google Rating</label><input class="form-input" id="f-rating" value="${esc(p.rating||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Status</label><select class="form-select" id="f-status">${ALL_STATUSES.map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Source</label><select class="form-select" id="f-source">${ALL_SOURCES.map(s=>`<option ${p.source===s?'selected':''}>${s}</option>`).join('')}</select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Package</label><select class="form-select" id="f-package"><option value="">None</option>${ALL_PACKAGES.filter(Boolean).map(pk=>`<option ${p.package===pk?'selected':''}>${pk}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Deal Value</label><input class="form-input" id="f-value" value="${esc(p.value||'')}" placeholder="e.g. 1500"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Channel Used</label><input class="form-input" id="f-channel" value="${esc(p.channel||'')}"></div>
        <div class="form-group"><label class="form-label">Last Contact</label><input class="form-input" id="f-lastcontact" value="${esc(p.lastContact||'')}" placeholder="MM/DD/YYYY"></div>
      </div>
      <div class="form-group"><label class="form-label">Notes</label><input class="form-input" id="f-notes" value="${esc(p.notes||'')}"></div>
      <div class="modal-actions">
        <button class="btn btn-accent" onclick="submitEdit()">Save</button>
        <button class="btn btn-ghost" onclick="${p.id ? 'state.editing=false;render()' : 'closeModal()'}">Cancel</button>
      </div>
    </div>
  </div></div>`;
}

function openDetailModal(id) {
  state.modal = state.prospects.find(p => p.id === id) || null;
  state.editing = false;
  render();
}

function openAddModal() {
  state.modal = { name:"",owner:"",industry:"Roofing",city:"",phone:"",email:"",website:"",quality:"No Website",rating:"",source:"Google Maps",status:"New Lead",lastContact:"",nextFollowUp:"",channel:"",notes:"",package:"",value:"" };
  state.editing = true;
  render();
}

function startEdit() { state.editing = true; render(); }

function closeModal() { state.modal = null; state.editing = false; render(); }

function submitEdit() {
  const p = state.modal;
  const updated = {
    ...p,
    name: document.getElementById("f-name").value,
    owner: document.getElementById("f-owner").value,
    industry: document.getElementById("f-industry").value,
    city: document.getElementById("f-city").value,
    phone: document.getElementById("f-phone").value,
    email: document.getElementById("f-email").value,
    website: document.getElementById("f-website").value,
    quality: document.getElementById("f-quality").value,
    rating: document.getElementById("f-rating").value,
    source: document.getElementById("f-source").value,
    status: document.getElementById("f-status").value,
    package: document.getElementById("f-package").value,
    value: document.getElementById("f-value").value,
    channel: document.getElementById("f-channel").value,
    lastContact: document.getElementById("f-lastcontact").value,
    notes: document.getElementById("f-notes").value,
  };
  saveProspect(updated);
  state.modal = null;
  state.editing = false;
}

function esc(s) { const d = document.createElement("div"); d.textContent = s||""; return d.innerHTML; }

// Fix select filters
document.addEventListener("change", function(e) {
  if (e.target.classList.contains("filter-select")) {
    const v = e.target.value;
    if (v === "All Industries") state.filter.industry = "All";
    else if (v === "All Cities") state.filter.city = "All";
    else if (ALL_INDUSTRIES.includes(v) || v === "All") state.filter.industry = v;
    else state.filter.city = v;
    render();
  }
});

async function runSearch() {
  const btn = document.getElementById("search-btn");
  if (btn) { btn.textContent = "⏳ Searching..."; btn.disabled = true; btn.style.opacity = "0.6"; }
  try {
    const r = await fetch("/api/search", { method: "POST" });
    const data = await r.json();
    if (btn) btn.textContent = "✅ Running...";
    let refreshCount = 0;
    const refresher = setInterval(async () => {
      await loadData();
      refreshCount++;
      if (refreshCount >= 20) {
        clearInterval(refresher);
        if (btn) { btn.textContent = "🔍 Find Prospects"; btn.disabled = false; btn.style.opacity = "1"; }
      }
    }, 15000);
    setTimeout(async () => { await loadData(); }, 30000);
  } catch(e) {
    if (btn) { btn.textContent = "❌ Error"; }
    setTimeout(() => { if (btn) { btn.textContent = "🔍 Find Prospects"; btn.disabled = false; btn.style.opacity = "1"; } }, 3000);
  }
}

loadData();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    print(f"\n🚀 Dashboard running at http://localhost:{PORT}")
    print(f"   Press Ctrl+C to stop\n")
    server = HTTPServer(("0.0.0.0", PORT), DashboardHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Dashboard stopped.")
        server.server_close()
