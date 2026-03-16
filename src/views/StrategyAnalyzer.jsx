import React, { useState, useEffect } from 'react';
import { GitPullRequest, Search, CheckCircle, ArrowUpRight, TrendingUp, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, AreaChart, Area } from 'recharts';

export const trackOptions = ['Suzuka', 'Monza', 'Silverstone', 'Spa', 'Monaco'];

// Helper to color code finish positions
const getPositionColor = (pos) => {
    if (pos === 1) return '#eab308'; // Gold
    if (pos <= 3) return '#94a3b8';  // Silver/Bronze
    if (pos <= 5) return '#3b82f6';  // Blue
    return 'var(--text-muted)';
};

export default function StrategyAnalyzerView({ strategyState, setStrategyState }) {
  const { track, lapsOp, lapsVal, tempOp, tempVal, paceOp, paceVal, results } = strategyState;
  const [loading, setLoading] = useState(false);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownResults, setDrilldownResults] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedSignature, setSelectedSignature] = useState(null);

  const setTrack = (val) => setStrategyState(prev => ({ ...prev, track: typeof val === 'function' ? val(prev.track) : val }));
  const setLapsOp = (val) => setStrategyState(prev => ({ ...prev, lapsOp: typeof val === 'function' ? val(prev.lapsOp) : val }));
  const setLapsVal = (val) => setStrategyState(prev => ({ ...prev, lapsVal: typeof val === 'function' ? val(prev.lapsVal) : val }));
  const setTempOp = (val) => setStrategyState(prev => ({ ...prev, tempOp: typeof val === 'function' ? val(prev.tempOp) : val }));
  const setTempVal = (val) => setStrategyState(prev => ({ ...prev, tempVal: typeof val === 'function' ? val(prev.tempVal) : val }));
  const setPaceOp = (val) => setStrategyState(prev => ({ ...prev, paceOp: typeof val === 'function' ? val(prev.paceOp) : val }));
  const setPaceVal = (val) => setStrategyState(prev => ({ ...prev, paceVal: typeof val === 'function' ? val(prev.paceVal) : val }));
  const setResults = (val) => setStrategyState(prev => ({ ...prev, results: typeof val === 'function' ? val(prev.results) : val }));

  const handleReset = () => {
    setStrategyState({
      track: '',
      lapsOp: '>=',
      lapsVal: '',
      tempOp: '=',
      tempVal: '',
      paceOp: '=',
      paceVal: '',
      results: null
    });
    setDrilldownResults(null);
    setSelectedScenario(null);
    setSelectedSignature(null);
  };

  const getSignature = (driver) => {
      let sig = `START:${driver.starting_tire}`;
      if (driver.pit_stops && driver.pit_stops.length > 0) {
          const sorted = [...driver.pit_stops].sort((a,b) => a.lap - b.lap);
          sorted.forEach(s => { sig += ` -> L${s.lap}:${s.to_tire}`; });
      }
      return sig;
  };

  const fetchDrilldown = async (signature, scenario) => {
      setDrilldownLoading(true);
      setSelectedScenario(scenario);
      setSelectedSignature(signature);
      try {
          const res = await fetch('/api/strategy/drilldown', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ signature, scenario })
          });
          const data = await res.json();
          if (data && data.success) {
              setDrilldownResults(data.races);
          }
      } catch (err) {
          console.error("Drilldown failed", err);
      } finally {
          setDrilldownLoading(false);
      }
  };

  const fetchStrategies = async () => {
      setLoading(true);
      try {
          const payload = { 
            track, 
            lapsOp,
            lapsVal: lapsVal ? Number(lapsVal) : undefined,
            tempOp,
            tempVal: tempVal ? Number(tempVal) : undefined,
            paceOp,
            paceVal: paceVal ? Number(paceVal) : undefined
          };
          const res = await fetch('/api/strategy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data && data.success) {
              setResults(data);
          }
      } catch (err) {
          console.error("Strategy fetch failed", err);
      } finally {
          setLoading(false);
      }
  };

  // Initial load of global strategies
  useEffect(() => {
      fetchStrategies();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Strategy Analyzer</h1>
          <p>Group exact simulation patterns to discover mathematically dominant strategies.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={handleReset} disabled={loading}>
            <RefreshCw size={18} />
            <span>Reset Filters</span>
          </button>
          <div className="badge" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: 'rgba(139, 92, 246, 0.1)' }}>
            <TrendingUp size={18} style={{ marginRight: '0.5rem', color: 'var(--secondary)' }} /> Scenario Profiler
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', padding: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Scenario Filter: Track</label>
              <select className="glass-select" value={track} onChange={e => setTrack(e.target.value)}>
                  <option value="">All Tracks (Global)</option>
                  {trackOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
          </div>
          <div style={{ flex: '1 1 180px' }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Laps Run</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <select className="glass-select" style={{ width: '60px', padding: '0.5rem' }} value={lapsOp} onChange={e => setLapsOp(e.target.value)}>
                      <option value="=">=</option><option value="!=">!=</option><option value=">">&gt;</option><option value="<">&lt;</option><option value=">=">&gt;=</option><option value="<=">&lt;=</option>
                  </select>
                  <input type="number" className="glass-input" placeholder="e.g. 50" value={lapsVal || ''} onChange={e => setLapsVal(e.target.value)} />
              </div>
          </div>
          <div style={{ flex: '1 1 180px' }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Track Temp (°C)</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <select className="glass-select" style={{ width: '60px', padding: '0.5rem' }} value={tempOp} onChange={e => setTempOp(e.target.value)}>
                      <option value="=">=</option><option value="!=">!=</option><option value=">">&gt;</option><option value="<">&lt;</option><option value=">=">&gt;=</option><option value="<=">&lt;=</option>
                  </select>
                  <input type="number" className="glass-input" placeholder="e.g. 26" value={tempVal || ''} onChange={e => setTempVal(e.target.value)} />
              </div>
          </div>
          <div style={{ flex: '1 1 180px' }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Base Pace (s)</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <select className="glass-select" style={{ width: '60px', padding: '0.5rem' }} value={paceOp} onChange={e => setPaceOp(e.target.value)}>
                      <option value="=">=</option><option value="!=">!=</option><option value=">">&gt;</option><option value="<">&lt;</option><option value=">=">&gt;=</option><option value="<=">&lt;=</option>
                  </select>
                  <input type="number" step="0.1" className="glass-input" placeholder="e.g. 85.2" value={paceVal || ''} onChange={e => setPaceVal(e.target.value)} />
              </div>
          </div>
          <button className="btn btn-primary" onClick={fetchStrategies} disabled={loading} style={{ height: '42px', padding: '0 2rem' }}>
              {loading ? <span className="animate-pulse">Parsing...</span> : (
                  <>
                      <Search size={18} /> Generate Leaderboard
                  </>
              )}
          </button>
      </div>

      {results && (
          <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                 <div className="glass-panel" style={{ padding: '1rem' }}>
                     <span className="stats-value" style={{ fontSize: '1.5rem' }}>{results.totalRacesAnalyzed.toLocaleString()}</span>
                     <span className="stats-label">Races in Scenario</span>
                 </div>
                 <div className="glass-panel" style={{ padding: '1rem' }}>
                     <span className="stats-value" style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>{results.totalGridSlotsAnalyzed.toLocaleString()}</span>
                     <span className="stats-label">Grid Slots Parsed</span>
                 </div>
                 <div className="glass-panel" style={{ padding: '1rem' }}>
                     <span className="stats-value" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{results.uniqueStrategiesFound.toLocaleString()}</span>
                     <span className="stats-label">Unique Signatures Executed</span>
                 </div>
              </div>

              <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <GitPullRequest size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
                         Strategy Win Leaderboard
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                         Ranked by Absolute Win Rate across {results.totalRacesAnalyzed.toLocaleString()} simulations. Minimum occurrences required for statistical relevance.
                      </p>
                  </div>
                  
                  <div className="data-table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                      <table className="data-table">
                          <thead style={{ position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
                              <tr>
                                  <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                                  <th>Exact Strategy Signature</th>
                                  <th style={{ textAlign: 'right' }}>Win Rate %</th>
                                  <th style={{ textAlign: 'right' }}>Top 5 Finishes</th>
                                  <th style={{ textAlign: 'right' }}>Average Finish</th>
                                  <th style={{ textAlign: 'right' }}>Total Executions</th>
                              </tr>
                          </thead>
                          <tbody>
                              {results.leaderboard.map((strategy, idx) => (
                                  <tr 
                                      key={idx} 
                                      onClick={() => fetchDrilldown(strategy.signature, strategy.scenario)}
                                      style={{ 
                                          cursor: 'pointer',
                                          background: idx === 0 ? 'rgba(234, 179, 8, 0.05)' : 
                                                      idx === 1 ? 'rgba(148, 163, 184, 0.05)' : 'transparent',
                                          borderLeft: idx === 0 ? '4px solid #eab308' : 
                                                  idx === 1 ? '4px solid #94a3b8' : 
                                                  idx === 2 ? '4px solid #cd7f32' : '4px solid transparent'
                                  }}>
                                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: getPositionColor(idx + 1) }}>
                                          #{idx + 1}
                                      </td>
                                      <td style={{ fontFamily: 'monospace', color: 'var(--primary)', letterSpacing: '0.5px' }}>
                                          {strategy.signature}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: strategy.winRate > 15 ? '#10b981' : 'var(--text-main)' }}>
                                          {strategy.winRate.toFixed(2)}%
                                      </td>
                                      <td style={{ textAlign: 'right' }}>
                                          {strategy.top5Rate.toFixed(1)}%
                                      </td>
                                      <td style={{ textAlign: 'right', color: getPositionColor(strategy.avgFinish) }}>
                                          P{strategy.avgFinish.toFixed(1)}
                                      </td>
                                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                          {strategy.timesUsed.toLocaleString()} 
                                          <span style={{ fontSize: '0.7em', display: 'block', opacity: 0.5 }}>({strategy.useRate.toFixed(2)}% of grid)</span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* DRILLDOWN VIEW */}
              {drilldownLoading && <div style={{ marginTop: '2rem', textAlign: 'center' }}><span className="animate-pulse">Fetching raw race data...</span></div>}
              {drilldownResults && selectedScenario && !drilldownLoading && (
                  <div className="glass-panel slide-up" style={{ marginTop: '2rem', padding: 0, overflow: 'hidden' }}>
                      <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-glass)' }}>
                          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                             <Search size={20} /> Deep Dive: Head-to-Head Race Analysis
                          </h3>
                          <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.9rem' }}>
                             Showing up to 10 sample races where the <strong>{selectedSignature}</strong> strategy was executed in the exact following environment:
                          </p>
                          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                              <span className="badge">Track: {selectedScenario.track}</span>
                              <span className="badge">Laps: {selectedScenario.total_laps}</span>
                              <span className="badge">Temp: {selectedScenario.track_temp}°C</span>
                              <span className="badge">Base Pace: {selectedScenario.base_lap_time}s</span>
                          </div>
                      </div>

                      <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                          {drilldownResults.slice(0, 10).map((r, rIdx) => (
                              <div key={r.race_id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)' }}>Race ID: {r.race_id}</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                      {r.finishing_positions.slice(0, 5).map((dId, posIdx) => {
                                          const driver = Object.values(r.strategies).find(d => d.driver_id === dId);
                                          const sig = driver ? getSignature(driver) : 'UNKNOWN';
                                          const isTarget = sig === selectedSignature;
                                          return (
                                              <div key={dId} style={{ 
                                                  display: 'flex', alignItems: 'center', gap: '1rem', 
                                                  padding: '0.5rem', 
                                                  background: isTarget ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                                  borderRadius: '4px',
                                                  borderLeft: isTarget ? '3px solid var(--primary)' : '3px solid transparent'
                                              }}>
                                                  <span style={{ fontWeight: 'bold', color: getPositionColor(posIdx+1), minWidth: '30px' }}>P{posIdx+1}</span>
                                                  <span 
                                                      onClick={() => !isTarget && fetchDrilldown(sig, selectedScenario)}
                                                      style={{ 
                                                          fontFamily: 'monospace', 
                                                          fontSize: '0.85rem', 
                                                          color: isTarget ? 'var(--text-main)' : 'var(--text-muted)',
                                                          cursor: !isTarget ? 'pointer' : 'default',
                                                          textDecoration: !isTarget ? 'underline' : 'none',
                                                          transition: 'all 0.2s'
                                                      }}
                                                      onMouseOver={e => { if(!isTarget) e.target.style.color = 'var(--accent)'}}
                                                      onMouseOut={e => { if(!isTarget) e.target.style.color = 'var(--text-muted)'}}
                                                  >
                                                      {sig}
                                                  </span>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
