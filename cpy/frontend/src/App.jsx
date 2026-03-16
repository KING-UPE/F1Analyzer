import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Database, Search, GitCompare, LayoutDashboard, Settings, GitPullRequest } from 'lucide-react';
import SearchView from './views/SearchView';
import CompareView from './views/CompareView';
import DashboardView from './views/DashboardView';
import ConfigView from './views/ConfigView';
import StrategyAnalyzerView from './views/StrategyAnalyzer';

function Sidebar() {
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link to={to} className={`nav-item ${location.pathname === to ? 'active' : ''}`}>
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Database size={28} className="text-primary" style={{ color: 'var(--primary)' }} />
        <span>F1 Analytics</span>
      </div>
      
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '2rem' }}>
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard View" />
        <NavItem to="/search" icon={Search} label="Advanced Search" />
        <NavItem to="/compare" icon={GitCompare} label="Side-by-Side Compare" />
        <NavItem to="/strategy" icon={GitPullRequest} label="Strategy Analyzer" />
        
        <div style={{ marginTop: 'auto' }}>
          <NavItem to="/config" icon={Settings} label="Configuration" />
        </div>
      </nav>
    </div>
  );
}

function App() {
  const [searchState, setSearchState] = useState({
    raceConditions: [{ id: Date.now(), field: 'track', operator: 'equals', value: 'Suzuka' }],
    driverSets: [[{ id: Date.now(), field: 'starting_tire', operator: 'equals', value: 'SOFT' }]],
    results: null,
    matchLogic: 'ALL'
  });

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/search" element={
              <SearchView searchState={searchState} setSearchState={setSearchState} />
            } />
            <Route path="/compare" element={<CompareView />} />
            <Route path="/strategy" element={<StrategyAnalyzerView />} />
            <Route path="/config" element={<ConfigView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
