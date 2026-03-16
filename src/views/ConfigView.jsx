import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, Database, Sliders, Monitor } from 'lucide-react';

export default function ConfigView() {
  const [activeTab, setActiveTab] = useState('storage');
  const [config, setConfig] = useState({ maxResponseLimit: 500 });
  const [saving, setSaving] = useState(false);
  const [flushing, setFlushing] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          setConfig(data.config);
        }
      })
      .catch(err => console.error("Failed to load config", err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        // Show lightweight toast or just release saving state 
        setTimeout(() => setSaving(false), 500);
      }
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  const handleFlush = async () => {
    if (!window.confirm("Are you sure you want to flush the Node.js memory cache?\nQueries will be temporarily disabled during the 3-5s reload window.")) return;
    
    setFlushing(true);
    try {
      await fetch('/api/config/flush', { method: 'POST' });
      alert("Cache successfully flushed and reloaded from disk.");
    } catch (err) {
      console.error(err);
      alert("Failed to flush cache.");
    } finally {
      setFlushing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>System Configuration</h1>
          <p>Manage application settings, thresholds, and performance tuning.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 3fr', gap: '2rem' }}>
        
        {/* Sidebar Tabs */}
        <div className="glass-panel" style={{ alignSelf: 'start', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={20} className="text-primary" style={{ color: 'var(--primary)' }} />
              Settings Menu
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button 
              className="btn btn-outline" 
              onClick={() => setActiveTab('storage')}
              style={{ border: 'none', borderRadius: 0, justifyContent: 'flex-start', padding: '1rem 1.5rem', 
                background: activeTab === 'storage' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: activeTab === 'storage' ? 'var(--primary)' : 'var(--text-muted)',
                borderLeft: `4px solid ${activeTab === 'storage' ? 'var(--primary)' : 'transparent'}`
              }}>
              <Database size={16} style={{ marginRight: '0.5rem' }} /> Data Storage
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => setActiveTab('api')}
              style={{ border: 'none', borderRadius: 0, justifyContent: 'flex-start', padding: '1rem 1.5rem',
                background: activeTab === 'api' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: activeTab === 'api' ? 'var(--primary)' : 'var(--text-muted)',
                borderLeft: `4px solid ${activeTab === 'api' ? 'var(--primary)' : 'transparent'}`
              }}>
              <Sliders size={16} style={{ marginRight: '0.5rem' }} /> API Thresholds
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => setActiveTab('ui')}
              style={{ border: 'none', borderRadius: 0, justifyContent: 'flex-start', padding: '1rem 1.5rem',
                background: activeTab === 'ui' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: activeTab === 'ui' ? 'var(--primary)' : 'var(--text-muted)',
                borderLeft: `4px solid ${activeTab === 'ui' ? 'var(--primary)' : 'transparent'}`
              }}>
              <Monitor size={16} style={{ marginRight: '0.5rem' }} /> UI Preferences
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="glass-panel">
          
          {activeTab === 'storage' && (
            <div className="fade-in">
              <h2 style={{ marginBottom: '1.5rem' }}>Data Caching Preferences</h2>
              
              <div className="condition-group" style={{ marginBottom: '2rem' }}>
                <div className="group-header">
                  <span className="badge">Memory Architecture</span>
                </div>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  The application currently caches all 30,000 JSON simulation files in node memory on startup. This zero-disk structure allows for near immediate querying, sub 100ms response times, and powerful aggregate statistics at the cost of intense RAM usage on the server.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                   <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', flex: 1, borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <span style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 'bold' }}>Active</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cache Status</span>
                   </div>
                   <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', flex: 1, borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <span style={{ display: 'block', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 'bold' }}>~500 MB</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est. RAM Footprint</span>
                   </div>
                </div>
              </div>

              <div className="condition-group" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
                <div className="group-header" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <AlertTriangle size={14} style={{ marginRight: '0.25rem' }} /> Danger Zone
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', color: '#fca5a5', lineHeight: '1.6' }}>
                  Flushing the cache clears the in-memory array and forces the Node instance to perform a highly intensive re-read of all disk assets. Queries will fail or stall temporarily until the 5 second load completes.
                </p>
                <button className="btn btn-danger" onClick={handleFlush} disabled={flushing}>
                   {flushing ? 'Re-reading Disk Data...' : 'Flush & Reload Memory Cache'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="fade-in">
              <h2 style={{ marginBottom: '1.5rem' }}>API Interaction Thresholds</h2>
              
              <div className="condition-group" style={{ marginBottom: '2rem' }}>
                <div className="group-header">
                  <span className="badge">Search Boundaries</span>
                </div>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  If a user queries for an empty or overly broad condition (for example, finding every race on "Suzuka"), thousands of matching JSON objects may attempt to cross the network and crash the browser window. Set a strict return limit to prevent this while keeping the metric aggregations accurate.
                </p>
                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                  <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Max JSON Payload Response Limit</label>
                  <select 
                    className="glass-select" 
                    value={config.maxResponseLimit} 
                    onChange={e => setConfig({ ...config, maxResponseLimit: e.target.value })}
                  >
                    <option value="100">Cap at 100 Entities</option>
                    <option value="500">Cap at 500 Entities (Recommended)</option>
                    <option value="1000">Cap at 1,000 Entities</option>
                    <option value="unlimited">Unlimited (Warning: Will crash browser on broad searches)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="fade-in">
              <h2 style={{ marginBottom: '1.5rem' }}>Visual & Interface Preferences</h2>
              
              <div className="condition-group">
                <div className="group-header">
                  <span className="badge">Theme Overrides</span>
                </div>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  The application is currently locked into Dark/Glassmorphism mode to fulfill styling requirements.
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <input type="checkbox" checked disabled id="glassCheckbox" />
                    <label htmlFor="glassCheckbox" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Force Glassmorphism GPU Rendering (Locked)</label>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
