import React, { useState } from 'react';
import { Search, Database, RefreshCw, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import QueryBuilder from '../components/QueryBuilder';

const COLORS = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444'];

function SearchView({ searchState, setSearchState }) {
  const { raceConditions, driverSets, results, matchLogic } = searchState;
  const [loading, setLoading] = useState(false);

  const setRaceConditions = (val) => setSearchState(prev => ({ ...prev, raceConditions: typeof val === 'function' ? val(prev.raceConditions) : val }));
  const setDriverSets = (val) => setSearchState(prev => ({ ...prev, driverSets: typeof val === 'function' ? val(prev.driverSets) : val }));
  const setResults = (val) => setSearchState(prev => ({ ...prev, results: typeof val === 'function' ? val(prev.results) : val }));
  const setMatchLogic = (val) => setSearchState(prev => ({ ...prev, matchLogic: typeof val === 'function' ? val(prev.matchLogic) : val }));

  const handleReset = () => {
    setSearchState({
      raceConditions: [{ id: Date.now(), field: 'track', operator: 'equals', value: 'Suzuka' }],
      driverSets: [[{ id: Date.now(), field: 'starting_tire', operator: 'equals', value: 'SOFT' }]],
      results: null,
      matchLogic: 'ALL'
    });
  };

  const handleAddRaceCondition = () => {
    setRaceConditions([...raceConditions, { id: Date.now(), field: 'track', operator: 'equals', value: '' }]);
  };

  const handleRemoveRaceCondition = (id) => {
    setRaceConditions(raceConditions.filter(c => c.id !== id));
  };

  const updateRaceCondition = (id, key, val) => {
    setRaceConditions(raceConditions.map(c => c.id === id ? { ...c, [key]: val } : c));
  };

  const handleAddDriverSet = () => {
    setDriverSets([...driverSets, [{ id: Date.now(), field: 'starting_tire', operator: 'equals', value: '' }]]);
  };

  const handleRemoveDriverSet = (index) => {
    const newSets = [...driverSets];
    newSets.splice(index, 1);
    setDriverSets(newSets);
  };

  const handleAddDriverCondition = (setIndex) => {
    const newSets = [...driverSets];
    newSets[setIndex].push({ id: Date.now(), field: 'starting_tire', operator: 'equals', value: '' });
    setDriverSets(newSets);
  };

  const handleRemoveDriverCondition = (setIndex, condId) => {
    const newSets = [...driverSets];
    newSets[setIndex] = newSets[setIndex].filter(c => c.id !== condId);
    setDriverSets(newSets);
  };

  const updateDriverCondition = (setIndex, condId, key, val) => {
    const newSets = [...driverSets];
    newSets[setIndex] = newSets[setIndex].map(c => c.id === condId ? { ...c, [key]: val } : c);
    setDriverSets(newSets);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Clean up empty conditions
      const cleanRaceConditions = raceConditions.filter(c => c.value !== '');
      const cleanDriverSets = driverSets.map(set => set.filter(c => c.value !== '')).filter(set => set.length > 0);

      const payload = {
        raceConditions: cleanRaceConditions.map(({ field, operator, value }) => ({ field, operator, value })),
        driverConditionsSets: cleanDriverSets.map(set => set.map(({ field, operator, value, value2 }) => ({ field, operator, value, value2 }))),
        matchLogic
      };

      const res = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const getChartData = () => {
    if (!results || !results.data) return { trackDist: [], tireDist: [] };
    
    const trackCounts = {};
    const winners = {};

    results.data.forEach(race => {
      const track = race.race_config.track;
      trackCounts[track] = (trackCounts[track] || 0) + 1;
      
      const winner = race.finishing_positions[0];
      winners[winner] = (winners[winner] || 0) + 1;
    });

    const trackDist = Object.keys(trackCounts).map(k => ({ name: k, value: trackCounts[k] }));
    const winnerDist = Object.keys(winners).map(k => ({ name: k, value: winners[k] })).sort((a,b)=>b.value-a.value).slice(0, 5);

    return { trackDist, winnerDist };
  };

  const charts = getChartData();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Advanced Search Builder</h1>
          <p>Construct complex queries querying over 30,000 F1 simulation records.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={handleReset} disabled={loading}>
            <RefreshCw size={18} />
            <span>Reset Filters</span>
          </button>
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? <span className="animate-pulse">Searching...</span> : (
              <>
                <Search size={18} />
                <span>Execute Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* left column - query builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={18} className="text-secondary" style={{ color: 'var(--secondary)' }} />
                  Match Behavior
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Do Multi-Grid Slot matches need to occur within the same race event?
                </p>
             </div>
             <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
                <button 
                  className={`btn ${matchLogic === 'ALL' ? 'btn-primary' : ''}`} 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: matchLogic === 'ALL' ? 'var(--primary)' : 'transparent', color: matchLogic === 'ALL' ? 'white' : 'var(--text-muted)' }}
                  onClick={() => setMatchLogic('ALL')}
                >
                  Same Race
                </button>
                <button 
                  className={`btn ${matchLogic === 'ANY' ? 'btn-primary' : ''}`} 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: matchLogic === 'ANY' ? 'var(--primary)' : 'transparent', color: matchLogic === 'ANY' ? 'white' : 'var(--text-muted)' }}
                  onClick={() => setMatchLogic('ANY')}
                >
                  Any Race
                </button>
             </div>
          </div>
          <QueryBuilder 
            raceConditions={raceConditions} setRaceConditions={setRaceConditions}
            driverSets={driverSets} setDriverSets={setDriverSets}
          />
        </div>

        {/* right column - results */}
        <div>
          {results ? (
            <div className="glass-panel" style={{ height: '100%' }}>
              <div className="results-header">
                <h2 style={{ margin:0 }}>Analysis Results</h2>
                <span className="badge" style={{ background: 'rgba(20, 184, 166, 0.2)', color: 'var(--accent)', border: '1px solid rgba(20, 184, 166, 0.4)'}}>
                  Found {results.totalMatchedRaces.toLocaleString()} matches
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="stats-card glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)' }}>
                  <span className="stats-value">{results.totalMatchedRaces}</span>
                  <span className="stats-label">Matching Races</span>
                </div>
                <div className="stats-card glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)' }}>
                  <span className="stats-value">~{(results.totalMatchedRaces / 30000 * 100).toFixed(1)}%</span>
                  <span className="stats-label">Dataset Share</span>
                </div>
              </div>

              {results.totalMatchedRaces > 0 && (
                <>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Track Distribution</h3>
                  <div className="chart-container" style={{ height: '220px', marginBottom: '2rem' }}>
                    {charts.trackDist && charts.trackDist.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.trackDist}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                          <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                             contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                             itemStyle={{ color: 'var(--primary)' }}
                          />
                          <Bar dataKey="value" fill="url(#colorPrimary)" radius={[4, 4, 0, 0]}>
                             {charts.trackDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        No chart data available
                      </div>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Sample Matched Races</h3>
                  <div className="data-table-container glass-panel" style={{ padding: 0, maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Race ID</th>
                          <th>Track</th>
                          <th>Matching Car IDs</th>
                          <th>Winning Car</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.data.slice(0, 50).map((r, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{r.race_id}</td>
                            <td>{r.race_config.track}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap:'wrap' }}>
                                {r.matched_drivers.map(d => (
                                  <span key={d} className="badge" style={{ fontSize:'0.65rem' }}>{d}</span>
                                ))}
                              </div>
                            </td>
                            <td style={{ color: 'var(--accent)'}}>{r.finishing_positions[0]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

            </div>
          ) : (
            <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
              <Database size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>Configure query parameters and execute search</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Data is loaded into memory, anticipating sub-100ms response times.</p>
            </div>
          )}
        </div>

      </div>

      {/* SVG Gradients for Charts */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.2}/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default SearchView;
