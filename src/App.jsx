import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Database, Search, GitCompare, LayoutDashboard, Settings, GitPullRequest, Activity, Gamepad2 } from 'lucide-react';
import SearchView from './views/SearchView';
import CompareView from './views/CompareView';
import DashboardView from './views/DashboardView';
import ConfigView from './views/ConfigView';
import StrategyAnalyzerView from './views/StrategyAnalyzer';
import StintAnalyzerView from './views/StintAnalyzer';
import RaceSimulatorView from './views/RaceSimulator';

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
        <NavItem to="/stints" icon={Activity} label="Tire Degradation" />
        <NavItem to="/simulator" icon={Gamepad2} label="Parametric Engine" />
        
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

  const [compareState, setCompareState] = useState({
    raceConditionsA: [{ id: Date.now(), field: 'track', operator: 'equals', value: 'Suzuka' }],
    driverSetsA: [[{ id: Date.now(), field: 'driver_id', operator: 'equals', value: 'D001' }]],
    raceConditionsB: [{ id: Date.now()+1, field: 'track', operator: 'equals', value: 'Suzuka' }],
    driverSetsB: [[{ id: Date.now()+2, field: 'driver_id', operator: 'equals', value: 'D002' }]],
    resultsA: null,
    resultsB: null
  });

  const [strategyState, setStrategyState] = useState({
    track: '',
    lapsOp: '>=',
    lapsVal: '',
    tempOp: '=',
    tempVal: '',
    paceOp: '=',
    paceVal: '',
    results: null
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
            <Route path="/compare" element={
              <CompareView compareState={compareState} setCompareState={setCompareState} />
            } />
            <Route path="/strategy" element={
              <StrategyAnalyzerView strategyState={strategyState} setStrategyState={setStrategyState} />
            } />
            <Route path="/stints" element={<StintAnalyzerView />} />
            <Route path="/simulator" element={<RaceSimulatorView />} />
            <Route path="/config" element={<ConfigView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
