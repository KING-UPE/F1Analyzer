import React, { useState, useEffect } from 'react';
import { GitPullRequest, Search, CheckCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, AreaChart, Area } from 'recharts';

export const trackOptions = ['Suzuka', 'Monza', 'Silverstone', 'Spa', 'Monaco'];

// Helper to color code finish positions
const getPositionColor = (pos) => {
    if (pos === 1) return '#eab308'; // Gold
    if (pos <= 3) return '#94a3b8';  // Silver/Bronze
    if (pos <= 5) return '#3b82f6';  // Blue
    return 'var(--text-muted)';
};

export default function StrategyAnalyzerView() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [track, setTrack] = useState('');
  const [minLaps, setMinLaps] = useState('');

  const fetchStrategies = async () => {
      setLoading(true);
      try {
          const payload = { track, minLaps: minLaps ? Number(minLaps) : undefined };
          const res = await fetch('http://localhost:5000/api/strategy', {
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
        <div className="badge" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: 'rgba(139, 92, 246, 0.1)' }}>
          <TrendingUp size={18} style={{ marginRight: '0.5rem', color: 'var(--secondary)' }} /> Scenario Profiler
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', padding: '1.5rem' }}>
          <div style={{ flex: 1 }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Scenario Filter: Track</label>
              <select className="glass-select" value={track} onChange={e => setTrack(e.target.value)}>
                  <option value="">All Tracks (Global)</option>
                  {trackOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
          </div>
          <div style={{ flex: 1 }}>
              <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Minimum Laps Run</label>
              <input 
                  type="number" 
                  className="glass-input" 
                  placeholder="e.g. 50" 
                  value={minLaps} 
                  onChange={e => setMinLaps(e.target.value)}
              />
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
                                  <tr key={idx} style={{ 
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
          </div>
      )}
    </div>
  );
}
