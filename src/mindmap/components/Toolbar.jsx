import React, { useState, useEffect, useRef } from 'react';
import { THEMES } from '../theme';
import { LAYOUT_TYPES, LAYOUT_LABELS, PRIORITY_ICONS, MARKER_ICONS, STICKER_LIST, COLOR_SCHEMES, TEMPLATES } from '../dataModel';

const Toolbar = React.memo(({
  theme,
  onUndo, onRedo, canUndo, canRedo,
  onAddChild, onAddSibling, onDelete, hasSelection, isRoot,
  onFitView, onCenterRoot, onZoomIn, onZoomOut, onZoomReset, scale,
  onNewFile, onExport, onImport, onExportPNG, onExportSVG, onExportMarkdown, onPrint, onMerge,
  themeName, onThemeChange,
  layoutType, onLayoutChange,
  onToggleNote, onToggleOutline, showNote, showOutline,
  onToggleMarker, onSetPriority,
  onToggleCheckbox, onAddLabel, onSetLink, onSetSticker, onSetTask,
  onStartLink, isLinking, onDeleteRelationship, hasSelectedRel,
  onToggleZen, onToggleGantt, onTogglePresentation,
  onFocusBranch, onUnfocusBranch, focusBranchId,
  onToggleNumbering, showNumbering,
  onToggleSketchy, sketchyMode,
  colorSchemeIdx, onColorSchemeChange, colorSchemes,
  onNewFromTemplate, templates,
  filter, onFilterChange,
  searchText, onSearch, onSearchNext, searchResultCount, searchResultIdx,
  canvasName, onCanvasNameChange,
}) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [labelInput, setLabelInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [taskForm, setTaskForm] = useState({ startDate: '', endDate: '', progress: 0, assignee: '' });
  const toolbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menuName) => {
    setOpenMenu(prev => prev === menuName ? null : menuName);
  };

  const closeMenu = () => setOpenMenu(null);

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

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: theme.contextMenuBg,
    border: `1px solid ${theme.contextMenuBorder}`,
    borderRadius: '8px',
    padding: '4px 0',
    zIndex: 300,
    minWidth: '120px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  };

  const dropdownItem = {
    padding: '5px 12px',
    color: theme.contextMenuItemColor,
    cursor: 'pointer',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  };

  const renderDropdownItem = (label, onClick) => (
    <div key={label} style={dropdownItem}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.contextMenuItemHoverBg}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      onClick={e => { e.stopPropagation(); onClick(); closeMenu(); }}
    >{label}</div>
  );

  const scalePercent = Math.round(scale * 100);

  return (
    <div className="toolbar" ref={toolbarRef} style={{ backgroundColor: theme.toolbarBg, borderBottom: `1px solid ${theme.toolbarBorder}` }}>
      <div className="toolbar-row">
        <div className="toolbar-group">
          {rBtn('新建', onNewFile, false, '📄')}
          <div style={{ position: 'relative' }}>
            <button style={openMenu === 'template' ? activeBtn(true) : btn} onClick={() => toggleMenu('template')}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = openMenu === 'template' ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
            >📋模板▾</button>
            {openMenu === 'template' && (
              <div style={dropdownStyle}>
                {templates && Object.entries(templates).map(([key, t]) => (
                  renderDropdownItem(t.name, () => onNewFromTemplate(key))
                ))}
              </div>
            )}
          </div>
          {rBtn('导入', onImport, false, '📂')}
          <div style={{ position: 'relative' }}>
            <button style={openMenu === 'export' ? activeBtn(true) : btn} onClick={() => toggleMenu('export')}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = openMenu === 'export' ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
            >💾导出▾</button>
            {openMenu === 'export' && (
              <div style={dropdownStyle}>
                {renderDropdownItem('JSON', onExport)}
                {renderDropdownItem('PNG 图片', onExportPNG)}
                {renderDropdownItem('SVG 矢量', onExportSVG)}
                {renderDropdownItem('Markdown', onExportMarkdown)}
                <div style={{ height: '1px', backgroundColor: theme.separatorColor, margin: '2px 0' }} />
                {renderDropdownItem('合并导入...', onMerge)}
                {renderDropdownItem('🖨 打印', onPrint)}
              </div>
            )}
          </div>
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
          {onStartLink && rBtn(isLinking ? '取消关联' : '🔗关联', isLinking ? () => onStartLink(null) : onStartLink, false, null, '关联线')}
          {onDeleteRelationship && rBtn('删关联', onDeleteRelationship, false, '✂', '删除关联线')}
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
          <button style={activeBtn(showOutline)} onClick={onToggleOutline} title="大纲"
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = showOutline ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
          >📋大纲</button>
          <button style={activeBtn(showNumbering)} onClick={onToggleNumbering} title="编号"
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = showNumbering ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
          >🔢编号</button>
        </div>
        <div style={sep} />
        <div className="toolbar-group">
          <button style={activeBtn(sketchyMode)} onClick={onToggleSketchy} title="手绘风格"
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = sketchyMode ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
          >✏️手绘</button>
          {onToggleCheckbox && rBtn('☑待办', onToggleCheckbox, !hasSelection, null, '切换待办')}
          {showLabelInput ? (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <input value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="标签"
                onKeyDown={e => { if (e.key === 'Enter' && labelInput.trim() && onAddLabel) { onAddLabel(labelInput.trim()); setLabelInput(''); setShowLabelInput(false); } if (e.key === 'Escape') setShowLabelInput(false); }}
                style={{ padding: '2px 4px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor, fontSize: '10px', width: '60px', outline: 'none' }}
                autoFocus />
            </div>
          ) : (
            onAddLabel && rBtn('🏷标签', () => setShowLabelInput(true), !hasSelection, null, '添加标签')
          )}
          {showLinkInput ? (
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="链接URL"
                onKeyDown={e => { if (e.key === 'Enter' && linkInput.trim() && onSetLink) { onSetLink(linkInput.trim()); setLinkInput(''); setShowLinkInput(false); } if (e.key === 'Escape') setShowLinkInput(false); }}
                style={{ padding: '2px 4px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor, fontSize: '10px', width: '80px', outline: 'none' }}
                autoFocus />
            </div>
          ) : (
            onSetLink && rBtn('🔗链接', () => setShowLinkInput(true), !hasSelection, null, '设置链接')
          )}
          <div style={{ position: 'relative' }}>
            <button style={openMenu === 'sticker' ? activeBtn(true) : btn} onClick={() => toggleMenu('sticker')}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = openMenu === 'sticker' ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
            >🎨贴纸▾</button>
            {openMenu === 'sticker' && (
              <div style={{ ...dropdownStyle, maxWidth: '200px', display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '6px' }}>
                {!hasSelection && <div style={{ ...dropdownItem, width: '100%', opacity: 0.5, fontSize: '10px', padding: '0 0 4px 0' }}>请先选择节点</div>}
                {STICKER_LIST.map(s => (
                  <span key={s} style={{ cursor: hasSelection ? 'pointer' : 'default', fontSize: '16px', padding: '2px', opacity: hasSelection ? 1 : 0.4 }}
                    onClick={() => { if (hasSelection && onSetSticker) { onSetSticker(s); closeMenu(); } }}
                  >{s}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button style={openMenu === 'task' ? activeBtn(true) : btn} onClick={() => toggleMenu('task')}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = openMenu === 'task' ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
            >📊任务▾</button>
            {openMenu === 'task' && (
              <div style={{ ...dropdownStyle, padding: '8px 12px', width: '200px' }} onMouseDown={e => e.preventDefault()}>
                {!hasSelection && <div style={{ color: theme.contextMenuItemColor, opacity: 0.5, fontSize: '10px', marginBottom: '6px' }}>请先选择节点</div>}
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '10px', color: theme.contextMenuItemColor, display: 'block', marginBottom: '2px' }}>开始日期</label>
                  <input type="date" value={taskForm.startDate} onChange={e => setTaskForm(p => ({ ...p, startDate: e.target.value }))}
                    style={{ width: '100%', padding: '2px 4px', fontSize: '10px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor }} />
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '10px', color: theme.contextMenuItemColor, display: 'block', marginBottom: '2px' }}>结束日期</label>
                  <input type="date" value={taskForm.endDate} onChange={e => setTaskForm(p => ({ ...p, endDate: e.target.value }))}
                    style={{ width: '100%', padding: '2px 4px', fontSize: '10px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor }} />
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '10px', color: theme.contextMenuItemColor, display: 'block', marginBottom: '2px' }}>进度 ({taskForm.progress}%)</label>
                  <input type="range" min="0" max="100" value={taskForm.progress} onChange={e => setTaskForm(p => ({ ...p, progress: parseInt(e.target.value) }))}
                    style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '10px', color: theme.contextMenuItemColor, display: 'block', marginBottom: '2px' }}>负责人</label>
                  <input value={taskForm.assignee} onChange={e => setTaskForm(p => ({ ...p, assignee: e.target.value }))}
                    style={{ width: '100%', padding: '2px 4px', fontSize: '10px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor }} />
                </div>
                <button style={{ ...btn, width: '100%', justifyContent: 'center', opacity: hasSelection ? 1 : 0.5 }} onClick={() => { if (hasSelection && onSetTask) { onSetTask(taskForm); closeMenu(); setTaskForm({ startDate: '', endDate: '', progress: 0, assignee: '' }); } }}>确认</button>
              </div>
            )}
          </div>
        </div>
        <div style={sep} />
        <div className="toolbar-group">
          <button style={activeBtn(!!focusBranchId)} onClick={focusBranchId ? onUnfocusBranch : onFocusBranch} disabled={!focusBranchId && !hasSelection}
            title={focusBranchId ? '取消聚焦' : '聚焦分支'}
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = focusBranchId ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
          >🔍聚焦</button>
          <button style={btn} onClick={onToggleGantt} title="甘特图"
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = theme.toolbarBtnBg; }}
          >📊甘特</button>
          <button style={btn} onClick={onTogglePresentation} title="演说模式"
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = theme.toolbarBtnBg; }}
          >🎤演说</button>
          <button style={btn} onClick={onToggleZen} title="ZEN模式 (Esc退出)"
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = theme.toolbarBtnBg; }}
          >🧘ZEN</button>
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
          <span style={{ fontSize: '10px', color: theme.toolbarBtnColor, opacity: 0.5, marginRight: '2px' }}>配色</span>
          <button style={activeBtn(colorSchemeIdx === -1)} onClick={() => onColorSchemeChange(-1)}
            onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
            onMouseLeave={e => { e.target.style.backgroundColor = colorSchemeIdx === -1 ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
          >默认</button>
          {colorSchemes && colorSchemes.map((cs, i) => (
            <button key={i} style={activeBtn(colorSchemeIdx === i)} onClick={() => onColorSchemeChange(i)} title={cs.name}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = colorSchemeIdx === i ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
            >
              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cs.root, marginRight: '2px' }} />
              {cs.name}
            </button>
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
        <div style={sep} />
        <div className="toolbar-group">
          <span style={{ fontSize: '10px', color: theme.toolbarBtnColor, opacity: 0.5, marginRight: '2px' }}>过滤</span>
          <div style={{ position: 'relative' }}>
            <button style={openMenu === 'filterPriority' ? activeBtn(filter?.priority) : btn}
              onClick={() => toggleMenu('filterPriority')}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = openMenu === 'filterPriority' ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
            >{filter?.priority ? `P${filter.priority}` : '优先级'}▾</button>
            {openMenu === 'filterPriority' && (
              <div style={dropdownStyle}>
                {renderDropdownItem('全部', () => onFilterChange({ ...filter, priority: undefined }))}
                {[1, 2, 3, 4, 5].map(p => (
                  <div key={p} style={dropdownItem}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.contextMenuItemHoverBg}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={e => { e.stopPropagation(); onFilterChange({ ...filter, priority: String(p) }); closeMenu(); }}
                  >{PRIORITY_ICONS[p]} P{p}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button style={openMenu === 'filterCheckbox' ? activeBtn(filter?.checkbox) : btn}
              onClick={() => toggleMenu('filterCheckbox')}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = openMenu === 'filterCheckbox' ? theme.toolbarBtnHoverBg : theme.toolbarBtnBg; }}
            >{filter?.checkbox === 'checked' ? '已完成' : filter?.checkbox === 'unchecked' ? '未完成' : '待办'}▾</button>
            {openMenu === 'filterCheckbox' && (
              <div style={dropdownStyle}>
                {renderDropdownItem('全部', () => onFilterChange({ ...filter, checkbox: undefined }))}
                {renderDropdownItem('☐ 未完成', () => onFilterChange({ ...filter, checkbox: 'unchecked' }))}
                {renderDropdownItem('☑ 已完成', () => onFilterChange({ ...filter, checkbox: 'checked' }))}
              </div>
            )}
          </div>
          {filter && Object.keys(filter).some(k => filter[k] !== undefined) && (
            <button style={btn} onClick={() => onFilterChange(null)}
              onMouseEnter={e => { e.target.style.backgroundColor = theme.toolbarBtnHoverBg; }}
              onMouseLeave={e => { e.target.style.backgroundColor = theme.toolbarBtnBg; }}
            >✕清除</button>
          )}
        </div>
      </div>
    </div>
  );
});

export default Toolbar;
