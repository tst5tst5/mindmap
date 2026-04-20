import React, { useCallback, useEffect, useRef } from 'react';
import { PRIORITY_ICONS, MARKER_ICONS } from '../dataModel';

const NodeComponent = React.memo(({
  node, pos, level, isRoot, branchColor, textColor,
  hasChildren, isSelected, isEditing, theme, editingRef,
  onSelect, onDoubleClick, onToggleCollapse, onEditText, onFinishEdit,
}) => {
  const textRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    onSelect(node.id);
  }, [node.id, onSelect]);

  const handleDoubleClickEvent = useCallback((e) => {
    e.stopPropagation();
    onDoubleClick(node.id);
  }, [node.id, onDoubleClick]);

  const handleTextChange = useCallback((e) => {
    onEditText(node.id, e.target.value);
  }, [node.id, onEditText]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onFinishEdit();
    }
    e.stopPropagation();
  }, [onFinishEdit]);

  const handleBlur = useCallback(() => {
    onFinishEdit();
  }, [onFinishEdit]);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    onToggleCollapse(node.id);
  }, [node.id, onToggleCollapse]);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  const getLevelStyle = () => {
    if (isRoot) {
      return {
        borderRadius: '28px',
        padding: '10px 24px',
        fontSize: '18px',
        fontWeight: '700',
        minHeight: '50px',
        boxShadow: `0 4px 20px ${theme.rootShadow}`,
      };
    }
    switch (level) {
      case 1: return { borderRadius: '20px', padding: '7px 18px', fontSize: '14px', fontWeight: '600', minHeight: '40px', boxShadow: `0 3px 14px ${theme.nodeShadow}` };
      case 2: return { borderRadius: '16px', padding: '6px 14px', fontSize: '13px', fontWeight: '500', minHeight: '36px', boxShadow: `0 2px 10px ${theme.nodeShadow}` };
      default: return { borderRadius: '12px', padding: '5px 12px', fontSize: '12px', fontWeight: '500', minHeight: '32px', boxShadow: `0 2px 8px ${theme.nodeShadow}` };
    }
  };

  const direction = pos.direction || 'right';
  const collapseSide = direction === 'left' ? 'right' : 'left';

  const hasIcons = node.priority || (node.markers && node.markers.length > 0);

  return (
    <div
      className="mindmap-node"
      data-node-id={node.id}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: pos.width,
        height: pos.height,
        zIndex: isSelected ? 3 : 1,
      }}
    >
      <div
        className={`node-body ${isSelected ? 'selected' : ''}`}
        style={{
          ...getLevelStyle(),
          backgroundColor: branchColor,
          color: textColor,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isEditing ? 'text' : 'pointer',
          userSelect: 'none',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          outline: isSelected ? `2.5px solid ${theme.selectedOutline}` : 'none',
          outlineOffset: '2px',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClickEvent}
      >
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
            borderRadius: 'inherit',
            borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '100%', overflow: 'hidden' }}>
          {node.priority && (
            <span style={{ fontSize: isRoot ? '14px' : '11px', flexShrink: 0 }}>{PRIORITY_ICONS[node.priority]}</span>
          )}
          {node.markers && node.markers.length > 0 && node.markers.map(m => (
            <span key={m} style={{ fontSize: isRoot ? '14px' : '11px', flexShrink: 0 }}>{MARKER_ICONS[m]}</span>
          ))}
          {isEditing ? (
            <textarea
              ref={(el) => { textRef.current = el; if (editingRef) editingRef.current = el; }}
              value={node.text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              style={{
                background: 'transparent', border: 'none', color: 'inherit',
                textAlign: 'center', fontSize: 'inherit', fontWeight: 'inherit',
                resize: 'none', width: '100%', outline: 'none', lineHeight: '1.4', fontFamily: 'inherit',
              }}
              rows={1}
            />
          ) : (
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: '100%', lineHeight: '1.4',
            }}>
              {node.text}
            </span>
          )}
        </div>
        {node.note && !isEditing && (
          <span style={{
            position: 'absolute', top: '2px', right: '4px',
            fontSize: '9px', opacity: 0.6,
          }}>📝</span>
        )}
      </div>

      {hasChildren && !isRoot && (
        <div
          className="collapse-btn"
          style={{
            position: 'absolute',
            [collapseSide === 'right' ? 'right' : 'left']: '-12px',
            top: '50%', transform: 'translateY(-50%)',
            width: '20px', height: '20px', borderRadius: '50%',
            backgroundColor: theme.collapseBtnBg,
            border: `1px solid ${theme.collapseBtnBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '11px', color: theme.collapseBtnColor,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)', zIndex: 5,
            opacity: 0, transition: 'opacity 0.15s ease',
          }}
          onMouseDown={e => e.stopPropagation()}
          onClick={handleToggle}
        >
          {node.collapsed ? '+' : '−'}
        </div>
      )}

      {hasChildren && isRoot && (
        <>
          <div
            className="collapse-btn"
            style={{
              position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)',
              width: '20px', height: '20px', borderRadius: '50%',
              backgroundColor: theme.collapseBtnBg,
              border: `1px solid ${theme.collapseBtnBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '11px', color: theme.collapseBtnColor,
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)', zIndex: 5,
              opacity: 0, transition: 'opacity 0.15s ease',
            }}
            onMouseDown={e => e.stopPropagation()}
            onClick={handleToggle}
          >
            {node.collapsed ? '+' : '−'}
          </div>
          <div
            className="collapse-btn"
            style={{
              position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)',
              width: '20px', height: '20px', borderRadius: '50%',
              backgroundColor: theme.collapseBtnBg,
              border: `1px solid ${theme.collapseBtnBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '11px', color: theme.collapseBtnColor,
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)', zIndex: 5,
              opacity: 0, transition: 'opacity 0.15s ease',
            }}
            onMouseDown={e => e.stopPropagation()}
            onClick={handleToggle}
          >
            {node.collapsed ? '+' : '−'}
          </div>
        </>
      )}
    </div>
  );
});

export default NodeComponent;
