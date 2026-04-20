import React from 'react';
import { THEMES } from '../theme';
import { LAYOUT_TYPES, LAYOUT_LABELS, PRIORITY_ICONS, MARKER_ICONS } from '../dataModel';

const Toolbar = React.memo(({
  theme,
  onUndo, onRedo, canUndo, canRedo,
  onAddChild, onAddSibling, onDelete, hasSelection, isRoot,
  onFitView, onCenterRoot, onZoomIn, onZoomOut, onZoomReset, scale,
  onNewFile, onExport, onImport,
  themeName, onThemeChange,
  layoutType, onLayoutChange,
  onToggleNote, onToggleOutline, showNote, showOutline,
  onToggleMarker, onSetPriority,
  searchText, onSearch, onSearchNext, searchResultCount, searchResultIdx,
}) => {
  const btn = {
    padding: '3px 8px',
    border: `1px solid ${theme.toolbarBtnBorder}`,
    borderRadius: '4px',
    backgroundColor: theme.toolbarBtnBg,
    color: theme.toolbarBtnColor,
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.12s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    whiteSpace: 'nowrap',
    lineHeight: '1.4',
  };

  const disBtn = { ...btn, color: theme.toolbarBtnDisabledColor, cursor: 'not-allowed', borderColor: 'transparent' };

  const sep = { width: '1px', height: '16px', backgroundColor: theme.separatorColor, margin: '0 2px', flexShrink: 0 };

  const rBtn = (label, onClick, disabled, icon, title) => (
    <button
      style={disabled ? disBtn : btn}
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      onMouseEnter={e => { if (!disabled) { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; e.target.style.borderColor = theme.toolbarBtnHoverBorder; } }}
      onMouseLeave={e => { e.target.style.backgroundColor = disabled ? 'transparent' : theme.toolbarBtnBg; e.target.style.borderColor = disabled ? 'transparent' : theme.toolbarBtnBorder; }}
    >
      {icon}{label}
    </button>
  );

  const activeBtn = (isActive) => ({
    ...btn,
    backgroundColor: isActive ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg,
    borderColor: isActive ? theme.toolbarBtnHoverBorder : theme.toolbarBtnBorder,
    fontWeight: isActive ? '600' : '400',
  });

  const scalePercent = Math.round(scale * 100);

  return (
    <div className="toolbar" style={{ backgroundColor: theme.toolbarBg, borderBottom: `1px solid ${theme.toolbarBorder}` }}>
      <div className="toolbar-row">
        <div className="toolbar-group">
          {rBtn('新建', onNewFile, false, '📄')}
          {rBtn('导入', onImport, false, '📂')}
          {rBtn('导出', onExport, false, '💾')}
        </div>
        <div style={sep} />
        <div className="toolbar-group">
          {rBtn('撤销', onUndo, !canUndo, '↩')}
          {rBtn('重做', onRedo, !canRedo, '↪')}
        </div>
        <div style={sep} />
        <div className="toolbar-group">
          {rBtn('子节点', onAddChild, !hasSelection, '➕', 'Tab')}
          {rBtn('兄弟', onAddSibling, !hasSelection || isRoot, '↗', 'Enter')}
          {rBtn('删除', onDelete, !hasSelection || isRoot, '🗑', 'Del')}
        </div>
        <div style={sep} />
        <div className="toolbar-group">
          {rBtn('适应', onFitView, false, '⊞')}
          {rBtn('居中', onCenterRoot, false, '⊕')}
          {rBtn('+', onZoomIn, false, null, '放大')}
          <span style={{ padding: '0 3px', fontSize: '11px', color: theme.toolbarBtnColor, minWidth: '32px', textAlign: 'center' }}>{scalePercent}%</span>
          {rBtn('-', onZoomOut, false, null, '缩小')}
        </div>
        <div style={sep} />
        <div className="toolbar-group">
          <button style={activeBtn(showNote)} onClick={onToggleNote} title="备注"
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = showNote ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
          >📝备注</button>
          <button style={activeBtn(showOutline)} onClick={onToggleOutline} title="大纲 (Ctrl+F)"
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = showOutline ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
          >📋大纲</button>
        </div>
        <div style={sep} />
        <div className="toolbar-group">
          <input
            type="text"
            value={searchText}
            onChange={e => onSearch(e.target.value)}
            placeholder="搜索..."
            style={{
              padding: '3px 6px',
              border: `1px solid ${theme.toolbarBtnBorder}`,
              borderRadius: '4px',
              backgroundColor: theme.toolbarBtnBg,
              color: theme.toolbarBtnColor,
              fontSize: '11px',
              width: '80px',
              outline: 'none',
            }}
          />
          {searchResultCount > 0 && (
            <span style={{ fontSize: '10px', color: theme.toolbarBtnColor }}>{searchResultIdx + 1}/{searchResultCount}</span>
          )}
          {searchResultCount > 1 && rBtn('▸', onSearchNext, false, null, '下一个')}
        </div>
        <div style={sep} />
        <div className="toolbar-group" style={{ gap: '1px' }}>
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              style={{
                padding: '2px 6px',
                border: `1px solid ${themeName === key ? theme.toolbarBtnHoverBorder : 'transparent'}`,
                borderRadius: '3px',
                backgroundColor: themeName === key ? theme.toolbarBtnHoverBg : 'transparent',
                color: theme.toolbarBtnColor,
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: themeName === key ? '600' : '400',
              }}
              onClick={() => onThemeChange(key)}
            >{t.name}</button>
          ))}
        </div>
      </div>

      <div className="toolbar-row">
        <div className="toolbar-group">
          <span style={{ fontSize: '10px', color: theme.toolbarBtnColor, opacity: 0.5, marginRight: '2px' }}>布局</span>
          {Object.entries(LAYOUT_TYPES).map(([key, type]) => (
            <button
              key={key}
              style={activeBtn(layoutType === type)}
              onClick={() => onLayoutChange(type)}
              onMouseEnter={e => { if (layoutType !== type) e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = layoutType === type ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
              title={LAYOUT_LABELS[type]}
            >{LAYOUT_LABELS[type]}</button>
          ))}
        </div>
        <div style={sep} />
        <div className="toolbar-group">
          <span style={{ fontSize: '10px', color: theme.toolbarBtnColor, opacity: 0.5, marginRight: '2px' }}>优先级</span>
          {onSetPriority && [1, 2, 3, 4, 5].map(p => (
            <button key={p} style={{ ...btn, padding: '2px 4px' }} onClick={() => onSetPriority(p)} title={`优先级 ${p}`}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = theme.toolbarBtnBg; }}
            >{PRIORITY_ICONS[p]}</button>
          ))}
        </div>
        <div style={sep} />
        <div className="toolbar-group">
          <span style={{ fontSize: '10px', color: theme.toolbarBtnColor, opacity: 0.5, marginRight: '2px' }}>标记</span>
          {onToggleMarker && Object.entries(MARKER_ICONS).map(([key, icon]) => (
            <button key={key} style={{ ...btn, padding: '2px 4px' }} onClick={() => onToggleMarker(key)} title={key}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = theme.toolbarBtnBg; }}
            >{icon}</button>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Toolbar;
