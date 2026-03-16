import React from 'react';
import { Plus, X, Filter } from 'lucide-react';

export const trackOptions = ['Suzuka', 'Monza', 'Silverstone', 'Spa', 'Monaco'];
export const tireOptions = ['SOFT', 'MEDIUM', 'HARD'];
export const driverOptions = Array.from({length: 20}, (_, i) => `D${String(i+1).padStart(3, '0')}`);
export const operators = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '!=' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
];

export default function QueryBuilder({ 
  title, 
  raceConditions, setRaceConditions, 
  driverSets, setDriverSets 
}) {
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

  return (
    <div>
      {title && <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>{title}</h3>}
      {/* Race Config Conditions */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="group-header">
          <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Filter size={18} className="text-secondary" style={{ color: 'var(--secondary)'}} />
            Race Config
          </h2>
          <button className="icon-btn" onClick={handleAddRaceCondition}><Plus size={16} /></button>
        </div>
        
        {raceConditions.map((cond) => (
          <div key={cond.id} className="condition-row">
            <select className="glass-select" style={{ flex: 1 }} value={cond.field} onChange={e => updateRaceCondition(cond.id, 'field', e.target.value)}>
              <option value="track">Track Name</option>
              <option value="total_laps">Total Laps</option>
              <option value="track_temp">Track Temp</option>
              <option value="base_lap_time">Base Lap Time</option>
            </select>
            <select className="glass-select" style={{ width: '60px', padding: '0.5rem' }} value={cond.operator} onChange={e => updateRaceCondition(cond.id, 'operator', e.target.value)}>
              {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
            </select>
            {(cond.field === 'track') ? (
                <select className="glass-select" style={{ flex: 1.5 }} value={cond.value} onChange={e => updateRaceCondition(cond.id, 'value', e.target.value)}>
                  <option value="">Any Track</option>
                  {trackOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            ) : (
                <input className="glass-input" style={{ flex: 1.5 }} type="text" placeholder="Value..." value={cond.value} onChange={e => updateRaceCondition(cond.id, 'value', e.target.value)} />
            )}
            <button className="icon-btn" onClick={() => handleRemoveRaceCondition(cond.id)}><X size={16} /></button>
          </div>
        ))}
        {raceConditions.length === 0 && <p style={{ fontSize:'0.75rem', color: 'var(--text-muted)' }}>No race conditions applied.</p>}
      </div>

      {/* Grid Condition Sets */}
      <div className="glass-panel">
        <div className="group-header" style={{ borderBottom: 'none', marginBottom: 0 }}>
          <h2 style={{ fontSize: '1rem', margin: 0 }}>Grid Slot Conditions</h2>
          <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize:'0.7rem' }} onClick={handleAddDriverSet}>
            <Plus size={12} /> Add Grid Slot
          </button>
        </div>
        
        {driverSets.map((set, sIdx) => (
          <div key={sIdx} className="condition-group" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div className="group-header" style={{ marginBottom: '0.5rem', paddingBottom: '0.25rem' }}>
              <span className="badge" style={{ fontSize: '0.65rem' }}>Grid Slot {sIdx + 1}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="icon-btn" style={{ padding: '0.15rem' }} onClick={() => handleAddDriverCondition(sIdx)}><Plus size={14} /></button>
                {driverSets.length > 1 && <button className="icon-btn" style={{ padding: '0.15rem', color: '#ef4444' }} onClick={() => handleRemoveDriverSet(sIdx)}><X size={14} /></button>}
              </div>
            </div>

            {set.map((cond) => (
              <div key={cond.id} className="condition-row" style={{ marginBottom: '0.5rem' }}>
                <select className="glass-select" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }} value={cond.field} onChange={e => updateDriverCondition(sIdx, cond.id, 'field', e.target.value)}>
                  <option value="driver_id">Starting Position</option>
                  <option value="finishing_position">Finishing Position</option>
                  <option value="starting_tire">Starting Tire</option>
                  <option value="pit_stops_count">Pit Stop Count</option>
                  <option value="pit_stop_tire">Pitted For Tire</option>
                  <option value="pit_stop_lap">Pitted On Lap</option>
                  <option value="pit_stop_event">Specific Pit Stop</option>
                </select>
                <select className="glass-select" style={{ width: '50px', padding: '0.5rem', fontSize: '0.75rem' }} value={cond.operator} onChange={e => updateDriverCondition(sIdx, cond.id, 'operator', e.target.value)}>
                  {operators.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                </select>
                
                {(cond.field === 'starting_tire' || cond.field === 'pit_stop_tire') ? (
                    <select className="glass-select" style={{ flex: 1.5, padding: '0.5rem', fontSize: '0.75rem' }} value={cond.value} onChange={e => updateDriverCondition(sIdx, cond.id, 'value', e.target.value)}>
                      <option value="">Any Tire</option>
                      {tireOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                ) : (cond.field === 'driver_id') ? (
                    <select className="glass-select" style={{ flex: 1.5, padding: '0.5rem', fontSize: '0.75rem' }} value={cond.value} onChange={e => updateDriverCondition(sIdx, cond.id, 'value', e.target.value)}>
                      <option value="">Any Position</option>
                      {driverOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                ) : (cond.field === 'pit_stop_event') ? (
                    <div style={{ display: 'flex', flex: 1.5, gap: '0.5rem' }}>
                      <input className="glass-input" style={{ width: '50%', padding: '0.5rem', fontSize: '0.75rem' }} type="text" placeholder="Lap..." value={cond.value} onChange={e => updateDriverCondition(sIdx, cond.id, 'value', e.target.value)} />
                      <select className="glass-select" style={{ width: '50%', padding: '0.5rem', fontSize: '0.75rem' }} value={cond.value2 || ''} onChange={e => updateDriverCondition(sIdx, cond.id, 'value2', e.target.value)}>
                        <option value="">Any Tire</option>
                        {tireOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                ) : (
                    <input className="glass-input" style={{ flex: 1.5, padding: '0.5rem', fontSize: '0.75rem' }} type="text" placeholder="Value..." value={cond.value} onChange={e => updateDriverCondition(sIdx, cond.id, 'value', e.target.value)} />
                )}
                <button className="icon-btn" style={{ padding: '0.15rem' }} onClick={() => handleRemoveDriverCondition(sIdx, cond.id)}><X size={14} /></button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
