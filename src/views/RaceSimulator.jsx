import React, { useState } from 'react';
import { Crosshair, Play, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function RaceSimulatorView() {
    const [raceIdStart, setRaceIdStart] = useState('00001');
    const [raceIdEnd, setRaceIdEnd] = useState('00001');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

        // Default Starting Constants (To be dialed in by user)
    const [constants, setConstants] = useState({
        SOFT_SPEED: -1.2,
        SOFT_DEG: 0.15,
        SOFT_WINDOW: 3,
        MEDIUM_SPEED: 0.0,
        MEDIUM_DEG: 0.08,
        MEDIUM_WINDOW: 5,
        HARD_SPEED: 1.5,
        HARD_DEG: 0.04,
        HARD_WINDOW: 10,
        INTERMEDIATE_SPEED: 5.0,
        INTERMEDIATE_DEG: 0.20,
        INTERMEDIATE_WINDOW: 2,
        WET_SPEED: 8.0,
        WET_DEG: 0.10,
        WET_WINDOW: 4,
        NOMINAL_TEMP: 26.0,
        TEMP_SENSITIVITY: 0.05
    });

    const handleConstantChange = (field, val) => {
        setConstants(prev => ({ ...prev, [field]: Number(val) }));
    };

    const simulateRace = async () => {
        if (!raceIdStart) return;
        setLoading(true);
        try {
            const res = await fetch('/api/simulator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ raceIdStart, raceIdEnd, constants })
            });
            const data = await res.json();
            if (data.success) {
                setResults(data);
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error("Simulation failed", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Parametric Race Engine</h1>
                    <p>Re-simulate any historical race using arbitrary mathematical constants to cross-reference physics accuracy.</p>
                </div>
                <div className="badge" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: 'rgba(56, 189, 248, 0.1)' }}>
                    <Crosshair size={18} style={{ marginRight: '0.5rem', color: '#38bdf8' }} /> Physics Sandbox
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '2rem', alignItems: 'start' }}>
                
                {/* Constants Configuration Panel */}
                <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '2rem' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Simulation Engine</h3>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label className="input-label" style={{ display: 'block', marginBottom: '0.25rem' }}>Start Race ID</label>
                                <input type="text" className="glass-input" style={{ width: '100%' }} value={raceIdStart} onChange={e => setRaceIdStart(e.target.value)} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="input-label" style={{ display: 'block', marginBottom: '0.25rem' }}>End Race ID</label>
                                <input type="text" className="glass-input" style={{ width: '100%' }} value={raceIdEnd} onChange={e => setRaceIdEnd(e.target.value)} />
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={simulateRace} disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                            {loading ? <span className="animate-pulse">Running Batch Simulation...</span> : <><Play size={18} /> Execute Engine</>}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '50vh', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                        
                        <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>GLOBAL PHYSICS</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Nominal Temp (°C)</label>
                            <input type="number" step="0.5" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.NOMINAL_TEMP} onChange={e => handleConstantChange('NOMINAL_TEMP', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Temp Multiplier</label>
                            <input type="number" step="0.01" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.TEMP_SENSITIVITY} onChange={e => handleConstantChange('TEMP_SENSITIVITY', e.target.value)} />
                        </div>

                        <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>COMPOUND: SOFT</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Pace Offset</label>
                            <input type="number" step="0.1" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.SOFT_SPEED} onChange={e => handleConstantChange('SOFT_SPEED', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Degradation Rate</label>
                            <input type="number" step="0.01" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.SOFT_DEG} onChange={e => handleConstantChange('SOFT_DEG', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Initial Peak Laps</label>
                            <input type="number" step="1" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.SOFT_WINDOW} onChange={e => handleConstantChange('SOFT_WINDOW', e.target.value)} />
                        </div>

                        <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>COMPOUND: MEDIUM</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Pace Offset</label>
                            <input type="number" step="0.1" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.MEDIUM_SPEED} onChange={e => handleConstantChange('MEDIUM_SPEED', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Degradation Rate</label>
                            <input type="number" step="0.01" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.MEDIUM_DEG} onChange={e => handleConstantChange('MEDIUM_DEG', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Initial Peak Laps</label>
                            <input type="number" step="1" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.MEDIUM_WINDOW} onChange={e => handleConstantChange('MEDIUM_WINDOW', e.target.value)} />
                        </div>

                        <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginTop: '1rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>COMPOUND: HARD</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Pace Offset</label>
                            <input type="number" step="0.1" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.HARD_SPEED} onChange={e => handleConstantChange('HARD_SPEED', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Degradation Rate</label>
                            <input type="number" step="0.01" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.HARD_DEG} onChange={e => handleConstantChange('HARD_DEG', e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="input-label" style={{ margin: 0 }}>Initial Peak Laps</label>
                            <input type="number" step="1" className="glass-input" style={{ width: '80px', padding: '0.5rem' }} value={constants.HARD_WINDOW} onChange={e => handleConstantChange('HARD_WINDOW', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Validation Results Panel */}
                <div>
                    {!results ? (
                       <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                           <Crosshair size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                           <h3>Awaiting Simulation Parameters</h3>
                           <p>Adjust the engine constraints on the left and run a simulation to verify your formulas against historical results.</p>
                       </div> 
                    ) : (
                        <div className="fade-in">
                            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
                                        {results.isRange ? `Simulation Complete: Range ${results.rangeStart} to ${results.rangeEnd}` : `Simulation Complete: Race ${results.raceId}`}
                                    </h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>Comparing Engine Predictions against Historic Dataset</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h2 style={{ margin: 0, color: results.accuracy === 100 ? '#22c55e' : 'var(--primary)', fontSize: '2.5rem' }}>
                                        {results.accuracy.toFixed(1)}%
                                    </h2>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mathematical Accuracy</span>
                                </div>
                            </div>

                            {results.isRange ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <CheckCircle size={48} style={{ opacity: 0.2, margin: '0 auto 1rem', color: results.accuracy === 100 ? '#22c55e' : 'var(--text-muted)' }} />
                                        <h3 style={{ color: 'var(--text-main)' }}>Batch Simulation Complete</h3>
                                        <p>Successfully ran Laplacian Engine against <strong>{results.racesCount}</strong> consecutive historical races.</p>
                                        <p>The constants you inputted yielded an aggregated accuracy of <strong style={{color: 'var(--primary)', fontSize: '1.25rem'}}>{results.accuracy.toFixed(1)}%</strong>.</p>
                                    </div>
                                    
                                    {results.batchData && results.batchData.length > 0 && (
                                        <div className="glass-panel" style={{ padding: '1.5rem' }}>
                                            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>Accuracy Over Range Trend</h4>
                                            <div style={{ height: '300px', width: '100%' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={results.batchData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <XAxis 
                                                            dataKey="raceId" 
                                                            stroke="var(--text-muted)" 
                                                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }} 
                                                            tickFormatter={(val) => val.replace('R','')}
                                                            minTickGap={30}
                                                        />
                                                        <YAxis 
                                                            stroke="var(--text-muted)" 
                                                            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                                                            domain={[0, 100]}
                                                            tickFormatter={(val) => `${val}%`}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-main)' }}
                                                            itemStyle={{ color: 'var(--primary)' }}
                                                            formatter={(value) => [`${value.toFixed(1)}%`, 'Accuracy']}
                                                            labelFormatter={(label) => `Race ID: ${label}`}
                                                        />
                                                        <Area type="monotone" dataKey="accuracy" stroke="var(--primary)" fillOpacity={1} fill="url(#colorAccuracy)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Pos</th>
                                                <th>Engine Prediction</th>
                                                <th>Historic Reality</th>
                                                <th style={{ textAlign: 'right' }}>Total Sim Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.results.map(row => (
                                                <tr key={row.position} style={{ backgroundColor: row.isMatch ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
                                                    <td style={{ color: 'var(--text-muted)' }}>P{row.position}</td>
                                                    <td>
                                                        <span style={{ 
                                                            color: row.isMatch ? '#22c55e' : 'var(--text-main)', 
                                                            fontWeight: row.isMatch ? '600' : '400',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem'
                                                        }}>
                                                            {row.isMatch && <CheckCircle size={14} />} {row.predicted}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: 'var(--text-muted)' }}>{row.actual}</td>
                                                    <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                                        {row.predictedTime.toFixed(3)}s
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
