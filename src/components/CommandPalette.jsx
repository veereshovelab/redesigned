import { useState, useEffect, useRef } from 'react';

export default function CommandPalette({
  isOpen,
  onClose,
  projects = [],
  setView,
  onSelectProject,
  theme,
  toggleTheme,
  currency,
  setCurrency,
  setTfaModalOpen,
  setPortfolioOpen,
  setShortcutsOpen,
  onOpenPitchReport,
  onOpenAnalytics,
  onOpenHallOfFame,
  onOpenComparison,
  showToast,
  protectAction
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Autofocus input on open & handle key navigation
  useEffect(() => {
    if (!isOpen) return undefined;

    const resetTimeout = setTimeout(() => {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('All');
      inputRef.current?.focus();
    }, 50);

    return () => clearTimeout(resetTimeout);
  }, [isOpen]);

  // Base Commands Definition
  const baseCommands = [
    // Navigation
    {
      id: 'nav-home',
      category: '⚡ Quick Navigation',
      title: 'Go to Homepage',
      subtitle: 'Browse trending campaigns and discovery filters',
      icon: 'fa-solid fa-house',
      iconColor: '#3b82f6',
      shortcut: 'Alt + H',
      action: () => {
        setView('home');
        if (onSelectProject) onSelectProject(null);
      }
    },
    {
      id: 'nav-create',
      category: '⚡ Quick Navigation',
      title: 'Start a Campaign',
      subtitle: 'Launch a new crowdfunding project proposal',
      icon: 'fa-solid fa-rocket',
      iconColor: '#a855f7',
      shortcut: 'Create',
      action: () => {
        protectAction?.(() => setView('create'));
      }
    },
    {
      id: 'nav-creator',
      category: '⚡ Quick Navigation',
      title: 'Creator Dashboard',
      subtitle: 'Manage campaigns, view gross proceeds and transaction status',
      icon: 'fa-solid fa-chart-line',
      iconColor: '#10b981',
      action: () => {
        protectAction?.(() => setView('creator-dashboard'));
      }
    },
    {
      id: 'nav-admin',
      category: '⚡ Quick Navigation',
      title: 'Admin Approval Console',
      subtitle: 'Review proposals and verify funder UTR transaction IDs',
      icon: 'fa-solid fa-user-shield',
      iconColor: '#f59e0b',
      action: () => {
        protectAction?.(() => setView('admin-panel'));
      }
    },
    {
      id: 'nav-qr',
      category: '⚡ Quick Navigation',
      title: 'UPI QR Code Generator',
      subtitle: 'Generate NPCI compliant UPI QR codes for zero-fee payment collection',
      icon: 'fa-solid fa-qrcode',
      iconColor: '#06b6d4',
      action: () => {
        setView('qr-generator');
      }
    },
    {
      id: 'nav-compare',
      category: '⚡ Quick Navigation',
      title: 'Campaign Comparison Matrix',
      subtitle: 'Compare campaigns side-by-side with metrics and pledge velocity',
      icon: 'fa-solid fa-code-compare',
      iconColor: '#a855f7',
      action: () => {
        onOpenComparison?.();
      }
    },

    // Account & Security
    {
      id: 'sec-2fa',
      category: '🔒 Account & Security',
      title: 'Two-Factor Authentication (2FA)',
      subtitle: 'Setup Google Authenticator / RFC 6238 TOTP security',
      icon: 'fa-solid fa-shield-halved',
      iconColor: '#10b981',
      action: () => {
        protectAction?.(() => setTfaModalOpen?.(true));
      }
    },
    {
      id: 'sec-portfolio',
      category: '🔒 Account & Security',
      title: 'My Backer Portfolio & Tax Receipts',
      subtitle: 'View pledge history, transaction UTRs and tax certificates',
      icon: 'fa-solid fa-file-invoice-dollar',
      iconColor: '#3b82f6',
      action: () => {
        protectAction?.(() => setPortfolioOpen?.(true));
      }
    },
    {
      id: 'sec-shortcuts',
      category: '🔒 Account & Security',
      title: 'Keyboard Shortcuts Reference',
      subtitle: 'View full list of keyboard power UX commands',
      icon: 'fa-solid fa-keyboard',
      iconColor: '#a855f7',
      shortcut: '?',
      action: () => {
        setShortcutsOpen?.(true);
      }
    },
    {
      id: 'doc-pitch-report',
      category: '📄 Reports & Pitch Decks',
      title: 'Export Executive Pitch Summary Report',
      subtitle: 'Generate clean PDF pitch summary and JSON report for campaigns',
      icon: 'fa-solid fa-file-contract',
      iconColor: '#10b981',
      action: () => {
        if (projects && projects.length > 0) {
          onOpenPitchReport?.(projects[0]);
        }
      }
    },
    {
      id: 'doc-analytics-sim',
      category: '📄 Reports & Pitch Decks',
      title: 'Campaign Analytics & Velocity Simulator',
      subtitle: 'Simulate funding growth, stretch goals, and daily run rates',
      icon: 'fa-solid fa-chart-line',
      iconColor: '#a855f7',
      action: () => {
        if (projects && projects.length > 0) {
          onOpenAnalytics?.(projects[0]);
        }
      }
    },
    {
      id: 'doc-backer-hof',
      category: '📄 Reports & Pitch Decks',
      title: 'Backer Hall of Fame & Supporter Leaderboard',
      subtitle: 'View top contributors, live pledge stream, and community trophies',
      icon: 'fa-solid fa-trophy',
      iconColor: '#f59e0b',
      action: () => {
        if (projects && projects.length > 0) {
          onOpenHallOfFame?.(projects[0]);
        }
      }
    },

    // Preferences
    {
      id: 'pref-theme',
      category: '⚙️ Preferences',
      title: `Switch Theme to ${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}`,
      subtitle: `Currently using ${theme} theme aesthetics`,
      icon: theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon',
      iconColor: theme === 'dark' ? '#f59e0b' : '#6366f1',
      shortcut: 'Alt + T',
      action: () => {
        toggleTheme?.();
        showToast?.(`Switched theme to ${theme === 'dark' ? 'Light' : 'Dark'} mode.`);
      }
    },
    {
      id: 'pref-curr-usd',
      category: '⚙️ Preferences',
      title: 'Display Currency in USD ($)',
      subtitle: 'Set platform currency conversion to US Dollars',
      icon: 'fa-solid fa-dollar-sign',
      iconColor: '#10b981',
      badge: currency === 'USD' ? 'Active' : null,
      action: () => {
        setCurrency?.('USD');
        showToast?.('Currency updated to USD ($)');
      }
    },
    {
      id: 'pref-curr-inr',
      category: '⚙️ Preferences',
      title: 'Display Currency in INR (₹)',
      subtitle: 'Set platform currency conversion to Indian Rupees',
      icon: 'fa-solid fa-indian-rupee-sign',
      iconColor: '#f59e0b',
      badge: currency === 'INR' ? 'Active' : null,
      action: () => {
        setCurrency?.('INR');
        showToast?.('Currency updated to INR (₹)');
      }
    },
    {
      id: 'pref-curr-eur',
      category: '⚙️ Preferences',
      title: 'Display Currency in EUR (€)',
      subtitle: 'Set platform currency conversion to Euros',
      icon: 'fa-solid fa-euro-sign',
      iconColor: '#3b82f6',
      badge: currency === 'EUR' ? 'Active' : null,
      action: () => {
        setCurrency?.('EUR');
        showToast?.('Currency updated to EUR (€)');
      }
    },
    {
      id: 'pref-curr-gbp',
      category: '⚙️ Preferences',
      title: 'Display Currency in GBP (£)',
      subtitle: 'Set platform currency conversion to British Pounds',
      icon: 'fa-solid fa-sterling-sign',
      iconColor: '#8b5cf6',
      badge: currency === 'GBP' ? 'Active' : null,
      action: () => {
        setCurrency?.('GBP');
        showToast?.('Currency updated to GBP (£)');
      }
    }
  ];

  // Dynamic Campaign Commands from projects
  const campaignCommands = projects
    .filter(p => p.status === 'approved' || p.status === 'live')
    .map(p => ({
      id: `proj-${p.id}`,
      category: '🚀 Live Campaigns',
      title: p.title,
      subtitle: `${p.subtitle} • (${p.category})`,
      icon: 'fa-solid fa-layer-group',
      iconColor: '#ec4899',
      image: p.image,
      badge: p.trending ? '🔥 Trending' : null,
      action: () => {
        onSelectProject?.(p.id);
        setView?.('details');
      }
    }));

  const allItems = [...baseCommands, ...campaignCommands];

  // Filter items matching query and category
  const cleanQuery = query.toLowerCase().trim();
  const filteredItems = allItems.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesQuery = !cleanQuery ||
      item.title.toLowerCase().includes(cleanQuery) ||
      item.subtitle?.toLowerCase().includes(cleanQuery) ||
      item.category.toLowerCase().includes(cleanQuery);
    return matchesCategory && matchesQuery;
  });

  const renderHighlighted = (text, highlight) => {
    if (!highlight || !text) return text;
    const idx = text.toLowerCase().indexOf(highlight);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: 'rgba(99, 102, 241, 0.35)', color: 'inherit', padding: '0 2px', borderRadius: '3px' }}>
          {text.slice(idx, idx + highlight.length)}
        </mark>
        {text.slice(idx + highlight.length)}
      </>
    );
  };

  // Key navigation handler
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredItems[selectedIndex];
      if (target) {
        target.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('.cmd-item-row.selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group items by category for visual display
  const groupedCategories = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // Cumulative item index tracking for arrow navigation across groups
  let globalItemCounter = 0;

  return (
    <div className="modal-overlay cmd-palette-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="cmd-palette-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '92%',
          background: 'var(--bg-surface, #0f172a)',
          border: '1px solid var(--border-standard, rgba(255,255,255,0.15))',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        {/* Search Input Bar */}
        <div className="cmd-search-header" style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-standard, rgba(255,255,255,0.1))', gap: '0.85rem' }}>
          <i className="fa-solid fa-terminal" style={{ color: 'var(--accent-brand, #6366f1)', fontSize: '1.2rem' }}></i>
          <input
            ref={inputRef}
            type="text"
            className="cmd-search-input"
            placeholder="Type a command or search campaigns... (e.g., '2FA', 'Dark', 'Dashboard', 'USD')"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary, #ffffff)',
              fontSize: '1.05rem',
              fontFamily: 'var(--font-sans, inherit)'
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSelectedIndex(0); inputRef.current?.focus(); }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem'
              }}
              title="Clear search"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
          <kbd
            className="cmd-esc-badge"
            onClick={onClose}
            style={{
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer'
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Category Filter Chips Bar */}
        <div
          className="cmd-filter-tabs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1.25rem',
            borderBottom: '1px solid var(--border-standard, rgba(255,255,255,0.08))',
            overflowX: 'auto',
            background: 'rgba(0,0,0,0.15)'
          }}
        >
          {['All', 'Navigation', 'Campaigns', 'Security', 'Reports', 'Preferences'].map(cat => {
            const fullCatName = cat === 'All' ? 'All' :
              cat === 'Navigation' ? '⚡ Quick Navigation' :
              cat === 'Campaigns' ? '🚀 Live Campaigns' :
              cat === 'Security' ? '🔒 Account & Security' :
              cat === 'Reports' ? '📄 Reports & Pitch Decks' : '⚙️ Preferences';
            const count = cat === 'All' ? allItems.length : allItems.filter(i => i.category === fullCatName).length;
            const isActive = activeCategory === fullCatName;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(fullCatName);
                  setSelectedIndex(0);
                }}
                style={{
                  background: isActive ? 'var(--accent-brand, #6366f1)' : 'rgba(255,255,255,0.06)',
                  color: isActive ? '#ffffff' : 'var(--text-muted, #94a3b8)',
                  border: isActive ? '1px solid var(--accent-brand, #6366f1)' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '9999px',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{cat}</span>
                <span style={{ opacity: 0.7, fontSize: '0.68rem' }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="cmd-results-container"
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.75rem 0.5rem'
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted, #94a3b8)' }}>
              <i className="fa-solid fa-ghost" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5, display: 'block' }}></i>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>No matching commands found for "{query}".</p>
              {(query || activeCategory !== 'All') && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setQuery(''); setActiveCategory('All'); setSelectedIndex(0); }}
                  style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  Reset Search
                </button>
              )}
            </div>
          ) : (
            Object.keys(groupedCategories).map(catName => (
              <div key={catName} className="cmd-category-group" style={{ marginBottom: '0.75rem' }}>
                <div
                  className="cmd-category-label"
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted, #94a3b8)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px'
                  }}
                >
                  {catName}
                </div>

                {groupedCategories[catName].map(item => {
                  const currentIndex = globalItemCounter++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      className={`cmd-item-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        background: isSelected ? 'var(--accent-brand-light, rgba(99, 102, 241, 0.18))' : 'transparent',
                        border: isSelected ? '1px solid var(--accent-brand, #6366f1)' : '1px solid transparent',
                        marginBottom: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.06)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <i className={item.icon} style={{ color: item.iconColor || 'var(--accent-brand)', fontSize: '0.95rem' }}></i>
                          </div>
                        )}

                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: '0.925rem',
                              fontWeight: 600,
                              color: isSelected ? '#ffffff' : 'var(--text-primary, #f8fafc)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {renderHighlighted(item.title, cleanQuery)}
                          </div>
                          {item.subtitle && (
                            <div
                              style={{
                                fontSize: '0.775rem',
                                color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary, #94a3b8)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {renderHighlighted(item.subtitle, cleanQuery)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {item.badge && (
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            {item.badge}
                          </span>
                        )}

                        {item.shortcut && (
                          <kbd
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.725rem',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: 'var(--text-muted, #94a3b8)',
                              fontFamily: 'monospace'
                            }}
                          >
                            {item.shortcut}
                          </kbd>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div
          className="cmd-footer-bar"
          style={{
            padding: '0.65rem 1.25rem',
            borderTop: '1px solid var(--border-standard, rgba(255,255,255,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.775rem',
            color: 'var(--text-muted, #94a3b8)',
            background: 'rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>↑</kbd> <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>↓</kbd> Navigate</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>↵</kbd> Select</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>Esc</kbd> Close</span>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--accent-brand)' }}>Vorynx Command Palette</span>
        </div>
      </div>
    </div>
  );
}
