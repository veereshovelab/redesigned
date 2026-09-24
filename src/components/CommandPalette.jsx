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
  showToast,
  protectAction
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Autofocus input on open & handle key navigation
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  // Filter items matching query
  const cleanQuery = query.toLowerCase().trim();
  const filteredItems = cleanQuery
    ? allItems.filter(item =>
        item.title.toLowerCase().includes(cleanQuery) ||
        item.subtitle.toLowerCase().includes(cleanQuery) ||
        item.category.toLowerCase().includes(cleanQuery)
      )
    : allItems;

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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.25)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
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

        {/* Results List */}
        <div
          ref={listRef}
          className="cmd-results-container"
          style={{
            maxHeight: '420px',
            overflowY: 'auto',
            padding: '0.75rem 0.5rem'
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted, #94a3b8)' }}>
              <i className="fa-solid fa-ghost" style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }}></i>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>No matching commands or campaigns found for "{query}".</p>
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
                            {item.title}
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
                              {item.subtitle}
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
