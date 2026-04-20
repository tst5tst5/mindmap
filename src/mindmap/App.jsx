import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  createDefaultData,
  getChildren,
  getNodeLevel,
  getVisibleNodes,
  addNodeToParent,
  addSiblingNode,
  deleteNodeById,
  updateNodeText,
  toggleCollapse,
  getRootNode,
  updateNodeNote,
  toggleNodeMarker,
  setNodePriority,
  LAYOUT_TYPES,
  LAYOUT_LABELS,
  PRIORITY_ICONS,
  MARKER_ICONS,
} from './dataModel';
import { layoutMindMap, getConnectionPaths, fitToView } from './layout';
import { getBranchColor, getTextColor, THEMES } from './theme';
import Toolbar from './components/Toolbar';
import ContextMenu from './components/ContextMenu';
import NodeComponent from './components/NodeComponent';
import MiniMap from './components/MiniMap';
import NotePanel from './components/NotePanel';
import OutlinePanel from './components/OutlinePanel';

function App() {
  const [nodes, setNodes] = useState(() => createDefaultData());
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [themeName, setThemeName] = useState('dark');
  const [layoutType, setLayoutType] = useState(LAYOUT_TYPES.MIND_MAP);
  const [contextMenu, setContextMenu] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultIdx, setSearchResultIdx] = useState(-1);

  const containerRef = useRef(null);
  const editingRef = useRef(null);
  const initialized = useRef(false);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const theme = THEMES[themeName];

  const positions = useMemo(() => layoutMindMap(nodes, layoutType), [nodes, layoutType]);
  const visibleNodes = useMemo(() => getVisibleNodes(nodes), [nodes]);
  const connections = useMemo(() => getConnectionPaths(visibleNodes, positions), [visibleNodes, positions]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const { panX, panY, scale: fitScale } = fitToView(
      nodes, positions, windowSize.width, windowSize.height
    );
    setPan({ x: panX, y: panY });
    setScale(fitScale);
  }, []);

  const pushHistory = useCallback((newNodes) => {
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(JSON.parse(JSON.stringify(newNodes)));
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      setNodes(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      setNodes(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current])));
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const handleAddChild = useCallback(() => {
    if (!selectedId) return;
    const newNodes = addNodeToParent(nodes, selectedId);
    setNodes(newNodes);
    pushHistory(newNodes);
  }, [selectedId, nodes, pushHistory]);

  const handleAddSibling = useCallback(() => {
    if (!selectedId) return;
    const node = nodes.find(n => n.id === selectedId);
    if (!node || !node.parentId) return;
    const newNodes = addSiblingNode(nodes, selectedId);
    setNodes(newNodes);
    pushHistory(newNodes);
  }, [selectedId, nodes, pushHistory]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const node = nodes.find(n => n.id === selectedId);
    if (!node || !node.parentId) return;
    const newNodes = deleteNodeById(nodes, selectedId);
    setNodes(newNodes);
    setSelectedId(null);
    pushHistory(newNodes);
  }, [selectedId, nodes, pushHistory]);

  const handleToggleCollapse = useCallback((nodeId) => {
    const newNodes = toggleCollapse(nodes, nodeId);
    setNodes(newNodes);
  }, [nodes]);

  const handleEditText = useCallback((nodeId, text) => {
    const newNodes = updateNodeText(nodes, nodeId, text);
    setNodes(newNodes);
  }, [nodes]);

  const handleFinishEdit = useCallback(() => {
    if (editingId) {
      pushHistory(nodes);
    }
    setEditingId(null);
  }, [editingId, nodes, pushHistory]);

  const handleSelectNode = useCallback((nodeId) => {
    setSelectedId(nodeId);
    setContextMenu(null);
  }, []);

  const handleDoubleClick = useCallback((nodeId) => {
    setEditingId(nodeId);
    setSelectedId(nodeId);
  }, []);

  const handleUpdateNote = useCallback((nodeId, note) => {
    const newNodes = updateNodeNote(nodes, nodeId, note);
    setNodes(newNodes);
    pushHistory(newNodes);
  }, [nodes, pushHistory]);

  const handleToggleMarker = useCallback((nodeId, marker) => {
    const newNodes = toggleNodeMarker(nodes, nodeId, marker);
    setNodes(newNodes);
    pushHistory(newNodes);
  }, [nodes, pushHistory]);

  const handleSetPriority = useCallback((nodeId, priority) => {
    const newNodes = setNodePriority(nodes, nodeId, priority);
    setNodes(newNodes);
    pushHistory(newNodes);
  }, [nodes, pushHistory]);

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button === 0) {
      const nodeEl = e.target.closest('.mindmap-node');
      if (!nodeEl) {
        setSelectedId(null);
        setEditingId(null);
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        setPanStartOffset({ x: pan.x, y: pan.y });
      }
      setContextMenu(null);
    }
  }, [pan]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({
        x: panStartOffset.x + dx,
        y: panStartOffset.y + dy,
      });
    }
  }, [isPanning, panStart, panStartOffset]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => {
      const newScale = Math.max(0.2, Math.min(4, prev * delta));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return prev;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const scaleRatio = newScale / prev;
      setPan(p => ({
        x: mouseX - (mouseX - p.x) * scaleRatio,
        y: mouseY - (mouseY - p.y) * scaleRatio,
      }));
      return newScale;
    });
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const nodeEl = e.target.closest('.mindmap-node');
    if (nodeEl) {
      const nodeId = nodeEl.dataset.nodeId;
      setSelectedId(nodeId);
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'node',
        nodeId,
      });
    } else {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'canvas',
      });
    }
  }, []);

  const handleFitView = useCallback(() => {
    const { panX, panY, scale: fitScale } = fitToView(
      nodes, positions, windowSize.width, windowSize.height - 76
    );
    setPan({ x: panX, y: panY });
    setScale(fitScale);
    setContextMenu(null);
  }, [nodes, positions, windowSize]);

  const handleCenterRoot = useCallback(() => {
    const root = getRootNode(nodes);
    if (!root) return;
    const rootPos = positions[root.id];
    if (!rootPos) return;
    setPan({
      x: windowSize.width / 2 - (rootPos.x + rootPos.width / 2) * scale,
      y: (windowSize.height - 76) / 2 - (rootPos.y + rootPos.height / 2) * scale,
    });
    setContextMenu(null);
  }, [nodes, positions, scale, windowSize]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => {
      const newScale = Math.min(4, prev * 1.2);
      const centerX = windowSize.width / 2;
      const centerY = (windowSize.height - 76) / 2;
      const scaleRatio = newScale / prev;
      setPan(p => ({
        x: centerX - (centerX - p.x) * scaleRatio,
        y: centerY - (centerY - p.y) * scaleRatio,
      }));
      return newScale;
    });
  }, [windowSize]);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const newScale = Math.max(0.2, prev / 1.2);
      const centerX = windowSize.width / 2;
      const centerY = (windowSize.height - 76) / 2;
      const scaleRatio = newScale / prev;
      setPan(p => ({
        x: centerX - (centerX - p.x) * scaleRatio,
        y: centerY - (centerY - p.y) * scaleRatio,
      }));
      return newScale;
    });
  }, [windowSize]);

  const handleZoomReset = useCallback(() => {
    setScale(1);
    handleCenterRoot();
  }, [handleCenterRoot]);

  const handleExportJSON = useCallback(() => {
    const data = JSON.stringify({ nodes, layoutType }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.json';
    a.click();
    URL.revokeObjectURL(url);
    setContextMenu(null);
  }, [nodes, layoutType]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data)) {
            setNodes(data);
            pushHistory(data);
          } else if (data.nodes) {
            setNodes(data.nodes);
            if (data.layoutType) setLayoutType(data.layoutType);
            pushHistory(data.nodes);
          }
          setTimeout(() => handleFitView(), 100);
        } catch (err) {
          alert('文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setContextMenu(null);
  }, [pushHistory, handleFitView]);

  const handleNewFile = useCallback(() => {
    const newNodes = createDefaultData();
    setNodes(newNodes);
    setSelectedId(null);
    setEditingId(null);
    pushHistory(newNodes);
    setTimeout(() => handleFitView(), 100);
    setContextMenu(null);
  }, [pushHistory, handleFitView]);

  const handleThemeChange = useCallback((name) => {
    setThemeName(name);
    setContextMenu(null);
  }, []);

  const handleLayoutChange = useCallback((type) => {
    setLayoutType(type);
    setContextMenu(null);
    setTimeout(() => handleFitView(), 50);
  }, [handleFitView]);

  const handleSearch = useCallback((text) => {
    setSearchText(text);
    if (!text.trim()) {
      setSearchResults([]);
      setSearchResultIdx(-1);
      return;
    }
    const results = nodes.filter(n =>
      n.text.toLowerCase().includes(text.toLowerCase()) ||
      (n.note && n.note.toLowerCase().includes(text.toLowerCase()))
    ).map(n => n.id);
    setSearchResults(results);
    setSearchResultIdx(results.length > 0 ? 0 : -1);
    if (results.length > 0) {
      setSelectedId(results[0]);
    }
  }, [nodes]);

  const handleSearchNext = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIdx = (searchResultIdx + 1) % searchResults.length;
    setSearchResultIdx(nextIdx);
    setSelectedId(searchResults[nextIdx]);
  }, [searchResults, searchResultIdx]);

  const handleArrowKey = useCallback((key) => {
    if (!selectedId) {
      const root = getRootNode(nodes);
      if (root) setSelectedId(root.id);
      return;
    }
    const node = nodes.find(n => n.id === selectedId);
    if (!node) return;
    const pos = positions[selectedId];
    if (!pos) return;
    const dir = pos.direction || 'right';
    const isH = dir === 'right' || dir === 'left' || dir === 'center';

    if (isH) {
      if (key === 'ArrowRight') {
        if (dir === 'right' || dir === 'center') {
          const children = getChildren(nodes, selectedId);
          if (children.length > 0 && !node.collapsed) setSelectedId(children[0].id);
        } else if (node.parentId) {
          setSelectedId(node.parentId);
        }
      } else if (key === 'ArrowLeft') {
        if (dir === 'left') {
          const children = getChildren(nodes, selectedId);
          if (children.length > 0 && !node.collapsed) setSelectedId(children[0].id);
        } else if (dir !== 'center' && node.parentId) {
          setSelectedId(node.parentId);
        } else if (dir === 'center' && node.parentId) {
          setSelectedId(node.parentId);
        }
      } else if (key === 'ArrowDown') {
        const siblings = nodes.filter(n => n.parentId === node.parentId);
        const idx = siblings.findIndex(n => n.id === selectedId);
        if (idx < siblings.length - 1) setSelectedId(siblings[idx + 1].id);
      } else if (key === 'ArrowUp') {
        const siblings = nodes.filter(n => n.parentId === node.parentId);
        const idx = siblings.findIndex(n => n.id === selectedId);
        if (idx > 0) setSelectedId(siblings[idx - 1].id);
      }
    } else {
      if (key === 'ArrowDown') {
        const children = getChildren(nodes, selectedId);
        if (children.length > 0 && !node.collapsed) setSelectedId(children[0].id);
      } else if (key === 'ArrowUp') {
        if (node.parentId) setSelectedId(node.parentId);
      } else if (key === 'ArrowRight') {
        const siblings = nodes.filter(n => n.parentId === node.parentId);
        const idx = siblings.findIndex(n => n.id === selectedId);
        if (idx < siblings.length - 1) setSelectedId(siblings[idx + 1].id);
      } else if (key === 'ArrowLeft') {
        const siblings = nodes.filter(n => n.parentId === node.parentId);
        const idx = siblings.findIndex(n => n.id === selectedId);
        if (idx > 0) setSelectedId(siblings[idx - 1].id);
      }
    }
  }, [selectedId, nodes, positions]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleFinishEdit();
        }
        return;
      }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Tab') {
        e.preventDefault();
        if (selectedId) handleAddChild();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedId) {
          const node = nodes.find(n => n.id === selectedId);
          if (node && node.parentId) handleAddSibling();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          handleDelete();
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (selectedId) handleDoubleClick(selectedId);
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        e.preventDefault();
        redo();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (selectedId) handleToggleCollapse(selectedId);
      } else if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        handleArrowKey(e.key);
      } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowOutline(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, nodes, handleAddChild, handleAddSibling, handleDelete, handleFinishEdit, handleDoubleClick, handleToggleCollapse, undo, redo, handleArrowKey]);

  useEffect(() => {
    if (editingId && editingRef.current) {
      editingRef.current.focus();
      editingRef.current.select();
    }
  }, [editingId]);

  const handleClickOutside = useCallback((e) => {
    if (contextMenu && !e.target.closest('.context-menu')) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [handleClickOutside]);

  const selectedNode = selectedId ? nodes.find(n => n.id === selectedId) : null;
  const isRootSelected = selectedNode ? !selectedNode.parentId : false;

  return (
    <div className="app-container" style={{ backgroundColor: theme.canvasBg }}>
      <Toolbar
        theme={theme}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddChild={handleAddChild}
        onAddSibling={handleAddSibling}
        onDelete={handleDelete}
        hasSelection={!!selectedId}
        isRoot={isRootSelected}
        onFitView={handleFitView}
        onCenterRoot={handleCenterRoot}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        scale={scale}
        onNewFile={handleNewFile}
        onExport={handleExportJSON}
        onImport={handleImportJSON}
        themeName={themeName}
        onThemeChange={handleThemeChange}
        layoutType={layoutType}
        onLayoutChange={handleLayoutChange}
        onToggleNote={() => setShowNotePanel(prev => !prev)}
        onToggleOutline={() => setShowOutline(prev => !prev)}
        showNote={showNotePanel}
        showOutline={showOutline}
        onToggleMarker={selectedId ? (m) => handleToggleMarker(selectedId, m) : undefined}
        onSetPriority={selectedId ? (p) => handleSetPriority(selectedId, p) : undefined}
        searchText={searchText}
        onSearch={handleSearch}
        onSearchNext={handleSearchNext}
        searchResultCount={searchResults.length}
        searchResultIdx={searchResultIdx}
      />

      <div
        className={`mindmap-container ${isPanning ? 'panning' : ''}`}
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        style={{
          backgroundColor: theme.canvasBg,
          backgroundImage: `radial-gradient(circle, ${theme.canvasDot} 1px, transparent 1px)`,
        }}
      >
        <div
          className="mindmap-content"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <svg
            className="svg-layer"
            style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', overflow: 'visible' }}
          >
            {connections.map(conn => {
              const branchColor = getBranchColor(nodes, conn.nodeId);
              return (
                <path
                  key={conn.key}
                  d={conn.pathData}
                  stroke={branchColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.6"
                />
              );
            })}
          </svg>

          {visibleNodes.map(node => {
            const pos = positions[node.id];
            if (!pos) return null;
            const level = getNodeLevel(nodes, node.id);
            const isRoot = level === 0;
            const branchColor = isRoot ? theme.rootBg : getBranchColor(nodes, node.id);
            const textColor = isRoot ? theme.rootColor : getTextColor(branchColor);
            const children = getChildren(nodes, node.id);
            const hasChildren = children.length > 0;
            const isSelected = selectedId === node.id;
            const isEditing = editingId === node.id;

            return (
              <NodeComponent
                key={node.id}
                node={node}
                pos={pos}
                level={level}
                isRoot={isRoot}
                branchColor={branchColor}
                textColor={textColor}
                hasChildren={hasChildren}
                isSelected={isSelected}
                isEditing={isEditing}
                theme={theme}
                editingRef={isEditing ? editingRef : null}
                onSelect={handleSelectNode}
                onDoubleClick={handleDoubleClick}
                onToggleCollapse={handleToggleCollapse}
                onEditText={handleEditText}
                onFinishEdit={handleFinishEdit}
              />
            );
          })}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          contextMenu={contextMenu}
          theme={theme}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onDelete={handleDelete}
          onToggleCollapse={() => {
            if (contextMenu.nodeId) handleToggleCollapse(contextMenu.nodeId);
            setContextMenu(null);
          }}
          onFitView={handleFitView}
          onCenterRoot={handleCenterRoot}
          onExport={handleExportJSON}
          onImport={handleImportJSON}
          onNewFile={handleNewFile}
          onClose={() => setContextMenu(null)}
          isRoot={contextMenu.nodeId ? !nodes.find(n => n.id === contextMenu.nodeId)?.parentId : false}
          node={contextMenu.nodeId ? nodes.find(n => n.id === contextMenu.nodeId) : null}
          layoutType={layoutType}
          onLayoutChange={handleLayoutChange}
          onToggleMarker={contextMenu.nodeId ? (m) => handleToggleMarker(contextMenu.nodeId, m) : undefined}
          onSetPriority={contextMenu.nodeId ? (p) => handleSetPriority(contextMenu.nodeId, p) : undefined}
          onToggleNote={() => { setShowNotePanel(true); setContextMenu(null); }}
        />
      )}

      {showNotePanel && selectedId && (
        <NotePanel
          node={selectedNode}
          theme={theme}
          onUpdateNote={(note) => handleUpdateNote(selectedId, note)}
          onClose={() => setShowNotePanel(false)}
        />
      )}

      {showOutline && (
        <OutlinePanel
          nodes={nodes}
          theme={theme}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); }}
          onClose={() => setShowOutline(false)}
        />
      )}

      <MiniMap
        nodes={visibleNodes}
        positions={positions}
        pan={pan}
        scale={scale}
        theme={theme}
        containerWidth={windowSize.width}
        containerHeight={windowSize.height - 76}
        onNavigate={(newPan) => setPan(newPan)}
      />

      <div
        className="hint"
        style={{
          backgroundColor: theme.hintBg,
          color: theme.hintColor,
          borderColor: theme.hintBorder,
        }}
      >
        Tab 子节点 · Enter 兄弟节点 · Del 删除 · F2 编辑 · Space 折叠 · 方向键导航 · 滚轮缩放 · Ctrl+F 搜索
      </div>
    </div>
  );
}

export default App;
