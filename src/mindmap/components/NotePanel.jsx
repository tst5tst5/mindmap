import React, { useState, useEffect, useRef } from 'react';

const NotePanel = React.memo(({ node, theme, onUpdateNote, onClose }) => {
  const [text, setText] = useState(node?.note || '');
  const [saved, setSaved] = useState(true);
  const textareaRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    setText(node?.note || '');
    setSaved(true);
    if (textareaRef.current) textareaRef.current.focus();
  }, [node?.id]);

  const handleChange = (e) => {
    setText(e.target.value);
    setSaved(false);
  };

  const handleSave = () => {
    onUpdateNote(text);
    setSaved(true);
  };

  const handleClose = () => {
    if (!saved) {
      handleSave();
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!node) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        right: '20px',
        top: '62px',
        width: '300px',
        height: '320px',
        backgroundColor: theme.contextMenuBg,
        border: `1px solid ${theme.contextMenuBorder}`,
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${theme.separatorColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: theme.contextMenuItemColor }}>
          📝 备注 - {node.text}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!saved && (
            <span style={{ fontSize: '11px', color: '#e17055', fontWeight: '500' }}>未保存</span>
          )}
          {saved && (
            <span style={{ fontSize: '11px', color: '#00b894', fontWeight: '500' }}>已保存</span>
          )}
          <button
            onClick={handleClose}
            style={{
              background: 'none', border: 'none', color: theme.contextMenuItemColor,
              cursor: 'pointer', fontSize: '16px', padding: '0 4px',
            }}
          >✕</button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="在此输入备注内容... (Ctrl+S 保存)"
        style={{
          flex: 1,
          padding: '12px 14px',
          border: 'none',
          backgroundColor: 'transparent',
          color: theme.contextMenuItemColor,
          fontSize: '13px',
          lineHeight: '1.6',
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      <div style={{
        padding: '8px 14px',
        borderTop: `1px solid ${theme.separatorColor}`,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
      }}>
        <button
          onClick={handleSave}
          disabled={saved}
          style={{
            padding: '6px 20px',
            border: `1px solid ${saved ? 'transparent' : theme.toolbarBtnHoverBorder}`,
            borderRadius: '6px',
            backgroundColor: saved ? theme.toolbarBtnBg : theme.toolbarBtnHoverBg,
            color: saved ? theme.toolbarBtnDisabledColor : theme.toolbarBtnColor,
            cursor: saved ? 'default' : 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            transition: 'all 0.15s ease',
          }}
        >
          💾 保存
        </button>
      </div>
    </div>
  );
});

export default NotePanel;
