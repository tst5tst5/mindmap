import React, { useCallback } from 'react';
import { getChildren, getRootNode } from '../dataModel';

const OutlinePanel = React.memo(({ nodes, theme, selectedId, onSelect, onClose }) => {
  const root = getRootNode(nodes);

  const renderNode = useCallback((node, depth = 0) => {
    const children = getChildren(nodes, node.id);
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id}>
        <div
          style={{
            padding: '5px 8px 5px ' + (depth * 16 + 8) + 'px',
            cursor: 'pointer',
            fontSize: '12px',
            color: isSelected ? theme.rootBg : theme.contextMenuItemColor,
            backgroundColor: isSelected ? theme.contextMenuItemHoverBg : 'transparent',
            fontWeight: isSelected ? '600' : depth === 0 ? '600' : '400',
            borderRadius: '4px',
            margin: '1px 4px',
            transition: 'background-color 0.1s',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = theme.contextMenuItemHoverBg; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? theme.contextMenuItemHoverBg : 'transparent'; }}
          onClick={() => onSelect(node.id)}
        >
          {node.collapsed && children.length > 0 && <span style={{ marginRight: '4px', opacity: 0.5 }}>▶</span>}
          {!node.collapsed && children.length > 0 && <span style={{ marginRight: '4px', opacity: 0.5 }}>▼</span>}
          {node.priority && <span style={{ marginRight: '2px', fontSize: '10px' }}>
            {['', '🔴', '🟠', '🟡', '🟢', '🔵'][node.priority] || ''}
          </span>}
          {node.text}
          {node.note && <span style={{ marginLeft: '4px', opacity: 0.4, fontSize: '10px' }}>📝</span>}
        </div>
        {!node.collapsed && children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  }, [nodes, selectedId, theme, onSelect]);

  if (!root) return null;

  return (
    <div style={{
      position: 'fixed',
      left: '20px',
      top: '62px',
      width: '260px',
      maxHeight: 'calc(100vh - 120px)',
      backgroundColor: theme.contextMenuBg,
      border: `1px solid ${theme.contextMenuBorder}`,
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${theme.separatorColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: theme.contextMenuItemColor }}>
          📋 大纲视图
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: theme.contextMenuItemColor,
            cursor: 'pointer', fontSize: '16px', padding: '0 4px',
          }}
        >✕</button>
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '6px 0',
      }}>
        {renderNode(root)}
      </div>
    </div>
  );
});

export default OutlinePanel;
