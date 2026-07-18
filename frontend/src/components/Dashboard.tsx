import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../config';
import {
  Users,
  UserCheck,
  UserX,
  Layers,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  deptCount: number;
  avgSalary: number;
}

export const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    active: 0,
    inactive: 0,
    deptCount: 0,
    avgSalary: 0,
  });
  const [deptData, setDeptData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [salaryData, setSalaryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all non-deleted employees (limit 1000) to compute stats on client
        const res = await fetch(`${API_BASE_URL}/api/employees?limit=1000`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const list = data.employees || [];

          // 1. Core Summary Stats
          const total = list.length;
          const active = list.filter((e: any) => e.status === 'Active').length;
          const inactive = total - active;
          const departments = Array.from(new Set(list.map((e: any) => e.department))).filter(Boolean);
          const deptCount = departments.length;
          
          const totalSalary = list.reduce((sum: number, e: any) => sum + (e.salary || 0), 0);
          const avgSalary = total > 0 ? Math.round(totalSalary / total) : 0;

          setStats({ total, active, inactive, deptCount, avgSalary });

          // 2. Department Chart Data
          const deptMap: { [key: string]: number } = {};
          list.forEach((e: any) => {
            if (e.department) {
              deptMap[e.department] = (deptMap[e.department] || 0) + 1;
            }
          });
          const parsedDept = Object.keys(deptMap).map((dept) => ({
            name: dept,
            'Number of Employees': deptMap[dept],
          }));
          setDeptData(parsedDept);

          // 3. Status Chart Data
          setStatusData([
            { name: 'Active', value: active },
            { name: 'Inactive', value: inactive },
          ]);

          // 4. Salary Range Chart Data
          let ranges = {
            '< 50k': 0,
            '50k - 100k': 0,
            '100k - 150k': 0,
            '> 150k': 0,
          };
          list.forEach((e: any) => {
            const sal = e.salary || 0;
            if (sal < 50000) ranges['< 50k']++;
            else if (sal <= 100000) ranges['50k - 100k']++;
            else if (sal <= 150000) ranges['100k - 150k']++;
            else ranges['> 150k']++;
          });
          const parsedSalary = Object.keys(ranges).map((range) => ({
            range,
            Count: ranges[range as keyof typeof ranges],
          }));
          setSalaryData(parsedSalary);
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const COLORS = ['#10b981', '#ef4444'];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading analytics dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Welcome Title */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Real-time overview of organization health, staff roles, and hierarchy metrics.</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid-4">
        {/* Total Employees */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Employees
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</span>
          </div>
        </div>

        {/* Active Employees */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UserCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
              Active Employees
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{stats.active}</span>
          </div>
        </div>

        {/* Inactive Employees */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--error-light)',
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UserX size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
              Inactive Employees
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>{stats.inactive}</span>
          </div>
        </div>

        {/* Departments */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Layers size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
              Departments
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.deptCount}</span>
          </div>
        </div>
      </div>

      {/* Analytical Charts */}
      <div className="grid-2" style={{ marginTop: '1rem' }}>
        {/* Department Distribution */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="var(--primary)" />
            <span>Employees by Department</span>
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                  <Bar dataKey="Number of Employees" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p style={{ color: 'var(--text-muted)' }}>No department data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Salary Distribution */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--secondary)" />
            <span>Salary Distribution ($)</span>
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            {stats.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="range" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                  <Bar dataKey="Count" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <p style={{ color: 'var(--text-muted)' }}>No salary data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Active vs Inactive ratio */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Employment Status Ratio</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '2rem' }}>
            {stats.total > 0 ? (
              <>
                <div style={{ width: '160px', height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {statusData.map((entry, index) => (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: COLORS[index] }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {entry.name}: <strong>{entry.value}</strong> ({Math.round((entry.value / stats.total) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No statistics data available</p>
            )}
          </div>
        </div>

        {/* Avg Salary card info */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
            Corporate Compensation
          </span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>
            ${stats.avgSalary.toLocaleString()}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', fontSize: '0.9rem' }}>
            Average salary package across all active operational departments and management layers.
          </p>
          <div style={{
            fontSize: '0.75rem',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--border-radius-sm)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}>
            Updated in real-time
          </div>
        </div>
      </div>
    </div>
  );
};
