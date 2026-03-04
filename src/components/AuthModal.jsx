import { useState } from 'react';
import { loginWithEmail, updateDisplayName } from '../utils/auth';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ onClose, isDisplayNamePrompt }) {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Display name prompt state
  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDisplayName = async (e) => {
    e.preventDefault();
    setNameError('');
    const name = displayName.trim();
    if (!name || name.length > 30) {
      setNameError('Name must be 1-30 characters');
      return;
    }
    setLoading(true);
    try {
      await updateDisplayName(name);
      await refreshUser();
      onClose();
    } catch (err) {
      setNameError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isDisplayNamePrompt) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>&times;</button>
          <h2 className="modal-title">Choose a Display Name</h2>
          <p className="auth-subtitle">This will appear on leaderboards.</p>
          <form onSubmit={handleSubmitDisplayName}>
            <input
              type="text"
              className="auth-input"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              autoFocus
            />
            {nameError && <p className="auth-error">{nameError}</p>}
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading || !displayName.trim()}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2 className="modal-title">Sign In</h2>

        {!sent ? (
          <>
            <p className="auth-subtitle">
              Enter your email to receive a sign-in link. No password needed.
            </p>
            <form onSubmit={handleSubmitEmail}>
              <input
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
              {error && <p className="auth-error">{error}</p>}
              <button className="btn btn-primary auth-submit" type="submit" disabled={loading || !email.trim()}>
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="auth-sent">
            <p className="auth-sent-icon">&#9993;</p>
            <p className="auth-sent-text">Check your email!</p>
            <p className="auth-sent-sub">
              We sent a sign-in link to <strong>{email}</strong>. Click it to log in.
            </p>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
