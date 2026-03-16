import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { trackOptions } from './StrategyAnalyzer';

const colors = {
    SOFT: '#ef4444',
    MEDIUM: '#eab308',
    HARD: '#ffffff',
    INTERMEDIATE: '#22c55e',
    WET: '#3b82f6'
};

export default function StintAnalyzerView() {
    const [track, setTrack] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    const fetchStints = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/stints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track })
            });
            const json = await res.json();
            if (json.success) {
                setData(json);
            }
        } catch (err) {
            console.error("Stint fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStints();
    }, []);

    // Transform global averages into an array for the BarChart
    const barData = data ? Object.entries(data.globalAverages).map(([comp, stats]) => ({
        name: comp,
        avgLifespan: stats.avgLifespan,
        optimalLifespan: stats.optimalLifespan,
        sampleSize: stats.sampleSize
    })).filter(c => c.sampleSize > 0) : [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Tire Degradation Profiler</h1>
                    <p>Scrape every individual tire stint to map compound lifespans and true optimal pitting windows.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className="btn btn-outline" onClick={() => { setTrack(''); setTimeout(fetchStints, 0); }} disabled={loading}>
                        <RefreshCw size={18} />
                        <span>Reset Scope</span>
                    </button>
                    <div className="badge" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: 'rgba(239, 68, 68, 0.1)' }}>
                        <Activity size={18} style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> Lifecycle Matrix
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', padding: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                    <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Track Scope (Optional)</label>
                    <select className="glass-select" value={track} onChange={e => setTrack(e.target.value)}>
                        <option value="">All Tracks (Global Profile)</option>
                        {trackOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary" onClick={fetchStints} disabled={loading} style={{ height: '42px', padding: '0 2rem' }}>
                    {loading ? <span className="animate-pulse">Profiling API...</span> : "Analyze Stints"}
                </button>
            </div>

            {data && (
                <div className="fade-in">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                       <div className="glass-panel" style={{ padding: '1rem' }}>
                           <span className="stats-value" style={{ fontSize: '1.5rem' }}>{data.totalRacesAnalyzed.toLocaleString()}</span>
                           <span className="stats-label">Races Scraped</span>
                       </div>
                       <div className="glass-panel" style={{ padding: '1rem' }}>
                           <span className="stats-value" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>{data.totalStintsAnalyzed.toLocaleString()}</span>
                           <span className="stats-label">Total Stints Processed</span>
                       </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        
                        {/* THE DEGRADATION CURVE: Track Temp vs Lifespan */}
                        <div className="glass-panel">
                            <h3 style={{ marginTop: 0, marginBottom: '0.25rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>Thermal Degradation Maps</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Average stint length (Laps) as Track Temperature increases.</p>
                            <div style={{ height: '400px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSOFT" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.SOFT} stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor={colors.SOFT} stopOpacity={0.1}/>
                                            </linearGradient>
                                            <linearGradient id="colorMEDIUM" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.MEDIUM} stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor={colors.MEDIUM} stopOpacity={0.1}/>
                                            </linearGradient>
                                            <linearGradient id="colorHARD" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={colors.HARD} stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor={colors.HARD} stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="temp" stroke="var(--text-muted)" tickFormatter={t => `${t}°C`} />
                                        <YAxis stroke="var(--text-muted)" label={{ value: 'Lifespan (Laps)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-glass)' }}
                                            formatter={(value, name) => [value ? value.toFixed(1) + ' laps' : 'N/A', name]}
                                        />
                                        <Legend />
                                        <Area type="monotone" dataKey="SOFT" stroke={colors.SOFT} fillOpacity={1} fill="url(#colorSOFT)" />
                                        <Area type="monotone" dataKey="MEDIUM" stroke={colors.MEDIUM} fillOpacity={1} fill="url(#colorMEDIUM)" />
                                        <Area type="monotone" dataKey="HARD" stroke={colors.HARD} fillOpacity={1} fill="url(#colorHARD)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* OPTIMAL LIFESPAN BAR CHART */}
                         <div className="glass-panel">
                            <h3 style={{ marginTop: 0, marginBottom: '0.25rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>Mathematical Pit Window</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Global Lifespan vs The "Optimal" Lifespan extracted purely from Podium Finishers.</p>
                            <div style={{ height: '400px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--text-muted)" />
                                        <YAxis stroke="var(--text-muted)" />
                                        <Tooltip 
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-glass)' }}
                                            formatter={(value) => [value.toFixed(1) + ' laps']}
                                        />
                                        <Legend />
                                        <Bar dataKey="avgLifespan" name="Avg Lifespan (All)" fill="rgba(148, 163, 184, 0.5)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="optimalLifespan" name="Optimal Window (Podiums)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
