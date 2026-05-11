import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  fetchAllUsers, groupByYearMonth, getAvailableYears,
  getGenderStats, getTopCountries, getAgeDistribution
} from './services/userApi';
import CustomTooltip from './components/CustomTooltip';
import StatCard from './components/StatCard';
import './App.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Connecting to data stream...');
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    const msgs = ['Connecting to data stream...','Fetching customer records...','Processing registrations...','Building analytics...'];
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % msgs.length; setLoadingMsg(msgs[i]); }, 900);
    fetchAllUsers(600).then(data => {
      clearInterval(interval);
      setUsers(data);
      const years = getAvailableYears(data);
      setSelectedYear(years[0] || new Date().getFullYear());
      setLoading(false);
    });
    return () => clearInterval(interval);
  }, []);

  const byYearMonth = useMemo(() => groupByYearMonth(users), [users]);
  const years = useMemo(() => getAvailableYears(users), [users]);
  const genderStats = useMemo(() => getGenderStats(users), [users]);
  const topCountries = useMemo(() => getTopCountries(users, 5), [users]);
  const ageDist = useMemo(() => getAgeDistribution(users), [users]);

  const chartData = useMemo(() => {
    if (!selectedYear || !byYearMonth[selectedYear]) return MONTHS.map((m, i) => ({ month: i, label: m, users: 0 }));
    return byYearMonth[selectedYear].map((count, i) => ({ month: i, label: MONTHS[i], users: count }));
  }, [selectedYear, byYearMonth]);

  const yearTotal = useMemo(() => chartData.reduce((s, d) => s + d.users, 0), [chartData]);
  const peakMonth = useMemo(() => chartData.reduce((a, b) => b.users > a.users ? b : a, chartData[0] || { label: '-', users: 0 }), [chartData]);
  const avgPerMonth = useMemo(() => (yearTotal / 12).toFixed(1), [yearTotal]);

  if (loading) return (
    <div className="loader-wrap">
      <div className="loader-inner">
        <div className="loader-ring" />
        <div className="loader-text">{loadingMsg}</div>
        <div className="loader-sub">Customer Data Platform</div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div>
          <div className="header-eyebrow">ANALYTICS SUITE</div>
          <h1 className="header-title">Customer Data Platform</h1>
        </div>
        <div className="header-badge"><span className="live-dot" />{users.length.toLocaleString()} users loaded</div>
      </header>

      <div className="stats-row">
        <StatCard label="Total Users" value={users.length.toLocaleString()} sub="All time registrations" accent="#00d4ff" icon="◈" />
        <StatCard label={`${selectedYear} Signups`} value={yearTotal} sub={`~${avgPerMonth}/month avg`} accent="#7c3aed" icon="◉" />
        <StatCard label="Peak Month" value={peakMonth?.label || '-'} sub={`${peakMonth?.users || 0} registrations`} accent="#f59e0b" icon="▲" />
        <StatCard label="Gender Split" value={`${Math.round(genderStats.female / Math.max(users.length, 1) * 100)}% F`} sub={`${Math.round(genderStats.male / Math.max(users.length, 1) * 100)}% male`} accent="#10b981" icon="⬡" />
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-eyebrow">MONTHLY REGISTRATIONS</div>
            <h2 className="chart-title">Customer Growth — {selectedYear}</h2>
          </div>
          <select className="year-select" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={chartData} margin={{ top: 16, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="rgba(30,45,74,0.8)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#4a5f80', fontSize: 12, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fill: '#4a5f80', fontSize: 11, fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} dx={-4} allowDecimals={false} />
              <Tooltip content={<CustomTooltip year={selectedYear} />} cursor={{ stroke: 'rgba(0,212,255,0.15)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="users" stroke="#00d4ff" strokeWidth={2.5} fill="url(#areaGrad)"
                dot={{ r: 4, fill: '#080c14', stroke: '#00d4ff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: '#00d4ff', stroke: '#080c14', strokeWidth: 2, style: { filter: 'drop-shadow(0 0 8px #00d4ff)' } }}
              />
              {peakMonth?.label && <ReferenceLine x={peakMonth.label} stroke="rgba(245,158,11,0.25)" strokeDasharray="3 3" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="month-bars">
          {chartData.map((d, i) => {
            const max = Math.max(...chartData.map(x => x.users), 1);
            const pct = (d.users / max) * 100;
            return (
              <div key={i} className="month-bar-item">
                <div className="month-bar-track"><div className="month-bar-fill" style={{ height: `${pct}%` }} /></div>
                <span className="month-bar-val">{d.users}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bottom-row">
        <div className="info-card">
          <div className="info-card-title">TOP COUNTRIES</div>
          {topCountries.map(([country, count]) => {
            const pct = Math.round(count / users.length * 100);
            return (
              <div key={country} className="country-row">
                <span className="country-name">{country}</span>
                <div className="country-bar-wrap"><div className="country-bar" style={{ width: `${pct}%` }} /></div>
                <span className="country-count">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="info-card">
          <div className="info-card-title">AGE DISTRIBUTION</div>
          {Object.entries(ageDist).map(([bracket, count]) => {
            const pct = Math.round(count / users.length * 100);
            return (
              <div key={bracket} className="country-row">
                <span className="country-name">{bracket}</span>
                <div className="country-bar-wrap"><div className="country-bar" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }} /></div>
                <span className="country-count">{pct}%</span>
              </div>
            );
          })}
        </div>
        <div className="info-card">
          <div className="info-card-title">GENDER BREAKDOWN</div>
          <div className="gender-wrap">
            <div className="gender-donut-wrap">
              <svg viewBox="0 0 100 100" width={120} height={120}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e2d4a" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#00d4ff" strokeWidth="12"
                  strokeDasharray={`${(genderStats.female / Math.max(users.length,1)) * 251.2} 251.2`}
                  strokeDashoffset="62.8" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#7c3aed" strokeWidth="12"
                  strokeDasharray={`${(genderStats.male / Math.max(users.length,1)) * 251.2} 251.2`}
                  strokeDashoffset={`${62.8 - (genderStats.female / Math.max(users.length,1)) * 251.2}`}
                  transform="rotate(-90 50 50)" />
                <text x="50" y="54" textAnchor="middle" fill="#e2eaf8" fontSize="13" fontWeight="700" fontFamily="Syne">{users.length}</text>
                <text x="50" y="64" textAnchor="middle" fill="#4a5f80" fontSize="7" fontFamily="Syne">TOTAL</text>
              </svg>
            </div>
            <div className="gender-legend">
              <div className="gender-item"><span className="gender-dot" style={{ background: '#00d4ff' }} /><span>Female</span><span className="gender-num">{genderStats.female}</span></div>
              <div className="gender-item"><span className="gender-dot" style={{ background: '#7c3aed' }} /><span>Male</span><span className="gender-num">{genderStats.male}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
