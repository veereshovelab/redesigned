import { useState } from 'react';

/**
 * Campaign Analytics & Goal Forecast Simulator Modal
 * Provides interactive funding velocity projections, stretch goal unlock estimates,
 * and 1-click export options for creators and backers.
 */
const formatCurrencyVal = (amount, currency = 'USD') => {
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

export default function CampaignAnalyticsModal({ project, isOpen, onClose, currency = 'USD', showToast }) {
  const [dailyBackerRate, setDailyBackerRate] = useState(10);
  const [avgPledgeAmount, setAvgPledgeAmount] = useState(() => {
    if (!project || !project.rewards || project.rewards.length === 0) return 45;
    const avg = project.rewards.reduce((acc, r) => acc + (r.pledgeAmount || 0), 0) / project.rewards.length;
    return Math.max(10, Math.round(avg));
  });
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  const currentRaised = project.raisedAmount || 0;
  const goal = project.goalAmount || 1;
  const currentFundedPct = Math.round((currentRaised / goal) * 100);
  const daysLeft = project.daysLeft || 1;

  // Projected Calculations
  const projectedFutureRaised = dailyBackerRate * avgPledgeAmount * daysLeft;
  const projectedTotalRaised = currentRaised + projectedFutureRaised;
  const projectedFundedPct = Math.round((projectedTotalRaised / goal) * 100);
  const projectedBackersAdded = dailyBackerRate * daysLeft;
  const totalProjectedBackers = (project.backerCount || 0) + projectedBackersAdded;
  const surplusDeficit = projectedTotalRaised - goal;

  // Stretch Goals
  const stretch100 = goal;
  const stretch125 = Math.round(goal * 1.25);
  const stretch150 = Math.round(goal * 1.5);
  const stretch200 = Math.round(goal * 2.0);

  const handleCopyForecast = () => {
    const summary = `📊 ${project.title} - Funding Forecast Report
Current Progress: ${currentFundedPct}% (${formatCurrencyVal(currentRaised, currency)} of ${formatCurrencyVal(goal, currency)})
Days Remaining: ${daysLeft} days

Simulation Parameters:
- Projected New Backers/Day: ${dailyBackerRate}
- Projected Average Pledge: ${formatCurrencyVal(avgPledgeAmount, currency)}

Forecast Results:
- Projected Final Raised: ${formatCurrencyVal(projectedTotalRaised, currency)} (${projectedFundedPct}% of Goal)
- Projected Final Backers: ${totalProjectedBackers.toLocaleString()}
- Target Status: ${surplusDeficit >= 0 ? `Surplus of ${formatCurrencyVal(surplusDeficit, currency)}` : `Short by ${formatCurrencyVal(Math.abs(surplusDeficit), currency)}`}

Forecast Generated via Vorynx Crowdfunding Analytics`;

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      if (showToast) showToast("📊 Forecast summary copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error("Failed to copy forecast summary:", err);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10600 }}>
      <div 
        className="modal-card exec-summary-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
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
              <span className="badge-tag" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-brand)', border: '1px solid var(--border-glow)', fontWeight: 700 }}>
                <i className="fa-solid fa-chart-line"></i> Campaign Analytics & Simulator
              </span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {project.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              Simulate funding trajectories, stretch goal unlocks, and backer velocity for the remaining {daysLeft} days.
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

        {/* Current Campaign Snapshot */}
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.85rem' }}>
            ⚡ Live Performance Snapshot
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-standard)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Raised</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-brand)', fontFamily: 'var(--font-heading)' }}>
                {formatCurrencyVal(currentRaised, currency)}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>{currentFundedPct}% of Goal</div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-standard)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Funding Goal</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {formatCurrencyVal(goal, currency)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Target Deadline</div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-standard)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Verified Backers</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {(project.backerCount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{daysLeft} Days Remaining</div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-standard)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Avg Backer Pledge</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-heading)' }}>
                {formatCurrencyVal(project.backerCount ? Math.round(currentRaised / project.backerCount) : 45, currency)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Historical Average</div>
            </div>
          </div>
        </div>

        {/* Interactive Funding Simulator */}
        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-sliders text-purple" style={{ color: '#a855f7' }}></i> Interactive Velocity Simulator
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Adjust variables to forecast end of campaign results
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Slider 1: Daily New Backer Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                <span>Daily New Backers</span>
                <span style={{ color: 'var(--accent-brand)', fontWeight: 800 }}>{dailyBackerRate} backers / day</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={dailyBackerRate} 
                onChange={(e) => setDailyBackerRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-brand)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <span>1/day</span>
                <span>25/day</span>
                <span>50/day</span>
              </div>
            </div>

            {/* Slider 2: Average Pledge Amount */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                <span>Projected Avg Pledge</span>
                <span style={{ color: '#10b981', fontWeight: 800 }}>{formatCurrencyVal(avgPledgeAmount, currency)}</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="500" 
                step="5"
                value={avgPledgeAmount} 
                onChange={(e) => setAvgPledgeAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <span>{formatCurrencyVal(5, currency)}</span>
                <span>{formatCurrencyVal(250, currency)}</span>
                <span>{formatCurrencyVal(500, currency)}</span>
              </div>
            </div>
          </div>

          {/* Simulation Output Cards */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.75rem' }}>
              🎯 Projected Campaign Outcome by Deadline
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Projected Total Raised</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: projectedTotalRaised >= goal ? '#10b981' : '#ef4444', fontFamily: 'var(--font-heading)' }}>
                  {formatCurrencyVal(projectedTotalRaised, currency)}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: projectedTotalRaised >= goal ? '#10b981' : '#ef4444' }}>
                  {projectedFundedPct}% of Goal
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Final Backer Count</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  {totalProjectedBackers.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  +{projectedBackersAdded} new backers in {daysLeft} days
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Goal Surplus / Shortfall</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: surplusDeficit >= 0 ? '#10b981' : '#f59e0b', fontFamily: 'var(--font-heading)' }}>
                  {surplusDeficit >= 0 ? `+${formatCurrencyVal(surplusDeficit, currency)}` : `-${formatCurrencyVal(Math.abs(surplusDeficit), currency)}`}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  {surplusDeficit >= 0 ? 'Surplus target achieved' : 'Action needed to reach 100%'}
                </div>
              </div>
            </div>

            {/* Stretch Goal Tier Badges */}
            <div style={{ borderTop: '1px solid var(--border-standard)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                🏆 Projected Stretch Goal Unlocks
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                {[
                  { label: "100% Core Goal", target: stretch100, pct: 100 },
                  { label: "125% Tier 1", target: stretch125, pct: 125 },
                  { label: "150% Tier 2", target: stretch150, pct: 150 },
                  { label: "200% Ultra Tier", target: stretch200, pct: 200 }
                ].map((tier) => {
                  const achieved = projectedTotalRaised >= tier.target;
                  return (
                    <div 
                      key={tier.pct}
                      style={{
                        padding: '0.6rem 0.8rem',
                        borderRadius: '10px',
                        background: achieved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: achieved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-standard)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <i className={`fa-solid ${achieved ? 'fa-circle-check text-green' : 'fa-circle-notch text-muted'}`}></i>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: achieved ? '#10b981' : 'var(--text-muted)' }}>
                          {tier.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {formatCurrencyVal(tier.target, currency)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={handleCopyForecast}
            style={{ fontSize: '0.85rem' }}
          >
            <i className={copied ? "fa-solid fa-check text-green" : "fa-regular fa-copy"}></i> {copied ? "Copied Forecast!" : "Copy Forecast Report"}
          </button>

          <button 
            type="button" 
            className="btn-primary"
            onClick={onClose}
            style={{ fontSize: '0.85rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
