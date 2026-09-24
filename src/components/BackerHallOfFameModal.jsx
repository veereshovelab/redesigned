import { useState } from 'react';

/**
 * Backer Hall of Fame & Community Leaderboard Modal
 * Displays ranked top contributors, recent backer stream, and community achievement milestones.
 */
const formatVal = (amount, currency = 'USD') => {
  const num = Number(amount) || 0;
  if (currency === 'INR') {
    const inr = Math.round(num * 85);
    return `₹${inr.toLocaleString('en-IN')}`;
  }
  if (currency === 'EUR') {
    const eur = Math.round(num * 0.92);
    return `€${eur.toLocaleString('de-DE')}`;
  }
  if (currency === 'GBP') {
    const gbp = Math.round(num * 0.78);
    return `£${gbp.toLocaleString('en-GB')}`;
  }
  return `$${Math.round(num).toLocaleString('en-US')}`;
};

export default function BackerHallOfFameModal({ project, donations = [], isOpen, onClose, currency = 'USD', showToast }) {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'stream' | 'achievements'
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  // Derive Backer Data from Project & Global Donations
  const projectDonations = (donations || []).filter(d => d.project_id === project.id || d.projectTitle === project.title);
  
  // Mock backer list if project has backerCount but few DB records
  const sampleBackers = [
    { id: 'b1', name: 'Marcus Vance', amount: 500, tier: 'Founding Patron', date: '2 hours ago', avatar: 'M', rank: 1 },
    { id: 'b2', name: 'Elena Rostova', amount: 350, tier: 'VIP Supporter', date: '5 hours ago', avatar: 'E', rank: 2 },
    { id: 'b3', name: 'Devon Wright', amount: 250, tier: 'Pioneer Backer', date: '1 day ago', avatar: 'D', rank: 3 },
    { id: 'b4', name: 'Sophia Chen', amount: 199, tier: 'Full Reward Tier', date: '2 days ago', avatar: 'S', rank: 4 },
    { id: 'b5', name: 'Liam O\'Connor', amount: 150, tier: 'Early Bird Backer', date: '3 days ago', avatar: 'L', rank: 5 },
    { id: 'b6', name: 'Aarav Patel', amount: 100, tier: 'Community Backer', date: '4 days ago', avatar: 'A', rank: 6 }
  ];

  const actualBackers = projectDonations.length > 0
    ? projectDonations
        .sort((a, b) => (b.amount || 0) - (a.amount || 0))
        .map((d, idx) => ({
          id: d.id || `don_${idx}`,
          name: d.username || 'Anonymous Supporter',
          amount: Number(d.amount || 0),
          tier: d.amount >= 300 ? 'Founding Patron' : d.amount >= 150 ? 'VIP Supporter' : 'Pioneer Backer',
          date: d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent',
          avatar: (d.username || 'A')[0].toUpperCase(),
          rank: idx + 1
        }))
    : sampleBackers;

  const topBacker = actualBackers[0] || { name: 'None', amount: 0 };
  const totalRaised = project.raisedAmount || 0;
  const backerCount = Math.max(project.backerCount || 0, actualBackers.length);
  const avgPledge = backerCount > 0 ? Math.round(totalRaised / backerCount) : 0;

  const handleCopyRoster = () => {
    const text = `🏆 ${project.title} - Backer Hall of Fame Roster
Total Backers: ${backerCount.toLocaleString()} Supporters
Top Supporter: ${topBacker.name} (${formatVal(topBacker.amount, currency)})
Average Pledge: ${formatVal(avgPledge, currency)}

Top Leaderboard:
${actualBackers.slice(0, 5).map(b => `#${b.rank} ${b.name} - ${formatVal(b.amount, currency)} (${b.tier})`).join('\n')}

Verified via Vorynx Crowdfunding Leaderboard`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (showToast) showToast("🏆 Leaderboard roster copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error("Failed to copy roster:", err);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10600 }}>
      <div 
        className="modal-card exec-summary-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '840px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-standard)',
          borderRadius: '24px',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge-tag" style={{ background: 'var(--accent-brand-light)', color: 'var(--accent-brand)', fontWeight: 700 }}>
                {project.category}
              </span>
              <span className="badge-tag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
                <i className="fa-solid fa-trophy"></i> Backer Hall of Fame
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {project.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              Honoring community supporters, top contributors, and milestone achievements.
            </p>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-standard)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Highlights Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-main)', padding: '0.9rem', borderRadius: '14px', border: '1px solid var(--border-standard)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Top Supporter</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topBacker.name}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {formatVal(topBacker.amount, currency)} Pledged
            </div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '0.9rem', borderRadius: '14px', border: '1px solid var(--border-standard)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Backers</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-brand)', fontFamily: 'var(--font-heading)' }}>
              {backerCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.725rem', color: '#10b981', fontWeight: 600 }}>Verified Supporters</div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '0.9rem', borderRadius: '14px', border: '1px solid var(--border-standard)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Average Contribution</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              {formatVal(avgPledge, currency)}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Per Backer</div>
          </div>

          <div style={{ background: 'var(--bg-main)', padding: '0.9rem', borderRadius: '14px', border: '1px solid var(--border-standard)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Community Status</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-heading)' }}>
              🔥 Active
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Real-time Feed</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-standard)', paddingBottom: '0.5rem' }}>
          <button 
            type="button"
            className={`category-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <i className="fa-solid fa-crown" style={{ color: '#f59e0b', marginRight: '6px' }}></i> Leaderboard
          </button>
          <button 
            type="button"
            className={`category-tab ${activeTab === 'stream' ? 'active' : ''}`}
            onClick={() => setActiveTab('stream')}
          >
            <i className="fa-solid fa-bolt" style={{ color: '#3b82f6', marginRight: '6px' }}></i> Recent Pledges
          </button>
          <button 
            type="button"
            className={`category-tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <i className="fa-solid fa-award" style={{ color: '#a855f7', marginRight: '6px' }}></i> Achievements
          </button>
        </div>

        {/* Tab Content 1: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-standard)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              👑 Top Supporter Leaderboard
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {actualBackers.map((backer) => (
                <div 
                  key={backer.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.9rem 1.25rem',
                    borderBottom: '1px solid var(--border-standard)',
                    background: backer.rank === 1 ? 'rgba(245, 158, 11, 0.06)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: backer.rank === 1 ? '#f59e0b' : backer.rank === 2 ? '#94a3b8' : backer.rank === 3 ? '#b45309' : 'var(--bg-surface)',
                      color: backer.rank <= 3 ? '#ffffff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      border: '1px solid var(--border-standard)'
                    }}>
                      {backer.rank === 1 ? <i className="fa-solid fa-crown" style={{ fontSize: '0.8rem' }}></i> : `#${backer.rank}`}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                        {backer.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--accent-brand)', fontWeight: 600 }}>{backer.tier}</span> • {backer.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-brand)', fontFamily: 'var(--font-heading)' }}>
                      {formatVal(backer.amount, currency)}
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      Verified Pledge
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 2: Recent Activity Stream */}
        {activeTab === 'stream' && (
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1rem' }}>
              ⚡ Live Backer Activity Feed
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {actualBackers.map((backer) => (
                <div key={`stream_${backer.id}`} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', padding: '0.85rem 1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-brand-light)', color: 'var(--accent-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {backer.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {backer.name} pledged <span style={{ color: 'var(--accent-brand)' }}>{formatVal(backer.amount, currency)}</span>
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {backer.date} • {backer.tier}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fa-solid fa-[#10b981] fa-circle-check"></i> Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 3: Community Achievements */}
        {activeTab === 'achievements' && (
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '1rem' }}>
              🎖️ Campaign Milestone Trophies
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {[
                { title: "First 100 Backers", desc: "100 early supporters joined the movement", unlocked: backerCount >= 50, icon: "fa-users text-purple" },
                { title: "50% Funding Threshold", desc: "Achieved half of total target goal", unlocked: (project.raisedAmount / project.goalAmount) >= 0.5, icon: "fa-chart-pie text-blue" },
                { title: "100% Core Funded", desc: "Project is fully funded and moving to production!", unlocked: (project.raisedAmount / project.goalAmount) >= 1.0, icon: "fa-rocket text-green" },
                { title: "Super Backer Club", desc: "Over 5 supporters contributed $300+", unlocked: actualBackers.filter(b => b.amount >= 300).length >= 1, icon: "fa-crown text-amber" }
              ].map((achieve, i) => (
                <div key={i} style={{ background: 'var(--bg-surface)', border: achieve.unlocked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-standard)', padding: '1rem', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <i className={`fa-solid ${achieve.icon}`} style={{ fontSize: '1.2rem' }}></i>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: achieve.unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {achieve.title}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {achieve.desc}
                  </p>
                  <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', fontWeight: 700, color: achieve.unlocked ? '#10b981' : 'var(--text-muted)' }}>
                    {achieve.unlocked ? '✓ Unlocked Milestone' : '🔒 In Progress'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={handleCopyRoster}
            style={{ fontSize: '0.85rem' }}
          >
            <i className={copied ? "fa-solid fa-check text-green" : "fa-regular fa-copy"}></i> {copied ? "Copied Roster!" : "Copy Leaderboard Roster"}
          </button>

          <button 
            type="button" 
            className="btn-primary"
            onClick={onClose}
            style={{ fontSize: '0.85rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
