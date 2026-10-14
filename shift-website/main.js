// main.js — Vanilla JS powering SHIFT Executive AI Summit

// Global state
let currentView = "home";
let loadedAgendaItems = [];
let loadedSpeakersList = [];

// ---------------------------------------------------------------------------
// 1) STATS COUNT-UP ANIMATION
// ---------------------------------------------------------------------------
const STATS_CONFIG = [
  { id: "stat-val-1", target: 500, decimals: 0, suffix: "+" },
  { id: "stat-val-2", target: 100, decimals: 0, suffix: "%" },
  { id: "stat-val-3", target: 8, decimals: 0, suffix: "h" },
  { id: "stat-val-4", target: 12, decimals: 0, suffix: "+" }
];

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateStat(stat, idx) {
  const el = document.getElementById(stat.id);
  if (!el) return;

  const duration = 1500 + idx * 80;
  const startOffset = 480 + idx * 90;

  setTimeout(() => {
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = eased * stat.target;

      el.textContent = current.toFixed(stat.decimals) + stat.suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = stat.target.toFixed(stat.decimals) + stat.suffix;
      }
    }
    requestAnimationFrame(tick);
  }, startOffset);
}

function initStatsCounter() {
  const footer = document.querySelector(".stats-footer");
  if (!footer) return;

  let triggered = false;
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !triggered) {
        triggered = true;
        STATS_CONFIG.forEach((stat, i) => animateStat(stat, i));
        obs.disconnect();
      }
    }, { threshold: 0.25 });
    obs.observe(footer);
  } else {
    STATS_CONFIG.forEach((stat, i) => animateStat(stat, i));
  }
}

// ---------------------------------------------------------------------------
// 2) SEPARATE PAGE / VIEW NAVIGATION ROUTER
// ---------------------------------------------------------------------------
function setView(viewName) {
  currentView = viewName || "home";

  // Hide or show hero vs view-panels
  const hero = document.getElementById("hero-view");
  const panels = document.querySelectorAll(".view-panel");
  const statsFooter = document.getElementById("stats-footer");
  const subFooter = document.querySelector(".site-sub-footer");

  if (currentView === "home") {
    if (hero) hero.style.display = "flex";
    if (statsFooter) statsFooter.style.display = "";
    if (subFooter) subFooter.style.display = "";
    panels.forEach(p => p.classList.remove("active"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    if (hero) hero.style.display = "none";
    if (statsFooter) statsFooter.style.display = "none";
    if (subFooter) subFooter.style.display = "none";
    panels.forEach(p => {
      if (p.id === `view-${currentView}`) {
        p.classList.add("active");
        p.scrollTop = 0;
      } else {
        p.classList.remove("active");
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Update active state on nav links
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.dataset.view === currentView) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Update active state on mobile nav links
  document.querySelectorAll(".mobile-nav-link").forEach(link => {
    if (link.dataset.view === currentView) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // Update window URL hash without jump
  if (currentView === "home") {
    if (window.location.hash) {
      history.pushState(null, "", window.location.pathname);
    }
  } else {
    history.pushState(null, "", `#${currentView}`);
  }
}

function initNavigation() {
  // Desktop nav pill links
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      setView(view);
    });
  });

  // Logo button returns home
  const logoBtn = document.getElementById("header-logo-btn");
  if (logoBtn) {
    logoBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setView("home");
    });
  }

  // Panel back buttons return home
  document.querySelectorAll(".view-panel-close-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      setView("home");
    });
  });

  // CTAs linking to pages
  document.querySelectorAll("[data-nav-view]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = el.getAttribute("data-nav-view");
      setView(targetView);
    });
  });

  // Handle direct hash navigation
  window.addEventListener("popstate", () => {
    const hash = window.location.hash.replace("#", "");
    if (hash && document.getElementById(`view-${hash}`)) {
      setView(hash);
    } else {
      setView("home");
    }
  });

  const initialHash = window.location.hash.replace("#", "");
  if (initialHash && document.getElementById(`view-${initialHash}`)) {
    setView(initialHash);
  } else {
    setView("home");
  }
}

// ---------------------------------------------------------------------------
// 3) MOBILE BURGER & SHEET MENU
// ---------------------------------------------------------------------------
function initMobileMenu() {
  const burgerBtn = document.getElementById("mobile-burger-btn");
  const overlay = document.getElementById("mobile-overlay");
  const sheetMenu = document.getElementById("mobile-sheet-menu");

  if (!burgerBtn || !overlay || !sheetMenu) return;

  function openMenu() {
    burgerBtn.classList.add("open");
    burgerBtn.setAttribute("aria-expanded", "true");
    overlay.style.display = "block";
    sheetMenu.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    burgerBtn.classList.remove("open");
    burgerBtn.setAttribute("aria-expanded", "false");
    overlay.style.display = "none";
    sheetMenu.style.display = "none";
    document.body.style.overflow = "";
  }

  burgerBtn.addEventListener("click", () => {
    if (burgerBtn.classList.contains("open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener("click", closeMenu);

  document.querySelectorAll(".mobile-nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = link.dataset.view;
      closeMenu();
      setView(view);
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burgerBtn.classList.contains("open")) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && burgerBtn.classList.contains("open")) {
      closeMenu();
    }
  });
}

// ---------------------------------------------------------------------------
// 4) MODALS MANAGEMENT
// ---------------------------------------------------------------------------
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  const firstInput = modal.querySelector("input:not([type=hidden]), textarea, button:not(.modal-close-btn)");
  if (firstInput) setTimeout(() => firstInput.focus(), 60);
}

function closeModal(modalOrId) {
  const modal = typeof modalOrId === "string" ? document.getElementById(modalOrId) : modalOrId;
  if (!modal) return;
  modal.classList.remove("open");
  const anyOpen = document.querySelector(".modal-overlay.open");
  if (!anyOpen) {
    document.body.style.overflow = "";
  }
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("open"));
  document.body.style.overflow = "";
}

function initModals() {
  document.querySelectorAll(".modal-close-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modal = btn.closest(".modal-overlay");
      if (modal) closeModal(modal);
    });
  });

  document.querySelectorAll(".modal-overlay").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openModals = Array.from(document.querySelectorAll(".modal-overlay.open"));
      if (openModals.length > 0) {
        closeModal(openModals[openModals.length - 1]);
      }
    }
  });

  // Triggers for Registration
  document.querySelectorAll("[data-open-modal='register']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeAllModals();
      openModal("modal-registration");
    });
  });

  // Triggers for Partner
  document.querySelectorAll("[data-open-modal='partner']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      closeAllModals();
      openModal("modal-partner-confirm");
    });
  });

  // Partner flow buttons
  const partnerRedirectBtn = document.getElementById("partner-redirect-to-reg-btn");
  if (partnerRedirectBtn) {
    partnerRedirectBtn.addEventListener("click", () => {
      closeModal("modal-partner-confirm");
      openModal("modal-registration");
    });
  }

  const partnerProceedBtn = document.getElementById("partner-proceed-btn");
  if (partnerProceedBtn) {
    partnerProceedBtn.addEventListener("click", () => {
      closeModal("modal-partner-confirm");
      openModal("modal-partner-form");
    });
  }
}

// ---------------------------------------------------------------------------
// 5) AGENDA TIMELINE & FILTERING
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("");
}

function downloadSessionIcs(title, desc, startIso, endIso, room) {
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AIESEC in Bardo//SHIFT Executive AI Summit//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:shift-session-" + Date.now() + "@aiesec.net",
    "DTSTAMP:20261007T120000Z",
    "DTSTART:" + startIso,
    "DTEND:" + endIso,
    "SUMMARY:SHIFT 2026: " + title,
    "DESCRIPTION:" + desc.replace(/\n/g, "\\n"),
    "LOCATION:" + (room || "HIDE University, Tunis, Tunisia"),
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const cleanFilename = title.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
  link.download = `SHIFT-${cleanFilename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderAgendaCard(item) {
  const type = item.type || "talks";
  const badge = item.badge || (type === "networking" ? "Networking" : type === "workshop" ? "Workshop" : "Keynote");
  const takeaways = (item.takeaways || [])
    .map(t => `<li style="display:flex;gap:6px;align-items:flex-start;margin-bottom:4px;"><span style="color:var(--primary-lime);">›</span><span>${escapeHtml(t)}</span></li>`)
    .join("");

  return `
    <div class="agenda-item" data-agenda-type="${escapeHtml(type)}" tabindex="0">
      <div class="agenda-item-header">
        <div style="display:flex;align-items:center;gap:14px;flex:1;">
          <span class="agenda-item-time">${escapeHtml(item.time || "TBD")}</span>
          <div class="agenda-item-title-block">
            <div class="agenda-item-title">${escapeHtml(item.title)}</div>
            ${item.subtitle ? `<div class="agenda-item-subtitle">${escapeHtml(item.subtitle)}</div>` : ""}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="agenda-item-badge">${escapeHtml(badge)}</span>
          <span class="fa-solid fa-chevron-down agenda-chevron"></span>
        </div>
      </div>
      <div class="agenda-drawer">
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--primary-lime);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Executive Brief & Focus</div>
          <p style="font-size:13px;color:#c4c2c3;line-height:1.55;margin:0 0 10px;">${escapeHtml(item.overview || "")}</p>
          ${takeaways ? `<ul style="list-style:none;padding:0;margin:0;font-size:12px;color:var(--muted);">${takeaways}</ul>` : ""}
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:34px;height:34px;border-radius:50%;background:#28282a;border:1px solid rgba(255,255,255,0.2);display:grid;place-items:center;font-weight:bold;color:var(--primary-lime);font-size:12px;">
              ${escapeHtml(item.host_initials || initials(item.host_name))}
            </div>
            <div>
              <div style="font-size:13px;font-weight:600;color:#ffffff;">${escapeHtml(item.host_name || "Summit Speaker")}</div>
              <div style="font-size:11px;color:var(--muted);">${escapeHtml(item.host_role || "Executive Leader")}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;font-size:11px;">
            <span style="color:var(--muted);"><i class="fa-solid fa-location-dot" style="margin-right:4px;"></i>${escapeHtml(item.room || "Grand Plenary")}</span>
            <button type="button" class="agenda-cal-btn" style="background:transparent;border:none;color:var(--primary-lime);font-weight:600;cursor:pointer;" data-title="${escapeHtml(item.title)}" data-start="${escapeHtml(item.start_iso || "20261128T090000Z")}" data-end="${escapeHtml(item.end_iso || "20261128T100000Z")}" data-room="${escapeHtml(item.room || "Tunis")}" data-desc="${escapeHtml(item.subtitle || item.title)}">
              <i class="fa-regular fa-calendar-plus" style="margin-right:4px;"></i>Add to Cal
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindAgendaEvents() {
  // Accordion drawer toggle on click
  document.querySelectorAll(".agenda-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".agenda-cal-btn")) return;
      item.classList.toggle("is-expanded");
    });
  });

  // Per-session calendar buttons
  document.querySelectorAll(".agenda-cal-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      downloadSessionIcs(
        btn.dataset.title,
        btn.dataset.desc,
        btn.dataset.start,
        btn.dataset.end,
        btn.dataset.room
      );
    });
  });
}

function filterAgenda(type) {
  const items = document.querySelectorAll(".agenda-item");
  items.forEach(item => {
    const itemType = item.getAttribute("data-agenda-type");
    if (type === "all" || itemType === type) {
      item.style.display = "";
    } else {
      item.style.display = "none";
    }
  });

  document.querySelectorAll(".agenda-filter-btn").forEach(btn => {
    if (btn.dataset.filter === type) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

async function loadAgenda() {
  let items = null;
  try {
    const res = await fetch("/api/agenda");
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        items = json.data;
      }
    }
  } catch (err) {}

  if (!items) {
    try {
      const res = await fetch("/data/agenda.json");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) items = json;
      }
    } catch (e) {}
  }

  const listContainer = document.getElementById("agenda-list-container");
  if (listContainer && items) {
    loadedAgendaItems = items.filter(i => i.published !== false);
    listContainer.innerHTML = loadedAgendaItems.map(renderAgendaCard).join("");
    bindAgendaEvents();
  }

  document.querySelectorAll(".agenda-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filterAgenda(btn.dataset.filter || "all");
    });
  });
}

// ---------------------------------------------------------------------------
// 6) SPEAKERS DATA & MODAL
// ---------------------------------------------------------------------------
const CURATED_SPEAKERS = [
  {
    name: "Executive Keynote Speaker",
    role: "Founder & CEO",
    company: "Leading Enterprise Scaleup",
    badge: "Keynote Address",
    time: "10:15 – 11:00",
    session_title: "AI Is Changing Business",
    abstract: "Unpacking macro AI adoption across enterprise structures, ROI calculation models, capital allocation shifts, and navigating technical debt when transitioning legacy infrastructure to modern neural stacks.",
    bio: "Serial entrepreneur and technology leader with 15+ years scaling B2B enterprise software and operational intelligence platforms across EMEA and North Africa.",
    linkedin_url: "https://www.linkedin.com/"
  },
  {
    name: "Enterprise Growth Architect",
    role: "Head of Growth & Automation",
    company: "Fintech & Automation Platform",
    badge: "Case Studies",
    time: "11:30 – 12:15",
    session_title: "AI in the Real World",
    abstract: "Real data from 50+ enterprise rollouts. An unflinching analysis of what works in automated underwriting, risk modelling, customer intelligence workflows, and why 80% of experimental POCs fail before reaching production.",
    bio: "Oversees automation and product scalability in banking and transaction processing platforms, bridging software engineering and business development.",
    linkedin_url: "https://www.linkedin.com/"
  },
  {
    name: "Lead Product Architect",
    role: "Product & Infrastructure Lead",
    company: "Deep Learning Infrastructure",
    badge: "Product Systems",
    time: "13:45 – 14:30",
    session_title: "Building with AI, Not Just Talking About It",
    abstract: "A deep dive into concrete architecture blueprints: low-latency model serving, agentic orchestration pipelines, fine-tuning vs. prompt-context tradeoffs, and keeping cloud costs under strict executive control.",
    bio: "Engineering architect specialized in distributed systems and production machine learning pipelines, advising international venture scaleups.",
    linkedin_url: "https://www.linkedin.com/"
  },
  {
    name: "Venture Capital Partner",
    role: "Managing Partner",
    company: "Pan-African Venture Capital",
    badge: "Grand Panelist",
    time: "14:30 – 15:15",
    session_title: "The Big Conversation: Board Level Strategy",
    abstract: "C-suite debate exploring sovereign AI capabilities, regional talent retention, how capital allocators assess artificial intelligence moats, and the strategic positioning of emerging tech hubs in Tunisia.",
    bio: "Veteran venture capitalist and angel investor backing high-growth technology companies across Africa and the Mediterranean basin.",
    linkedin_url: "https://www.linkedin.com/"
  },
  {
    name: "AI Transformation Director",
    role: "AI Strategy Consultant",
    company: "Advisory & Transformational Operations",
    badge: "Practical Lab",
    time: "15:45 – 16:30",
    session_title: "Your Business, SHIFTed: Hands-on Frameworks",
    abstract: "An interactive, practical workshop demonstrating how to audit enterprise friction points, map them to AI-augmented workflows, and establish measurable KPIs for immediate operational gains.",
    bio: "Consultant and transformation lead who has advised tier-1 telecom, banking, and retail corporations on workforce readiness and digital capability evolution.",
    linkedin_url: "https://www.linkedin.com/"
  },
  {
    name: "Global Systems Strategist",
    role: "Serial Tech Entrepreneur",
    company: "Global Systems Architect",
    badge: "Closing Perspective",
    time: "16:30 – 17:15",
    session_title: "What Comes Next? & 2027 Vision",
    abstract: "Forward-looking synthesis on frontier model trajectories, embodied AI, robotics, multimodal reasoning, and closing recommendations for tomorrow's executive leaders.",
    bio: "Pioneer in artificial intelligence research and commercial deployment with extensive advisory experience for technology ministries and research labs.",
    linkedin_url: "https://www.linkedin.com/"
  }
];

function openSpeakerModal(speaker) {
  if (!speaker) return;
  const nameEl = document.getElementById("speaker-modal-name");
  const badgeEl = document.getElementById("speaker-modal-badge");
  const roleEl = document.getElementById("speaker-modal-role");
  const companyEl = document.getElementById("speaker-modal-company");
  const timeEl = document.getElementById("speaker-modal-time");
  const sessionEl = document.getElementById("speaker-modal-session");
  const abstractEl = document.getElementById("speaker-modal-abstract");
  const bioEl = document.getElementById("speaker-modal-bio");
  const avatarEl = document.getElementById("speaker-modal-avatar");
  const liEl = document.getElementById("speaker-modal-linkedin");

  if (nameEl) nameEl.textContent = speaker.name;
  if (badgeEl) badgeEl.textContent = speaker.badge || "Speaker";
  if (roleEl) roleEl.textContent = speaker.role || "Executive";
  if (companyEl) companyEl.textContent = speaker.company || "Enterprise AI";
  if (timeEl) timeEl.textContent = speaker.time || "28 Nov 2026";
  if (sessionEl) sessionEl.textContent = speaker.session_title || "Executive Briefing";
  if (abstractEl) abstractEl.textContent = speaker.abstract || "Operational framework and takeaways.";
  if (bioEl) bioEl.textContent = speaker.bio || "Speaker biography.";

  if (avatarEl) {
    if (speaker.photo_url) {
      avatarEl.innerHTML = `<img src="${escapeHtml(speaker.photo_url)}" alt="${escapeHtml(speaker.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      avatarEl.innerHTML = `<span style="font-size:22px;font-weight:bold;color:var(--primary-lime);">${escapeHtml(initials(speaker.name))}</span>`;
    }
  }

  if (liEl) {
    if (speaker.linkedin_url) {
      liEl.href = speaker.linkedin_url;
      liEl.style.display = "inline-flex";
    } else {
      liEl.style.display = "none";
    }
  }

  openModal("modal-speaker-detail");
}

function bindSpeakerCards() {
  document.querySelectorAll(".speaker-card").forEach(card => {
    card.addEventListener("click", () => {
      const idx = card.dataset.index;
      if (idx !== undefined && CURATED_SPEAKERS[idx]) {
        openSpeakerModal(CURATED_SPEAKERS[idx]);
      } else if (card.dataset.id && loadedSpeakersList.length) {
        const found = loadedSpeakersList.find(s => s.id === card.dataset.id);
        if (found) openSpeakerModal(found);
      }
    });
  });
}

async function loadSpeakers() {
  const container = document.getElementById("speakers-container");
  if (!container) return;

  const client = window.supabaseClient || (typeof supabaseClient !== "undefined" ? supabaseClient : null);
  if (client) {
    try {
      const { data, error } = await client
        .from("speakers")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        loadedSpeakersList = data;
        container.innerHTML = data.map((s) => `
          <div class="speaker-card" data-id="${s.id}">
            <div>
              <div class="speaker-avatar-box">
                ${s.photo_url ? `<img src="${escapeHtml(s.photo_url)}" alt="${escapeHtml(s.name)}"/>` : `<span style="font-size:32px;font-weight:bold;color:var(--primary-lime);">${escapeHtml(initials(s.name))}</span>`}
              </div>
              ${s.badge ? `<span style="font-size:11px;font-weight:600;color:var(--primary-lime);text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(s.badge)}</span>` : ""}
              <h3 style="font-size:17px;font-weight:700;color:#ffffff;margin:4px 0 2px;">${escapeHtml(s.name)}</h3>
              <p style="font-size:13px;color:#c4c2c3;margin:0;">${escapeHtml(s.role || "")}</p>
              <p style="font-size:12px;color:var(--muted);margin:2px 0 0;">${escapeHtml(s.company || "")}</p>
            </div>
            <div style="margin-top:16px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;color:var(--primary-lime);font-size:12px;font-weight:600;">
              <span>Session: ${escapeHtml(s.session_title || "View Details")}</span>
              <i class="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        `).join("");
        bindSpeakerCards();
        return;
      }
    } catch (e) {}
  }

  // Fallback curated speakers
  container.innerHTML = CURATED_SPEAKERS.map((s, idx) => `
    <div class="speaker-card" data-index="${idx}">
      <div>
        <div class="speaker-avatar-box">
          <span style="font-size:32px;font-weight:bold;color:var(--primary-lime);">${escapeHtml(initials(s.name))}</span>
        </div>
        <span style="font-size:11px;font-weight:600;color:var(--primary-lime);text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(s.badge)}</span>
        <h3 style="font-size:17px;font-weight:700;color:#ffffff;margin:4px 0 2px;">${escapeHtml(s.name)}</h3>
        <p style="font-size:13px;color:#c4c2c3;margin:0;">${escapeHtml(s.role)}</p>
        <p style="font-size:12px;color:var(--muted);margin:2px 0 0;">${escapeHtml(s.company)}</p>
      </div>
      <div style="margin-top:16px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;color:var(--primary-lime);font-size:12px;font-weight:600;">
        <span>Session: ${escapeHtml(s.session_title)}</span>
        <i class="fa-solid fa-arrow-right"></i>
      </div>
    </div>
  `).join("");
  bindSpeakerCards();
}

// ---------------------------------------------------------------------------
// 7) PARTNERS DATA
// ---------------------------------------------------------------------------
const CURATED_PARTNERS = [
  { name: "Enterprise AI Alliance", tier: "Anchor Partner" },
  { name: "Cloud Compute Labs", tier: "Infrastructure" },
  { name: "Autonomous Systems Group", tier: "Intelligence" },
  { name: "Venture EMEA Capital", tier: "Investment" },
  { name: "Nordic Neural Works", tier: "Research" },
  { name: "Tunisia Digital Matrix", tier: "Ecosystem" }
];

async function loadPartners() {
  const container = document.getElementById("partners-container");
  if (!container) return;

  const client = window.supabaseClient || (typeof supabaseClient !== "undefined" ? supabaseClient : null);
  if (client) {
    try {
      const { data, error } = await client
        .from("partners")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        container.innerHTML = data.map(p => `
          <a href="${p.website_url ? escapeHtml(p.website_url) : "#"}" target="${p.website_url ? "_blank" : "_self"}" class="partner-logo-box">
            ${p.logo_url 
              ? `<img src="${escapeHtml(p.logo_url)}" alt="${escapeHtml(p.name)}" style="max-height:48px;max-width:100%;object-fit:contain;"/>` 
              : `<div style="text-align:center;">
                  <div style="font-size:14px;font-weight:700;color:#ffffff;">${escapeHtml(p.name)}</div>
                  ${p.tier ? `<div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">${escapeHtml(p.tier)}</div>` : ""}
                </div>`
            }
          </a>
        `).join("");
        return;
      }
    } catch (e) {}
  }

  container.innerHTML = CURATED_PARTNERS.map(p => `
    <div class="partner-logo-box">
      <div style="text-align:center;">
        <div style="font-size:14px;font-weight:700;color:#ffffff;">${escapeHtml(p.name)}</div>
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:2px;">${escapeHtml(p.tier)}</div>
      </div>
    </div>
  `).join("");
}

// ---------------------------------------------------------------------------
// 8) TEAM MEMBERS
// ---------------------------------------------------------------------------
const CURATED_TEAM = [
  { name: "Amen Krifi", role: "Organizing Committee President", linkedin: "https://www.linkedin.com/" },
  { name: "Sarra Ben Amor", role: "VP Corporate Relations & Partnerships", linkedin: "https://www.linkedin.com/" },
  { name: "Yassine Mansour", role: "VP Marketing & Communications", linkedin: "https://www.linkedin.com/" },
  { name: "Ines Trabelsi", role: "VP Logistics & Venue Operations", linkedin: "https://www.linkedin.com/" },
  { name: "Mohamed Dridi", role: "VP Delegate Experience & Strategy", linkedin: "https://www.linkedin.com/" }
];

async function loadTeam() {
  const container = document.getElementById("team-container");
  if (!container) return;

  const client = window.supabaseClient || (typeof supabaseClient !== "undefined" ? supabaseClient : null);
  if (client) {
    try {
      const { data, error } = await client
        .from("team_members")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        // If database only has 1 or 2 entries, merge with CURATED_TEAM
        let list = [...data];
        if (list.length < 3) {
          const dbNames = new Set(list.map(m => (m.name || "").toLowerCase().trim()));
          const extra = CURATED_TEAM.filter(m => !dbNames.has((m.name || "").toLowerCase().trim()));
          list = [...list, ...extra];
        }

        container.innerHTML = list.map(m => `
          <div class="team-card">
            <div class="team-avatar-box">
              ${m.photo_url ? `<img src="${escapeHtml(m.photo_url)}" alt="${escapeHtml(m.name)}"/>` : `<span style="font-size:28px;font-weight:bold;color:var(--primary-lime);">${escapeHtml(initials(m.name))}</span>`}
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <h4 style="font-size:15px;font-weight:700;color:#ffffff;margin:0;">${escapeHtml(m.name)}</h4>
                <p style="font-size:12px;color:var(--muted);margin:2px 0 0;">${escapeHtml(m.role || "")}</p>
              </div>
              ${(m.linkedin_url || m.linkedin) ? `<a href="${escapeHtml(m.linkedin_url || m.linkedin)}" target="_blank" rel="noreferrer" style="width:32px;height:32px;border-radius:50%;background:#28282a;display:grid;place-items:center;color:#ffffff;text-decoration:none;"><i class="fa-brands fa-linkedin-in" style="font-size:13px;"></i></a>` : ""}
            </div>
          </div>
        `).join("");
        return;
      }
    } catch (e) {}
  }

  container.innerHTML = CURATED_TEAM.map(m => `
    <div class="team-card">
      <div class="team-avatar-box">
        <span style="font-size:28px;font-weight:bold;color:var(--primary-lime);">${escapeHtml(initials(m.name))}</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <h4 style="font-size:15px;font-weight:700;color:#ffffff;margin:0;">${escapeHtml(m.name)}</h4>
          <p style="font-size:12px;color:var(--muted);margin:2px 0 0;">${escapeHtml(m.role)}</p>
        </div>
        <a href="${escapeHtml(m.linkedin)}" target="_blank" rel="noreferrer" style="width:32px;height:32px;border-radius:50%;background:#28282a;display:grid;place-items:center;color:#ffffff;text-decoration:none;">
          <i class="fa-brands fa-linkedin-in" style="font-size:13px;"></i>
        </a>
      </div>
    </div>
  `).join("");
}

// ---------------------------------------------------------------------------
// 9) FAQ ACCORDION
// ---------------------------------------------------------------------------
function initFaq() {
  document.querySelectorAll(".faq-card").forEach(card => {
    card.addEventListener("click", () => {
      card.classList.toggle("open");
    });
  });
}

// ---------------------------------------------------------------------------
// 10) PASS GENERATION & QR CODE CANVAS
// ---------------------------------------------------------------------------
function generatePassCanvas(name, org, code) {
  const canvas = document.createElement("canvas");
  canvas.width = 1100;
  canvas.height = 680;
  const ctx = canvas.getContext("2d");

  // Background
  const grad = ctx.createLinearGradient(0, 0, 1100, 680);
  grad.addColorStop(0, "#0a0a0c");
  grad.addColorStop(0.5, "#141418");
  grad.addColorStop(1, "#0a0a0c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1100, 680);

  // Border glow
  ctx.strokeStyle = "rgba(159, 213, 75, 0.4)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 1060, 640);

  // Subtle matrix grid dots
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  for (let x = 40; x < 1060; x += 40) {
    for (let y = 40; y < 640; y += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Header banner
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 38px 'Inter', sans-serif";
  ctx.fillText("SHIFT.", 70, 95);

  ctx.fillStyle = "#9FD54B";
  ctx.font = "800 38px 'Inter', sans-serif";
  ctx.fillText("2026", 195, 95);

  ctx.fillStyle = "#8e8e8e";
  ctx.font = "600 13px 'Inter', sans-serif";
  ctx.fillText("EXECUTIVE AI SUMMIT · AIESEC IN BARDO", 70, 125);

  // Divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, 150);
  ctx.lineTo(1030, 150);
  ctx.stroke();

  // Badge
  ctx.fillStyle = "rgba(159, 213, 75, 0.15)";
  ctx.fillRect(70, 180, 210, 36);
  ctx.strokeStyle = "#9FD54B";
  ctx.strokeRect(70, 180, 210, 36);
  ctx.fillStyle = "#9FD54B";
  ctx.font = "700 13px 'Inter', sans-serif";
  ctx.fillText("OFFICIAL DELEGATE", 90, 204);

  // Delegate Info
  ctx.fillStyle = "#8e8e8e";
  ctx.font = "500 13px 'Inter', sans-serif";
  ctx.fillText("CREDENTIAL HOLDER", 70, 260);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 36px 'Inter', sans-serif";
  ctx.fillText(name.slice(0, 30), 70, 305);

  ctx.fillStyle = "#c4c2c3";
  ctx.font = "500 18px 'Inter', sans-serif";
  ctx.fillText(org.slice(0, 45), 70, 340);

  // Metadata columns
  ctx.fillStyle = "#8e8e8e";
  ctx.font = "500 12px 'Inter', sans-serif";
  ctx.fillText("SUMMIT DATE", 70, 410);
  ctx.fillText("LOCATION", 340, 410);
  ctx.fillText("SECURITY CREDENTIAL", 70, 485);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 16px 'Inter', sans-serif";
  ctx.fillText("28 November 2026", 70, 435);
  ctx.fillText("HIDE University, Tunis", 340, 435);

  ctx.fillStyle = "#9FD54B";
  ctx.font = "700 20px monospace";
  ctx.fillText(code, 70, 515);

  // Draw the real QR Code directly on downloaded canvas pass with ample quiet zone
  const qrCanvas = document.querySelector("#pass-qrcode-box canvas");
  const qrImg = document.querySelector("#pass-qrcode-box img");
  const sourceQr = qrCanvas || qrImg;

  if (sourceQr) {
    ctx.fillStyle = "#ffffff";
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(800, 210, 230, 230, 16);
      ctx.fill();
    } else {
      ctx.fillRect(800, 210, 230, 230);
    }
    // Centered with 20px quiet zone padding
    ctx.drawImage(sourceQr, 820, 230, 190, 190);

    ctx.fillStyle = "#8e8e8e";
    ctx.font = "600 11px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GATE VERIFICATION QR", 915, 465);
    ctx.textAlign = "left";
  }

  // Barcode decoration
  for (let i = 0; i < 48; i++) {
    const w = (i % 3 === 0) ? 4 : (i % 2 === 0) ? 2 : 1;
    ctx.fillStyle = (i % 4 === 0) ? "#9FD54B" : "#ffffff";
    ctx.fillRect(70 + i * 8, 560, w, 32);
  }

  // Footer note
  ctx.fillStyle = "#8e8e8e";
  ctx.font = "500 12px 'Inter', sans-serif";
  ctx.fillText("VERIFIED DATABASE ENTRY · STRICTLY STRATEGIC ENTERPRISE DEPLOYMENT", 70, 625);

  return canvas;
}

function downloadPassImage() {
  const name = document.getElementById("verif-name")?.textContent || "Delegate";
  const org = document.getElementById("pass-holder-org")?.textContent || "Executive Delegate";
  const code = document.getElementById("pass-code")?.textContent || "SHFT-2026-DELEGATE";
  const canvas = generatePassCanvas(name, org, code);

  const link = document.createElement("a");
  link.download = `SHIFT-2026-Pass-${name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ---------------------------------------------------------------------------
// 11) FORMS (REGISTRATION & PARTNER)
// ---------------------------------------------------------------------------
function initRegisterForm() {
  const form = document.getElementById("register-form");
  if (!form) return;
  const msgEl = document.getElementById("register-form-message");
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Registering & Sending Pass...";
    }
    if (msgEl) msgEl.style.display = "none";

    const payload = {
      full_name: document.getElementById("reg-name").value.trim(),
      email: document.getElementById("reg-email").value.trim(),
      phone: document.getElementById("reg-phone").value.trim(),
      university: document.getElementById("reg-university")?.value.trim() || "",
      faculty: document.getElementById("reg-faculty")?.value.trim() || ""
    };

    let passCode = "";
    let emailDispatched = false;

    // 1. Submit to server registration & email dispatch endpoint
    try {
      const resp = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await resp.json();

      if (!result.success) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Registration";
        }
        if (msgEl) {
          msgEl.textContent = result.error || "Registration error. Please check details.";
          msgEl.style.display = "block";
          msgEl.style.color = "#ff6b6b";
        }
        return;
      }

      passCode = result.pass_code || "";
      emailDispatched = result.email_sent || false;
    } catch (apiErr) {
      console.warn("Server register API note:", apiErr);
    }

    // 2. Also record in Supabase if client available (ignoring any RLS error)
    if (window.supabaseClient) {
      try {
        await window.supabaseClient.from("applicants").insert(payload);
      } catch (err) {}
    }

    form.reset();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Registration";
    }

    closeModal("modal-registration");

    // Populate verification popup
    const verifName = document.getElementById("verif-name");
    const verifEmail = document.getElementById("verif-email");
    const passName = document.getElementById("pass-holder-name");
    const passOrg = document.getElementById("pass-holder-org");
    const passCodeEl = document.getElementById("pass-code");

    if (verifName) verifName.textContent = payload.full_name;
    if (verifEmail) verifEmail.textContent = payload.email;
    if (passName) passName.textContent = payload.full_name;

    const orgStr = [payload.faculty, payload.university].filter(Boolean).join(" · ") || "Executive Delegate";
    if (passOrg) passOrg.textContent = orgStr;

    const currentCode = passCode || `SHFT-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    if (passCodeEl) passCodeEl.textContent = currentCode;

    // Hook email preview button
    const previewBtn = document.getElementById("preview-email-pass-btn");
    if (previewBtn) {
      previewBtn.href = `/api/email-preview/${currentCode}`;
    }

    // Hook resend email button
    const resendBtn = document.getElementById("resend-pass-email-btn");
    if (resendBtn) {
      resendBtn.onclick = async () => {
        resendBtn.disabled = true;
        resendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        try {
          const res = await fetch("/api/send-pass-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: payload.email,
              full_name: payload.full_name,
              pass_code: currentCode,
              university: payload.university,
              faculty: payload.faculty
            })
          });
          const d = await res.json();
          if (d.success) {
            resendBtn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--primary-lime);"></i> Pass Sent to Mail!';
          } else {
            resendBtn.innerHTML = '<i class="fa-solid fa-envelope"></i> Dispatched!';
          }
        } catch (e) {
          resendBtn.innerHTML = '<i class="fa-solid fa-envelope"></i> Dispatched!';
        }
        setTimeout(() => {
          resendBtn.disabled = false;
          resendBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Resend Email';
        }, 3500);
      };
    }

    // Generate large-module, ultra-scannable QR Code with quiet zone
    generateDelegateQRCode(currentCode, payload.email);

    openModal("modal-reg-verification");
  });

  // Pre-generate initial QR Code so the pass is always scannable
  generateDelegateQRCode("SHFT-2026-VIP");
}

function generateDelegateQRCode(code, email) {
  const qrBox = document.getElementById("pass-qrcode-box");
  if (!qrBox) return;
  qrBox.innerHTML = "";

  const host = (typeof window !== "undefined" && window.location.origin && window.location.origin !== "null") 
    ? window.location.origin 
    : "https://shift-event.tn";
  const path = (typeof window !== "undefined" && window.location.pathname) ? window.location.pathname : "/";
  const emailParam = email ? `&email=${encodeURIComponent(email)}` : "";
  const scanUrl = `${host}${path}?verify=${encodeURIComponent(code)}${emailParam}`;

  if (typeof QRCode !== "undefined") {
    try {
      new QRCode(qrBox, {
        text: scanUrl,
        width: 120,
        height: 120,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.L // Low error correction level = minimal modules, largest dots, instant recognition by phone cameras
      });
    } catch (qrErr) {
      console.warn("QR creation warning:", qrErr);
    }
  }
}

function initPartnerForm() {
  const form = document.getElementById("partner-form");
  if (!form) return;
  const msgEl = document.getElementById("partner-form-message");
  const submitBtn = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }

    const payload = {
      company_name: document.getElementById("partner-company").value.trim(),
      contact_name: document.getElementById("partner-contact").value.trim(),
      email: document.getElementById("partner-email").value.trim(),
      phone: document.getElementById("partner-phone")?.value.trim() || "",
      message: document.getElementById("partner-message")?.value.trim() || ""
    };

    if (window.supabaseClient) {
      try {
        const { error } = await window.supabaseClient.from("partner_applications").insert(payload);
        if (error) {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Application";
          }
          if (msgEl) {
            msgEl.textContent = "Error submitting application. Please retry.";
            msgEl.style.display = "block";
            msgEl.style.color = "#ff6b6b";
          }
          return;
        }
      } catch (err) {}
    }

    form.reset();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Application";
    }

    closeModal("modal-partner-form");

    const verifCompany = document.getElementById("verif-partner-company");
    const verifContact = document.getElementById("verif-partner-contact");
    if (verifCompany) verifCompany.textContent = payload.company_name;
    if (verifContact) verifContact.textContent = payload.contact_name;

    openModal("modal-partner-verification");
  });
}

// ---------------------------------------------------------------------------
// 12) SUMMIT CALENDAR INTEGRATION & SHARE KIT
// ---------------------------------------------------------------------------
function initCountdownTimer() {
  const targetDate = new Date("2026-11-28T09:00:00+01:00").getTime();
  const daysEl = document.getElementById("countdown-days");
  const hoursEl = document.getElementById("countdown-hours");
  const minsEl = document.getElementById("countdown-mins");
  const secsEl = document.getElementById("countdown-secs");

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  function update() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minsEl.textContent = "00";
      secsEl.textContent = "00";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    daysEl.textContent = String(days).padStart(2, "0");
    hoursEl.textContent = String(hours).padStart(2, "0");
    minsEl.textContent = String(mins).padStart(2, "0");
    secsEl.textContent = String(secs).padStart(2, "0");
  }

  update();
  setInterval(update, 1000);
}

function initCalendarAndShare() {
  const downloadBtn = document.getElementById("download-pass-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadPassImage);
  }

  // Google Calendar URL generator
  const gcalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
    encodeURIComponent("SHIFT 2026: Where Business Meets AI") +
    "&dates=20261128T080000Z/20261128T170000Z&details=" +
    encodeURIComponent("SHIFT — Where Business Meets AI organized by AIESEC in Bardo at HIDE University.") +
    "&location=" + encodeURIComponent("HIDE University, Tunis, Tunisia");

  document.querySelectorAll(".cal-export-google").forEach(el => {
    el.href = gcalUrl;
  });

  document.querySelectorAll(".cal-export-ics").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      downloadSessionIcs("Where Business Meets AI", "One-day business-focused AI event organized by AIESEC in Bardo at HIDE University.", "20261128T080000Z", "20261128T170000Z", "HIDE University, Tunis");
    });
  });

  // Social sharing buttons
  const pageUrl = window.location.origin + window.location.pathname;
  const liBtn = document.getElementById("share-linkedin-btn");
  if (liBtn) {
    liBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  }

  const xBtn = document.getElementById("share-x-btn");
  if (xBtn) {
    xBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent("I just registered for SHIFT 2026 — Executive AI Summit by AIESEC in Bardo! #SHIFT2026 #EnterpriseAI")}&url=${encodeURIComponent(pageUrl)}`;
  }

  const copyBtn = document.getElementById("share-copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pageUrl);
        copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--primary-lime);"></i>';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fa-solid fa-link"></i>';
        }, 2000);
      } catch (err) {}
    });
  }
}

// ---------------------------------------------------------------------------
// 13) SHIFT AI CONCIERGE CHATBOT
// ---------------------------------------------------------------------------
function initChatBot() {
  const launcherBtn = document.getElementById("chat-launcher-btn");
  const chatPanel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-close-btn");
  const clearBtn = document.getElementById("chat-clear-btn");
  const teaserPill = document.getElementById("chat-teaser-pill");
  const inputForm = document.getElementById("chat-input-form");
  const userInput = document.getElementById("chat-user-input");
  const sendBtn = document.getElementById("chat-send-btn");
  const messagesBox = document.getElementById("chat-messages");

  if (!launcherBtn || !chatPanel || !inputForm || !userInput || !messagesBox) return;

  let conversationHistory = [];
  let isAwaitingResponse = false;

  // Render markdown helper
  function formatMarkdown(text) {
    if (!text) return "";
    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold **text**
    safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic *text*
    safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Markdown links [text](url)
    safe = safe.replace(/\[(.+?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

    // Split lines
    const lines = safe.split("\n");
    let result = "";
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (inList) {
          result += "</ul>";
          inList = false;
        }
        continue;
      }

      if (line.startsWith("- ") || line.startsWith("• ") || line.startsWith("* ")) {
        if (!inList) {
          result += "<ul>";
          inList = true;
        }
        result += `<li>${line.substring(2)}</li>`;
      } else {
        if (inList) {
          result += "</ul>";
          inList = false;
        }
        result += `<p>${line}</p>`;
      }
    }

    if (inList) {
      result += "</ul>";
    }

    return result;
  }

  function scrollChatToBottom(smooth = true) {
    messagesBox.scrollTo({
      top: messagesBox.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }

  function openChat() {
    chatPanel.classList.add("open");
    launcherBtn.classList.add("open");
    launcherBtn.setAttribute("aria-expanded", "true");
    if (teaserPill) teaserPill.classList.add("hidden");
    
    // Close mobile menu if open
    const mobileMenu = document.getElementById("mobile-sheet-menu");
    const mobileOverlay = document.getElementById("mobile-overlay");
    const burgerBtn = document.getElementById("mobile-burger-btn");
    if (mobileMenu && mobileMenu.classList.contains("open")) {
      mobileMenu.classList.remove("open");
      if (mobileOverlay) mobileOverlay.style.display = "none";
      if (burgerBtn) burgerBtn.classList.remove("open");
    }

    setTimeout(() => {
      userInput.focus();
      scrollChatToBottom(false);
    }, 150);
  }

  function closeChat() {
    chatPanel.classList.remove("open");
    launcherBtn.classList.remove("open");
    launcherBtn.setAttribute("aria-expanded", "false");
    if (teaserPill) teaserPill.classList.remove("hidden");
  }

  function toggleChat() {
    if (chatPanel.classList.contains("open")) {
      closeChat();
    } else {
      openChat();
    }
  }

  launcherBtn.addEventListener("click", toggleChat);
  if (teaserPill) teaserPill.addEventListener("click", openChat);
  if (closeBtn) closeBtn.addEventListener("click", closeChat);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && chatPanel.classList.contains("open")) {
      closeChat();
    }
  });

  // Clear chat
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      conversationHistory = [];
      messagesBox.innerHTML = `
        <div class="chat-msg chat-msg-bot">
          <div class="chat-msg-avatar">
            <i class="fa-solid fa-sparkles"></i>
          </div>
          <div class="chat-msg-bubble">
            <p><strong>Conversation refreshed!</strong></p>
            <p>I'm your official summit concierge for <strong>SHIFT 2026</strong> organized by <strong>AIESEC in Bardo</strong> at <strong>HIDE University</strong> on <strong>28 November 2026</strong>. How can I help you today?</p>
          </div>
        </div>
        <div class="chat-chips-container" id="chat-quick-chips">
          <span class="chips-label">Popular questions:</span>
          <div class="chips-scroll">
            <button type="button" class="chat-chip" data-prompt="What is SHIFT and what makes it unique?">💡 What is SHIFT?</button>
            <button type="button" class="chat-chip" data-prompt="When and where is SHIFT happening?">📍 When &amp; Where?</button>
            <button type="button" class="chat-chip" data-prompt="Who is organizing the event?">🏛️ Who organizes it?</button>
            <button type="button" class="chat-chip" data-prompt="What topics and activities are scheduled in the agenda?">📅 Summit Agenda</button>
            <button type="button" class="chat-chip" data-prompt="How do I get my Summit Pass with instant QR code?">🎟️ How to get a pass?</button>
            <button type="button" class="chat-chip" data-prompt="How can our organization become a corporate partner or sponsor?">🤝 Become a Partner</button>
          </div>
        </div>
      `;
      bindQuickChips();
      userInput.focus();
    });
  }

  function bindQuickChips() {
    messagesBox.querySelectorAll(".chat-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const prompt = chip.getAttribute("data-prompt");
        if (prompt && !isAwaitingResponse) {
          sendUserMessage(prompt);
        }
      });
    });
  }
  bindQuickChips();

  async function sendUserMessage(text) {
    if (!text || isAwaitingResponse) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    // 1. Append User Message
    const userMsgEl = document.createElement("div");
    userMsgEl.className = "chat-msg chat-msg-user";
    userMsgEl.innerHTML = `
      <div class="chat-msg-bubble">
        <p>${trimmed.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>
    `;
    messagesBox.appendChild(userMsgEl);

    // Add to history
    conversationHistory.push({ role: "user", text: trimmed });

    userInput.value = "";
    isAwaitingResponse = true;
    sendBtn.disabled = true;

    // 2. Append Typing Indicator
    const typingEl = document.createElement("div");
    typingEl.className = "chat-msg chat-msg-bot typing-msg";
    typingEl.id = "chat-typing-bubble";
    typingEl.innerHTML = `
      <div class="chat-msg-avatar">
        <i class="fa-solid fa-sparkles"></i>
      </div>
      <div class="chat-msg-bubble">
        <div class="chat-typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    messagesBox.appendChild(typingEl);
    scrollChatToBottom();

    // 3. Request /api/chat
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: conversationHistory.slice(-6),
        }),
      });

      const data = await res.json();
      const typingBubble = document.getElementById("chat-typing-bubble");
      if (typingBubble) typingBubble.remove();

      let replyText = data && data.reply ? data.reply : "";
      if (!replyText) {
        replyText = "SHIFT — Where Business Meets AI takes place on 28 November 2026 at HIDE University, organized by AIESEC in Bardo. Feel free to ask about our agenda, passes, or partnership opportunities!";
      }

      // 4. Append Bot Response
      const botMsgEl = document.createElement("div");
      botMsgEl.className = "chat-msg chat-msg-bot";
      botMsgEl.innerHTML = `
        <div class="chat-msg-avatar">
          <i class="fa-solid fa-sparkles"></i>
        </div>
        <div class="chat-msg-bubble">
          ${formatMarkdown(replyText)}
        </div>
      `;
      messagesBox.appendChild(botMsgEl);
      conversationHistory.push({ role: "model", text: replyText });
    } catch (err) {
      console.error("Chatbot request error:", err);
      const typingBubble = document.getElementById("chat-typing-bubble");
      if (typingBubble) typingBubble.remove();

      const botMsgEl = document.createElement("div");
      botMsgEl.className = "chat-msg chat-msg-bot";
      botMsgEl.innerHTML = `
        <div class="chat-msg-avatar">
          <i class="fa-solid fa-sparkles"></i>
        </div>
        <div class="chat-msg-bubble">
          <p><strong>SHIFT 2026 Concierge</strong></p>
          <p>We are ready to welcome you on <strong>28 November 2026</strong> at <strong>HIDE University</strong>! You can register for your attendee pass or submit a corporate partnership proposal anytime using the buttons on this page.</p>
        </div>
      `;
      messagesBox.appendChild(botMsgEl);
    } finally {
      isAwaitingResponse = false;
      sendBtn.disabled = false;
      scrollChatToBottom();
      setTimeout(() => userInput.focus(), 100);
    }
  }

  inputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendUserMessage(userInput.value);
  });
}

// ---------------------------------------------------------------------------
// 14) DYNAMIC ANIMATED BACKGROUND (#9FD54B & #0F172A)
// ---------------------------------------------------------------------------
function initAnimatedBackground() {
  const container = document.getElementById("bg-container");
  const canvas = document.getElementById("bg-canvas");
  const video = document.getElementById("bg-video");

  if (!container || !canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let animId = null;
  let width = 0;
  let height = 0;
  let isRunning = false;

  // Set permanent colors for the new design
  document.documentElement.style.setProperty("--bg", "#0F172A");
  container.setAttribute("data-bg-theme", "lime-slate");
  canvas.style.display = "block";
  if (video) {
    video.style.opacity = "0.15";
    video.style.mixBlendMode = "luminosity";
    video.play().catch(() => {});
  }

  // Plasma / Aurora Glowing Orbs configuration in #9FD54B and #0F172A
  const orbs = [
    { x: 0.32, y: 0.28, r: 0.42, color: "rgba(159, 213, 75, 0.28)", speedX: 0.00045, speedY: 0.00032, phase: 0 },
    { x: 0.72, y: 0.68, r: 0.48, color: "rgba(15, 23, 42, 0.95)", speedX: -0.00032, speedY: 0.00038, phase: 1.5 },
    { x: 0.50, y: 0.42, r: 0.35, color: "rgba(159, 213, 75, 0.18)", speedX: 0.00028, speedY: -0.00032, phase: 3.14 },
    { x: 0.82, y: 0.22, r: 0.30, color: "rgba(159, 213, 75, 0.22)", speedX: -0.00038, speedY: -0.00024, phase: 4.2 },
    { x: 0.22, y: 0.78, r: 0.38, color: "rgba(30, 41, 59, 0.85)", speedX: 0.00035, speedY: 0.00026, phase: 2.1 }
  ];

  // AI Neural Constellation Particles in #9FD54B
  const particleCount = window.innerWidth < 768 ? 24 : 45;
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00032,
      vy: (Math.random() - 0.5) * 0.00032,
      radius: Math.random() * 2 + 1,
      baseAlpha: Math.random() * 0.45 + 0.25,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2
    });
  }

  // Interactive mouse drift / soft repulsion
  const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
  window.addEventListener("mousemove", (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  }, { passive: true });
  window.addEventListener("mouseleave", () => {
    mouse.targetX = -1000;
    mouse.targetY = -1000;
  });

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  function render(time) {
    if (!isRunning) return;

    // Smooth mouse interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;

    // 1) Base canvas background: rich deep slate navy #0F172A
    const baseGrad = ctx.createLinearGradient(0, 0, width, height);
    baseGrad.addColorStop(0, "#0F172A");
    baseGrad.addColorStop(0.55, "#0b1222");
    baseGrad.addColorStop(1, "#070c18");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, width, height);

    // 2) Glowing flowing plasma / aurora orbs (#9FD54B & #0F172A tones)
    for (let i = 0; i < orbs.length; i++) {
      const orb = orbs[i];
      const ox = (orb.x + Math.sin(time * orb.speedX + orb.phase) * 0.16) * width;
      const oy = (orb.y + Math.cos(time * orb.speedY + orb.phase) * 0.16) * height;
      const radius = (orb.r + Math.sin(time * 0.0009 + orb.phase) * 0.06) * Math.max(width, height);

      const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(radius, 10));
      grad.addColorStop(0, orb.color);
      grad.addColorStop(0.5, orb.color.replace(/[\d\.]+\)$/, (m) => `${parseFloat(m) * 0.4})`));
      grad.addColorStop(1, "rgba(15, 23, 42, 0)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 3) AI Constellation / Neural filaments in vibrant lime #9FD54B
    const maxDist = Math.min(width, height) * 0.15;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = 1;
      if (p.x > 1) p.x = 0;
      if (p.y < 0) p.y = 1;
      if (p.y > 1) p.y = 0;

      const px = p.x * width;
      const py = p.y * height;

      // Mouse interactive deflection
      if (mouse.x > 0) {
        const dx = px - mouse.x;
        const dy = py - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 130 && d > 0) {
          const force = (130 - d) / 130 * 0.6;
          p.x += (dx / d) * force * 0.0018;
          p.y += (dy / d) * force * 0.0018;
        }
      }

      // Draw filament connections between neighboring nodes
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const p2x = p2.x * width;
        const p2y = p2.y * height;
        const dist = Math.hypot(px - p2x, py - p2y);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.22;
          ctx.strokeStyle = `rgba(159, 213, 75, ${alpha})`;
          ctx.lineWidth = 0.85;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(p2x, p2y);
          ctx.stroke();
        }
      }

      // Draw glowing particle node in #9FD54B
      const currentAlpha = p.baseAlpha + Math.sin(time * p.pulseSpeed + p.phase) * 0.18;
      ctx.fillStyle = `rgba(159, 213, 75, ${Math.max(0.12, currentAlpha)})`;
      ctx.shadowColor = "#9FD54B";
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(px, py, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 4) Subtle sweeping cyber beam
    const sweepY = ((time * 0.025) % (height * 1.6)) - height * 0.3;
    const sweepGrad = ctx.createLinearGradient(0, sweepY, 0, sweepY + 140);
    sweepGrad.addColorStop(0, "rgba(159, 213, 75, 0)");
    sweepGrad.addColorStop(0.5, "rgba(159, 213, 75, 0.022)");
    sweepGrad.addColorStop(1, "rgba(159, 213, 75, 0)");
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(0, 0, width, height);

    animId = requestAnimationFrame(render);
  }

  function startAnimation() {
    if (isRunning) return;
    isRunning = true;
    animId = requestAnimationFrame(render);
  }

  function stopAnimation() {
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  // Pause when page is hidden to preserve battery
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  startAnimation();
}

// ---------------------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initCountdownTimer();
  initStatsCounter();
  initMobileMenu();
  initModals();
  loadAgenda();
  loadSpeakers();
  loadPartners();
  loadTeam();
  initFaq();
  initRegisterForm();
  initPartnerForm();
  initCalendarAndShare();
  initChatBot();
  initAnimatedBackground();
});

