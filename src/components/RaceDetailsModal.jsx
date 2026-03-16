import React from 'react';
import { X, Trophy, AlertTriangle, ChevronRight } from 'lucide-react';

export default function RaceDetailsModal({ race, highlightDriverId, onClose }) {
  if (!race) return null;

  const { race_config, strategies = {}, finishing_positions } = race;

  // Render a strategy flow visually
  const renderStrategyFlow = (pitStops, startTire) => {
    const stops = pitStops || [];
    if (stops.length === 0) {
      return (
        <span className={`badge tire-${startTire.toLowerCase()}`}>
          {startTire}
        </span>
      );
    }

    const flow = [];
    flow.push(
      <span key="start" className={`badge tire-${startTire.toLowerCase()}`}>
        {startTire}
      </span>
    );

    // Render pits
    stops.forEach((stop, idx) => {
      flow.push(
        <span key={`arrow-${idx}`} style={{ color: 'var(--text-muted)', margin: '0 4px' }}>
            <ChevronRight size={14} />
            <span style={{ fontSize: '0.7rem' }}>L{stop.lap}</span>
            <ChevronRight size={14} />
        </span>
      );
      flow.push(
        <span key={`stop-${idx}`} className={`badge tire-${stop.to_tire.toLowerCase()}`}>
          {stop.to_tire}
        </span>
      );
    });

    return <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>{flow}</div>;
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(5px)'
    }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{
        width: '90%', maxWidth: '1000px', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', padding: 0,
        overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Race {race.race_id} 
              <span className="badge">{race_config.track}</span>
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={24} />
          </button>
        </div>

        {/* Environment Bar */}
        <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-glass)' }}>
            <div><span style={{color: 'var(--text-muted)', fontSize:'0.85rem'}}>Laps</span> <br/><strong>{race_config.total_laps}</strong></div>
            <div><span style={{color: 'var(--text-muted)', fontSize:'0.85rem'}}>Track Temp</span> <br/><strong>{race_config.track_temp}°C</strong></div>
            <div><span style={{color: 'var(--text-muted)', fontSize:'0.85rem'}}>Base Pace</span> <br/><strong>{race_config.base_lap_time}s</strong></div>
            <div><span style={{color: 'var(--text-muted)', fontSize:'0.85rem'}}>Pit Penalty</span> <br/><strong>{race_config.pit_lane_time}s</strong></div>
        </div>

        {/* Leaderboard Body */}
        <div style={{ overflowY: 'auto', padding: '1.5rem' }} className="custom-scrollbar">
            <table className="data-table">
                <thead>
                    <tr>
                        <th style={{ width: '60px' }}>Pos</th>
                        <th style={{ width: '100px' }}>Driver</th>
                        <th>Strategy Flow</th>
                        <th style={{ textAlign: 'right' }}>Stops</th>
                    </tr>
                </thead>
                <tbody>
                    {finishing_positions.map((driverId, index) => {
                        // Find strategy object
                        const strat = Object.values(strategies).find(s => s.driver_id === driverId);
                        const isHighlighted = highlightDriverId === driverId;
                        const isPodium = index < 3;

                        return (
                            <tr key={driverId} style={{ 
                                backgroundColor: isHighlighted ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                                borderLeft: isHighlighted ? '3px solid var(--primary)' : '3px solid transparent'
                            }}>
                                <td style={{ fontWeight: isPodium ? 'bold' : 'normal', color: isPodium ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                    {index === 0 && <Trophy size={14} style={{ color: '#fbbf24', marginRight: '4px' }} />}
                                    P{index + 1}
                                </td>
                                <td>
                                    <span style={{ color: isHighlighted ? 'var(--primary)' : 'var(--text-main)', fontWeight: isHighlighted ? 'bold' : 'normal' }}>
                                        {driverId}
                                    </span>
                                </td>
                                <td>
                                    {strat ? renderStrategyFlow(strat.pit_stops, strat.starting_tire) : <span className="text-muted">Data Error</span>}
                                </td>
                                <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                                    {strat && strat.pit_stops ? strat.pit_stops.length : 0}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

      </div>
    </div>
  );
}
