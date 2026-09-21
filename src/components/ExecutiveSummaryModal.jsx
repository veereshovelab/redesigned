import { useState } from 'react';

// Helper function to format currency values
const formatVal = (val, currency) => {
  if (currency === 'INR') {
    return `₹${Math.round(val * 83).toLocaleString('en-IN')}`;
  }
  return `$${val.toLocaleString()}`;
};

export default function ExecutiveSummaryModal({ project, isOpen, onClose, currency = 'USD', showToast }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  const percentFunded = Math.round((project.raisedAmount / project.goalAmount) * 100);
  const averageDailyPledge = project.daysLeft ? Math.round(project.raisedAmount / Math.max(1, 30 - project.daysLeft)) : 0;
  const qrData = encodeURIComponent(`upi://pay?pa=vorynx.campaigns@upi&pn=${encodeURIComponent(project.title)}&am=${project.rewards?.[0]?.pledgeAmount || 25}&cu=INR`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&color=4f46e5`;

  // Action: Print / Save PDF
  const handlePrint = () => {
    window.print();
  };

  // Action: Export JSON payload
  const handleExportJSON = () => {
    const summaryData = {
      platform: "Vorynx Zero-Barrier Crowdfunding",
      exportDate: new Date().toISOString(),
      project: {
        id: project.id,
        title: project.title,
        subtitle: project.subtitle,
        category: project.category,
        creator: project.creator,
        funding: {
          currency: currency,
          raisedAmount: project.raisedAmount,
          goalAmount: project.goalAmount,
          percentFunded: percentFunded,
          backerCount: project.backerCount,
          daysLeft: project.daysLeft,
          averageDailyPledge: averageDailyPledge
        },
        description: project.description,
        rewards: project.rewards || [],
        updatesCount: project.updates?.length || 0,
        commentsCount: project.comments?.length || 0
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(summaryData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_pitch_summary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (showToast) showToast("📄 Pitch summary exported as JSON file!", "success");
  };

  // Action: Copy Text Summary to Clipboard
  const handleCopySummary = () => {
    const summaryText = `📌 ${project.title} - Executive Summary
Category: ${project.category} | Organized by ${project.creator?.name || 'Creator'}
Funding Progress: ${percentFunded}% (${formatVal(project.raisedAmount, currency)} of ${formatVal(project.goalAmount, currency)})
Backers: ${project.backerCount.toLocaleString()} | Days Remaining: ${project.daysLeft}

Overview:
${project.subtitle}

${project.description}

Verified on Vorynx Crowdfunding Platform.`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      if (showToast) showToast("📋 Executive summary copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error("Failed to copy pitch summary:", err);
    });
  };

  return (
    <div className="modal-overlay exec-summary-backdrop" onClick={onClose} style={{ zIndex: 10500 }}>
      <div 
        className="modal-card exec-summary-modal print-area" 
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-standard)',
          borderRadius: '24px',
          padding: '2.25rem',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header Bar */}
        <div className="exec-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge-tag" style={{ background: 'var(--accent-brand-light)', color: 'var(--accent-brand)', border: 'none', fontWeight: 700 }}>
                {project.category}
              </span>
              <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
                <i className="fa-solid fa-file-contract"></i> Executive Pitch Summary
              </span>
              {project.creator?.verified && (
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="fa-solid fa-shield-halved"></i> KYC Verified
                </span>
              )}
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {project.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.35rem', marginBottom: 0 }}>
              {project.subtitle}
            </p>
          </div>

          <button 
            type="button" 
            className="no-print" 
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

        {/* Action Controls Bar (Hidden during Print) */}
        <div className="exec-actions-bar no-print" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.75rem', background: 'var(--bg-main)', padding: '0.85rem 1.15rem', borderRadius: '14px', border: '1px solid var(--border-standard)' }}>
          <button type="button" className="btn-primary" onClick={handlePrint} style={{ padding: '0.55rem 1rem', fontSize: '0.875rem' }}>
            <i className="fa-solid fa-print"></i> Print / Save PDF
          </button>
          <button type="button" className="btn-secondary" onClick={handleExportJSON} style={{ padding: '0.55rem 1rem', fontSize: '0.875rem' }}>
            <i className="fa-solid fa-file-code"></i> Export JSON
          </button>
          <button type="button" className="btn-secondary" onClick={handleCopySummary} style={{ padding: '0.55rem 1rem', fontSize: '0.875rem' }}>
            <i className={copied ? "fa-solid fa-check text-green" : "fa-regular fa-copy"}></i> {copied ? "Copied Summary!" : "Copy Summary Text"}
          </button>
        </div>

        {/* Executive Summary Pitch Content */}
        <div className="exec-summary-body" style={{ display: 'grid', gap: '1.5rem' }}>
          
          {/* Section 1: Financial & Backer Metrics Grid */}
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.85rem' }}>
              📊 Campaign Performance & Funding Velocity
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-standard)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Pledged</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-brand)', fontFamily: 'var(--font-heading)' }}>
                  {formatVal(project.raisedAmount, currency)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>{percentFunded}% of Goal</div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-standard)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Goal</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  {formatVal(project.goalAmount, currency)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>All-or-Nothing Model</div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-standard)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Community Backers</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  {project.backerCount.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verified Supporters</div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border-standard)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Daily Velocity</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-heading)' }}>
                  {formatVal(averageDailyPledge, currency)}/day
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{project.daysLeft} Days Remaining</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              <span>Funding Progress Bar</span>
              <span style={{ color: '#10b981' }}>{percentFunded}%</span>
            </div>
            <div className="progress-container" style={{ height: '8px', background: 'rgba(255,255,255,0.08)' }}>
              <div className="progress-fill" style={{ width: `${Math.min(100, percentFunded)}%` }}></div>
            </div>
          </div>

          {/* Section 2: Creator & Campaign Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.85rem' }}>
                🚀 Campaign Pitch Overview
              </div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.925rem', lineHeight: 1.6, margin: 0 }}>
                {project.description}
              </p>
            </div>

            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.85rem' }}>
                  👤 Organizer Information
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div className="creator-avatar" style={{ width: '38px', height: '38px', fontSize: '1rem' }}>
                    {project.creator?.avatar || 'C'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{project.creator?.name || 'Creator'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vorynx Verified Campaign Lead</div>
                  </div>
                </div>
              </div>

              {/* Dynamic QR Code */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', padding: '0.85rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.85rem' }}>
                <img src={qrUrl} alt="Campaign UPI QR" style={{ width: '64px', height: '64px', borderRadius: '8px' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Direct Mobile UPI QR</div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Scan with GPay, PhonePe or Paytm to back this project directly.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Reward Tiers Preview */}
          {project.rewards && project.rewards.length > 0 && (
            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.85rem' }}>
                🎁 Featured Pledge Tier
              </div>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-standard)', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>{project.rewards[0].title}</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{project.rewards[0].desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-brand)' }}>
                    {formatVal(project.rewards[0].pledgeAmount, currency)}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    {project.rewards[0].claimed || 0} / {project.rewards[0].limit || '∞'} Claimed
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Document Footer Verification Note */}
          <div style={{ borderTop: '1px solid var(--border-standard)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>Generated by Vorynx Crowdfunding Platform • NPCI Dynamic UPI Compliant</div>
            <div>Document Ref: VORYNX-PITCH-{project.id.toUpperCase()}</div>
          </div>

        </div>
      </div>
    </div>
  );
}
