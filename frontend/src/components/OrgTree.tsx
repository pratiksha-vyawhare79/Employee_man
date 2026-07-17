import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GitFork, User, Award, Layers } from 'lucide-react';

interface OrgNode {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  status: string;
  role: string;
  profileImage?: string;
  children: OrgNode[];
}

export const OrgTree: React.FC = () => {
  const { token } = useAuth();
  const [treeData, setTreeData] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/organization/tree', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTreeData(data);
        if (data.length > 0) {
          setSelectedNode(data[0]); // Select first node by default
        }
      }
    } catch (err) {
      console.error('Error fetching org tree:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTree();
    }
  }, [token]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: OrgNode) => {
    const isActive = selectedNode?._id === node._id;

    return (
      <div className="org-tree-node" key={node._id}>
        <div
          className={`org-tree-card ${isActive ? 'active' : ''}`}
          onClick={() => setSelectedNode(node)}
        >
          {node.profileImage ? (
            <img
              src={`http://localhost:5000${node.profileImage}`}
              alt={node.name}
              className="org-tree-card-img"
            />
          ) : (
            <div className="org-tree-card-img" style={{
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              margin: '0 auto 0.5rem auto',
            }}>
              <User size={20} />
            </div>
          )}
          <div className="org-tree-card-name">{node.name}</div>
          <div className="org-tree-card-title">{node.designation}</div>
          <div className="org-tree-card-dept">{node.department}</div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="org-tree-nodes">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading organizational reporting tree...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Reporting Hierarchy</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Visualize operational chains of command and direct reporting paths.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Visual Org Chart Tree Panel */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          <div className="tree-container">
            <div className="org-tree">
              {treeData.length === 0 ? (
                <div style={{ padding: '3rem', color: 'var(--text-muted)' }}>
                  No active reporting connections configured. Make sure employees have managers assigned.
                </div>
              ) : (
                treeData.map((root) => (
                  <div key={root._id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    {renderTreeNode(root)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Selected Employee Detailed Sidebar Card */}
        {selectedNode && (
          <div className="glass-panel" style={{ width: '320px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              {selectedNode.profileImage ? (
                <img
                  src={`http://localhost:5000${selectedNode.profileImage}`}
                  alt={selectedNode.name}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', marginBottom: '0.75rem' }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  margin: '0 auto 0.75rem auto',
                }}>
                  <User size={36} />
                </div>
              )}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{selectedNode.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{selectedNode.designation}</p>
              <span className={`badge badge-active`} style={{ marginTop: '0.5rem', fontSize: '0.65rem' }}>
                {selectedNode.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ID:</span>
                <span style={{ fontWeight: 600 }}>{selectedNode.employeeId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                <span style={{ fontWeight: 600 }}>{selectedNode.department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>System Role:</span>
                <span style={{ fontWeight: 600 }}>{selectedNode.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span style={{ fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}>{selectedNode.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Direct Reports:</span>
                <span style={{ fontWeight: 600 }}>{selectedNode.children?.length || 0}</span>
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <GitFork size={14} color="var(--primary)" />
              <span>Click other card nodes in the chart to inspect their profiles.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
