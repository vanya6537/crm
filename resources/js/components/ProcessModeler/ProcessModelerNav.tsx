import React from 'react';
import { Link } from '@inertiajs/react';
import './ProcessModelerNav.css';

export const ProcessModelerNav: React.FC = () => {
    return (
        <nav className="modeler-nav">
            <div className="nav-container">
                <div className="nav-brand">
                    <span className="nav-logo">⚡</span>
                    <span className="nav-title">Process Modeler</span>
                </div>

                <div className="nav-links">
                    <Link href="/designer" className="nav-link">
                        📐 Designer
                    </Link>
                    <Link href="/process-modeler" className="nav-link active">
                        ⚡ Full Modeler
                    </Link>
                    <Link href="/triggers" className="nav-link">
                        🔗 Triggers
                    </Link>
                </div>

                <div className="nav-right">
                    <Link href="/dashboard" className="nav-link-secondary">
                        Dashboard
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default ProcessModelerNav;
