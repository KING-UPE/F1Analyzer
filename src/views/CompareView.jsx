import React, { useState } from 'react';
import { GitCompare, RefreshCw } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import QueryBuilder from '../components/QueryBuilder';

export default function CompareView({ compareState, setCompareState }) {
  const { raceConditionsA, driverSetsA, raceConditionsB, driverSetsB, resultsA, resultsB } = compareState;
  const [loading, setLoading] = useState(false);

  // Setters to maintain QueryBuilder compatibility
  const setRaceConditionsA = (val) => setCompareState(prev => ({ ...prev, raceConditionsA: typeof val === 'function' ? val(prev.raceConditionsA) : val }));
  const setDriverSetsA = (val) => setCompareState(prev => ({ ...prev, driverSetsA: typeof val === 'function' ? val(prev.driverSetsA) : val }));
  const setRaceConditionsB = (val) => setCompareState(prev => ({ ...prev, raceConditionsB: typeof val === 'function' ? val(prev.raceConditionsB) : val }));
  const setDriverSetsB = (val) => setCompareState(prev => ({ ...prev, driverSetsB: typeof val === 'function' ? val(prev.driverSetsB) : val }));
  const setResultsA = (val) => setCompareState(prev => ({ ...prev, resultsA: typeof val === 'function' ? val(prev.resultsA) : val }));
  const setResultsB = (val) => setCompareState(prev => ({ ...prev, resultsB: typeof val === 'function' ? val(prev.resultsB) : val }));

  const handleReset = () => {
    setCompareState({
      raceConditionsA: [{ id: Date.now(), field: 'track', operator: 'equals', value: 'Suzuka' }],
      driverSetsA: [[{ id: Date.now(), field: 'driver_id', operator: 'equals', value: 'D001' }]],
      raceConditionsB: [{ id: Date.now()+1, field: 'track', operator: 'equals', value: 'Suzuka' }],
      driverSetsB: [[{ id: Date.now()+2, field: 'driver_id', operator: 'equals', value: 'D002' }]],
      resultsA: null,
      resultsB: null
    });
  };

  const handleCompare = async () => {
    setLoading(true);
    try {
      // Clean A
      const cleanRaceA = raceConditionsA.filter(c => c.value !== '');
      const cleanDriverA = driverSetsA.map(s => s.filter(c => c.value !== '')).filter(s => s.length > 0);
      const payloadA = {
        raceConditions: cleanRaceA.map(({ field, operator, value }) => ({ field, operator, value })),
        driverConditionsSets: cleanDriverA.map(set => set.map(({ field, operator, value }) => ({ field, operator, value })))
      };
      
      // Clean B
      const cleanRaceB = raceConditionsB.filter(c => c.value !== '');
      const cleanDriverB = driverSetsB.map(s => s.filter(c => c.value !== '')).filter(s => s.length > 0);
      const payloadB = {
        raceConditions: cleanRaceB.map(({ field, operator, value }) => ({ field, operator, value })),
        driverConditionsSets: cleanDriverB.map(set => set.map(({ field, operator, value }) => ({ field, operator, value })))
      };

      const [resA, resB] = await Promise.all([
        fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadA) }),
        fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadB) })
      ]);

      setResultsA(await resA.json());
      setResultsB(await resB.json());
    } catch (err) {
      console.error(err);
      alert('Compare failed');
    } finally {
      setLoading(false);
    }
  };

  const getRadarData = () => {
    if (!resultsA?.data || !resultsB?.data) return [];
    
    const getTargetEntityWinRate = (results) => {
      // Best guess for "the targeted driver" is from the first matched driver array
      // But Since a query can be broad, let's just look at how often ANY of the matched drivers won.
      let wins = 0;
      results.data.forEach(r => {
        if (r.matched_drivers.includes(r.finishing_positions[0])) wins++;
      });
      return results.totalMatchedRaces > 0 ? (wins / results.totalMatchedRaces) * 100 : 0;
    };

    const getTargetEntityTop5 = (results) => {
      let top5 = 0;
      results.data.forEach(r => {
        const top5Finishers = r.finishing_positions.slice(0, 5);
        if (r.matched_drivers.some(d => top5Finishers.includes(d))) top5++;
      });
      return results.totalMatchedRaces > 0 ? (top5 / results.totalMatchedRaces) * 100 : 0;
    };

    const data = [
      {
        subject: 'Win Rate %',
        'Side A': getTargetEntityWinRate(resultsA),
        'Side B': getTargetEntityWinRate(resultsB),
        fullMark: 100,
      },
      {
        subject: 'Total Matches Found',
        'Side A': resultsA.totalMatchedRaces,
        'Side B': resultsB.totalMatchedRaces,
        fullMark: Math.max(resultsA.totalMatchedRaces, resultsB.totalMatchedRaces, 1000),
      },
      {
        subject: 'Top 5 Finishes %',
        'Side A': getTargetEntityTop5(resultsA),
        'Side B': getTargetEntityTop5(resultsB),
        fullMark: 100,
      }
    ];

    return data;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Head-to-Head Compare</h1>
          <p>Construct two separate dynamic queries and compare the resulting datasets side-by-side.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={handleReset} disabled={loading}>
            <RefreshCw size={18} />
            <span>Reset Filters</span>
          </button>
          <button className="btn btn-primary" onClick={handleCompare} disabled={loading}>
            {loading ? <span className="animate-pulse">Analyzing...</span> : (
              <>
                <GitCompare size={18} />
                <span>Run Comparison</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dual Builders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ borderTop: '4px solid var(--primary)', paddingTop: '1rem' }}>
          <QueryBuilder 
            title="Entity A Params"
            raceConditions={raceConditionsA} setRaceConditions={setRaceConditionsA}
            driverSets={driverSetsA} setDriverSets={setDriverSetsA}
          />
        </div>
        
        <div style={{ borderTop: '4px solid var(--secondary)', paddingTop: '1rem' }}>
          <QueryBuilder 
            title="Entity B Params"
            raceConditions={raceConditionsB} setRaceConditions={setRaceConditionsB}
            driverSets={driverSetsB} setDriverSets={setDriverSetsB}
          />
        </div>
      </div>

      {/* Results */}
      {resultsA && resultsB && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
             <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Side A Summary</h3>
             <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
               <div>
                 <span style={{ fontSize: '2rem', fontWeight: 700 }}>{resultsA.totalMatchedRaces}</span>
                 <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Matching Races</p>
               </div>
             </div>
          </div>

          <div className="glass-panel" style={{ borderLeft: '4px solid var(--secondary)' }}>
             <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Side B Summary</h3>
             <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
               <div>
                 <span style={{ fontSize: '2rem', fontWeight: 700 }}>{resultsB.totalMatchedRaces}</span>
                 <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Matching Races</p>
               </div>
             </div>
          </div>

          {/* Combined Radar Chart */}
          <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
            <h3 style={{ marginBottom: '1rem' }}>Attributes Comparison</h3>
            <div style={{ height: '350px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 13 }} />
                  <PolarRadiusAxis angle={30} tick={false} axisLine={false} />
                  <Radar name="Side A" dataKey="Side A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.5} />
                  <Radar name="Side B" dataKey="Side B" stroke="var(--secondary)" fill="var(--secondary)" fillOpacity={0.5} />
                  <Legend />
                  <Tooltip 
                     contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
