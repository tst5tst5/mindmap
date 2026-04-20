import React from 'react';
import { LAYOUT_TYPES, LAYOUT_LABELS, PRIORITY_ICONS, MARKER_ICONS } from '../dataModel';

const ContextMenu = React.memo(({
  contextMenu, theme,
  onAddChild, onAddSibling, onDelete, onToggleCollapse,
  onFitView, onCenterRoot, onExport, onImport, onNewFile, onClose,
  isRoot, node,
  layoutType, onLayoutChange,
  onToggleMarker, onSetPriority, onToggleNote,
}) => {
  const itemStyle = {
    padding: '7px 14px',
    color: theme.contextMenuItemColor,
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'background-color 0.1s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const renderItem = (label, onClick, icon, shortcut) => (
    <div
      style={itemStyle}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.contextMenuItemHoverBg}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
      onClick={e => { e.stopPropagation(); onClick(); onClose(); }}
    >
      {icon && <span style={{ fontSize: '13px', width: '16px', textAlign: 'center' }}>{icon}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && <span style={{ fontSize: '10px', opacity: 0.5 }}>{shortcut}</span>}
    </div>
  );

  const sep = { height: '1px', backgroundColor: theme.separatorColor, margin: '3px 0' };

  const subMenuStyle = {
    padding: '2px 14px',
    color: theme.contextMenuItemColor,
    fontSize: '11px',
    fontWeight: '600',
    opacity: 0.5,
  };

  return (
    <div
      className="context-menu"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        backgroundColor: theme.contextMenuBg,
        border: `1px solid ${theme.contextMenuBorder}`,
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {contextMenu.type === 'node' ? (
        <>
          {renderItem('添加子节点', onAddChild, '➕', 'Tab')}
          {!isRoot && renderItem('添加兄弟节点', onAddSibling, '↗', 'Enter')}
          <div style={sep} />
          {node && getChildrenCount(node) > 0 && renderItem(
            node?.collapsed ? '展开子节点' : '折叠子节点',
            onToggleCollapse,
            node?.collapsed ? '📂' : '📁',
            'Space'
          )}
          {onToggleNote && renderItem('编辑备注', onToggleNote, '📝')}
          <div style={sep} />
          <div style={subMenuStyle}>优先级</div>
          <div style={{ display: 'flex', gap: '2px', padding: '2px 14px' }}>
            {onSetPriority && [1, 2, 3, 4, 5].map(p => (
              <span key={p} style={{ cursor: 'pointer', fontSize: '14px' }}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onSetPriority(p); onClose(); }}
              >{PRIORITY_ICONS[p]}</span>
            ))}
          </div>
          <div style={subMenuStyle}>标记</div>
          <div style={{ display: 'flex', gap: '2px', padding: '2px 14px', flexWrap: 'wrap' }}>
            {onToggleMarker && Object.entries(MARKER_ICONS).map(([key, icon]) => (
              <span key={key} style={{ cursor: 'pointer', fontSize: '14px' }}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onToggleMarker(key); onClose(); }}
                title={key}
              >{icon}</span>
            ))}
          </div>
          <div style={sep} />
          {!isRoot && renderItem('删除节点', onDelete, '🗑', 'Del')}
        </>
      ) : (
        <>
          {renderItem('新建脑图', onNewFile, '📄')}
          {renderItem('导入JSON', onImport, '📂')}
          {renderItem('导出JSON', onExport, '💾')}
          <div style={sep} />
          <div style={subMenuStyle}>布局结构</div>
          {Object.entries(LAYOUT_TYPES).map(([key, type]) => (
            <div
              key={key}
              style={{
                ...itemStyle,
                fontWeight: layoutType === type ? '600' : '400',
                backgroundColor: layoutType === type ? theme.contextMenuItemHoverBg : 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.contextMenuItemHoverBg}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = layoutType === type ? theme.contextMenuItemHoverBg : 'transparent'}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={e => { e.stopPropagation(); onLayoutChange(type); onClose(); }}
            >
              <span style={{ width: '16px', textAlign: 'center' }}>{layoutType === type ? '●' : '○'}</span>
              {LAYOUT_LABELS[type]}
            </div>
          ))}
          <div style={sep} />
          {renderItem('适应窗口', onFitView, '⊞')}
          {renderItem('居中根节点', onCenterRoot, '⊕')}
        </>
      )}
    </div>
  );
});

function getChildrenCount(node) {
  return node?.collapsed ? 0 : 1;
}

export default ContextMenu;
