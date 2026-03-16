import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Activity, Database, Trophy, Flag, Timer } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const PIE_COLORS = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444'];
const BAR_COLORS = ['#3b82f6', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#10b981', '#f43f5e', '#884dff'];

export default function DashboardView() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stats');
        const data = await res.json();
        
        if (data && data.success) {
           setStats(data);
        }
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGlobalStats();
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
         <div className="animate-pulse" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>Aggregating 30,000 Simulation Records...</div>
      </div>
    );
  }

  const { overview, charts } = stats;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Global Overview Dashboard</h1>
          <p>Advanced metrics and aggregation across the entire simulation database.</p>
        </div>
        <div className="badge" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: 'rgba(59, 130, 246, 0.1)' }}>
          <Activity size={18} style={{ marginRight: '0.5rem' }} /> Server Online
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
           <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: 'var(--primary)' }}>
             <Database size={32} />
           </div>
           <div>
             <span className="stats-value" style={{ fontSize: '2rem', display: 'block', textAlign: 'left' }}>
               {overview.totalRaces.toLocaleString()}
             </span>
             <span className="stats-label">Total Races Simulated</span>
           </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
           <div style={{ padding: '1rem', background: 'rgba(20, 184, 166, 0.2)', borderRadius: '12px', color: 'var(--accent)' }}>
             <Trophy size={32} />
           </div>
           <div>
             <span className="stats-value" style={{ fontSize: '2rem', display: 'block', textAlign: 'left', color: 'var(--accent)' }}>
               {overview.totalPositionsTracked.toLocaleString()}
             </span>
             <span className="stats-label">Grid Positions Tracked</span>
           </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
           <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '12px', color: 'var(--secondary)' }}>
             <Flag size={32} />
           </div>
           <div>
             <span className="stats-value" style={{ fontSize: '2rem', display: 'block', textAlign: 'left', color: 'var(--secondary)' }}>
               {overview.uniqueTracks.toLocaleString()}
             </span>
             <span className="stats-label">Track Configurations</span>
           </div>
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
           <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '12px', color: '#f59e0b' }}>
             <Timer size={32} />
           </div>
           <div>
             <span className="stats-value" style={{ fontSize: '2rem', display: 'block', textAlign: 'left', color: '#f59e0b' }}>
               {overview.totalLapsSimulated.toLocaleString()}
             </span>
             <span className="stats-label">Total Laps Driven</span>
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', marginBottom: '2rem' }}>
        
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>Starting Grid Performance (Total Wins)</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Top 10 most successful starting positions across all tracked simulations.</p>
          
          <div style={{ height: '350px', width: '100%' }}>
            {charts.gridLeaderboard && charts.gridLeaderboard.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.gridLeaderboard.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                  <YAxis dataKey="position" type="category" stroke="var(--text-muted)" tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="wins" fill="var(--primary)" barSize={20} radius={[0, 4, 4, 0]}>
                    {charts.gridLeaderboard.slice(0,10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>Tire Strategy Preference</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Overall selected starting tires across all grid slots.</p>
          
          <div style={{ height: '350px', width: '100%' }}>
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={charts.tirePreferences}
                   cx="50%"
                   cy="45%"
                   labelLine={false}
                   innerRadius={60}
                   outerRadius={100}
                   fill="#8884d8"
                   dataKey="value"
                 >
                   {charts.tirePreferences.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                 />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Full Track Database Distribution</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Visualizing distribution scale across all {overview.totalRaces.toLocaleString()} dataset records globally.
        </p>
        
        <div style={{ height: '350px', width: '100%' }}>
          {charts.trackDistribution && charts.trackDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.trackDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--primary)" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>

    </div>
  );
}
