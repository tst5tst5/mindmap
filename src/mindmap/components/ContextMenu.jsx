import React, { useState } from 'react';
import { LAYOUT_TYPES, LAYOUT_LABELS, PRIORITY_ICONS, MARKER_ICONS, STICKER_LIST } from '../dataModel';

const ContextMenu = React.memo(({
  contextMenu, theme,
  onAddChild, onAddSibling, onDelete, onToggleCollapse,
  onFitView, onCenterRoot, onExport, onImport, onNewFile, onClose,
  isRoot, node,
  layoutType, onLayoutChange,
  onToggleMarker, onSetPriority, onToggleNote,
  onStartLink, isLinking, onDeleteRelationship, hasSelectedRel,
  onToggleCheckbox, onAddLabel, onSetLink, onSetSticker, onSetTask,
  onFocusBranch, onExportPNG, onExportMarkdown,
}) => {
  const [labelInput, setLabelInput] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ startDate: '', endDate: '', progress: 0, assignee: '' });

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
          {onStartLink && renderItem(isLinking ? '取消关联' : '添加关联线', onStartLink, '🔗')}
          <div style={sep} />

          {onToggleCheckbox && renderItem(
            node?.checkbox !== null && node?.checkbox !== undefined ? (node.checkbox ? '取消待办' : '标记完成') : '添加待办',
            onToggleCheckbox,
            node?.checkbox ? '☑' : '☐'
          )}

          {showLabelInput ? (
            <div style={{ padding: '4px 14px', display: 'flex', gap: '4px' }}>
              <input value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="输入标签"
                onKeyDown={e => { if (e.key === 'Enter' && labelInput.trim() && onAddLabel) { onAddLabel(labelInput.trim()); setLabelInput(''); setShowLabelInput(false); onClose(); } if (e.key === 'Escape') { setShowLabelInput(false); setLabelInput(''); } }}
                style={{ flex: 1, padding: '3px 6px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor, fontSize: '11px', outline: 'none' }}
                autoFocus />
            </div>
          ) : (
            onAddLabel && renderItem('添加标签', () => setShowLabelInput(true), '🏷')
          )}

          {showLinkInput ? (
            <div style={{ padding: '4px 14px', display: 'flex', gap: '4px' }}>
              <input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="输入链接URL"
                onKeyDown={e => { if (e.key === 'Enter' && linkInput.trim() && onSetLink) { onSetLink(linkInput.trim()); setLinkInput(''); setShowLinkInput(false); onClose(); } if (e.key === 'Escape') { setShowLinkInput(false); setLinkInput(''); } }}
                style={{ flex: 1, padding: '3px 6px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor, fontSize: '11px', outline: 'none' }}
                autoFocus />
            </div>
          ) : (
            onSetLink && renderItem('设置链接', () => setShowLinkInput(true), '🔗')
          )}

          {showStickerPicker ? (
            <div style={{ padding: '6px 14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {STICKER_LIST.map(s => (
                  <span key={s} style={{ cursor: 'pointer', fontSize: '16px', padding: '2px' }}
                    onClick={() => { onSetSticker && onSetSticker(s); setShowStickerPicker(false); onClose(); }}
                  >{s}</span>
                ))}
              </div>
            </div>
          ) : (
            onSetSticker && renderItem('添加贴纸', () => setShowStickerPicker(true), '🎨')
          )}

          {showTaskForm ? (
            <div style={{ padding: '6px 14px', fontSize: '11px' }}>
              <div style={{ marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', color: theme.contextMenuItemColor, display: 'block', marginBottom: '2px' }}>开始日期</label>
                <input type="date" value={taskForm.startDate} onChange={e => setTaskForm(p => ({ ...p, startDate: e.target.value }))}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '10px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor }} />
              </div>
              <div style={{ marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', color: theme.contextMenuItemColor, display: 'block', marginBottom: '2px' }}>结束日期</label>
                <input type="date" value={taskForm.endDate} onChange={e => setTaskForm(p => ({ ...p, endDate: e.target.value }))}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '10px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor }} />
              </div>
              <div style={{ marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', color: theme.contextMenuItemColor, display: 'block', marginBottom: '2px' }}>进度 ({taskForm.progress}%)</label>
                <input type="range" min="0" max="100" value={taskForm.progress} onChange={e => setTaskForm(p => ({ ...p, progress: parseInt(e.target.value) }))}
                  style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '4px' }}>
                <label style={{ fontSize: '10px', color: theme.contextMenuItemColor, display: 'block', marginBottom: '2px' }}>负责人</label>
                <input value={taskForm.assignee} onChange={e => setTaskForm(p => ({ ...p, assignee: e.target.value }))}
                  style={{ width: '100%', padding: '2px 4px', fontSize: '10px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor }} />
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ flex: 1, padding: '4px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor, cursor: 'pointer', fontSize: '10px' }}
                  onClick={() => { onSetTask && onSetTask(taskForm); setShowTaskForm(false); onClose(); }}>确认</button>
                <button style={{ flex: 1, padding: '4px', border: `1px solid ${theme.toolbarBtnBorder}`, borderRadius: '3px', backgroundColor: theme.toolbarBtnBg, color: theme.toolbarBtnColor, cursor: 'pointer', fontSize: '10px' }}
                  onClick={() => { setShowTaskForm(false); }}>取消</button>
              </div>
            </div>
          ) : (
            onSetTask && renderItem('设置任务', () => setShowTaskForm(true), '📊')
          )}

          {onFocusBranch && renderItem('聚焦此分支', onFocusBranch, '🔍')}

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
          {onExportPNG && renderItem('导出PNG', onExportPNG, '🖼')}
          {onExportMarkdown && renderItem('导出Markdown', onExportMarkdown, '📝')}
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
