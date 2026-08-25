/**
 * Vorynx - Zero-Barrier Crowdfunding Platform (v0.1.0)
 * Main Application Component & Router Interface
 */

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import './App.css';
import {
  auth,
  googleProvider,
  githubProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updateProfile,
  sendPasswordResetEmail
} from './firebaseConfig';
import { supabase } from './supabaseClient';

// ==========================================
// Friendly Error Message Helper
// ==========================================
/**
 * Maps raw auth error messages or codes to user-friendly status strings.
 * @param {Error|Object|string} error
 * @returns {string} Human readable error message
 */
const getFriendlyErrorMessage = (error) => {
  const code = error.code || error.message || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect email or password. Please try again.";
  }
  if (code.includes("email-already-in-use")) {
    return "This email is already registered. Please sign in instead.";
  }
  if (code.includes("weak-password")) {
    return "Password should be at least 6 characters long.";
  }
  if (code.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code.includes("too-many-requests")) {
    return "This account has been temporarily disabled due to too many failed login attempts.";
  }
  return error.message ? error.message.replace("Firebase: ", "") : String(error);
};

// ==========================================
// Currency Formatter & Helper
// ==========================================
const formatCurrency = (amount, currency = 'USD') => {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    const inr = Math.round(num * 85);
    return `₹${inr.toLocaleString('en-IN')}`;
  }
  return `$${Math.round(num).toLocaleString('en-US')}`;
};

// ==========================================
// CSV Export Helper
// ==========================================
const exportDonationsToCSV = (donations, filename = "vorynx_transactions") => {
  if (!donations || donations.length === 0) return;
  const headers = ["ID", "Funder", "Amount (USD)", "UTR / Transaction ID", "Status", "Date"];
  const rows = donations.map(d => [
    `"${d.id || ''}"`,
    `"${(d.username || 'Anonymous').replace(/"/g, '""')}"`,
    `"${d.amount || 0}"`,
    `"${(d.utr_id || '').replace(/"/g, '""')}"`,
    `"${(d.status || '').replace(/"/g, '""')}"`,
    `"${d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}"`
  ]);
  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Initial Mock Campaign Data
/* eslint-disable-next-line no-unused-vars */
const INITIAL_PROJECTS = [
  {
    id: "keyboard",
    title: "Helix-68: Retro-Mechanical Keyboard",
    subtitle: "A gasket-mounted wireless keyboard with premium walnut casing & custom tactile switches.",
    description: "An ergonomic mechanical keyboard crafted with premium CNC-aluminum, hot-swappable tactile switches, and hand-polished walnut casing. Featuring dual-wireless connectivity, custom gasket-mount dampening, and vibrant RGB backing. Perfect for programmers, writers, and keyboard enthusiasts looking for acoustic perfection and ergonomic comfort.",
    category: "Design",
    tags: ["#Hardware", "#Ergonomics", "#Wireless", "#Retro"],
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    creator: { name: "Aether Laboratories", avatar: "A", verified: true },
    goalAmount: 15000,
    raisedAmount: 12450,
    backerCount: 138,
    daysLeft: 8,
    trending: true,
    rewards: [
      { id: "kb-t1", pledgeAmount: 5, title: "Support Vorynx", desc: "No reward, just help make it happen. You get our eternal gratitude and community updates.", limit: null, claimed: 42 },
      { id: "kb-t2", pledgeAmount: 35, title: "Custom Keycap Set", desc: "Get the complete custom keycap set in the retro Helix-68 color scheme. Switch puller included.", limit: 150, claimed: 62 },
      { id: "kb-t3", pledgeAmount: 129, title: "Helix-68 Barebones Kit", desc: " Walnut case, hot-swappable PCB, aluminum plates, and USB-C braided cable. Switches and keycaps not included.", limit: 200, claimed: 112 },
      { id: "kb-t4", pledgeAmount: 199, title: "Full Helix-68 Keyboard", desc: "The completely assembled Helix-68 mechanical keyboard with custom pre-lubed tactile switches and walnut frame.", limit: 100, claimed: 78 }
    ],
    comments: [
      { id: "c1", username: "alex_dev", body: "Does this keyboard support VIA key remapping out of the box?", timestamp: "2 hours ago" },
      { id: "c2", username: "key_connoisseur", body: "That walnut frame looks absolutely gorgeous. Backed the Barebones kit!", timestamp: "1 day ago" }
    ],
    updates: [
      { id: "u1", title: "Factory Tooling Commenced!", body: "We have finalized our molds for the CNC aluminum bottom shells. Check out the latest prototype photos below...", date: "May 25, 2026" }
    ]
  },
  {
    id: "smarthub",
    title: "Aura Hub: Privacy Smart Home Assistant",
    subtitle: "An offline-first voice assistant and smart hub prioritizing local household privacy.",
    description: "The next generation of localized smart home controllers. Aura Hub operates completely offline to protect your household data privacy, using a custom voice-recognition model and low-power mesh radios. Control smart lights, temperature sensors, media systems, and appliance schedules through a stunning, glassmorphic touch interface.",
    category: "Tech",
    tags: ["#Privacy", "#Hardware", "#SmartHome", "#AI"],
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
    creator: { name: "Nova Smart Labs", avatar: "N", verified: true },
    goalAmount: 45000,
    raisedAmount: 49200,
    backerCount: 384,
    daysLeft: 16,
    trending: true,
    rewards: [
      { id: "sh-t1", pledgeAmount: 10, title: "Digital Supporter Badge", desc: "Show your dedication to smart privacy. Digital dashboard wallpaper and project newsletter access.", limit: null, claimed: 82 },
      { id: "sh-t2", pledgeAmount: 99, title: "Early Bird: Aura Hub Lite", desc: "Core smart hub processor with screen-less voice recognition. Connects up to 20 local smart devices.", limit: 100, claimed: 100 },
      { id: "sh-t3", pledgeAmount: 169, title: "Aura Hub Smart Screen", desc: "Full glassmorphic touch display Aura Hub. Advanced localized NLU assistant and mesh hub integration.", limit: 500, claimed: 202 }
    ],
    comments: [
      { id: "c3", username: "lucas_privacy", body: "Offline NLU is exactly what I've been waiting for. No more sending home recordings to the cloud!", timestamp: "4 hours ago" }
    ],
    updates: [
      { id: "u2", title: "NLU Model Beta Test Success", body: "We ran our offline vocabulary training on the localized processor and achieved a 98.4% trigger word accuracy rate.", date: "May 20, 2026" }
    ]
  },
  {
    id: "game",
    title: "Cyberpunk: Neon Streets RPG",
    subtitle: "A dystopian sci-fi tabletop RPG with detailed miniature figurines.",
    description: "An immersive tabletop roleplaying game featuring neon-drenched dystopian environments, deep hacking mechanics, and modular visual assets. Traverse through a highly detailed urban landscape as an augmented mercenary, solving complex political intrigues and escaping cybernetic strike squads. Includes 12 high-quality miniatures, rulebook, and map grids.",
    category: "Games",
    tags: ["#Tabletop", "#Gaming", "#Cyberpunk", "#Miniatures"],
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    creator: { name: "PixelGrid Tabletop", avatar: "P", verified: false },
    goalAmount: 20000,
    raisedAmount: 8200,
    backerCount: 95,
    daysLeft: 29,
    trending: false,
    rewards: [
      { id: "g-t1", pledgeAmount: 20, title: "Digital Core PDF Book", desc: "Get the full color rulebook in PDF format, plus digital battle maps and character sheets.", limit: null, claimed: 56 },
      { id: "g-t2", pledgeAmount: 60, title: "Physical Core Set", desc: "Includes hardcover rulebook, high-quality physical maps, custom cyberpunk dice set, and token cards.", limit: 400, claimed: 39 }
    ],
    comments: [],
    updates: []
  },
  {
    id: "backpack",
    title: "Nomad Pro: Modular Travel Backpack",
    subtitle: "A weather-resistant travel companion with customizable magnetic compartments.",
    description: "Designed for digital nomads and weekend travelers. The Nomad Pro features magnetic modular pockets, high-durability Cordura fabric, expandable capacity from 25L to 40L, and an integrated TSA-friendly laptop sleeve. Keep your gear organized with dedicated slots for chargers, cameras, clothing, and water bottles.",
    category: "Design",
    tags: ["#Travel", "#Modular", "#Design", "#Everyday"],
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    creator: { name: "Nomad Gear Co.", avatar: "N", verified: true },
    goalAmount: 10000,
    raisedAmount: 34200,
    backerCount: 280,
    daysLeft: 4,
    trending: false,
    rewards: [
      { id: "bp-t1", pledgeAmount: 15, title: "Nomad Tech Organizer Pouch", desc: "Magnetic accessory pouch to hold chargers, cables, and SD cards. Attaches directly to the side strap.", limit: null, claimed: 120 },
      { id: "bp-t2", pledgeAmount: 119, title: "Nomad Pro Backpack Only", desc: "Receive the core 40L Nomad Pro backpack in weather-proof matte black. Accessories sold separately.", limit: 300, claimed: 160 }
    ],
    comments: [
      { id: "c4", username: "world_traveler", body: "Does the modular system allow linking multiple magnetic pouches together? Great design!", timestamp: "2 days ago" }
    ],
    updates: []
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState("");

  // Navigation & Browsing States
  const [view, setView] = useState("home"); // 'home' | 'details' | 'create' | 'creator-dashboard' | 'admin-panel' | 'qr-generator'
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Currency State ($ USD or ₹ INR)
  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem('vorynx_currency') || 'USD';
    } catch {
      return 'USD';
    }
  });

  // Theme State ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('vorynx_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('vorynx_theme', theme);
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  };

  // Bookmarks / Saved Projects State
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vorynx_bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  // Share Modal State
  const [shareModalProject, setShareModalProject] = useState(null);

  // App Dynamic Project Database State
  const [projects, setProjects] = useState([]);
  
  // Sandbox Modes
  const [simMode, setSimMode] = useState("funder"); // 'funder' | 'creator' | 'admin'
  const [donations, setDonations] = useState([]);

  // Alerts
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    const toastObj = typeof msg === "string" ? { message: msg, type } : msg;
    setToast(toastObj);
    setTimeout(() => {
      setToast((prev) => (prev?.message === toastObj.message ? null : prev));
    }, 4500);
  };

  const toggleBookmark = (projectId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setBookmarkedIds((prev) => {
      const exists = prev.includes(projectId);
      const updated = exists ? prev.filter((id) => id !== projectId) : [...prev, projectId];
      try {
        localStorage.setItem('vorynx_bookmarks', JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save bookmark:", err);
      }
      showToast(exists ? "Campaign removed from Saved list." : "❤️ Campaign saved to your bookmarks!");
      return updated;
    });
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, rewards(*), comments(*), updates(*)');

      if (error) throw error;

      const mapped = data.map(p => {
        const rewards = (p.rewards || []).sort((a, b) => a.pledge_amount - b.pledge_amount);
        const comments = (p.comments || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const updates = (p.updates || []).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        return {
          id: p.id,
          title: p.title,
          subtitle: p.subtitle,
          description: p.description,
          category: p.category,
          image: p.image,
          creator: {
            name: p.creator_name,
            avatar: p.creator_avatar,
            verified: !!p.creator_verified
          },
          goalAmount: Number(p.goal_amount),
          raisedAmount: Number(p.raised_amount),
          backerCount: Number(p.backer_count),
          daysLeft: Number(p.days_left),
          trending: !!p.trending,
          upi_id: p.upi_id || "payment@vorynx",
          status: p.status || "pending",
          rewards: rewards.map(r => ({
            id: r.id,
            pledgeAmount: Number(r.pledge_amount),
            title: r.title,
            desc: r.desc,
            limit: r.limit,
            claimed: Number(r.claimed)
          })),
          comments: comments.map(c => ({
            id: c.id,
            username: c.username,
            body: c.body,
            timestamp: c.timestamp
          })),
          updates: updates.map(u => ({
            id: u.id,
            title: u.title,
            body: u.body,
            date: u.date
          }))
        };
      });

      setProjects(mapped);
    } catch (err) {
      console.error("Error fetching projects:", err);
      showToast("Error loading campaigns from database.");
    }
  };

  const fetchDonations = async () => {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*');

      if (error) throw error;
      setDonations(data || []);
    } catch (err) {
      console.error("Error fetching donations:", err);
    }
  };

  const refreshData = async () => {
    await fetchProjects();
    await fetchDonations();
  };

  // Modals & Flows
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Global Keyboard Shortcuts (/ for search, Escape for modals, ? for shortcut guide, Alt+T for theme, Alt+H for home)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

      if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        const searchInput = document.getElementById('search-campaigns-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      if ((e.key === '?' || (e.shiftKey && e.key === '?')) && !isInputActive) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }

      if ((e.altKey || e.metaKey) && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        toggleTheme();
      }

      if ((e.altKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setView("home");
        setSelectedProjectId(null);
      }

      if (e.key === 'Escape') {
        if (shortcutsOpen) setShortcutsOpen(false);
        if (authOpen) setAuthOpen(false);
        if (shareModalProject) setShareModalProject(null);
        if (checkoutOpen) {
          setCheckoutOpen(false);
          setSelectedReward(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authOpen, shareModalProject, checkoutOpen, shortcutsOpen, theme]);

  // Scroll listener for floating scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Check if the link is a sign-in with email link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation:');
      }
      if (email) {
        setTimeout(() => setLoading(true), 0);
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            setInitialError(getFriendlyErrorMessage(err));
            setLoading(false);
          });
      }
    }

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      await refreshData();
      setLoading(false);
      if (currentUser) {
        setAuthOpen(false); // Close sign-in popup if completed successfully
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px 0px -60px 0px",
      threshold: 0.05
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(".reveal-on-scroll");
      elements.forEach((el) => {
        observer.observe(el);
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [view, projects]);

  const handleLogout = () => {
    signOut(auth);
    showToast("Logged out successfully.");
  };



  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Restricted action protector
  const protectAction = (actionCallback) => {
    if (!user) {
      setAuthOpen(true);
      showToast("Please sign in to complete this action.");
      return;
    }
    actionCallback();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff', background: '#0b0f19', flexDirection: 'column' }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, letterSpacing: '1px', textShadow: '0 0 10px rgba(0, 245, 155, 0.3)' }} className="text-green">
          VORYNX
        </h2>
        <p style={{ marginTop: '10px', color: '#9ca3af', fontSize: '0.9rem' }}>Initializing Platform...</p>
      </div>
    );
  }

  return (
    <div className="vorynx-app">
      {/* Ambient background glow blobs */}
      <div className="ambient-glow-container">
        <div className="ambient-glow-blob ambient-glow-blob-1"></div>
        <div className="ambient-glow-blob ambient-glow-blob-2"></div>
      </div>

      {/* Sandbox Simulation Toolbar */}
      <div className="sim-toolbar">
        <div className="sim-toolbar-container">
          <div className="sim-title">
            <i className="fa-solid fa-flask"></i> Vorynx Sandbox Simulator
          </div>
          <div className="sim-role-badges">
            <button 
              className={`sim-role-btn ${simMode === 'funder' ? 'active' : ''}`}
              onClick={() => { setSimMode('funder'); setView('home'); setSelectedProjectId(null); }}
            >
              <i className="fa-solid fa-wallet"></i> Funder View
            </button>
            <button 
              className={`sim-role-btn ${simMode === 'creator' ? 'active' : ''}`}
              onClick={() => { 
                setSimMode('creator'); 
                protectAction(() => setView('creator-dashboard'));
              }}
            >
              <i className="fa-solid fa-chart-line"></i> Creator Mode
            </button>
            <button 
              className={`sim-role-btn ${simMode === 'admin' ? 'active' : ''}`}
              onClick={() => { setSimMode('admin'); setView('admin-panel'); }}
            >
              <i className="fa-solid fa-user-shield"></i> Admin Mode
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert Notification */}
      {toast && (
        <div className={`toast-notification-card toast-${toast.type || 'info'}`}>
          <i className={`fa-solid ${
            toast.type === 'success' ? 'fa-circle-check text-green' :
            toast.type === 'warning' ? 'fa-triangle-exclamation text-amber' :
            'fa-circle-info text-blue'
          }`} style={{ fontSize: '1.1rem' }}></i>
          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#fff' }}>{toast.message}</span>
          <button className="toast-close-btn" onClick={() => setToast(null)} title="Dismiss">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="vorynx-header">
        <div className="header-container">
          <div className="logo-section" id="brand-logo-btn" onClick={() => { setView("home"); setSelectedProjectId(null); }}>
            <span className="logo-icon">V</span>
            <span className="logo-text">VORYNX</span>
          </div>

          <div className="search-bar-container">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              id="search-campaigns-input"
              placeholder="Search campaigns..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery ? (
              <button 
                type="button" 
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            ) : (
              <kbd className="search-shortcut-badge" title="Press / to search">/</kbd>
            )}
          </div>

          <div className="nav-actions">
            {/* Multi-Currency Toggle */}
            <div className="currency-toggle-pill" title="Toggle Currency ($ USD / ₹ INR)">
              <button 
                className={`currency-pill-btn ${currency === 'USD' ? 'active' : ''}`}
                onClick={() => { setCurrency('USD'); localStorage.setItem('vorynx_currency', 'USD'); }}
              >
                $ USD
              </button>
              <button 
                className={`currency-pill-btn ${currency === 'INR' ? 'active' : ''}`}
                onClick={() => { setCurrency('INR'); localStorage.setItem('vorynx_currency', 'INR'); }}
              >
                ₹ INR
              </button>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button 
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <i className={`fa-solid ${theme === 'dark' ? 'fa-sun text-amber' : 'fa-moon text-blue'}`}></i>
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            {/* Keyboard Shortcuts Guide Button */}
            <button
              className="theme-toggle-btn"
              onClick={() => setShortcutsOpen(true)}
              title="Keyboard Shortcuts (?)"
            >
              <i className="fa-solid fa-keyboard text-purple" style={{ color: '#a855f7' }}></i>
              <span>Shortcuts</span>
            </button>

            {/* Saved Bookmarks Navigation Button */}
            <button 
              className="btn-text"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => { setView("home"); setSelectedCategory("Saved"); setSelectedProjectId(null); }}
              title="View Saved Bookmarks"
            >
              <i className="fa-solid fa-heart" style={{ color: '#ef4444' }}></i>
              <span>Saved</span>
              {bookmarkedIds.length > 0 && (
                <span style={{ 
                  background: '#ef4444', 
                  color: '#fff', 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  padding: '0.1rem 0.45rem', 
                  borderRadius: '999px',
                  lineHeight: 1
                }}>
                  {bookmarkedIds.length}
                </span>
              )}
            </button>

            <button className="btn-text" onClick={() => { setView("qr-generator"); setSelectedProjectId(null); }}>
              UPI QR Generator
            </button>
            {(simMode === "creator" || simMode === "admin") && (
              <button className="btn-text" onClick={() => protectAction(() => setView("creator-dashboard"))}>
                Creator Dashboard
              </button>
            )}
            {simMode === "admin" && (
              <button className="btn-text" onClick={() => setView("admin-panel")}>
                Admin Panel
              </button>
            )}
            <button className="btn-text" id="nav-start-campaign-btn" onClick={() => protectAction(() => setView("create"))}>
              Start a Campaign
            </button>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="creator-avatar">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                </div>
                <button className="btn-secondary" id="nav-logout-btn" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            ) : (
              <button className="btn-primary" id="nav-sign-in-btn" onClick={() => setAuthOpen(true)}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="vorynx-main">
        {view === "home" && (
          <div className="view-transition-enter">
            <HomepageView
              projects={projects}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onSelectProject={(id) => { setSelectedProjectId(id); setView("details"); }}
              protectAction={protectAction}
              setView={setView}
              currency={currency}
              bookmarkedIds={bookmarkedIds}
              toggleBookmark={toggleBookmark}
            />
          </div>
        )}

        {view === "details" && activeProject && (
          <div className="view-transition-enter">
            <ProjectDetailView
              project={activeProject}
              onBack={() => { setView("home"); setSelectedProjectId(null); }}
              user={user}
              currency={currency}
              bookmarkedIds={bookmarkedIds}
              toggleBookmark={toggleBookmark}
              onShare={(p) => setShareModalProject(p)}
              onPledge={(reward) => {
                protectAction(() => {
                  setSelectedReward(reward);
                  setCheckoutOpen(true);
                });
              }}
              onAddComment={async (body) => {
                const username = user?.displayName || user?.email?.split('@')[0] || "Anonymous";
                const newComment = {
                  id: `c_${Date.now()}`,
                  project_id: activeProject.id,
                  username,
                  body,
                  timestamp: "Just now"
                };
                try {
                  const { error } = await supabase
                    .from('comments')
                    .insert([newComment]);
                  if (error) throw error;
                  await fetchProjects();
                  showToast("Comment posted!");
                } catch (err) {
                  console.error("Error adding comment:", err);
                  showToast("Failed to post comment to database.");
                }
              }}
              onDeleteProject={async (projectId) => {
                if (window.confirm("Are you sure you want to permanently discontinue and delete this campaign? This action cannot be undone.")) {
                  try {
                    if (!auth.currentUser) {
                      throw new Error("You must be logged in to delete this campaign.");
                    }
                    const token = await auth.currentUser.getIdToken(true);
                    const response = await fetch('/api/discontinue', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ projectId })
                    });

                    let result = {};
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                      result = await response.json();
                    } else {
                      const errorText = await response.text();
                      throw new Error(errorText || `Request failed with status ${response.status}`);
                    }

                    if (!response.ok) {
                      throw new Error(result.error || "Failed to discontinue campaign");
                    }

                    await fetchProjects();
                    setView("home");
                    setSelectedProjectId(null);
                    showToast("Campaign has been discontinued and removed.");
                  } catch (err) {
                    console.error("Error deleting project:", err);
                    showToast(err.message || "Failed to delete campaign from database.");
                  }
                }
              }}
            />
          </div>
        )}

        {view === "create" && (
          <div className="view-transition-enter">
            <CreateProjectWizard
              onBack={() => setView("home")}
              onSubmit={async (newProj) => {
                try {
                  const { error: projErr } = await supabase
                    .from('projects')
                    .insert([{
                      id: newProj.id,
                      title: newProj.title,
                      subtitle: newProj.subtitle,
                      description: newProj.description,
                      category: newProj.category,
                      image: newProj.image,
                      creator_name: newProj.creator.name,
                      creator_avatar: newProj.creator.avatar,
                      creator_verified: newProj.creator.verified,
                      goal_amount: newProj.goalAmount,
                      raised_amount: newProj.raisedAmount,
                      backer_count: newProj.backerCount,
                      days_left: newProj.daysLeft,
                      trending: newProj.trending,
                      upi_id: newProj.upi_id,
                      status: 'pending'
                    }]);

                  if (projErr) throw projErr;

                  const rewardRows = newProj.rewards.map(r => ({
                    id: r.id,
                    project_id: newProj.id,
                    pledge_amount: r.pledgeAmount,
                    title: r.title,
                    desc: r.desc,
                    limit: r.limit,
                    claimed: r.claimed
                  }));

                  const { error: rewErr } = await supabase
                    .from('rewards')
                    .insert(rewardRows);

                  if (rewErr) throw rewErr;

                  await refreshData();
                  setView("home");
                  showToast("Your campaign proposal has been submitted and is awaiting Admin approval.");
                } catch (err) {
                  console.error("Error creating project:", err);
                  showToast("Failed to launch campaign to database.");
                }
              }}
              user={user}
            />
          </div>
        )}

        {view === "creator-dashboard" && (
          <div className="view-transition-enter">
            <CreatorDashboardView
              projects={projects}
              donations={donations}
              user={user}
              setView={setView}
              currency={currency}
              onSelectProject={(id) => { setSelectedProjectId(id); setView("details"); }}
            />
          </div>
        )}

        {view === "admin-panel" && (
          <div className="view-transition-enter">
            <AdminPanelView
              projects={projects}
              donations={donations}
              setView={setView}
              refreshData={refreshData}
              showToast={showToast}
              currency={currency}
            />
          </div>
        )}

        {view === "qr-generator" && (
          <div className="view-transition-enter">
            <UpiQrGenerator
              setView={setView}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-standard)', padding: '2rem 1rem', background: '#090c13', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <h3 style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '0.5rem' }}>Vorynx Platform</h3>
            <p style={{ maxWidth: '300px', color: 'var(--text-muted)' }}>Empowering creative developers, hardware pioneers, and designers to manifest their vision through zero-barrier crowdfunding.</p>
          </div>
          <div style={{ display: 'flex', gap: '3rem' }}>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Categories</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-muted)' }}>
                <li>Technology</li>
                <li>Design</li>
                <li>Gaming</li>
                <li>Publishing</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Developer</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-muted)' }}>
                <li>UI Sandbox</li>
                <li>React Mockups</li>
                <li>Local Storage</li>
                <li>Firebase Core</li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1400px', margin: '1.5rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <span>&copy; {new Date().getFullYear()} Vorynx Inc. Designed with glassmorphic aesthetics.</span>
          <span>Terms & Privacy | Sandbox Mode</span>
        </div>
      </footer>

      {/* Floating Scroll to Top Action Button */}
      {showScrollTop && (
        <button
          className="scroll-to-top-btn"
          onClick={scrollToTop}
          title="Scroll back to top"
          aria-label="Scroll back to top"
        >
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      )}

      {/* Modal - Keyboard Shortcuts Reference */}
      {shortcutsOpen && (
        <div className="modal-overlay" onClick={() => setShortcutsOpen(false)}>
          <div className="shortcuts-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-keyboard text-purple" style={{ color: '#a855f7', fontSize: '1.2rem' }}></i>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Keyboard Shortcuts</h3>
              </div>
              <button className="toast-close-btn" onClick={() => setShortcutsOpen(false)} title="Close (Esc)">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="shortcut-row">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Focus Search Bar</span>
                <kbd className="shortcut-key-badge">/</kbd>
              </div>
              <div className="shortcut-row">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Toggle Keyboard Shortcuts</span>
                <kbd className="shortcut-key-badge">?</kbd>
              </div>
              <div className="shortcut-row">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Toggle Dark / Light Theme</span>
                <kbd className="shortcut-key-badge">Alt + T</kbd>
              </div>
              <div className="shortcut-row">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Navigate to Homepage</span>
                <kbd className="shortcut-key-badge">Alt + H</kbd>
              </div>
              <div className="shortcut-row">
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Close Open Modal / Dialog</span>
                <kbd className="shortcut-key-badge">Esc</kbd>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Press <kbd className="shortcut-key-badge" style={{ fontSize: '0.7rem' }}>Esc</kbd> anytime to dismiss overlay windows.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Firebase sliding AuthPanel wrapper */}
      {authOpen && (
        <div className="modal-overlay" onClick={() => setAuthOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '90%', padding: '0px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" style={{ top: '1.5rem', right: '1.5rem', zIndex: 2000, color: '#9ca3af' }} onClick={() => setAuthOpen(false)}>&times;</button>
            <div className="auth-page-wrapper">
              <AuthPanel initialError={initialError} />
            </div>
          </div>
        </div>
      )}

      {/* Modal - Share Campaign Modal */}
      {shareModalProject && (
        <ShareModal
          project={shareModalProject}
          onClose={() => setShareModalProject(null)}
          showToast={showToast}
        />
      )}

      {/* Modal - Pledge/Checkout Simulator */}
      {checkoutOpen && selectedReward && activeProject && (
        <CheckoutModal
          project={activeProject}
          reward={selectedReward}
          currency={currency}
          onClose={() => { setCheckoutOpen(false); setSelectedReward(null); }}
          onSubmit={async (pledgeAmt, paymentMethod, transactionId) => {
            try {
              if (paymentMethod === "card") {
                const { error: rewErr } = await supabase
                  .from('rewards')
                  .update({ claimed: selectedReward.claimed + 1 })
                  .eq('id', selectedReward.id);

                if (rewErr) throw rewErr;

                // Log a successful donation record
                const { error: donErr } = await supabase
                  .from('donations')
                  .insert([{
                    project_id: activeProject.id,
                    amount: pledgeAmt,
                    utr_id: transactionId || `card_${Date.now()}`,
                    username: user?.displayName || user?.email?.split('@')[0] || "Anonymous Funder",
                    status: 'successful'
                  }]);

                if (donErr) throw donErr;

                const { error: projErr } = await supabase
                  .from('projects')
                  .update({
                    raised_amount: activeProject.raisedAmount + pledgeAmt,
                    backer_count: activeProject.backerCount + 1
                  })
                  .eq('id', activeProject.id);

                if (projErr) throw projErr;

                await refreshData();
                setCheckoutOpen(false);
                setSelectedReward(null);
                showToast(`Card pledge of ${formatCurrency(pledgeAmt, currency)} authorized successfully!`);
              } else {
                // UPI transaction flow - insert pending donation
                const { error: donErr } = await supabase
                  .from('donations')
                  .insert([{
                    project_id: activeProject.id,
                    amount: pledgeAmt,
                    utr_id: transactionId,
                    username: user?.displayName || user?.email?.split('@')[0] || "Anonymous Funder",
                    status: 'pending'
                  }]);

                if (donErr) throw donErr;

                const { error: rewErr } = await supabase
                  .from('rewards')
                  .update({ claimed: selectedReward.claimed + 1 })
                  .eq('id', selectedReward.id);

                if (rewErr) throw rewErr;

                await refreshData();
                setCheckoutOpen(false);
                setSelectedReward(null);
                showToast(`Pledge submitted. UTR: ${transactionId} is pending Admin verification.`);
              }
            } catch (err) {
              console.error("Error recording pledge:", err);
              showToast("Failed to register pledge in database.");
            }
          }}
        />
      )}

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button 
          type="button"
          className="scroll-top-btn"
          onClick={scrollToTop}
          title="Scroll to top (or navigate)"
          aria-label="Scroll to top"
        >
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// HOMEPAGE VIEW COMPONENT
// ============================================================================
function HomepageView({ projects, searchQuery, selectedCategory, setSelectedCategory, onSelectProject, protectAction, setView, currency, bookmarkedIds, toggleBookmark }) {
  const [sortBy, setSortBy] = useState("trending");
  const [selectedTag, setSelectedTag] = useState("All Tags");

  const POPULAR_TAGS = ["All Tags", "#Hardware", "#Privacy", "#Tabletop", "#Ergonomics", "#Travel", "#Wireless"];

  // Filtering Logic
  const filteredProjects = projects.filter(proj => {
    const matchesSearch = proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All"
      ? true
      : selectedCategory === "Saved"
      ? bookmarkedIds.includes(proj.id)
      : proj.category === selectedCategory;

    const matchesTag = selectedTag === "All Tags" || (
      proj.tags ? proj.tags.includes(selectedTag) :
      (proj.title + " " + proj.subtitle + " " + proj.description + " " + proj.category)
        .toLowerCase()
        .includes(selectedTag.replace('#', '').toLowerCase())
    );

    const isApproved = proj.status === 'approved' || proj.status === 'live';

    return matchesSearch && matchesCategory && matchesTag && isApproved;
  });

  // Sorting Logic
  filteredProjects.sort((a, b) => {
    if (sortBy === "funded_desc") return b.raisedAmount - a.raisedAmount;
    if (sortBy === "pct_desc") return (b.raisedAmount / b.goalAmount) - (a.raisedAmount / a.goalAmount);
    if (sortBy === "days_asc") return a.daysLeft - b.daysLeft;
    if (sortBy === "backers_desc") return b.backerCount - a.backerCount;
    if (sortBy === "newest") return String(b.id).localeCompare(String(a.id));
    // Default 'trending'
    if (a.trending && !b.trending) return -1;
    if (!a.trending && b.trending) return 1;
    return b.raisedAmount - a.raisedAmount;
  });

  // Spotlight is the first trending project
  const spotlightProj = projects.find(p => p.trending && (p.status === 'approved' || p.status === 'live')) || projects.find(p => p.status === 'approved' || p.status === 'live');

  const handleExploreClick = () => {
    document.getElementById("discover-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="hero-section" style={{ textAlign: 'center', padding: '3.5rem 1rem 3rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-brand-light)', color: 'var(--accent-brand)', padding: '0.35rem 1rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          <i className="fa-solid fa-circle-check"></i> Zero-Barrier Crowdfunding Platform
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-1.2px', marginBottom: '1.25rem' }}>
          Bring your creative ideas to life.
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2.25rem', maxWidth: '650px', margin: '0 auto 2.25rem' }}>
          Vorynx is the trusted platform for designers, engineers, and creators. Back vetted, high-integrity campaigns or launch your own to a global community.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }} onClick={() => protectAction(() => setView("create"))}>
            Start a Campaign <i className="fa-solid fa-arrow-right"></i>
          </button>
          <button className="btn-secondary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }} onClick={handleExploreClick}>
            Explore Campaigns
          </button>
        </div>

        {/* Trust Quick Indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginTop: '3rem', flexWrap: 'wrap', borderTop: '1px solid var(--border-standard)', paddingTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <i className="fa-solid fa-shield-halved text-green"></i> 100% Vetted Creators
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <i className="fa-solid fa-lock text-green"></i> Secure Encrypted Checkouts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <i className="fa-solid fa-circle-dollar-to-slot text-green"></i> All-or-Nothing Guarantee
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TABS WITH SAVED BOOKMARKS */}
      <div className="category-filter-bar" style={{ borderRadius: '16px', border: '1px solid var(--border-standard)', marginBottom: '1.25rem' }}>
        {["All", "Tech", "Design", "Games", "Publishing"].map((cat) => (
          <button
            key={cat}
            className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
        <button
          className={`category-tab ${selectedCategory === 'Saved' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('Saved')}
        >
          <i className="fa-solid fa-heart" style={{ color: selectedCategory === 'Saved' ? 'inherit' : '#ef4444', marginRight: '5px' }}></i>
          Saved ({bookmarkedIds.length})
        </button>
      </div>

      {/* 2b. INTERACTIVE SUB-TAG QUICK FILTERS */}
      <div className="tag-filter-bar">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: '0.2rem' }}>
          <i className="fa-solid fa-tags"></i> Tags:
        </span>
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => setSelectedTag(selectedTag === tag ? "All Tags" : tag)}
          >
            {tag}
          </button>
        ))}
        {selectedTag !== "All Tags" && (
          <button
            className="tag-chip"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={() => setSelectedTag("All Tags")}
          >
            <i className="fa-solid fa-xmark"></i> Clear Tag Filter
          </button>
        )}
      </div>

      {/* 3. CURATED FEATURED PROJECT */}
      {spotlightProj && searchQuery === "" && selectedCategory === "All" && (
        <div style={{ marginBottom: '4rem' }}>
          <div className="section-header">
            <h2 className="section-title">Curated Featured Project</h2>
            <span className="badge-tag" style={{ background: 'var(--accent-success-light)', color: 'var(--accent-success)', border: 'none', fontWeight: 700 }}>
              <i className="fa-solid fa-star"></i> Project We Love
            </span>
          </div>
          <div className="hero-spotlight reveal-on-scroll">
            <div className="hero-media">
              <span className="hero-tag">Staff Pick</span>
              <button 
                className={`card-bookmark-btn ${bookmarkedIds.includes(spotlightProj.id) ? 'bookmarked' : ''}`}
                onClick={(e) => toggleBookmark(spotlightProj.id, e)}
                title={bookmarkedIds.includes(spotlightProj.id) ? "Remove from bookmarks" : "Save campaign"}
                style={{ top: '1.25rem', right: '1.25rem', zIndex: 10 }}
              >
                <i className={bookmarkedIds.includes(spotlightProj.id) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
              </button>
              <img src={spotlightProj.image} alt={spotlightProj.title} />
            </div>
            <div className="hero-details">
              <span className="hero-category">{spotlightProj.category}</span>
              <h1 className="hero-title">{spotlightProj.title}</h1>
              <p className="hero-desc">{spotlightProj.subtitle}</p>

              <div className="hero-stats-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                  <span>{formatCurrency(spotlightProj.raisedAmount, currency)} pledged</span>
                  <span className="text-green">{Math.round((spotlightProj.raisedAmount / spotlightProj.goalAmount) * 100)}%</span>
                </div>
                <div className="progress-container">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, (spotlightProj.raisedAmount / spotlightProj.goalAmount) * 100)}%` }}
                  ></div>
                </div>
                <div className="hero-stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{spotlightProj.backerCount.toLocaleString()}</span>
                    <span className="stat-label">Backers</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatCurrency(spotlightProj.goalAmount, currency)}</span>
                    <span className="stat-label">Goal</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{spotlightProj.daysLeft}</span>
                    <span className="stat-label">Days Left</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-primary" onClick={() => onSelectProject(spotlightProj.id)}>
                  View Campaign
                </button>
                <button className="btn-secondary" onClick={() => protectAction(() => setView("create"))}>
                  Create Yours
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DISCOVER TRENDING CAMPAIGNS GRID */}
      <div id="discover-section" className="section-header reveal-on-scroll" style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-standard)', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="section-title">
            {selectedCategory === "Saved" ? "Saved Bookmarks" : searchQuery !== "" || selectedCategory !== "All" ? "Search Results" : "Trending Campaigns"}
          </h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Showing {filteredProjects.length} campaigns
          </span>
        </div>

        {/* Sort Controls */}
        <div className="sort-controls-box">
          <label className="sort-control-label">
            <i className="fa-solid fa-arrow-down-wide-short"></i> Sort:
          </label>
          <select 
            className="sort-select-dropdown" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="trending">🔥 Trending / Featured</option>
            <option value="funded_desc">💰 Most Funded</option>
            <option value="pct_desc">📈 % Funded (High to Low)</option>
            <option value="days_asc">⏳ Ending Soonest</option>
            <option value="backers_desc">👥 Most Backers</option>
            <option value="newest">✨ Newest</option>
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '24px', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}>
          <i className={selectedCategory === "Saved" ? "fa-solid fa-heart-crack" : "fa-solid fa-magnifying-glass"} style={{ fontSize: '3rem', marginBottom: '1.25rem', color: 'var(--text-light)' }}></i>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {selectedCategory === "Saved" ? "No Saved Campaigns Yet" : "No Campaigns Found"}
          </h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', maxWidth: '400px', margin: '0.5rem auto 0' }}>
            {selectedCategory === "Saved" 
              ? "Click the heart icon on any campaign to save it to your bookmarks for quick access anytime!" 
              : "We couldn't find any projects matching your search. Try adjusting filters or searching for key words."}
          </p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((proj, idx) => {
            const pct = Math.round((proj.raisedAmount / proj.goalAmount) * 100);
            const isSaved = bookmarkedIds.includes(proj.id);
            return (
              <div key={proj.id} className={`project-card reveal-on-scroll stagger-${(idx % 3) + 1}`} onClick={() => onSelectProject(proj.id)}>
                <div className="card-media">
                  {proj.trending && <span className="card-badge"><i className="fa-solid fa-bolt text-green"></i> Trending</span>}
                  <button 
                    className={`card-bookmark-btn ${isSaved ? 'bookmarked' : ''}`}
                    onClick={(e) => toggleBookmark(proj.id, e)}
                    title={isSaved ? "Remove from bookmarks" : "Save campaign"}
                  >
                    <i className={isSaved ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                  </button>
                  <img src={proj.image} alt={proj.title} />
                </div>
                <div className="card-content">
                  <span className="card-category">{proj.category}</span>
                  <h3 className="card-title">{proj.title}</h3>
                  <p className="card-desc">{proj.subtitle}</p>

                  <div className="card-footer-stats">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                      <span>{formatCurrency(proj.raisedAmount, currency)} raised of {formatCurrency(proj.goalAmount, currency)}</span>
                      <span className="text-green">{pct}%</span>
                    </div>
                    <div className="progress-container" style={{ height: '6px', marginBottom: '0.8rem' }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      ></div>
                    </div>
                    <div className="card-stats-row">
                      <div>
                        <div className="card-stat-number">{proj.backerCount.toLocaleString()}</div>
                        <div className="card-stat-lbl">Backers</div>
                      </div>
                      <div>
                        <div className="card-stat-number">{proj.daysLeft}</div>
                        <div className="card-stat-lbl">Days Left</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. PLATFORM STATISTICS */}
      <section className="reveal-on-scroll" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '24px', padding: '3rem 2rem', marginBottom: '4rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Vorynx by the Numbers</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>Fast, reliable, and transparent fundraising supporting creative minds worldwide.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-brand)', fontFamily: 'var(--font-heading)' }}>$18.4M+</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.5rem' }}>Total Funds Pledged</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-brand)', fontFamily: 'var(--font-heading)' }}>120,000+</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.5rem' }}>Global Backers</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-brand)', fontFamily: 'var(--font-heading)' }}>98.2%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.5rem' }}>Successful Project Delivery</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-brand)', fontFamily: 'var(--font-heading)' }}>0%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.5rem' }}>Platform Listing Fees</div>
          </div>
        </div>
      </section>

      {/* 6. SUCCESS STORIES */}
      <section className="reveal-on-scroll" style={{ marginBottom: '4rem' }}>
        <div className="section-header">
          <h2 className="section-title">Success Stories</h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Visions made physical</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
            <img src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80" alt="Smart Wearables" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--accent-success)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Technology</span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: '0.5rem 0' }}>Zenith Smart Watch</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>"Vorynx helped us raise 320% of our initial funding goal. Their creator support and all-or-nothing transparent payout structure gave our backers the absolute trust needed to fund our development phase."</p>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>Raised $148,200</span>
                <span style={{ color: 'var(--accent-success)' }}>1,120 Backers</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
            <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" alt="Acoustics" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'var(--accent-success)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Design</span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: '0.5rem 0' }}>EchoWood Speakers</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>"We launched our eco-friendly studio monitors on Vorynx. The zero platform listing fee allowed us to direct all support into procuring local walnut timber, keeping prices highly affordable for our core users."</p>
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <span>Raised $64,500</span>
                <span style={{ color: 'var(--accent-success)' }}>480 Backers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="reveal-on-scroll" style={{ marginBottom: '4rem' }}>
        <div className="section-header">
          <h2 className="section-title">Backer & Creator Feedback</h2>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Vetted testimonials</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', gap: '0.25rem', color: '#fbbf24', marginBottom: '0.8rem' }}>
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '1rem' }}>
              "The design is incredibly clean. I've backed four campaigns on Vorynx now, and the updates timeline keeping me informed of shipping speeds has made this the only platform I fully trust."
            </p>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Rohan Mehta</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Technology Backer</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', gap: '0.25rem', color: '#fbbf24', marginBottom: '0.8rem' }}>
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '1rem' }}>
              "Vorynx is the best. The team actually vetted our product design prototype before allowing us to go live. This filtration ensures backing high-quality stuff, reducing the risks commonly seen elsewhere."
            </p>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Sarah Connor</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Industrial Designer</div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', gap: '0.25rem', color: '#fbbf24', marginBottom: '0.8rem' }}>
              <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '1rem' }}>
              "As a developer launching a smart hub, the developer API tools and easy integration with Supabase made shipping comments and updates completely smooth. Backers loved the transparent story layout."
            </p>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>David Vance</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Smart Home Creator</div>
          </div>
        </div>
      </section>

      {/* 8. TRUST AND SECURITY INDICATORS */}
      <section className="reveal-on-scroll" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.02) 0%, rgba(16, 185, 129, 0.02) 100%)', border: '1px solid var(--border-standard)', borderRadius: '24px', padding: '2.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifycontent: 'space-between', gap: '2rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ maxWidth: '600px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-shield-halved text-green"></i> Secure Crowdfunding Guaranteed
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
            Our security framework protects both donors and creators. We verify campaign identity, secure checkout tokens using PCI-compliant processors, and enforce the strict All-or-Nothing model to guarantee financial safety.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', padding: '0.8rem 1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <i className="fa-brands fa-cc-stripe" style={{ fontSize: '1.5rem', color: '#635bff' }}></i> Stripe Payments
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', padding: '0.8rem 1.2rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 700 }}>
            <i className="fa-solid fa-circle-check text-green" style={{ fontSize: '1.25rem' }}></i> KYC Verified
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// PROJECT DETAIL VIEW COMPONENT
// ============================================================================
// Helper to fetch customized specifications/materials per category
const getCategoryDetails = (category) => {
  const cat = (category || "").toLowerCase();
  if (cat === "tech") {
    return {
      specsTitle: "Technical & Device Specifications",
      specsBody: "Our PCB routing design is complete and custom voice recognition algorithms are fully optimized. Aura Hub runs a custom lightweight neural network model locally to keep execution entirely offline, and uses low-energy radio transmitters.",
      materialsTitle: "System Architecture & Security",
      materialsBody: "The housing uses premium anodized aluminum with double-shot glassmorphic lenses. The internals feature cryptographic coprocessors for secure on-device token storage and local database hashing via custom SQLite pipelines."
    };
  } else if (cat === "design") {
    return {
      specsTitle: "Ergonomics & Design Schematics",
      specsBody: "We have finalized our mechanical drafts, custom keyboard switches, and mold files. Everything is optimized for premium acoustic resonance, hot-swappable keycap tolerances, and custom gasket dampening systems.",
      materialsTitle: "Materials & Tactile Craftsmanship",
      materialsBody: "Each frame is milled from a single block of aerospace-grade aluminum or hand-polished American walnut timber. We verify wood grain quality individually to ensure a gorgeous finish and lifelong structural durability."
    };
  } else if (cat === "games") {
    return {
      specsTitle: "Game Engine & Mechanics",
      specsBody: "Rules have undergone extensive balance playtesting with over 100 beta sessions. Miniature designs are fully optimized for detailed 3D resin printing, ensuring sharp model features and robust peg structures.",
      materialsTitle: "Asset Quality & Production",
      materialsBody: "Card sets use premium 350gsm linen-finish paper stocks with scratch-resistant coating. Dice are precision-milled resin with embedded glowing pigments, and modular grid maps are printed on thick, water-resistant boards."
    };
  } else {
    // Publishing / Default
    return {
      specsTitle: "Layout & Production Specifications",
      specsBody: "The manuscript formatting and cover illustrations are completed in high-resolution vector formats. Book binding drafts have been approved by our local printing house, matching optimal margin guidelines.",
      materialsTitle: "Print Quality & Binding Materials",
      materialsBody: "We utilize heavy-weight 120gsm acid-free cream paper to ensure pages do not yellow. Covers feature premium cloth-bound hardback materials, custom gold-foil embossing, and highly durable reinforced stitching."
    };
  }
};

function ProjectDetailView({ project, onBack, user, onPledge, onAddComment, onDeleteProject, currency, bookmarkedIds, toggleBookmark, onShare }) {
  const [activeTab, setActiveTab] = useState("story"); // 'story' | 'updates' | 'comments'
  const [commentInput, setCommentInput] = useState("");

  const percentFunded = Math.round((project.raisedAmount / project.goalAmount) * 100);
  const isCreator = user && (
    user.displayName === project.creator.name ||
    user.email?.split('@')[0] === project.creator.name
  );
  const isSaved = bookmarkedIds && bookmarkedIds.includes(project.id);

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(commentInput);
    setCommentInput("");
  };

  const catDetails = getCategoryDetails(project.category);

  return (
    <div>
      {/* Back button and quick actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <span className="back-link" style={{ margin: 0 }} onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Back to discovery
        </span>

        <div className="detail-action-buttons-row">
          <button 
            type="button" 
            className="btn-secondary detail-share-btn" 
            onClick={() => onShare && onShare(project)}
            title="Share this campaign"
          >
            <i className="fa-solid fa-share-nodes"></i> Share
          </button>
          <button 
            type="button" 
            className={`detail-bookmark-btn ${isSaved ? 'bookmarked' : ''}`} 
            onClick={(e) => toggleBookmark && toggleBookmark(project.id, e)}
            title={isSaved ? "Remove from bookmarks" : "Save campaign"}
          >
            <i className={isSaved ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      <div className="detail-header-full">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge-tag" style={{ background: 'var(--accent-brand-light)', color: 'var(--accent-brand)', border: 'none', fontWeight: 700 }}>
            {project.category}
          </span>
          {project.creator.verified && (
            <span className="creator-tag">
              <i className="fa-solid fa-circle-check text-green" style={{ marginRight: '4px' }}></i> Trust Vetted Campaign
            </span>
          )}
        </div>
        <h1 className="detail-title">{project.title}</h1>
        <p className="detail-subtitle">{project.subtitle}</p>
        <div className="detail-creator-row">
          <div className="creator-avatar">
            {project.creator.avatar}
          </div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            Campaign organized by <span className="creator-name" style={{ fontWeight: 700 }}>{project.creator.name}</span>
          </span>
        </div>
      </div>

      <div className="detail-view">
        {/* Main Left Details */}
        <div className="detail-left">
          <div className="detail-media-box">
            <img src={project.image} alt={project.title} />
          </div>

          <div>
            <div className="detail-tabs-bar">
              <button
                className={`detail-tab-btn ${activeTab === 'story' ? 'active' : ''}`}
                onClick={() => setActiveTab("story")}
              >
                Campaign Story
              </button>
              <button
                className={`detail-tab-btn ${activeTab === 'updates' ? 'active' : ''}`}
                onClick={() => setActiveTab("updates")}
              >
                Updates ({project.updates.length})
              </button>
              <button
                className={`detail-tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                onClick={() => setActiveTab("comments")}
              >
                Comments ({project.comments.length})
              </button>
            </div>

            {/* Tab Panes */}
            {activeTab === "story" && (
              <div className="story-cards-container animate-fade-in">
                {/* Card 1: About This Project (Full Width) */}
                <div className="story-card-premium brand">
                  <div className="story-card-header">
                    <div className="story-card-icon-wrapper icon-wrapper-brand">
                      <i className="fa-regular fa-compass"></i>
                    </div>
                    <h3 className="story-card-title">About This Project</h3>
                  </div>
                  <div className="story-card-desc">
                    <p style={{ fontWeight: 500, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                      {project.description}
                    </p>
                    <p>
                      Crowdfunding allows creative hardware builders and software teams to directly interface with their initial users. By backing our team, you help support tooling setup, mechanical designs, component procurement, and beta testing. Our team is committed to high-frequency weekly updates to give you full visibility into our design pipeline.
                    </p>
                  </div>
                </div>

                {/* Card 2: Interactive Roadmap & Milestones Track */}
                <ProjectRoadmap project={project} />

                {/* Card 2b: Visual Stretch Goals & Unlock Milestones */}
                <StretchGoalsMilestones project={project} currency={currency} />

                {/* 2-Column Grid */}
                <div className="story-grid-2col">
                  {/* Card 3: Specs */}
                  <div className="story-card-premium success">
                    <div className="story-card-header">
                      <div className="story-card-icon-wrapper icon-wrapper-success">
                        <i className="fa-solid fa-microchip"></i>
                      </div>
                      <h3 className="story-card-title">{catDetails.specsTitle}</h3>
                    </div>
                    <div className="story-card-desc">
                      <p>{catDetails.specsBody}</p>
                    </div>
                  </div>

                  {/* Card 4: Materials & Craftsmanship */}
                  <div className="story-card-premium purple">
                    <div className="story-card-header">
                      <div className="story-card-icon-wrapper icon-wrapper-purple">
                        <i className="fa-solid fa-palette"></i>
                      </div>
                      <h3 className="story-card-title">{catDetails.materialsTitle}</h3>
                    </div>
                    <div className="story-card-desc">
                      <p>{catDetails.materialsBody}</p>
                    </div>
                  </div>

                  {/* Card 5: Timeline & Weekly Updates */}
                  <div className="story-card-premium info">
                    <div className="story-card-header">
                      <div className="story-card-icon-wrapper icon-wrapper-info">
                        <i className="fa-regular fa-calendar-check"></i>
                      </div>
                      <h3 className="story-card-title">Updates & Timeline</h3>
                    </div>
                    <div className="story-card-desc">
                      <p>We believe in building in public. We commit to weekly progress reports, production photos, and shipping checks to ensure you remain fully aligned with our deployment pipeline.</p>
                    </div>
                  </div>

                  {/* Card 6: Safe Escrow / Guarantee */}
                  <div className="story-card-premium brand">
                    <div className="story-card-header">
                      <div className="story-card-icon-wrapper icon-wrapper-brand">
                        <i className="fa-solid fa-shield-halved"></i>
                      </div>
                      <h3 className="story-card-title">Backer Escrow Guarantee</h3>
                    </div>
                    <div className="story-card-desc">
                      <p>With our All-or-Nothing guarantee, your funds are only processed when the project reaches its funding target. All campaigns undergo strict KYC verification prior to listing.</p>
                    </div>
                  </div>
                </div>

                {/* Card 7: Risks & Challenges */}
                <div className="story-card-premium warning warning-theme">
                  <div className="story-card-header">
                    <div className="story-card-icon-wrapper icon-wrapper-warning">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h3 className="story-card-title" style={{ color: '#d97706' }}>Risks & Challenges</h3>
                  </div>
                  <div className="story-card-desc">
                    <p>
                      Global supply chains, shipping corridors, and raw material procurement are subject to fluctuating lead times. We have already pre-purchased key processing units and structural frames to buffer against delayed launches, but production shifts are always a minor possibility.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "updates" && (
              <div className="tab-pane-content">
                {project.updates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    No updates have been posted by the creator yet.
                  </div>
                ) : (
                  project.updates.map(up => (
                    <div key={up.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <h4 style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800 }}>{up.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{up.date}</span>
                      </div>
                      <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{up.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="tab-pane-content">
                <form onSubmit={handleSubmitComment} className="comment-input-form">
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Join the discussion</span>
                  <textarea
                    placeholder={user ? "Ask a question or share feedback..." : "Please sign in to write a comment."}
                    className="comment-textarea"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    disabled={!user}
                  />
                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end' }} disabled={!user}>
                    Post Comment
                  </button>
                </form>

                <div className="comments-section">
                  {project.comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      No comments yet. Start the conversation!
                    </div>
                  ) : (
                    project.comments.map(c => (
                      <div key={c.id} className="comment-card">
                        <div className="comment-meta">
                          <div className="comment-user-info">
                            <div className="comment-avatar">
                              {c.username[0].toUpperCase()}
                            </div>
                            <span className="comment-username">{c.username}</span>
                          </div>
                          <span>{c.timestamp}</span>
                        </div>
                        <div className="comment-body">
                          {c.body}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Right Details */}
        <div className="detail-right">
          {/* Funding Stats */}
          <div className="stats-card-side">
            <div className="side-stat-block">
              <span className="side-stat-big">{formatCurrency(project.raisedAmount, currency)}</span>
              <span className="side-stat-lbl">pledged of {formatCurrency(project.goalAmount, currency)} goal</span>
            </div>

            <div className="progress-container" style={{ marginBottom: '0.5rem' }}>
              <div className="progress-fill" style={{ width: `${Math.min(100, percentFunded)}%` }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', borderTop: '1px solid var(--border-standard)', borderBottom: '1px solid var(--border-standard)', padding: '1rem 0' }}>
              <div className="side-stat-block">
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{project.backerCount.toLocaleString()}</span>
                <span className="side-stat-lbl" style={{ fontSize: '0.7rem' }}>Backers</span>
              </div>
              <div className="side-stat-block">
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{project.daysLeft}</span>
                <span className="side-stat-lbl" style={{ fontSize: '0.7rem' }}>Days Left</span>
              </div>
            </div>

            <button className="btn-primary" style={{ padding: '0.8rem 1rem', width: '100%', fontSize: '0.95rem' }} onClick={() => onPledge(project.rewards[0])}>
              Back this project
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '12px', padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <div style={{ display: 'flex', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                <i className="fa-solid fa-circle-check text-green" style={{ marginTop: '0.1rem' }}></i> All-or-Nothing Guarantee
              </div>
              <div>If this campaign does not reach its funding goal by its deadline, no backers will be charged and all transactions are voided.</div>
            </div>

            {isCreator && (
              <button
                className="btn-danger"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s'
                }}
                onClick={() => onDeleteProject(project.id)}
              >
                <i className="fa-solid fa-trash-can"></i> Discontinue Campaign
              </button>
            )}

            {/* Interactive Goal Impact Calculator */}
            <GoalCompletionCalculator project={project} currency={currency} onPledge={onPledge} />
          </div>

          {/* Organizer Profile Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '20px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="rewards-title" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Organizer Profile</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
              <div className="creator-avatar" style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}>
                {project.creator.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{project.creator.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Vorynx Creator since 2025</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              We are committed to full design transparency. Our primary manufacturing base is vetted and ready for tooling optimization.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge-tag" style={{ background: 'var(--accent-success-light)', color: 'var(--accent-success)', border: 'none', fontWeight: 700 }}>
                <i className="fa-solid fa-shield-check"></i> Identity Verified
              </span>
              <span className="badge-tag" style={{ background: 'rgba(79, 70, 229, 0.08)', color: 'var(--accent-brand)', border: 'none', fontWeight: 700 }}>
                <i className="fa-solid fa-circle-check"></i> Bank Verified
              </span>
            </div>
          </div>

          {/* Reward Options */}
          <div>
            <h3 className="rewards-title">Support Reward Tiers</h3>
            <div className="rewards-stack">
              {project.rewards.map(rew => (
                <div key={rew.id} className="reward-tier" onClick={() => onPledge(rew)}>
                  <div className="tier-pledge-amount">Pledge {formatCurrency(rew.pledgeAmount, currency)}+</div>
                  <h4 className="tier-title">{rew.title}</h4>
                  <p className="tier-description">{rew.desc}</p>
                  <div className="tier-meta">
                    {rew.limit ? (
                      <span className="tier-limit-badge">
                        Limited ({(rew.limit - rew.claimed)} left of {rew.limit})
                      </span>
                    ) : (
                      <span>Unlimited Reward</span>
                    )}
                    <span>{rew.claimed} claimed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROJECT ROADMAP & MILESTONES COMPONENT
// ============================================================================
function ProjectRoadmap({ project }) {
  const percent = Math.round((project.raisedAmount / project.goalAmount) * 100);
  const isFunded = percent >= 100;
  
  const milestones = [
    {
      phase: "Phase 1",
      title: "Concept & Prototype Verification",
      desc: "Hardware schematics, component bench testing, and team identity verification completed.",
      status: "completed",
      icon: "fa-solid fa-check"
    },
    {
      phase: "Phase 2",
      title: "Community Crowdfunding",
      desc: `Target: $${project.goalAmount.toLocaleString()} — Currently at ${percent}% backed by ${project.backerCount} supporters.`,
      status: isFunded ? "completed" : "in-progress",
      icon: isFunded ? "fa-solid fa-check" : "fa-solid fa-bolt"
    },
    {
      phase: "Phase 3",
      title: "Tooling & Manufacturing",
      desc: "Mass manufacturing line setup, CNC milling, injection mold fabrication, and batch packaging.",
      status: "upcoming",
      icon: "fa-solid fa-gears"
    },
    {
      phase: "Phase 4",
      title: "Quality Assurance & Global Delivery",
      desc: "Final QC inspection, tracking ID assignment, and worldwide backer shipment.",
      status: "upcoming",
      icon: "fa-solid fa-truck-fast"
    }
  ];

  return (
    <div className="story-card-premium brand roadmap-container">
      <div className="story-card-header">
        <div className="story-card-icon-wrapper icon-wrapper-brand">
          <i className="fa-solid fa-route"></i>
        </div>
        <div>
          <h3 className="story-card-title">Campaign Roadmap & Milestones</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Step-by-step progress from prototyping to backer fulfillment</p>
        </div>
      </div>

      <div className="roadmap-milestones-track">
        {milestones.map((m, idx) => (
          <div key={idx} className={`roadmap-step-item ${m.status}`}>
            <div className="roadmap-step-left">
              <div className="roadmap-node-circle">
                <i className={m.icon}></i>
              </div>
              {idx < milestones.length - 1 && <div className="roadmap-connector-line"></div>}
            </div>
            <div className="roadmap-step-content">
              <div className="roadmap-step-header">
                <span className="roadmap-step-phase">{m.phase}</span>
                <span className={`roadmap-status-pill ${m.status}`}>
                  {m.status === 'completed' ? 'Completed' : m.status === 'in-progress' ? 'In Progress' : 'Upcoming'}
                </span>
              </div>
              <h4 className="roadmap-step-title">{m.title}</h4>
              <p className="roadmap-step-desc">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// STRETCH GOALS & UNLOCKABLE MILESTONES COMPONENT
// ============================================================================
function StretchGoalsMilestones({ project, currency }) {
  const goal = project.goalAmount || 10000;
  const raised = project.raisedAmount || 0;

  const tiers = [
    {
      multiplier: 1.0,
      title: "Base Funding Goal",
      desc: "Initial tooling, batch production runs, and core inventory manufacturing unlocked.",
      icon: "fa-solid fa-flag-checkered"
    },
    {
      multiplier: 1.25,
      title: "Stretch Goal 1: Extended Care & Accessories",
      desc: "All backers receive a complimentary braided cable upgrade and 2-year extended warranty.",
      icon: "fa-solid fa-gift"
    },
    {
      multiplier: 1.50,
      title: "Stretch Goal 2: Custom Hardshell Travel Case",
      desc: "Unlocks custom shockproof hardshell travel case included in all reward tier shipments.",
      icon: "fa-solid fa-box-open"
    },
    {
      multiplier: 2.00,
      title: "Stretch Goal 3: Laser-Engraved Founder Edition",
      desc: "Custom laser-engraved serial numbering and founder signature plaque on housing.",
      icon: "fa-solid fa-award"
    }
  ];

  return (
    <div className="stretch-goals-container reveal-on-scroll">
      <div className="story-card-header" style={{ marginBottom: '1rem' }}>
        <div className="story-card-icon-wrapper icon-wrapper-purple">
          <i className="fa-solid fa-trophy"></i>
        </div>
        <div>
          <h3 className="story-card-title">Stretch Goal Unlock Milestones</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            Community funding progress unlocks bonus features & accessories for all backers!
          </p>
        </div>
      </div>

      <div className="stretch-tiers-list">
        {tiers.map((t, idx) => {
          const targetAmount = Math.round(goal * t.multiplier);
          const isUnlocked = raised >= targetAmount;
          const prevTarget = idx === 0 ? 0 : Math.round(goal * tiers[idx - 1].multiplier);
          const isInProgress = !isUnlocked && raised >= prevTarget;
          const remainingNeeded = targetAmount - raised;

          return (
            <div 
              key={idx} 
              className={`stretch-tier-item ${isUnlocked ? 'unlocked' : isInProgress ? 'in-progress' : ''}`}
            >
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: isUnlocked ? 'rgba(16, 185, 129, 0.15)' : isInProgress ? 'rgba(79, 70, 229, 0.15)' : 'var(--bg-surface)',
                  color: isUnlocked ? 'var(--accent-success)' : isInProgress ? 'var(--accent-brand)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  border: '1px solid var(--border-standard)'
                }}>
                  <i className={t.icon}></i>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{t.title}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>({Math.round(t.multiplier * 100)}%)</span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{t.desc}</p>
                </div>
              </div>

              <div style={{ textAlign: 'right', minWidth: '140px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {formatCurrency(targetAmount, currency)}
                </div>
                {isUnlocked ? (
                  <span className="stretch-tier-badge unlocked">
                    <i className="fa-solid fa-circle-check"></i> Unlocked
                  </span>
                ) : isInProgress ? (
                  <span className="stretch-tier-badge in-progress">
                    <i className="fa-solid fa-spinner fa-spin"></i> {formatCurrency(remainingNeeded, currency)} left
                  </span>
                ) : (
                  <span className="stretch-tier-badge locked">
                    <i className="fa-solid fa-lock"></i> Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// INTERACTIVE GOAL COMPLETION CALCULATOR COMPONENT
// ============================================================================
function GoalCompletionCalculator({ project, currency, onPledge }) {
  const [pledgeValueUSD, setPledgeValueUSD] = useState(25);

  const currentRaised = project.raisedAmount || 0;
  const goal = project.goalAmount || 10000;

  const newRaised = currentRaised + pledgeValueUSD;
  const currentPercent = Math.round((currentRaised / goal) * 100);
  const newPercent = ((newRaised / goal) * 100).toFixed(1);
  const boostPercent = ((pledgeValueUSD / goal) * 100).toFixed(1);

  const presetAmounts = [10, 25, 50, 100, 250];

  return (
    <div className="calc-widget-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
        <i className="fa-solid fa-calculator text-green" style={{ fontSize: '1.1rem' }}></i>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
          Pledge Impact Calculator
        </h4>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
        See how your support advances this campaign's funding milestones in real time.
      </p>

      {/* Preset Amount Chips */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {presetAmounts.map((amt) => (
          <button
            key={amt}
            type="button"
            className={`calc-preset-btn ${pledgeValueUSD === amt ? 'active' : ''}`}
            onClick={() => setPledgeValueUSD(amt)}
          >
            +{formatCurrency(amt, currency)}
          </button>
        ))}
      </div>

      {/* Range Slider */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
          <span>Pledge Amount</span>
          <span style={{ color: 'var(--accent-brand)', fontWeight: 800 }}>{formatCurrency(pledgeValueUSD, currency)}</span>
        </div>
        <input
          type="range"
          min="5"
          max="500"
          step="5"
          value={pledgeValueUSD}
          onChange={(e) => setPledgeValueUSD(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent-brand)', cursor: 'pointer' }}
        />
      </div>

      {/* Dynamic Results Box */}
      <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Projected Funding %</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-success)' }}>
            {currentPercent}% → {newPercent}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Campaign Goal Boost</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-brand)' }}>
            +{boostPercent}%
          </span>
        </div>
      </div>

      <button
        type="button"
        className="btn-primary"
        style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
        onClick={() => onPledge({ pledgeAmount: pledgeValueUSD, title: "Calculated Backer Pledge", desc: "Custom pledge boost calculated via Impact Calculator." })}
      >
        Pledge {formatCurrency(pledgeValueUSD, currency)} Now
      </button>
    </div>
  );
}


// ============================================================================
// SHARE MODAL COMPONENT
// ============================================================================
function ShareModal({ project, onClose, showToast }) {
  const qrCanvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?campaign=${project.id}` 
    : `https://vorynx.com/campaign/${project.id}`;

  useEffect(() => {
    if (qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
        width: 150,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }, (err) => {
        if (err) console.error("QR Code Error:", err);
      });
    }
  }, [shareUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        showToast("Campaign link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        showToast("Unable to copy link.");
      });
    } else {
      showToast("Link: " + shareUrl);
    }
  };

  const shareText = `Check out "${project.title}" on Vorynx! Zero-Barrier Crowdfunding for innovators:`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <div className="share-modal-header">
          <div className="share-modal-icon-badge">
            <i className="fa-solid fa-share-nodes"></i>
          </div>
          <h2 className="share-modal-title">Share Campaign</h2>
          <p className="share-modal-subtitle">Spread the word about <strong>{project.title}</strong> and help reach the funding goal!</p>
        </div>

        <div className="share-modal-body">
          {/* Quick Copy Link Box */}
          <div className="share-link-box">
            <input type="text" readOnly value={shareUrl} className="share-link-input" />
            <button className="btn-primary share-copy-btn" onClick={handleCopyLink}>
              <i className={copied ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {/* Social Share Grid */}
          <div className="social-share-grid">
            <a 
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-share-btn whatsapp"
            >
              <i className="fa-brands fa-whatsapp"></i> WhatsApp
            </a>
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-share-btn twitter"
            >
              <i className="fa-brands fa-x-twitter"></i> X / Twitter
            </a>
            <a 
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-share-btn linkedin"
            >
              <i className="fa-brands fa-linkedin"></i> LinkedIn
            </a>
            <a 
              href={`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(project.title)}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="social-share-btn reddit"
            >
              <i className="fa-brands fa-reddit-alien"></i> Reddit
            </a>
          </div>

          {/* Mobile Scan QR Box */}
          <div className="share-qr-section">
            <span className="share-qr-title"><i className="fa-solid fa-qrcode"></i> Scan on Mobile to Open Campaign</span>
            <div className="share-qr-wrapper">
              <canvas ref={qrCanvasRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BRAND-AUTHENTIC UPI PAYMENT CARD COMPONENT
// ============================================================================
function UpiPaymentCard({ merchantName, upiId, canvasRef }) {
  const isBankRouting = upiId && upiId.includes('.ifsc.npci');
  let displayAddress = upiId || "merchant@upi";
  
  if (isBankRouting) {
    const parts = upiId.split('@');
    if (parts.length === 2) {
      const accountNo = parts[0];
      const ifsc = parts[1].replace('.ifsc.npci', '');
      displayAddress = `A/C: ${accountNo} | IFSC: ${ifsc}`;
    }
  }

  return (
    <div className="upi-payment-card">
      <h4 className="upi-card-merchant">{merchantName || "Merchant Name"}</h4>

      <div className="upi-card-qr-box">
        <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
      </div>

      <div className="upi-card-vpa" style={{ fontSize: isBankRouting ? '0.725rem' : '0.9rem' }}>{displayAddress}</div>

      <div className="upi-card-instruction">Scan & pay using any UPI app</div>

      <div className="upi-card-divider"></div>

      <div className="upi-card-logos-container">
        {/* Row 1: BHIM & UPI with subtext */}
        <div className="upi-card-logos-row-1" style={{ gap: '2rem' }}>
          {/* BHIM SVG logo */}
          <div className="upi-card-logo-item" title="BHIM">
            <svg width="60" height="22" viewBox="0 0 60 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="2" y="13" fill="#334155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-style="italic" font-size="12" letter-spacing="-0.3">BHIM</text>
              <path d="M34,3 L38.5,9 L34,15 L36.5,15 L41,9 L36.5,3 Z" fill="#5c6f84" />
              <path d="M39,3 L43.5,9 L39,15 L41.5,15 L46,9 L41.5,3 Z" fill="#e05b26" />
              <text x="2" y="20" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="3.2" font-weight="700" letter-spacing="0.1">BHARAT INTERFACE FOR MONEY</text>
            </svg>
          </div>
          {/* UPI SVG logo */}
          <div className="upi-card-logo-item" title="UPI">
            <svg width="55" height="22" viewBox="0 0 55 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="2" y="13" fill="#334155" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-style="italic" font-size="12.5" letter-spacing="-0.3">UPI</text>
              <path d="M26,3 L30.5,9 L26,15 L28.5,15 L33,9 L28.5,3 Z" fill="#097939" />
              <path d="M31,3 L35.5,9 L31,15 L33.5,15 L38,9 L33.5,3 Z" fill="#e05b26" />
              <text x="2" y="20" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="3.2" font-weight="700" letter-spacing="0.1">UNIFIED PAYMENTS INTERFACE</text>
            </svg>
          </div>
        </div>

        {/* Row 2: GPay, PhonePe, Paytm, Amazon Pay */}
        <div className="upi-card-logos-row-2">
          {/* GPay */}
          <div className="upi-card-logo-item" title="Google Pay">
            <svg width="45" height="15" viewBox="0 0 45 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 7.5c0-.4-.04-.8-.11-1.2H7v2.3h2.8c-.12.64-.48 1.18-.98 1.53v1.28h1.58c.92-.85 1.46-2.11 1.46-3.61z" fill="#4285F4" />
              <path d="M7 12.5c1.49 0 2.74-.49 3.66-1.33l-1.58-1.28c-.44.29-1 .47-2.08.47-1.6 0-2.96-1.08-3.44-2.53H2.03v1.32C2.95 11.09 4.8 12.5 7 12.5z" fill="#34A853" />
              <path d="M3.56 7.86c-.12-.37-.19-.76-.19-1.17s.07-.8.19-1.17V4.2H2.03C1.37 5.16 1 6.29 1 7.5s.37 2.34 1.03 3.3l1.53-1.3v-1.64z" fill="#FBBC05" />
              <path d="M7 2.5c1.21 0 2.3.42 3.15 1.22l1.77-1.77C10.74 1.1 9.01.5 7 .5 4.8.5 2.95 1.91 2.03 4.2l1.53 1.3c.48-1.45 1.84-2.5 3.44-2.5z" fill="#EA4335" />
              <text x="14" y="10.5" fill="#5f6368" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="600" font-size="11.5" letter-spacing="-0.3">Pay</text>
            </svg>
          </div>

          {/* PhonePe */}
          <div className="upi-card-logo-item" title="PhonePe">
            <svg width="65" height="15" viewBox="0 0 65 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7.5" cy="7.5" r="6.5" fill="#5f259f" />
              <text x="7.5" y="10.5" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="8.5" text-anchor="middle">पे</text>
              <text x="16.5" y="11" fill="#5f259f" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11.5" letter-spacing="-0.3">PhonePe</text>
            </svg>
          </div>

          {/* Paytm */}
          <div className="upi-card-logo-item" title="Paytm">
            <svg width="45" height="15" viewBox="0 0 45 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="2" y="11.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="13" letter-spacing="-0.6">
                <tspan fill="#002e6e">pay</tspan>
                <tspan fill="#00baf2">tm</tspan>
              </text>
            </svg>
          </div>

          {/* Amazon Pay */}
          <div className="upi-card-logo-item" title="Amazon Pay">
            <svg width="65" height="15" viewBox="0 0 65 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="2" y="11" fill="#000000" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="9.5" letter-spacing="-0.3">amazon</text>
              <path d="M4 12c4 1.8 14 1.8 18 .2" stroke="#ff9900" stroke-width="0.8" fill="none" stroke-linecap="round" />
              <g transform="translate(36, 1.5) rotate(5)">
                <rect x="0" y="0" width="23" height="11" rx="2" fill="#ff9900" stroke="#ffffff" stroke-width="0.5" />
                <text x="11.5" y="8.5" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="7.5" text-anchor="middle" letter-spacing="-0.2">pay</text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CHECKOUT MODAL SIMULATOR
// ============================================================================
function CheckoutModal({ project, reward, onClose, onSubmit, currency = 'USD' }) {
  const [pledgeAmt, setPledgeAmt] = useState(reward.pledgeAmount);
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' | 'upi'

  // Card States
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");
  const [cardholder, setCardholder] = useState("Sandbox Tester");

  // UPI States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("");
  const [upiPaid, setUpiPaid] = useState(false);
  const [utrId, setUtrId] = useState("");

  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (paymentMethod === 'upi' && !upiPaid && qrCanvasRef.current && project.upi_id) {
      const pledgeAmtInInr = Math.round(pledgeAmt * 85);
      const upiUri = `upi://pay?pa=${project.upi_id}&pn=${encodeURIComponent(project.title)}&am=${pledgeAmtInInr}&cu=INR`;
      QRCode.toCanvas(qrCanvasRef.current, upiUri, {
        width: 180,
        color: {
          dark: "#000000",
          light: "#ffffff"
        },
        margin: 1
      }, (err) => {
        if (err) console.error("Checkout QR error:", err);
      });
    }
  }, [paymentMethod, upiPaid, pledgeAmt, project.upi_id, project.title]);

  const handlePledgeSubmit = (e) => {
    e.preventDefault();
    if (pledgeAmt < reward.pledgeAmount) {
      alert(`Minimum pledge amount for this reward is ${formatCurrency(reward.pledgeAmount, currency)}`);
      return;
    }

    if (paymentMethod === "card") {
      setIsSimulating(true);
      setSimulationStatus("Processing credit card transaction...");
      setTimeout(() => {
        onSubmit(Number(pledgeAmt), "card", `card_${Date.now()}`);
        setIsSimulating(false);
      }, 2000);
    } else {
      if (!upiPaid) {
        alert("Please complete the simulated UPI payment first.");
        return;
      }
      if (!utrId || utrId.length < 6) {
        alert("Please enter a valid Transaction UTR ID.");
        return;
      }
      onSubmit(Number(pledgeAmt), "upi", utrId);
    }
  };

  const handleSimulateUpiAppPayment = () => {
    setIsSimulating(true);
    setSimulationStatus("Opening GPay/PhonePe intent connection...");
    setTimeout(() => {
      setSimulationStatus(`Requesting authorization for $${pledgeAmt} (₹${Math.round(pledgeAmt * 85)}) to ${project.upi_id}...`);
      setTimeout(() => {
        setSimulationStatus("UPI Payment Completed! Generating Bank UTR ID...");
        setTimeout(() => {
          const generatedUtr = `1034${Math.floor(10000000 + Math.random() * 90000000)}`;
          setUtrId(generatedUtr);
          setUpiPaid(true);
          setIsSimulating(false);
        }, 1200);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={isSimulating ? undefined : onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {!isSimulating && <button className="modal-close-btn" onClick={onClose}>&times;</button>}
        <h2 className="modal-title">Confirm Your Pledge</h2>
        <p className="modal-subtitle">Supporting: {project.title}</p>

        {isSimulating ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
            <div className="upi-loader"></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1rem' }}>{simulationStatus}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Please do not close this window or refresh the page.</p>
          </div>
        ) : (
          <form onSubmit={handlePledgeSubmit} className="credit-card-form">
            <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-standard)', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Selected Reward Tier:</span>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem', fontSize: '1rem' }}>{reward.title}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--accent-brand)', marginTop: '0.2rem', fontWeight: 600 }}>Minimum Pledge: {formatCurrency(reward.pledgeAmount, currency)}</div>
            </div>

            <div className="form-field">
              <label className="form-label">Pledge Amount (USD Base Equivalent)</label>
              <input
                type="number"
                className="form-input"
                value={pledgeAmt}
                onChange={(e) => setPledgeAmt(Math.max(1, Number(e.target.value)))}
                min={reward.pledgeAmount}
                required
              />
              
              {/* Quick Boost Preset Chips */}
              <div className="pledge-preset-chips">
                <span className="pledge-preset-label">Quick boost:</span>
                {[5, 10, 25, 50, 100].map(add => (
                  <button
                    key={add}
                    type="button"
                    className="pledge-preset-chip"
                    onClick={() => setPledgeAmt(prev => prev + add)}
                    title={`Add ${formatCurrency(add, currency)} to pledge`}
                  >
                    +{formatCurrency(add, currency)}
                  </button>
                ))}
                {pledgeAmt > reward.pledgeAmount && (
                  <button
                    type="button"
                    className="pledge-reset-chip"
                    onClick={() => setPledgeAmt(reward.pledgeAmount)}
                    title="Reset to minimum tier amount"
                  >
                    Reset
                  </button>
                )}
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                Estimated total: <strong>{formatCurrency(pledgeAmt, currency)}</strong>
              </span>
            </div>

            {/* Payment Method Tabs */}
            <div className="payment-tabs-container">
              <button
                type="button"
                className={`payment-method-tab ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => { setPaymentMethod('card'); setUpiPaid(false); }}
              >
                <i className="fa-regular fa-credit-card"></i> Credit Card
              </button>
              <button
                type="button"
                className={`payment-method-tab ${paymentMethod === 'upi' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <i className="fa-solid fa-mobile-screen-button"></i> UPI / QR Code
              </button>
            </div>

            {paymentMethod === 'card' ? (
              <>
                <div className="form-field">
                  <label className="form-label">Cardholder Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cardholder}
                    onChange={(e) => setCardholder(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-field">
                    <label className="form-label">Expiration Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="form-input"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="form-input"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {!upiPaid ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <UpiPaymentCard
                      merchantName={project.title}
                      upiId={project.upi_id}
                      canvasRef={qrCanvasRef}
                    />

                    <button
                      type="button"
                      className="btn-primary"
                      style={{ background: 'var(--accent-success)', borderColor: 'var(--accent-success)', padding: '0.8rem', width: '100%', fontSize: '0.9rem' }}
                      onClick={handleSimulateUpiAppPayment}
                    >
                      <i className="fa-solid fa-mobile-screen-button"></i> Simulate Payment via GPay/PhonePe
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border-standard)', padding: '1.25rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)', fontWeight: 700, fontSize: '0.95rem' }}>
                      <i className="fa-solid fa-circle-check"></i> Simulated Payment Successful
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      The simulated transfer of ${pledgeAmt} (₹${Math.round(pledgeAmt * 83)}) to creator UPI ID ({project.upi_id}) has completed.
                    </p>

                    <div className="form-field" style={{ marginTop: '0.5rem' }}>
                      <label className="form-label" style={{ fontWeight: 700 }}>Bank UTR / Transaction ID</label>
                      <input
                        type="text"
                        className="form-input"
                        value={utrId}
                        onChange={(e) => setUtrId(e.target.value)}
                        placeholder="Enter 12-digit UTR ID"
                        required
                        style={{ fontFamily: 'monospace' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Confirm or input the 12-digit UTR reference ID from your UPI app receipt to log escrow pending verification.
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-success-light)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)', margin: '0.5rem 0' }}>
              <i className="fa-solid fa-lock text-green" style={{ fontSize: '0.9rem' }}></i>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Secure Escrow. Funds only distributed when campaign goal is fully verified.
              </span>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.8rem', width: '100%', fontSize: '0.95rem' }}
              disabled={paymentMethod === 'upi' && !upiPaid}
            >
              {paymentMethod === 'card' ? `Authorize Card Pledge of $${pledgeAmt}` : `Submit UTR & Register Pledge`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CREATE PROJECT WIZARD COMPONENT
// ============================================================================
function CreateProjectWizard({ onBack, onSubmit, user }) {
  const [step, setStep] = useState(1);

  // Wizard Input States
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("Tech");
  const [imageOpt, setImageOpt] = useState("tech"); // tech | design | games | publishing (presetted unsplash options)
  const [goal, setGoal] = useState(10000);
  const [duration, setDuration] = useState(30);

  // UPI configuration states
  const [payeeType, setPayeeType] = useState("bank"); // default to bank account
  const [upiVpa, setUpiVpa] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [payeeName, setPayeeName] = useState("");

  // Customization (Internal defaults)
  const qrSize = "180";
  const fgColor = "#000000";
  const bgColor = "#ffffff";

  // Reward Creation State
  const [rewardTitle, setRewardTitle] = useState("Standard Backer Pack");
  const [rewardCost, setRewardCost] = useState(25);
  const [rewardDesc, setRewardDesc] = useState("Includes our core designed product and all digital campaign updates.");

  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (step === 2 && qrCanvasRef.current) {
      const payeeAddress = payeeType === "vpa"
        ? (upiVpa && upiVpa.includes("@") ? upiVpa.trim() : "")
        : (bankAccount && bankIfsc ? `${bankAccount.trim()}@${bankIfsc.trim().toUpperCase()}.ifsc.npci` : "");

      if (!payeeAddress) {
        // Clear canvas
        const ctx = qrCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, qrCanvasRef.current.width, qrCanvasRef.current.height);
        ctx.font = "12px Inter";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "center";
        ctx.fillText("Fill UPI ID or Bank Info", qrCanvasRef.current.width / 2, qrCanvasRef.current.height / 2);
        return;
      }

      const finalPayeeName = payeeName || title || "Campaign Payout";
      const upiUri = `upi://pay?pa=${payeeAddress}&pn=${encodeURIComponent(finalPayeeName)}&cu=INR`;
      QRCode.toCanvas(qrCanvasRef.current, upiUri, {
        width: Number(qrSize),
        color: {
          dark: fgColor,
          light: bgColor
        },
        margin: 1
      }, (err) => {
        if (err) console.error("Wizard QR error:", err);
      });
    }
  }, [step, payeeType, upiVpa, bankAccount, bankIfsc, payeeName, title, qrSize, fgColor, bgColor]);

  const handleDownloadPng = () => {
    if (!qrCanvasRef.current) return;
    const dataUrl = qrCanvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    const finalPayeeName = payeeName || title || "Campaign";
    link.download = `campaign-qr-${finalPayeeName.replace(/\s+/g, '-').toLowerCase() || 'payment'}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadSvg = () => {
    const payeeAddress = payeeType === "vpa"
      ? (upiVpa ? upiVpa.trim() : "")
      : (bankAccount && bankIfsc ? `${bankAccount.trim()}@${bankIfsc.trim().toUpperCase()}.ifsc.npci` : "");

    if (!payeeAddress) return;

    const finalPayeeName = payeeName || title || "Campaign";
    const upiUri = `upi://pay?pa=${payeeAddress}&pn=${encodeURIComponent(finalPayeeName)}&cu=INR`;

    QRCode.toString(upiUri, {
      type: 'svg',
      width: Number(qrSize),
      color: {
        dark: fgColor,
        light: bgColor
      },
      margin: 1
    }, (error, svgString) => {
      if (error) {
        console.error(error);
        return;
      }
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const dataUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `campaign-qr-${finalPayeeName.replace(/\s+/g, '-').toLowerCase() || 'payment'}.svg`;
      link.href = dataUrl;
      link.click();
      URL.revokeObjectURL(dataUrl);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
      if (step === 2) {
        if (payeeType === 'vpa') {
          if (!upiVpa || !upiVpa.includes("@")) {
            alert("Please enter a valid UPI VPA Address (must contain @).");
            return;
          }
        } else {
          if (!bankAccount || !bankIfsc) {
            alert("Please enter both Bank Account Number and IFSC Code.");
            return;
          }
        }
      }
      setStep(step + 1);
      return;
    }

    // Map selected image options
    const images = {
      tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      design: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      games: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
      publishing: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80"
    };

    const resolvedUpiId = payeeType === "vpa"
      ? (upiVpa ? upiVpa.trim() : "")
      : (bankAccount && bankIfsc ? `${bankAccount.trim()}@${bankIfsc.trim().toUpperCase()}.ifsc.npci` : "");

    const newProj = {
      id: `p_${Date.now()}`,
      title,
      subtitle,
      description: `${subtitle} We are opening this Vorynx project to establish initial manufacturing pipelines, complete tooling designs, and scale our core team. We thank you for participating in our launch campaign!`,
      category,
      image: images[imageOpt] || images.tech,
      creator: {
        name: user?.displayName || user?.email?.split('@')[0] || "Anonymous Creator",
        avatar: (user?.displayName || user?.email || "C")[0].toUpperCase(),
        verified: false
      },
      goalAmount: Number(goal),
      raisedAmount: 0,
      backerCount: 0,
      daysLeft: Number(duration),
      trending: false,
      upi_id: resolvedUpiId || "payment@vorynx",
      status: 'pending',
      rewards: [
        { id: `r_${Date.now()}_1`, pledgeAmount: 5, title: "Support Creator", desc: "Digital backer access and platform dashboard verification badge.", limit: null, claimed: 0 },
        { id: `r_${Date.now()}_2`, pledgeAmount: Number(rewardCost), title: rewardTitle, desc: rewardDesc, limit: null, claimed: 0 }
      ],
      comments: [],
      updates: []
    };

    onSubmit(newProj);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto 4rem', background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '24px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}>

      {/* Back link */}
      <span className="back-link" onClick={onBack}>
        <i className="fa-solid fa-arrow-left"></i> Cancel Wizard
      </span>

      <div style={{ margin: '1rem 0 2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Start Your Vorynx Campaign</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Launch your creative project to the community in 3 simple steps.</p>
      </div>

      {/* Progress indicators */}
      <div className="wizard-steps-indicator">
        <div className={`wizard-step-dot ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}`}>1</div>
        <div className={`wizard-step-dot ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}`}>2</div>
        <div className={`wizard-step-dot ${step >= 3 ? (step > 3 ? 'completed' : 'active') : ''}`}>3</div>
      </div>

      <form onSubmit={handleSubmit} className="credit-card-form">

        {/* Step 1: Basics */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Step 1: Campaign Basics</h3>

            <div className="form-field">
              <label className="form-label">Project Title</label>
              <input
                type="text"
                placeholder="e.g. Helix-68 Walnut Keyboard"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Brief Subtitle</label>
              <input
                type="text"
                placeholder="e.g. A custom hot-swap keyboard using CNC mechanical framework."
                className="form-input"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group-row">
              <div className="form-field">
                <label className="form-label">Category</label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Tech">Technology</option>
                  <option value="Design">Design</option>
                  <option value="Games">Games</option>
                  <option value="Publishing">Publishing</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Aesthetic Cover Art</label>
                <select className="form-input" value={imageOpt} onChange={(e) => setImageOpt(e.target.value)}>
                  <option value="tech">Modern Electronics (Tech)</option>
                  <option value="design">Minimalist Architecture (Design)</option>
                  <option value="games">Neon Gaming (Games)</option>
                  <option value="publishing">Cozy Library (Publishing)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goal, Duration & UPI QR Setup */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Step 2: Funding, Duration & UPI Setup</h3>

            <div className="form-group-row">
              <div className="form-field">
                <label className="form-label">Funding Goal ($)</label>
                <input
                  type="number"
                  placeholder="Minimum $1,000"
                  className="form-input"
                  value={goal}
                  onChange={(e) => setGoal(Math.max(1000, Number(e.target.value)))}
                  min="1000"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">Campaign Length (Days)</label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  className="form-input"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(5, Math.min(60, Number(e.target.value))))}
                  min="5"
                  max="60"
                  required
                />
              </div>
            </div>

            {/* Destination Selection */}
            <div style={{ borderTop: '1px solid var(--border-standard)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>UPI Payout Destination</span>
              
              {/* Bank details input fields (displayed first) */}
              <div style={{ background: 'var(--bg-main)', padding: '1.25rem', border: '1px solid var(--border-standard)', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>Option A: Direct Bank Account & IFSC</span>
                <div className="form-group-row">
                  <div className="form-field">
                    <label className="form-label">Bank Account Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 91820491823"
                      value={bankAccount}
                      onChange={(e) => {
                        setBankAccount(e.target.value);
                        if (e.target.value) {
                          setPayeeType('bank');
                          setUpiVpa(''); // clear VPA to avoid conflict
                        }
                      }}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. HDFC0000123"
                      value={bankIfsc}
                      onChange={(e) => {
                        setBankIfsc(e.target.value);
                        if (e.target.value) {
                          setPayeeType('bank');
                          setUpiVpa(''); // clear VPA to avoid conflict
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* OR divider */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0.25rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
                <span>— OR —</span>
              </div>

              {/* UPI ID VPA input field (displayed second) */}
              <div style={{ background: 'var(--bg-main)', padding: '1.25rem', border: '1px solid var(--border-standard)', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>Option B: Payee UPI VPA Address</span>
                <div className="form-field" style={{ margin: 0 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. startup@upi"
                    value={upiVpa}
                    onChange={(e) => {
                      setUpiVpa(e.target.value);
                      if (e.target.value) {
                        setPayeeType('vpa');
                        setBankAccount(''); // clear bank details to avoid conflict
                        setBankIfsc('');
                      }
                    }}
                  />
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>Provide a standard UPI ID address (must contain @).</span>
                </div>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Payee Display Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder={title || "Campaign Payout"}
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
              />
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Name shown to backers when they scan the payment QR code.</span>
            </div>

            {/* Universal QR Code Preview Box with Customization and Downloads */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', padding: '1.25rem', background: 'var(--bg-main)', border: '1px dashed var(--border-standard)', borderRadius: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700, textAlign: 'center', display: 'block' }}>Universal UPI QR Code Card</span>
              
              <UpiPaymentCard
                merchantName={payeeName || title || "Campaign Payout"}
                upiId={payeeType === 'vpa' ? upiVpa : (bankAccount && bankIfsc ? `${bankAccount}@${bankIfsc}.ifsc.npci` : '')}
                canvasRef={qrCanvasRef}
              />



              {/* Download buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                  onClick={handleDownloadPng}
                  disabled={
                    payeeType === 'bank'
                      ? (!bankAccount || !bankIfsc)
                      : (!upiVpa || !upiVpa.includes("@"))
                  }
                >
                  <i className="fa-solid fa-file-image"></i> Download PNG
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                  onClick={handleDownloadSvg}
                  disabled={
                    payeeType === 'bank'
                      ? (!bankAccount || !bankIfsc)
                      : (!upiVpa || !upiVpa.includes("@"))
                  }
                >
                  <i className="fa-solid fa-file-code"></i> Download SVG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Rewards setup */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Step 3: Core Reward Tier</h3>

            <div className="form-field">
              <label className="form-label">Reward Tier Title</label>
              <input
                type="text"
                className="form-input"
                value={rewardTitle}
                onChange={(e) => setRewardTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Pledge Cost ($)</label>
              <input
                type="number"
                className="form-input"
                value={rewardCost}
                onChange={(e) => setRewardCost(Math.max(1, Number(e.target.value)))}
                min="1"
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">Reward Description</label>
              <textarea
                className="form-input"
                style={{ minHeight: '90px', fontFamily: 'inherit', resize: 'vertical' }}
                value={rewardDesc}
                onChange={(e) => setRewardDesc(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="wizard-action-footer">
          {step > 1 ? (
            <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <div></div> // Placeholder to align right btn
          )}

          <button type="submit" className="btn-primary">
            {step === 3 ? "Launch Campaign" : "Next Step"}
          </button>
        </div>

      </form>
    </div>
  );
}

// ============================================================================
// AUTH PANEL COMPONENT (Sliding Login/Register UI)
// ============================================================================
function AuthPanel({ initialError }) {
  const [isActive, setIsActive] = useState(false); // Controls sliding layout animation
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  useEffect(() => {
    if (initialError) {
      setTimeout(() => setError(initialError), 0);
    }
  }, [initialError]);

  // Handler: Email/Password Login
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    if (!signInPassword) {
      setError("Password is required for standard sign in.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Handler: Email Link Sign In (Passwordless)
  const handleSendEmailLink = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    if (!signInEmail) {
      setError("Please enter your email in the email field first.");
      return;
    }
    try {
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, signInEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', signInEmail);
      setInfoMessage("Sign-in link sent to your email! Please check your inbox.");
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Handler: Forgot Password (Reset email)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    if (!signInEmail) {
      setError("Please enter your email in the email field first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, signInEmail);
      setInfoMessage("Password reset email sent! Please check your inbox.");
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  // Handler: Email/Password Registration
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      if (signUpName) {
        await updateProfile(userCredential.user, { displayName: signUpName });
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  //  handler: Google oauth 
  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  //  handler; github oauth 
  const handleGithubLogin = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className={`container ${isActive ? 'active' : ''}`} id="container">

      {/* --- SIGN UP FORM --- */}
      <div className="form-container sign-up">
        <form onSubmit={handleSignUp}>
          <div className="auth-logo-header">
            <span className="auth-logo-v">V</span>
            <span className="auth-logo-text">VORYNX</span>
          </div>
          <h1>Create Account</h1>

          <div className="social-buttons-column">
            <button type="button" className="btn-social google" onClick={handleGoogleLogin}>
              <i className="fa-brands fa-google text-orange"></i> Continue with Google
            </button>
            <button type="button" className="btn-social github" onClick={handleGithubLogin}>
              <i className="fa-brands fa-github"></i> Continue with GitHub
            </button>
          </div>

          <div className="auth-divider">
            <span></span>
            <span>or</span>
            <span></span>
          </div>

          {isActive && error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '5px 0', fontWeight: 500 }}>{error}</p>}
          {isActive && infoMessage && <p style={{ color: 'var(--accent-success)', fontSize: '13px', margin: '5px 0', fontWeight: 500 }}>{infoMessage}</p>}

          <label className="auth-input-label">Full Name</label>
          <input type="text" placeholder="e.g. John Doe" value={signUpName} onChange={(e) => setSignUpName(e.target.value)} />

          <label className="auth-input-label">Email Address</label>
          <input type="email" placeholder="e.g. you@example.com" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} required />

          <label className="auth-input-label">Password</label>
          <input type="password" placeholder="Min. 6 characters" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} required />

          <button type="submit">Sign Up</button>
          <div className="mobile-toggle-helper">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsActive(false); setError(""); setInfoMessage(""); }}>Sign In</a>
          </div>
        </form>
      </div>

      {/* --- SIGN IN FORM --- */}
      <div className="form-container sign-in">
        <form onSubmit={handleSignIn}>
          <div className="auth-logo-header">
            <span className="auth-logo-v">V</span>
            <span className="auth-logo-text">VORYNX</span>
          </div>
          <h1>Sign In</h1>

          <div className="social-buttons-column">
            <button type="button" className="btn-social google" onClick={handleGoogleLogin}>
              <i className="fa-brands fa-google text-orange"></i> Continue with Google
            </button>
            <button type="button" className="btn-social github" onClick={handleGithubLogin}>
              <i className="fa-brands fa-github"></i> Continue with GitHub
            </button>
          </div>

          <div className="auth-divider">
            <span></span>
            <span>or</span>
            <span></span>
          </div>

          {!isActive && error && <p style={{ color: '#ef4444', fontSize: '13px', margin: '5px 0', fontWeight: 500 }}>{error}</p>}
          {!isActive && infoMessage && <p style={{ color: 'var(--accent-success)', fontSize: '13px', margin: '5px 0', fontWeight: 500 }}>{infoMessage}</p>}

          <label className="auth-input-label">Email Address</label>
          <input type="email" placeholder="e.g. you@example.com" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />

          <label className="auth-input-label">Password</label>
          <input type="password" placeholder="Enter password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} />

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px', margin: '10px 0 5px' }}>
            <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
            <a href="#" onClick={handleSendEmailLink} style={{ color: 'var(--accent-brand)', fontWeight: '600' }}>Passwordless Link</a>
          </div>

          <button type="submit">Sign In</button>
          <div className="mobile-toggle-helper">
            Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsActive(true); setError(""); setInfoMessage(""); }}>Sign Up</a>
          </div>
        </form>
      </div>

      {/* --- SLIDING TOGGLE PANELS --- */}
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <div className="auth-logo-header" style={{ marginBottom: '1.5rem' }}>
              <span className="auth-logo-v" style={{ color: '#fff', border: '2px solid #fff', borderRadius: '8px', padding: '0.1rem 0.6rem' }}>V</span>
              <span className="auth-logo-text" style={{ color: '#fff' }}>VORYNX</span>
            </div>
            <h1>Welcome Back!</h1>
            <p>Access your campaign workspace and saved payments</p>
            <button className="hidden" id="login" onClick={() => { setIsActive(false); setError(""); setInfoMessage(""); }}>Sign In</button>
          </div>
          <div className="toggle-panel toggle-right">
            <div className="auth-logo-header" style={{ marginBottom: '1.5rem' }}>
              <span className="auth-logo-v" style={{ color: '#fff', border: '2px solid #fff', borderRadius: '8px', padding: '0.1rem 0.6rem' }}>V</span>
              <span className="auth-logo-text" style={{ color: '#fff' }}>VORYNX</span>
            </div>
            <h1>Hello, Friend!</h1>
            <p>Start launching creative campaigns on our zero-barrier platform</p>
            <button className="hidden" id="register" onClick={() => { setIsActive(true); setError(""); setInfoMessage(""); }}>Sign Up</button>
          </div>
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// CREATOR DASHBOARD VIEW
// ============================================================================
function CreatorDashboardView({ projects, donations, user, setView, currency, onSelectProject }) {
  const creatorName = user?.displayName || user?.email?.split('@')[0] || "";
  const myProjects = projects.filter(p => p.creator.name === creatorName);

  return (
    <div className="creator-dashboard-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="dashboard-title-bar">
        <div>
          <h1 className="dashboard-heading">Creator Campaign Console</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitor your campaign status, platform fees, and funding transactions.</p>
        </div>
        <button className="btn-secondary" onClick={() => setView("home")}>
          <i className="fa-solid fa-arrow-left"></i> Back to discovery
        </button>
      </div>

      {myProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '24px', color: 'var(--text-secondary)' }}>
          <i className="fa-solid fa-chart-line" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-light)' }}></i>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Campaigns Found</h3>
          <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>You haven't launched any campaigns yet. Start a campaign to begin crowdfunding!</p>
          <button className="btn-primary" onClick={() => setView("create")}>
            Start a Campaign <i className="fa-solid fa-plus"></i>
          </button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {myProjects.map(project => {
            const projectDonations = donations.filter(d => d.project_id === project.id);

            return (
              <div key={project.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '24px', padding: '2rem', marginBottom: '2rem', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-standard)', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge-tag" style={{ background: 'var(--accent-brand-light)', color: 'var(--accent-brand)', border: 'none', fontWeight: 700 }}>
                        {project.category}
                      </span>
                      <span className={`status-badge ${project.status}`}>
                        {project.status === 'approved' ? 'Live & Active' : 'Pending Admin Approval'}
                      </span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>{project.title}</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {projectDonations.length > 0 && (
                      <button 
                        type="button"
                        className="btn-secondary" 
                        style={{ fontSize: '0.85rem' }} 
                        onClick={() => exportDonationsToCSV(projectDonations, `${project.title.replace(/\s+/g, '_')}_backers`)}
                        title="Download backer list and transaction records as CSV"
                      >
                        <i className="fa-solid fa-file-csv text-green"></i> Export Backers CSV
                      </button>
                    )}
                    <button className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => onSelectProject(project.id)}>
                      View Live Page <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="stats-grid-3col">
                  <div className="metric-card gross">
                    <span className="metric-label">Gross Raised</span>
                    <span className="metric-value">{formatCurrency(project.raisedAmount, currency)}</span>
                    <span className="metric-sub">Pledged by {project.backerCount} backers</span>
                  </div>
                  <div className="metric-card fee">
                    <span className="metric-label">Platform Fee (20%)</span>
                    <span className="metric-value">{formatCurrency(project.raisedAmount * 0.20, currency)}</span>
                    <span className="metric-sub">Dedicated to platform maintenance</span>
                  </div>
                  <div className="metric-card net">
                    <span className="metric-label">Net Proceeds (80%)</span>
                    <span className="metric-value">{formatCurrency(project.raisedAmount * 0.80, currency)}</span>
                    <span className="metric-sub">Payout amount to startup wallet</span>
                  </div>
                </div>

                {/* Donation list */}
                <div className="table-container" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-standard)' }}>
                    <div className="table-header-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                      Transaction & Escrow History
                    </div>
                    {projectDonations.length > 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{projectDonations.length} total entries</span>
                    )}
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    {projectDonations.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No donations have been registered for this campaign yet.
                      </div>
                    ) : (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th className="admin-th">Funder</th>
                            <th className="admin-th">Amount</th>
                            <th className="admin-th">UTR / Transaction ID</th>
                            <th className="admin-th">Date</th>
                            <th className="admin-th">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projectDonations.map(donation => (
                            <tr key={donation.id} className="admin-tr">
                              <td className="admin-td" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{donation.username}</td>
                              <td className="admin-td" style={{ fontWeight: 700, color: 'var(--accent-success)' }}>{formatCurrency(donation.amount, currency)}</td>
                              <td className="admin-td" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{donation.utr_id}</td>
                              <td className="admin-td">{new Date(donation.created_at).toLocaleDateString()}</td>
                              <td className="admin-td">
                                <span className={`status-badge ${donation.status}`}>
                                  {donation.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADMIN PANEL VIEW
// ============================================================================
function AdminPanelView({ projects, donations, setView, refreshData, showToast, currency }) {
  const [activeSubTab, setActiveSubTab] = useState("campaigns"); // 'campaigns' | 'transactions'
  const pendingProjects = projects.filter(p => p.status === 'pending');
  const pendingDonations = donations.filter(d => d.status === 'pending');

  const handleApproveProject = async (id) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      showToast("Campaign approved! It is now live for backing.");
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast("Failed to approve campaign.");
    }
  };

  const handleRejectProject = async (id) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast("Campaign proposal rejected.");
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast("Failed to reject campaign.");
    }
  };

  const handleVerifyDonation = async (donation) => {
    try {
      // Find corresponding project
      const proj = projects.find(p => p.id === donation.project_id);
      if (!proj) {
        throw new Error("Project not found.");
      }

      // Update donation status to successful
      const { error: donErr } = await supabase
        .from('donations')
        .update({ status: 'successful' })
        .eq('id', donation.id);

      if (donErr) throw donErr;

      // Update project funding raised amount and backer count
      const { error: projErr } = await supabase
        .from('projects')
        .update({
          raised_amount: proj.raisedAmount + Number(donation.amount),
          backer_count: proj.backerCount + 1
        })
        .eq('id', proj.id);

      if (projErr) throw projErr;

      showToast(`Donation of ${formatCurrency(donation.amount, currency)} verified! Project raised amount updated.`);
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to verify donation.");
    }
  };

  const handleRejectDonation = async (donationId) => {
    try {
      const { error } = await supabase
        .from('donations')
        .update({ status: 'rejected' })
        .eq('id', donationId);

      if (error) throw error;
      showToast("Transaction rejected (invalid UTR).");
      await refreshData();
    } catch (err) {
      console.error(err);
      showToast("Failed to reject transaction.");
    }
  };

  return (
    <div className="admin-panel-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="dashboard-title-bar">
        <div>
          <h1 className="dashboard-heading">Platform Administration Console</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Approve campaign proposals and verify transaction receipts.</p>
        </div>
        <button className="btn-secondary" onClick={() => setView("home")}>
          <i className="fa-solid fa-arrow-left"></i> Back to discovery
        </button>
      </div>

      {/* Subtabs */}
      <div className="detail-tabs-bar" style={{ marginBottom: '2rem' }}>
        <button
          className={`detail-tab-btn ${activeSubTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveSubTab("campaigns")}
        >
          Pending Proposals ({pendingProjects.length})
        </button>
        <button
          className={`detail-tab-btn ${activeSubTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveSubTab("transactions")}
        >
          UTR Transaction Approvals ({pendingDonations.length})
        </button>
      </div>

      {/* Proposals Queue */}
      {activeSubTab === "campaigns" && (
        <div>
          {pendingProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '24px', color: 'var(--text-secondary)' }}>
              <i className="fa-solid fa-clipboard-check" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-light)' }}></i>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Clear Approval Queue</h3>
              <p style={{ marginTop: '0.5rem' }}>No campaign proposals are currently awaiting approval.</p>
            </div>
          ) : (
            <div className="approval-queue-grid">
              {pendingProjects.map(proj => (
                <div key={proj.id} className="approval-card">
                  <div className="approval-card-info">
                    <span className="badge-tag" style={{ background: 'var(--accent-brand-light)', color: 'var(--accent-brand)', border: 'none', fontWeight: 700, width: 'fit-content' }}>
                      {proj.category}
                    </span>
                    <span className="approval-card-title">{proj.title}</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>{proj.subtitle}</p>
                    <div className="approval-card-meta">
                      <span>Goal: <strong>{formatCurrency(proj.goalAmount, currency)}</strong></span>
                      <span>Creator: <strong>{proj.creator.name}</strong></span>
                      <span>UPI ID: <strong style={{ color: 'var(--accent-brand)' }}>{proj.upi_id}</strong></span>
                    </div>
                  </div>
                  <div className="approval-actions">
                    <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => handleApproveProject(proj.id)}>
                      Approve Proposal
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleRejectProject(proj.id)}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions Queue */}
      {activeSubTab === "transactions" && (
        <div className="table-container" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-standard)', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="table-header-title" style={{ margin: 0, padding: 0, border: 'none' }}>
              Pending UTR Receipts Queue
            </div>
            {pendingDonations.length > 0 && (
              <button 
                type="button"
                className="btn-secondary" 
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                onClick={() => exportDonationsToCSV(pendingDonations, "vorynx_pending_receipts")}
                title="Download pending UTR receipts as CSV"
              >
                <i className="fa-solid fa-file-csv text-green"></i> Export Receipts CSV
              </button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            {pendingDonations.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-receipt" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--text-light)' }}></i>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>No Pending Receipts</h3>
                <p style={{ marginTop: '0.5rem' }}>All transaction UTR entries have been successfully processed.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">Campaign</th>
                    <th className="admin-th">Funder</th>
                    <th className="admin-th">Pledge Amount</th>
                    <th className="admin-th">UTR Transaction ID</th>
                    <th className="admin-th">Submitted Date</th>
                    <th className="admin-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDonations.map(donation => {
                    const campaign = projects.find(p => p.id === donation.project_id);
                    return (
                      <tr key={donation.id} className="admin-tr">
                        <td className="admin-td" style={{ fontWeight: 600 }}>{campaign?.title || donation.project_id}</td>
                        <td className="admin-td">{donation.username}</td>
                        <td className="admin-td" style={{ fontWeight: 700, color: 'var(--accent-success)' }}>{formatCurrency(donation.amount, currency)}</td>
                        <td className="admin-td" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{donation.utr_id}</td>
                        <td className="admin-td">{new Date(donation.created_at).toLocaleDateString()}</td>
                        <td className="admin-td">
                          <div className="btn-actions-row">
                            <button className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleVerifyDonation(donation)}>
                              Verify (UTR Valid)
                            </button>
                            <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleRejectDonation(donation.id)}>
                              Reject (Invalid)
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UNIVERSAL UPI QR CODE GENERATOR
// ============================================================================
function UpiQrGenerator({ setView }) {
  const [payeeType, setPayeeType] = useState("vpa"); // 'vpa' | 'bank'
  
  // Form fields
  const [upiId, setUpiId] = useState("merchant@upi");
  const [accountNo, setAccountNo] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [payeeName, setPayeeName] = useState("Alex Mercer");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("Invoice Settlement");
  
  // Customization (Internal defaults)
  const qrSize = "180";
  const fgColor = "#000000";
  const bgColor = "#ffffff";
  
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    if (payeeType === "bank" && (!accountNo || !ifscCode)) {
      // Clear canvas or show message
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.font = "14px Inter";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText("Fill Account No. & IFSC", canvasRef.current.width / 2, canvasRef.current.height / 2);
      return;
    }

    // NPCI standard UPI URI
    const payeeAddress = payeeType === "vpa"
      ? (upiId ? upiId.trim() : "")
      : `${accountNo.trim()}@${ifscCode.trim().toUpperCase()}.ifsc.npci`;

    const nameParam = payeeName ? `&pn=${encodeURIComponent(payeeName)}` : "";
    const amountParam = amount ? `&am=${encodeURIComponent(amount)}` : "";
    const noteParam = note ? `&tn=${encodeURIComponent(note)}` : "";
    
    // Standard UPI URI
    const upiUri = `upi://pay?pa=${payeeAddress}${nameParam}${amountParam}${noteParam}&cu=INR`;

    QRCode.toCanvas(canvasRef.current, upiUri, {
      width: Number(qrSize),
      color: {
        dark: fgColor,
        light: bgColor
      },
      margin: 2
    }, (error) => {
      if (error) console.error("QR Code generation error:", error);
    });
  }, [payeeType, upiId, accountNo, ifscCode, payeeName, amount, note, qrSize, fgColor, bgColor]);

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `upi-qr-${payeeName.replace(/\s+/g, '-').toLowerCase() || 'payment'}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadSvg = () => {
    const payeeAddress = payeeType === "vpa"
      ? (upiId ? upiId.trim() : "")
      : `${accountNo.trim()}@${ifscCode.trim().toUpperCase()}.ifsc.npci`;

    const nameParam = payeeName ? `&pn=${encodeURIComponent(payeeName)}` : "";
    const amountParam = amount ? `&am=${encodeURIComponent(amount)}` : "";
    const noteParam = note ? `&tn=${encodeURIComponent(note)}` : "";
    const upiUri = `upi://pay?pa=${payeeAddress}${nameParam}${amountParam}${noteParam}&cu=INR`;

    QRCode.toString(upiUri, {
      type: 'svg',
      width: Number(qrSize),
      color: {
        dark: fgColor,
        light: bgColor
      },
      margin: 2
    }, (error, svgString) => {
      if (error) {
        console.error(error);
        return;
      }
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const dataUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `upi-qr-${payeeName.replace(/\s+/g, '-').toLowerCase() || 'payment'}.svg`;
      link.href = dataUrl;
      link.click();
      URL.revokeObjectURL(dataUrl);
    });
  };



  return (
    <div className="qr-generator-wrapper" style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="dashboard-title-bar">
        <div>
          <h1 className="dashboard-heading">Universal UPI QR Generator</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Generate NPCI-compliant payment QR codes directly in your browser. Offline-first, secure, zero upload logs.</p>
        </div>
        <button className="btn-secondary" onClick={() => setView("home")}>
          <i className="fa-solid fa-arrow-left"></i> Back to discovery
        </button>
      </div>

      <div className="qr-generator-container">
        {/* Left Side Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Select Destination Type</span>
          <div className="toggle-group-buttons">
            <button 
              type="button" 
              className={`toggle-btn ${payeeType === 'vpa' ? 'active' : ''}`}
              onClick={() => setPayeeType('vpa')}
            >
              <i className="fa-solid fa-at"></i> UPI ID (VPA)
            </button>
            <button 
              type="button" 
              className={`toggle-btn ${payeeType === 'bank' ? 'active' : ''}`}
              onClick={() => setPayeeType('bank')}
            >
              <i className="fa-solid fa-building-columns"></i> Bank Account & IFSC
            </button>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="credit-card-form" style={{ gap: '1.25rem', display: 'flex', flexDirection: 'column' }}>
            {payeeType === "vpa" ? (
              <div className="form-field">
                <label className="form-label">Payee UPI VPA Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. merchant@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="form-group-row">
                <div className="form-field">
                  <label className="form-label">Bank Account Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 91820491823"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">IFSC Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. HDFC0000123"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-field">
              <label className="form-label">Payee Display Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alex Mercer"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                required
              />
            </div>

            <div className="form-group-row">
              <div className="form-field">
                <label className="form-label">Amount (INR, Optional)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Transaction Remarks (Note, Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Invoice Settlement"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>


          </form>
        </div>

        {/* Right Side Live Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Real-time QR Preview</h3>
          
          <UpiPaymentCard
            merchantName={payeeName || "Merchant Name"}
            upiId={payeeType === 'vpa' ? upiId : (accountNo && ifscCode ? `${accountNo}@${ifscCode}.ifsc.npci` : "")}
            canvasRef={canvasRef}
          />

          <div className="download-btn-group">
            <button 
              className="btn-primary" 
              onClick={handleDownloadPng}
              disabled={
                payeeType === 'bank'
                  ? (!accountNo || !ifscCode)
                  : (!upiId || !upiId.includes("@"))
              }
            >
              <i className="fa-solid fa-file-image"></i> Download PNG
            </button>
            <button 
              className="btn-secondary" 
              onClick={handleDownloadSvg}
              disabled={
                payeeType === 'bank'
                  ? (!accountNo || !ifscCode)
                  : (!upiId || !upiId.includes("@"))
              }
            >
              <i className="fa-solid fa-file-code"></i> Download SVG
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}