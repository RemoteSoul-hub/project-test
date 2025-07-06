'use client';

import React, { useState, useEffect } from 'react';
import { isImpersonating, getImpersonatedUser, stopImpersonation } from '@/services/AuthService';

const ImpersonationBar = () => {
  const [impersonating, setImpersonating] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const checkImpersonation = () => {
      const currentlyImpersonating = isImpersonating();
      setImpersonating(currentlyImpersonating);
      if (currentlyImpersonating) {
        const user = getImpersonatedUser();
        setUserName(user ? user.name : 'Unknown User');
      } else {
        setUserName('');
      }
    };

    // Check immediately on mount
    checkImpersonation();

    // Optional: Listen for storage changes if impersonation might start/stop
    // without a full page reload (e.g., via other tabs). This is more complex.
    // window.addEventListener('storage', checkImpersonation);

    // return () => {
    //   window.removeEventListener('storage', checkImpersonation);
    // };
  }, []); // Empty dependency array means this runs once on mount

  const handleStopImpersonation = () => {
    stopImpersonation(true); // true to redirect back to admin/users after stopping
    // State will update on redirect/reload
  };

  if (!impersonating) {
    return null; // Don't render anything if not impersonating
  }

  return (
    // Removed fixed positioning classes
    <div className="bg-yellow-400 text-black p-3 text-center z-50 shadow-lg flex justify-between items-center">
      <span>
        ⚠️ You are currently impersonating <strong>{userName}</strong>.
      </span>
      <button
        onClick={handleStopImpersonation}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
      >
        Stop Impersonating
      </button>
    </div>
  );
};

export default ImpersonationBar;