import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  generateTotpSecret,
  getTotpUri,
  verifyTotpToken,
  generateBackupCodes
} from '../utils/totp';

export default function TwoFactorModal({ user, user2faStatus, onSave2FA, onClose, showToast }) {
  const [step, setStep] = useState(1); // 1: QR Code & Secret, 2: Verification, 3: Backup Codes
  const [secret] = useState(() => generateTotpSecret(16));
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  const isEnabled = user2faStatus?.enabled || false;

  useEffect(() => {
    if (!isEnabled && secret) {
      const email = user?.email || 'user@vorynx.com';
      const uri = getTotpUri(secret, email, 'Vorynx');

      QRCode.toDataURL(uri, {
        width: 220,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(url => setQrCodeUrl(url)).catch(err => console.error('QR generation error:', err));
    }
  }, [isEnabled, user, secret]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleVerifyStep = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isValid = await verifyTotpToken(verificationCode, secret);
      if (!isValid) {
        setError('Invalid 6-digit authenticator code. Please verify time on device and try again.');
        setLoading(false);
        return;
      }

      const generatedCodes = generateBackupCodes(8);
      setBackupCodes(generatedCodes);

      // Save 2FA config
      onSave2FA({
        enabled: true,
        secret: secret,
        backupCodes: generatedCodes,
        enabledAt: new Date().toISOString()
      });

      showToast?.('2FA Authenticator enabled successfully!');
      setStep(3); // Proceed to Backup Codes step
    } catch (err) {
      setError(err.message || 'Error verifying passcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = () => {
    if (window.confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) {
      onSave2FA({ enabled: false, secret: null, backupCodes: [] });
      showToast?.('Two-Factor Authentication disabled.');
      onClose();
    }
  };

  const handleCopyBackupCodes = () => {
    const text = `VORYNX 2FA BACKUP RECOVERY CODES\nAccount: ${user?.email || 'Vorynx User'}\nDate: ${new Date().toLocaleDateString()}\n\n` +
      backupCodes.map((code, idx) => `${idx + 1}. ${code}`).join('\n') +
      '\n\nKeep these single-use recovery codes in a secure location.';

    navigator.clipboard.writeText(text);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const text = `VORYNX 2FA BACKUP RECOVERY CODES\nAccount: ${user?.email || 'Vorynx User'}\nDate: ${new Date().toLocaleDateString()}\n\n` +
      backupCodes.map((code, idx) => `${idx + 1}. ${code}`).join('\n') +
      '\n\nKeep these single-use recovery codes in a secure location.';

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vorynx-backup-codes-${user?.email?.split('@')[0] || 'account'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="tfa-modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="tfa-icon-shield">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h2 className="modal-title">Two-Factor Authentication (2FA)</h2>
              <p className="modal-subtitle">Enhance account security using standard TOTP Authenticator apps.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Existing Enabled View */}
        {isEnabled ? (
          <div className="tfa-content-body">
            <div className="tfa-status-banner active">
              <i className="fa-solid fa-circle-check text-green"></i>
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block' }}>2FA is Currently Active</strong>
                <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Your account is protected with Google Authenticator / TOTP verification on login.
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-standard)', borderRadius: '16px', padding: '1.25rem', margin: '1.25rem 0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Security Management</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                If you lost your authenticator device or want to switch to a new phone, you can re-configure or disable 2FA below.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                onClick={handleDisable2FA}
              >
                <i className="fa-solid fa-lock-open"></i> Disable 2FA Security
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : (
          /* Setup Steps */
          <div className="tfa-content-body">
            {/* Step Wizard Indicator */}
            <div className="tfa-step-wizard">
              <div className={`tfa-step-item ${step >= 1 ? 'active' : ''}`}>
                <span className="tfa-step-num">1</span>
                <span className="tfa-step-label">Scan QR</span>
              </div>
              <div className="tfa-step-line"></div>
              <div className={`tfa-step-item ${step >= 2 ? 'active' : ''}`}>
                <span className="tfa-step-num">2</span>
                <span className="tfa-step-label">Verify Code</span>
              </div>
              <div className="tfa-step-line"></div>
              <div className={`tfa-step-item ${step >= 3 ? 'active' : ''}`}>
                <span className="tfa-step-num">3</span>
                <span className="tfa-step-label">Backup Codes</span>
              </div>
            </div>

            {/* Step 1: Scan QR Code */}
            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Use any authenticator application (e.g. <strong>Google Authenticator</strong>, <strong>Authy</strong>, <strong>1Password</strong>, or <strong>Microsoft Authenticator</strong>) to scan the QR code below:
                </p>

                <div className="tfa-qr-card">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="2FA QR Code" className="tfa-qr-img" />
                  ) : (
                    <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Generating QR Code...</div>
                  )}

                  <div className="tfa-secret-box">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Can't scan QR code? Enter secret key manually:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <code className="tfa-secret-code">{secret}</code>
                      <button type="button" className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={handleCopySecret}>
                        <i className={`fa-solid ${copiedSecret ? 'fa-check text-green' : 'fa-copy'}`}></i> {copiedSecret ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="wizard-action-footer" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                  <button type="button" className="btn-primary" onClick={() => setStep(2)}>Next: Verify Passcode <i className="fa-solid fa-arrow-right"></i></button>
                </div>
              </div>
            )}

            {/* Step 2: Verify Passcode */}
            {step === 2 && (
              <form onSubmit={handleVerifyStep} style={{ animation: 'fadeIn 0.3s ease' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Enter the 6-digit code currently displayed in your Authenticator app to confirm setup:
                </p>

                {error && <p className="tfa-error-msg"><i className="fa-solid fa-circle-exclamation"></i> {error}</p>}

                <div className="form-field" style={{ maxWidth: '320px', margin: '0 auto 1.5rem' }}>
                  <label className="form-label" style={{ textAlign: 'center' }}>6-Digit Passcode</label>
                  <input
                    type="text"
                    className="form-input tfa-code-input"
                    placeholder="000000"
                    maxLength="6"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    required
                  />
                </div>

                <div className="wizard-action-footer">
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Back</button>
                  <button type="submit" className="btn-primary" disabled={verificationCode.length !== 6 || loading}>
                    {loading ? 'Verifying...' : 'Enable 2FA Authentication'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Backup Recovery Codes */}
            {step === 3 && (
              <div style={{ animation: 'fadeIn 0.3s ease' }}>
                <div className="tfa-status-banner active" style={{ marginBottom: '1.25rem' }}>
                  <i className="fa-solid fa-circle-check text-green"></i>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>2FA Enabled Successfully!</strong>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Save these single-use recovery codes in case you lose access to your authenticator device.</span>
                  </div>
                </div>

                <div className="tfa-backup-grid">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="tfa-backup-pill">
                      <span className="tfa-backup-idx">{idx + 1}.</span>
                      <span className="tfa-backup-val">{code}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleCopyBackupCodes}>
                    <i className={`fa-solid ${copiedBackup ? 'fa-check text-green' : 'fa-copy'}`}></i> {copiedBackup ? 'Copied All' : 'Copy Codes'}
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={handleDownloadBackupCodes}>
                    <i className="fa-solid fa-download"></i> Download .TXT
                  </button>
                </div>

                <div className="wizard-action-footer" style={{ marginTop: '1.5rem' }}>
                  <div></div>
                  <button type="button" className="btn-primary" onClick={onClose}>Done & Close</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
