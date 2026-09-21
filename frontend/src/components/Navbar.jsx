import React from 'react';
import { LifeBuoy } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-logo">
          <LifeBuoy size={20} />
        </div>
        <div>
          <span className="brand-name">Datastraw</span>
          <span className="brand-subtitle">Support CRM</span>
        </div>
      </div>
    </header>
  );
}
