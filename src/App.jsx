import { useState, useEffect } from "react";
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

// Initial Mock Campaign Data
/* eslint-disable-next-line no-unused-vars */
const INITIAL_PROJECTS = [
  {
    id: "keyboard",
    title: "Helix-68: Retro-Mechanical Keyboard",
    subtitle: "A gasket-mounted wireless keyboard with premium walnut casing & custom tactile switches.",
    description: "An ergonomic mechanical keyboard crafted with premium CNC-aluminum, hot-swappable tactile switches, and hand-polished walnut casing. Featuring dual-wireless connectivity, custom gasket-mount dampening, and vibrant RGB backing. Perfect for programmers, writers, and keyboard enthusiasts looking for acoustic perfection and ergonomic comfort.",
    category: "Design",
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
  const [view, setView] = useState("home"); // 'home' | 'details' | 'create'
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // App Dynamic Project Database State
  const [projects, setProjects] = useState([]);

  // Alerts
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
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

  // Modals & Flows
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);



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
      await fetchProjects();
      setLoading(false);
      if (currentUser) {
        setAuthOpen(false); // Close sign-in popup if completed successfully
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: 'rgba(17, 24, 39, 0.95)', border: '1px solid #00f59b', color: '#fff', padding: '1rem 2rem', borderRadius: '12px', zIndex: 10000, boxShadow: '0 5px 25px rgba(0, 245, 155, 0.15)', display: 'flex', alignItems: 'center', gap: '0.8rem', animation: 'slideUp 0.3s ease-out' }}>
          <i className="fa-solid fa-circle-info text-green"></i>
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="vorynx-header">
        <div className="header-container">
          <div className="logo-section" onClick={() => { setView("home"); setSelectedProjectId(null); }}>
            <span className="logo-icon">V</span>
            <span className="logo-text">VORYNX</span>
          </div>

          <div className="search-bar-container">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input
              type="text"
              placeholder="Search campaigns..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="nav-actions">
            <button className="btn-text" style={{ fontSize: '0.9rem' }} onClick={() => protectAction(() => setView("create"))}>
              Start a Campaign
            </button>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="creator-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                </div>
                <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            ) : (
              <button className="btn-primary" style={{ padding: '0.4rem 1.2rem', borderRadius: '20px' }} onClick={() => setAuthOpen(true)}>
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="vorynx-main">
        {view === "home" && (
          <HomepageView
            projects={projects}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSelectProject={(id) => { setSelectedProjectId(id); setView("details"); }}
            protectAction={protectAction}
            setView={setView}
          />
        )}

        {view === "details" && activeProject && (
          <ProjectDetailView
            project={activeProject}
            onBack={() => { setView("home"); setSelectedProjectId(null); }}
            user={user}
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
        )}

        {view === "create" && (
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
                    trending: newProj.trending
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

                await fetchProjects();
                setView("home");
                showToast("Your campaign has been successfully launched on Vorynx!");
              } catch (err) {
                console.error("Error creating project:", err);
                showToast("Failed to launch campaign to database.");
              }
            }}
            user={user}
          />
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

      {/* Modal - Pledge/Checkout Simulator */}
      {checkoutOpen && selectedReward && activeProject && (
        <CheckoutModal
          project={activeProject}
          reward={selectedReward}
          onClose={() => { setCheckoutOpen(false); setSelectedReward(null); }}
          onSubmit={async (pledgeAmt) => {
            try {
              const { error: rewErr } = await supabase
                .from('rewards')
                .update({ claimed: selectedReward.claimed + 1 })
                .eq('id', selectedReward.id);

              if (rewErr) throw rewErr;

              const { error: projErr } = await supabase
                .from('projects')
                .update({
                  raised_amount: activeProject.raisedAmount + pledgeAmt,
                  backer_count: activeProject.backerCount + 1
                })
                .eq('id', activeProject.id);

              if (projErr) throw projErr;

              await fetchProjects();
              setCheckoutOpen(false);
              setSelectedReward(null);
              showToast(`Pledge of $${pledgeAmt} recorded! Thank you for supporting ${activeProject.title}!`);
            } catch (err) {
              console.error("Error recording pledge:", err);
              showToast("Failed to register pledge in database.");
            }
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// HOMEPAGE VIEW COMPONENT
// ============================================================================
function HomepageView({ projects, searchQuery, selectedCategory, setSelectedCategory, onSelectProject, protectAction, setView }) {

  // Filtering Logic
  const filteredProjects = projects.filter(proj => {
    const matchesSearch = proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || proj.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Spotlight is the first trending project
  const spotlightProj = projects.find(p => p.trending) || projects[0];

  return (
    <div>
      {/* Category Selection Tabs */}
      <div className="category-filter-bar">
        {["All", "Tech", "Design", "Games", "Publishing"].map((cat) => (
          <button
            key={cat}
            className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Spotlight Campaign Banner */}
      {spotlightProj && searchQuery === "" && selectedCategory === "All" && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Spotlight Project</h2>
            <span className="badge-tag"><i className="fa-solid fa-fire text-orange"></i> Creator Showcase</span>
          </div>
          <div className="hero-spotlight">
            <div className="hero-media">
              <span className="hero-tag">Project We Love</span>
              <img src={spotlightProj.image} alt={spotlightProj.title} />
            </div>
            <div className="hero-details">
              <span className="hero-category">{spotlightProj.category}</span>
              <h1 className="hero-title">{spotlightProj.title}</h1>
              <p className="hero-desc">{spotlightProj.subtitle}</p>

              <div className="hero-stats-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                  <span>${spotlightProj.raisedAmount.toLocaleString()} pledged</span>
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
                    <span className="stat-value">{spotlightProj.backerCount}</span>
                    <span className="stat-label">Backers</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">${spotlightProj.goalAmount.toLocaleString()}</span>
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

      {/* Campaigns Listing */}
      <div className="section-header">
        <h2 className="section-title">
          {searchQuery !== "" || selectedCategory !== "All" ? "Search Results" : "Trending Campaigns"}
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing {filteredProjects.length} campaigns
        </span>
      </div>

      {filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
          <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}></i>
          <h3>No Campaigns Found</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>We couldn't find anything matching your filters. Try clearing search queries or selecting another category.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((proj) => {
            const pct = Math.round((proj.raisedAmount / proj.goalAmount) * 100);
            return (
              <div key={proj.id} className="project-card" onClick={() => onSelectProject(proj.id)}>
                <div className="card-media">
                  {proj.trending && <span className="card-badge"><i className="fa-solid fa-bolt"></i> Trending</span>}
                  <img src={proj.image} alt={proj.title} />
                </div>
                <div className="card-content">
                  <span className="card-category">{proj.category}</span>
                  <h3 className="card-title">{proj.title}</h3>
                  <p className="card-desc">{proj.subtitle}</p>

                  <div className="card-footer-stats">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                      <span>${proj.raisedAmount.toLocaleString()} raised</span>
                      <span className="text-green">{pct}%</span>
                    </div>
                    <div className="progress-container" style={{ height: '6px' }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      ></div>
                    </div>
                    <div className="card-stats-row" style={{ marginTop: '0.8rem' }}>
                      <div>
                        <div className="card-stat-number">{proj.backerCount}</div>
                        <div className="card-stat-lbl">Backers</div>
                      </div>
                      <div>
                        <div className="card-stat-number">${proj.goalAmount.toLocaleString()}</div>
                        <div className="card-stat-lbl">Goal</div>
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
    </div>
  );
}

// ============================================================================
// PROJECT DETAIL VIEW COMPONENT
// ============================================================================
function ProjectDetailView({ project, onBack, user, onPledge, onAddComment, onDeleteProject }) {
  const [activeTab, setActiveTab] = useState("story"); // 'story' | 'updates' | 'comments'
  const [commentInput, setCommentInput] = useState("");

  const percentFunded = Math.round((project.raisedAmount / project.goalAmount) * 100);
  const isCreator = user && (
    user.displayName === project.creator.name ||
    user.email?.split('@')[0] === project.creator.name
  );

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(commentInput);
    setCommentInput("");
  };

  return (
    <div>
      {/* Back button */}
      <span className="back-link" onClick={onBack}>
        <i className="fa-solid fa-arrow-left"></i> Back to discovery
      </span>

      <div className="detail-header-full">
        <h1 className="detail-title">{project.title}</h1>
        <p className="detail-subtitle">{project.subtitle}</p>
        <div className="detail-creator-row">
          <div className="creator-avatar">
            {project.creator.avatar}
          </div>
          <span style={{ color: 'var(--text-primary)' }}>
            By <span className="creator-name">{project.creator.name}</span>
          </span>
          {project.creator.verified && (
            <span className="creator-tag">
              <i className="fa-solid fa-circle-check text-green" style={{ marginRight: '3px' }}></i> Verified Creator
            </span>
          )}
          <span className="badge-tag">{project.category}</span>
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
              <div className="tab-pane-content">
                <h3>About This Project</h3>
                <p>{project.description}</p>
                <p>Crowdfunding allows creative hardware builders and software teams to directly interface with their initial users. By backing our team, you help support tooling setup, mechanical designs, component procurement, and beta testing. Our team is committed to high-frequency weekly updates to give you full visibility into our design pipeline.</p>

                <h3>Prototype Specifications</h3>
                <p>We have finished our initial mechanical modeling and 3D housing runs. The design integrates premium raw materials, customized localized programming, and heavy physical layout validations. Everything is optimized to deliver peak aesthetics and robust functional capabilities.</p>

                <h3>Risks & Challenges</h3>
                <div style={{ background: 'rgba(255, 159, 67, 0.05)', borderLeft: '3px solid #ff9f43', padding: '1rem', borderRadius: '4px', margin: '1rem 0' }}>
                  <strong style={{ color: '#ff9f43' }}>Required Crowdfunding Notice</strong>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Global supply chains, shipping corridors, and raw material procurement are subject to fluctuating lead times. We have already pre-purchased key processing units and structural frames to buffer against delayed launches, but production shifts are always a minor possibility.</p>
                </div>
              </div>
            )}

            {activeTab === "updates" && (
              <div className="tab-pane-content">
                {project.updates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    No updates have been posted by the creator yet.
                  </div>
                ) : (
                  project.updates.map(up => (
                    <div key={up.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-standard)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                        <h4 style={{ color: '#fff', fontFamily: 'var(--font-heading)' }}>{up.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{up.date}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{up.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "comments" && (
              <div className="tab-pane-content">
                <form onSubmit={handleSubmitComment} className="comment-input-form">
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Join the discussion</span>
                  <textarea
                    placeholder={user ? "Ask a question or share feedback..." : "Please sign in to write a comment."}
                    className="comment-textarea"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    disabled={!user}
                  />
                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', padding: '0.4rem 1.2rem', fontSize: '0.8rem' }} disabled={!user}>
                    Post Comment
                  </button>
                </form>

                <div className="comments-section">
                  {project.comments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
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

        {/* Sidebar Left Details */}
        <div className="detail-right">
          {/* Funding Stats */}
          <div className="stats-card-side">
            <div className="side-stat-block">
              <span className="side-stat-big">${project.raisedAmount.toLocaleString()}</span>
              <span className="side-stat-lbl">pledged of ${project.goalAmount.toLocaleString()} goal</span>
            </div>

            <div className="progress-container">
              <div className="progress-fill" style={{ width: `${Math.min(100, percentFunded)}%` }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="side-stat-block">
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.backerCount}</span>
                <span className="side-stat-lbl">Backers</span>
              </div>
              <div className="side-stat-block">
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{project.daysLeft}</span>
                <span className="side-stat-lbl">Days Left</span>
              </div>
            </div>

            <button className="btn-primary" style={{ justifyContent: 'center', padding: '0.8rem' }} onClick={() => onPledge(project.rewards[0])}>
              Back this project
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              All Vorynx projects run on an "All-or-Nothing" model. If goal target isn't reached by closing, zero transactions execute.
            </span>
            {isCreator && (
              <button
                className="btn-danger"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem',
                  backgroundColor: '#ff4d4d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '0.8rem',
                  width: '100%',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s'
                }}
                onClick={() => onDeleteProject(project.id)}
              >
                <i className="fa-solid fa-trash-can"></i> Discontinue Campaign
              </button>
            )}
          </div>

          {/* Reward Options */}
          <div>
            <h3 className="rewards-title">Support Reward Tiers</h3>
            <div className="rewards-stack">
              {project.rewards.map(rew => (
                <div key={rew.id} className="reward-tier" onClick={() => onPledge(rew)}>
                  <div className="tier-pledge-amount">Pledge ${rew.pledgeAmount}+</div>
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
// CHECKOUT MODAL SIMULATOR
// ============================================================================
function CheckoutModal({ project, reward, onClose, onSubmit }) {
  const [pledgeAmt, setPledgeAmt] = useState(reward.pledgeAmount);
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");
  const [cardholder, setCardholder] = useState("Sandbox Tester");

  const handlePledgeSubmit = (e) => {
    e.preventDefault();
    if (pledgeAmt < reward.pledgeAmount) {
      alert(`Minimum pledge amount for this reward is $${reward.pledgeAmount}`);
      return;
    }
    onSubmit(Number(pledgeAmt));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <h2 className="modal-title">Confirm Pledge Reward</h2>
        <p className="modal-subtitle">Supporting: {project.title}</p>

        <form onSubmit={handlePledgeSubmit} className="credit-card-form">
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-standard)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Selected Tier:</span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{reward.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Minimum Pledge: ${reward.pledgeAmount}</div>
          </div>

          <div className="form-field">
            <label className="form-label">Pledge Amount ($)</label>
            <input
              type="number"
              className="form-input"
              value={pledgeAmt}
              onChange={(e) => setPledgeAmt(Math.max(1, Number(e.target.value)))}
              min={reward.pledgeAmount}
              required
            />
          </div>

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

          <button type="submit" className="btn-primary" style={{ marginTop: '1rem', padding: '0.8rem', justifyContent: 'center' }}>
            Authorize Simulated Pledge of ${pledgeAmt}
          </button>
        </form>
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

  // Reward Creation State
  const [rewardTitle, setRewardTitle] = useState("Standard Backer Pack");
  const [rewardCost, setRewardCost] = useState(25);
  const [rewardDesc, setRewardDesc] = useState("Includes our core designed product and all digital campaign updates.");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) {
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
    <div style={{ maxWidth: '600px', margin: '1.5rem auto 3rem', background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '20px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>

      {/* Back link */}
      <span className="back-link" onClick={onBack}>
        <i className="fa-solid fa-arrow-left"></i> Cancel Wizard
      </span>

      <div style={{ margin: '1rem 0 2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>Start Your Vorynx Campaign</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Launch your creative project to the community in 3 simple steps.</p>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Step 1: Campaign Basics</h3>

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

        {/* Step 2: Goal and Targets */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Step 2: Funding & Duration</h3>

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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculate the minimal funding required to complete your production lines.</span>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Specify the duration of campaign (Between 5 and 60 days).</span>
            </div>
          </div>
        )}

        {/* Step 3: Rewards setup */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Step 3: Core Reward Tier</h3>

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
                style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
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

      //  handler: Google 0auth 
      const handleGooglelogin = async (e) =>{
        e.preventdefault();
        setError("");
        setInfoMessage("");
        try{
          await signInWithPopup(auth, googleProvider);
        }  catch (err) {
          setError(getFriendlyErrorMessage(err));
        }
      };

      //  handler; github oauth 
      const handleGithubLogin = async (e) => {
        e.preventDefault();
        setError("");
        setInfoMessage("");
        try{
          await signInWithPopup(auth, githubProvider);
        }  catch (err) {
          setError(getfriendlyErrorMessage(err));
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
              <i className="fa-brands fa-google"></i> Continue with Google
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

          {isActive && error && <p style={{ color: '#ff4d4d', fontSize: '13px', margin: '5px 0', fontWeight: 500 }}>{error}</p>}
          {isActive && infoMessage && <p style={{ color: '#00f59b', fontSize: '13px', margin: '5px 0', fontWeight: 500 }}>{infoMessage}</p>}

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
              <i className="fa-brands fa-google"></i> Continue with Google
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

          {!isActive && error && <p style={{ color: '#ff4d4d', fontSize: '13px', margin: '5px 0', fontWeight: 500 }}>{error}</p>}
          {!isActive && infoMessage && <p style={{ color: '#00f59b', fontSize: '13px', margin: '5px 0', fontWeight: 500 }}>{infoMessage}</p>}

          <label className="auth-input-label">Email Address</label>
          <input type="email" placeholder="e.g. you@example.com" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)} required />

          <label className="auth-input-label">Password</label>
          <input type="password" placeholder="Enter password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} />

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px', margin: '10px 0 5px' }}>
            <a href="#" onClick={handleForgotPassword}>Forgot Password?</a>
            <a href="#" onClick={handleSendEmailLink} style={{ color: '#00f59b', fontWeight: '600' }}>Passwordless Link</a>
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