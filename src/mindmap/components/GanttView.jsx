import React, { useMemo } from 'react';
import { getChildren, getRootNode } from '../dataModel';

const GanttView = React.memo(({ nodes, theme, onClose }) => {
  const root = getRootNode(nodes);
  const tasks = useMemo(() => {
    const result = [];
    const collect = (nodeId, depth = 0) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      if (node.task) {
        result.push({ id: node.id, text: node.text, depth, ...node.task });
      } else if (depth > 0) {
        result.push({ id: node.id, text: node.text, depth, startDate: '', endDate: '', progress: 0, assignee: '' });
      }
      getChildren(nodes, nodeId).forEach(c => collect(c.id, depth + 1));
    };
    if (root) collect(root.id);
    return result;
  }, [nodes, root]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: theme.canvasBg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 20px', borderBottom: `1px solid ${theme.toolbarBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.toolbarBg }}>
        <span style={{ fontSize: '16px', fontWeight: '600', color: theme.toolbarBtnColor }}>📊 甘特图视图</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.toolbarBtnColor, cursor: 'pointer', fontSize: '18px' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.hintColor, marginTop: '100px' }}>
            <p style={{ fontSize: '16px' }}>暂无任务数据</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>请在节点上右键 → 设置任务信息（开始/结束日期、进度、负责人）</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: theme.contextMenuItemColor, fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.separatorColor}` }}>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>任务名称</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>负责人</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>开始日期</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>结束日期</th>
                <th style={{ textAlign: 'left', padding: '8px 12px' }}>进度</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${theme.separatorColor}` }}>
                  <td style={{ padding: '8px 12px', paddingLeft: `${t.depth * 20 + 12}px` }}>{t.text}</td>
                  <td style={{ padding: '8px 12px' }}>{t.assignee || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>{t.startDate || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>{t.endDate || '-'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '8px', backgroundColor: theme.toolbarBtnBg, borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${t.progress || 0}%`, height: '100%', backgroundColor: '#6c5ce7', borderRadius: '4px' }} />
                      </div>
                      <span style={{ minWidth: '30px' }}>{t.progress || 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

export default GanttView;
