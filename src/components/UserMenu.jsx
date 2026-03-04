import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (!user) {
    return (
      <>
        <button className="btn-sign-in" onClick={() => setShowAuthModal(true)}>
          Sign In
        </button>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  return (
    <div className="user-menu-container">
      <button className="btn-user-menu" onClick={() => setShowMenu(!showMenu)}>
        {user.displayName}
      </button>
      {showMenu && (
        <div className="user-menu-dropdown">
          <div className="user-menu-email">{user.email}</div>
          <button
            className="user-menu-item"
            onClick={() => {
              logout();
              setShowMenu(false);
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
