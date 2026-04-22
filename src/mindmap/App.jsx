import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  createDefaultData, getChildren, getNodeLevel, getVisibleNodes,
  addNodeToParent, addSiblingNode, deleteNodeById, updateNodeText,
  toggleCollapse, getRootNode, updateNodeNote, toggleNodeMarker,
  setNodePriority, addRelationship, removeRelationship,
  updateRelationshipLabel, cleanupRelationships,
  toggleCheckbox, addLabel, removeLabel, setNodeLink, setNodeTopicLink,
  setNodeImage, setNodeSticker, setNodeTask, moveNodeToParent,
  getNodeNumbering, getFilteredNodes, generateId,
  LAYOUT_TYPES, LAYOUT_LABELS, PRIORITY_ICONS, MARKER_ICONS,
  STICKER_LIST, COLOR_SCHEMES, TEMPLATES,
  loadFromLocalStorage, saveToLocalStorage,
} from './dataModel';
import { layoutMindMap, getConnectionPaths, getRelationshipPaths, fitToView } from './layout';
import { getBranchColor, getTextColor, THEMES } from './theme';
import Toolbar from './components/Toolbar';
import ContextMenu from './components/ContextMenu';
import NodeComponent from './components/NodeComponent';
import MiniMap from './components/MiniMap';
import NotePanel from './components/NotePanel';
import OutlinePanel from './components/OutlinePanel';
import GanttView from './components/GanttView';
import PresentationMode from './components/PresentationMode';

const TOOLBAR_HEIGHT = 76;
const AUTO_SAVE_KEY = 'mindmap_autosave';

function App() {
  const _saved = loadFromLocalStorage();
  const [nodes, setNodes] = useState(() => _saved?.nodes || createDefaultData());
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [themeName, setThemeName] = useState(() => _saved?.themeName || 'dark');
  const [layoutType, setLayoutType] = useState(() => _saved?.layoutType || LAYOUT_TYPES.MIND_MAP);
  const [colorSchemeIdx, setColorSchemeIdx] = useState(() => _saved?.colorSchemeIdx ?? -1);
  const [sketchyMode, setSketchyMode] = useState(false);
  const [showNumbering, setShowNumbering] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panStartOffset, setPanStartOffset] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [focusBranchId, setFocusBranchId] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultIdx, setSearchResultIdx] = useState(-1);
  const [relationships, setRelationships] = useState(() => _saved?.relationships || []);
  const [linkingFromId, setLinkingFromId] = useState(null);
  const [selectedRelId, setSelectedRelId] = useState(null);
  const [filter, setFilter] = useState(null);
  const [canvasName, setCanvasName] = useState('画布 1');
  const [canvases, setCanvases] = useState(() => _saved?.canvases || []);
  const [activeCanvasIdx, setActiveCanvasIdx] = useState(0);

  const containerRef = useRef(null);
  const editingRef = useRef(null);
  const initialized = useRef(false);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const contentRef = useRef(null);

  const theme = THEMES[themeName];
  const colorScheme = colorSchemeIdx >= 0 ? COLOR_SCHEMES[colorSchemeIdx] : null;

  const effectiveNodes = useMemo(() => {
    if (focusBranchId) {
      const root = getRootNode(nodes);
      if (!root) return nodes;
      const branchIds = new Set([root.id, focusBranchId]);
      const addDescendants = (id) => {
        getChildren(nodes, id).forEach(c => { branchIds.add(c.id); addDescendants(c.id); });
      };
      addDescendants(focusBranchId);
      return nodes.filter(n => branchIds.has(n.id));
    }
    if (filter) return getFilteredNodes(nodes, filter);
    return nodes;
  }, [nodes, focusBranchId, filter]);

  const positions = useMemo(() => layoutMindMap(effectiveNodes, layoutType), [effectiveNodes, layoutType]);
  const visibleNodes = useMemo(() => getVisibleNodes(effectiveNodes), [effectiveNodes]);
  const connections = useMemo(() => getConnectionPaths(visibleNodes, positions, layoutType), [visibleNodes, positions, layoutType]);
  const relPaths = useMemo(() => getRelationshipPaths(relationships, positions), [relationships, positions]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const { panX, panY, scale: fitScale } = fitToView(nodes, positions, windowSize.width, windowSize.height - TOOLBAR_HEIGHT);
    setPan({ x: panX, y: panY });
    setScale(fitScale);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveToLocalStorage({ nodes, relationships, layoutType, themeName, canvases });
    }, 1000);
    return () => clearTimeout(timer);
  }, [nodes, relationships, layoutType, themeName, canvases]);

  const pushHistory = useCallback((newNodes) => {
    const h = historyRef.current.slice(0, historyIndexRef.current + 1);
    h.push(JSON.parse(JSON.stringify(newNodes)));
    historyRef.current = h;
    historyIndexRef.current = h.length - 1;
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

  const handleAddChild = useCallback(() => { if (!selectedId) return; const n = addNodeToParent(nodes, selectedId); setNodes(n); pushHistory(n); }, [selectedId, nodes, pushHistory]);
  const handleAddSibling = useCallback(() => { if (!selectedId) return; const nd = nodes.find(n => n.id === selectedId); if (!nd?.parentId) return; const n = addSiblingNode(nodes, selectedId); setNodes(n); pushHistory(n); }, [selectedId, nodes, pushHistory]);
  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    const nd = nodes.find(n => n.id === selectedId);
    if (!nd?.parentId) return;
    const nn = deleteNodeById(nodes, selectedId);
    setNodes(nn); setRelationships(cleanupRelationships(relationships, nn));
    setSelectedId(null); pushHistory(nn);
  }, [selectedId, nodes, relationships, pushHistory]);

  const handleToggleCollapse = useCallback((nodeId) => { setNodes(toggleCollapse(nodes, nodeId)); }, [nodes]);
  const handleEditText = useCallback((nodeId, text) => { setNodes(updateNodeText(nodes, nodeId, text)); }, [nodes]);
  const handleFinishEdit = useCallback(() => { if (editingId) pushHistory(nodes); setEditingId(null); }, [editingId, nodes, pushHistory]);

  const handleStartLinking = useCallback((fromId) => { setLinkingFromId(fromId); setSelectedId(fromId); }, []);
  const handleSelectNodeForLink = useCallback((nodeId) => {
    if (linkingFromId && linkingFromId !== nodeId) {
      setRelationships(addRelationship(relationships, linkingFromId, nodeId)); setLinkingFromId(null);
    } else { setLinkingFromId(null); }
  }, [linkingFromId, relationships]);

  const handleSelectNode = useCallback((nodeId, e) => {
    if (linkingFromId) { handleSelectNodeForLink(nodeId); return; }
    if (e?.ctrlKey || e?.metaKey) {
      setSelectedIds(prev => { const s = new Set(prev); if (s.has(nodeId)) s.delete(nodeId); else s.add(nodeId); return s; });
    } else { setSelectedIds(new Set()); }
    setSelectedId(nodeId); setContextMenu(null); setSelectedRelId(null);
  }, [linkingFromId, handleSelectNodeForLink]);

  const handleDoubleClick = useCallback((nodeId) => { setEditingId(nodeId); setSelectedId(nodeId); }, []);
  const handleUpdateNote = useCallback((nodeId, note) => { const n = updateNodeNote(nodes, nodeId, note); setNodes(n); pushHistory(n); }, [nodes, pushHistory]);
  const handleToggleMarker = useCallback((nodeId, marker) => { const n = toggleNodeMarker(nodes, nodeId, marker); setNodes(n); pushHistory(n); }, [nodes, pushHistory]);
  const handleSetPriority = useCallback((nodeId, priority) => { const n = setNodePriority(nodes, nodeId, priority); setNodes(n); pushHistory(n); }, [nodes, pushHistory]);
  const handleToggleCheckbox = useCallback((nodeId) => { const n = toggleCheckbox(nodes, nodeId); setNodes(n); pushHistory(n); }, [nodes, pushHistory]);
  const handleAddLabel = useCallback((nodeId, label) => { const n = addLabel(nodes, nodeId, label); setNodes(n); pushHistory(n); }, [nodes, pushHistory]);
  const handleRemoveLabel = useCallback((nodeId, label) => { const n = removeLabel(nodes, nodeId, label); setNodes(n); pushHistory(n); }, [nodes, pushHistory]);
  const handleSetLink = useCallback((nodeId, link) => { const n = setNodeLink(nodes, nodeId, link); setNodes(n); pushHistory(n); }, [nodes, pushHistory]);
  const handleSetSticker = useCallback((nodeId, sticker) => { const n = setNodeSticker(nodes, nodeId, sticker); setNodes(n); pushHistory(n); }, [nodes, pushHistory]);
  const handleSetTask = useCallback((nodeId, task) => { const n = setNodeTask(nodes, nodeId, task); setNodes(n); pushHistory(n); }, [nodes, pushHistory]);
  const handleDeleteRelationship = useCallback((relId) => { setRelationships(removeRelationship(relationships, relId)); setSelectedRelId(null); }, [relationships]);
  const handleRelClick = useCallback((relId) => { setSelectedRelId(relId); }, []);

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button === 0) {
      const nodeEl = e.target.closest('.mindmap-node');
      if (!nodeEl) { setSelectedId(null); setEditingId(null); setLinkingFromId(null); setSelectedRelId(null); setSelectedIds(new Set()); setIsPanning(true); setPanStart({ x: e.clientX, y: e.clientY }); setPanStartOffset({ x: pan.x, y: pan.y }); }
      setContextMenu(null);
    }
  }, [pan]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (isPanning) { setPan({ x: panStartOffset.x + e.clientX - panStart.x, y: panStartOffset.y + e.clientY - panStart.y }); }
  }, [isPanning, panStart, panStartOffset]);

  const handleCanvasMouseUp = useCallback(() => { setIsPanning(false); }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => {
      const ns = Math.max(0.2, Math.min(4, prev * delta));
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return prev;
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const sr = ns / prev;
      setPan(p => ({ x: mx - (mx - p.x) * sr, y: my - (my - p.y) * sr }));
      return ns;
    });
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const nodeEl = e.target.closest('.mindmap-node');
    if (nodeEl) { const nid = nodeEl.dataset.nodeId; setSelectedId(nid); setContextMenu({ x: e.clientX, y: e.clientY, type: 'node', nodeId: nid }); }
    else { setContextMenu({ x: e.clientX, y: e.clientY, type: 'canvas' }); }
  }, []);

  const handleFitView = useCallback(() => {
    const { panX, panY, scale: fs } = fitToView(effectiveNodes, positions, windowSize.width, windowSize.height - TOOLBAR_HEIGHT);
    setPan({ x: panX, y: panY }); setScale(fs); setContextMenu(null);
  }, [effectiveNodes, positions, windowSize]);

  const handleCenterRoot = useCallback(() => {
    const root = getRootNode(nodes); if (!root) return;
    const rp = positions[root.id]; if (!rp) return;
    setPan({ x: windowSize.width / 2 - (rp.x + rp.width / 2) * scale, y: (windowSize.height - TOOLBAR_HEIGHT) / 2 - (rp.y + rp.height / 2) * scale });
    setContextMenu(null);
  }, [nodes, positions, scale, windowSize]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => { const ns = Math.min(4, prev * 1.2); const cx = windowSize.width / 2, cy = (windowSize.height - TOOLBAR_HEIGHT) / 2; const sr = ns / prev; setPan(p => ({ x: cx - (cx - p.x) * sr, y: cy - (cy - p.y) * sr })); return ns; });
  }, [windowSize]);

  const handleZoomOut = useCallback(() => {
    setScale(prev => { const ns = Math.max(0.2, prev / 1.2); const cx = windowSize.width / 2, cy = (windowSize.height - TOOLBAR_HEIGHT) / 2; const sr = ns / prev; setPan(p => ({ x: cx - (cx - p.x) * sr, y: cy - (cy - p.y) * sr })); return ns; });
  }, [windowSize]);

  const handleExportJSON = useCallback(() => {
    const data = JSON.stringify({ nodes, layoutType, relationships, themeName, colorSchemeIdx }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${canvasName}.json`; a.click();
    setContextMenu(null);
  }, [nodes, layoutType, relationships, themeName, colorSchemeIdx, canvasName]);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data)) { setNodes(data); pushHistory(data); }
          else if (data.nodes) { setNodes(data.nodes); if (data.layoutType) setLayoutType(data.layoutType); if (data.relationships) setRelationships(data.relationships); pushHistory(data.nodes); }
          setTimeout(() => handleFitView(), 100);
        } catch { alert('文件格式错误'); }
      };
      reader.readAsText(file);
    };
    input.click(); setContextMenu(null);
  }, [pushHistory, handleFitView]);

  const handleMergeJSON = useCallback(() => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          const imported = Array.isArray(data) ? data : data.nodes || [];
          if (imported.length > 0) {
            const root = getRootNode(nodes);
            const importedRoot = imported.find(n => !n.parentId);
            if (root && importedRoot) {
              const newChild = { ...importedRoot, id: generateId(), parentId: root.id, text: importedRoot.text };
              let allNodes = [...nodes, newChild];
              const idMap = { [importedRoot.id]: newChild.id };
              imported.filter(n => n.parentId).forEach(n => {
                const newId = generateId();
                idMap[n.id] = newId;
                allNodes.push({ ...n, id: newId, parentId: idMap[n.parentId] || root.id });
              });
              setNodes(allNodes); pushHistory(allNodes);
            }
          }
        } catch { alert('文件格式错误'); }
      };
      reader.readAsText(file);
    };
    input.click(); setContextMenu(null);
  }, [nodes, pushHistory]);

  const handleNewFromTemplate = useCallback((templateKey) => {
    const template = TEMPLATES[templateKey];
    if (!template) return;
    const newNodes = template.create();
    setNodes(newNodes); setRelationships([]); setSelectedId(null); setEditingId(null);
    pushHistory(newNodes); setTimeout(() => handleFitView(), 100); setContextMenu(null);
  }, [pushHistory, handleFitView]);

  const handleNewFile = useCallback(() => {
    const n = createDefaultData(); setNodes(n); setRelationships([]); setSelectedId(null); setEditingId(null);
    pushHistory(n); setTimeout(() => handleFitView(), 100); setContextMenu(null);
  }, [pushHistory, handleFitView]);

  const handleThemeChange = useCallback((name) => { setThemeName(name); setContextMenu(null); }, []);
  const handleLayoutChange = useCallback((type) => { setLayoutType(type); setContextMenu(null); setTimeout(() => handleFitView(), 50); }, [handleFitView]);
  const handleColorSchemeChange = useCallback((idx) => { setColorSchemeIdx(idx); }, []);

  const handleExportPNG = useCallback(() => {
    const content = contentRef.current; if (!content) return;
    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(content, { backgroundColor: null, scale: 2 }).then(canvas => {
        const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `${canvasName}.png`; a.click();
      });
    }).catch(() => alert('导出PNG需要安装html2canvas'));
    setContextMenu(null);
  }, [canvasName]);

  const handleExportSVG = useCallback(() => {
    const svgEl = containerRef.current?.querySelector('.svg-layer');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${canvasName}.svg`; a.click();
    setContextMenu(null);
  }, [canvasName]);

  const handleExportMarkdown = useCallback(() => {
    const root = getRootNode(nodes); if (!root) return;
    const buildMd = (nodeId, depth = 0) => {
      const node = nodes.find(n => n.id === nodeId); if (!node) return '';
      let line = '#'.repeat(Math.min(depth + 1, 6)) + ' ' + node.text;
      if (node.checkbox !== null) line = `- [${node.checkbox ? 'x' : ' '}] ` + node.text;
      if (node.priority) line += ` [P${node.priority}]`;
      if (node.note) line += '\n> ' + node.note.split('\n').join('\n> ');
      const children = getChildren(nodes, nodeId);
      return [line, ...children.flatMap(c => buildMd(c.id, depth + 1).split('\n'))].join('\n');
    };
    const md = buildMd(root.id);
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${canvasName}.md`; a.click();
    setContextMenu(null);
  }, [nodes, canvasName]);

  const handlePrint = useCallback(() => { window.print(); setContextMenu(null); }, []);

  const handleSearch = useCallback((text) => {
    setSearchText(text);
    if (!text.trim()) { setSearchResults([]); setSearchResultIdx(-1); return; }
    const results = nodes.filter(n => n.text.toLowerCase().includes(text.toLowerCase()) || (n.note && n.note.toLowerCase().includes(text.toLowerCase()))).map(n => n.id);
    setSearchResults(results); setSearchResultIdx(results.length > 0 ? 0 : -1);
    if (results.length > 0) setSelectedId(results[0]);
  }, [nodes]);

  const handleSearchNext = useCallback(() => {
    if (searchResults.length === 0) return;
    const ni = (searchResultIdx + 1) % searchResults.length;
    setSearchResultIdx(ni); setSelectedId(searchResults[ni]);
  }, [searchResults, searchResultIdx]);

  const handleArrowKey = useCallback((key) => {
    if (!selectedId) { const root = getRootNode(nodes); if (root) setSelectedId(root.id); return; }
    const node = nodes.find(n => n.id === selectedId); if (!node) return;
    const pos = positions[selectedId]; if (!pos) return;
    const dir = pos.direction || 'right'; const isH = dir === 'right' || dir === 'left' || dir === 'center';
    if (isH) {
      if (key === 'ArrowRight') { if (dir === 'right' || dir === 'center') { const ch = getChildren(nodes, selectedId); if (ch.length > 0 && !node.collapsed) setSelectedId(ch[0].id); } else if (node.parentId) setSelectedId(node.parentId); }
      else if (key === 'ArrowLeft') { if (dir === 'left') { const ch = getChildren(nodes, selectedId); if (ch.length > 0 && !node.collapsed) setSelectedId(ch[0].id); } else if (node.parentId) setSelectedId(node.parentId); }
      else if (key === 'ArrowDown') { const sibs = nodes.filter(n => n.parentId === node.parentId); const idx = sibs.findIndex(n => n.id === selectedId); if (idx < sibs.length - 1) setSelectedId(sibs[idx + 1].id); }
      else if (key === 'ArrowUp') { const sibs = nodes.filter(n => n.parentId === node.parentId); const idx = sibs.findIndex(n => n.id === selectedId); if (idx > 0) setSelectedId(sibs[idx - 1].id); }
    } else {
      if (key === 'ArrowDown') { const ch = getChildren(nodes, selectedId); if (ch.length > 0 && !node.collapsed) setSelectedId(ch[0].id); }
      else if (key === 'ArrowUp') { if (node.parentId) setSelectedId(node.parentId); }
      else if (key === 'ArrowRight') { const sibs = nodes.filter(n => n.parentId === node.parentId); const idx = sibs.findIndex(n => n.id === selectedId); if (idx < sibs.length - 1) setSelectedId(sibs[idx + 1].id); }
      else if (key === 'ArrowLeft') { const sibs = nodes.filter(n => n.parentId === node.parentId); const idx = sibs.findIndex(n => n.id === selectedId); if (idx > 0) setSelectedId(sibs[idx - 1].id); }
    }
  }, [selectedId, nodes, positions]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingId) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleFinishEdit(); } return; }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Tab') { e.preventDefault(); if (selectedId) handleAddChild(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (selectedId) { const nd = nodes.find(n => n.id === selectedId); if (nd?.parentId) handleAddSibling(); } }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedRelId) { e.preventDefault(); handleDeleteRelationship(selectedRelId); } else if (selectedId) { e.preventDefault(); handleDelete(); } }
      else if (e.key === 'Escape') { setLinkingFromId(null); setSelectedRelId(null); setZenMode(false); setFocusBranchId(null); }
      else if (e.key === 'F2') { e.preventDefault(); if (selectedId) handleDoubleClick(selectedId); }
      else if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
      else if (e.key === ' ') { e.preventDefault(); if (selectedId) handleToggleCollapse(selectedId); }
      else if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) { e.preventDefault(); handleArrowKey(e.key); }
      else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setShowOutline(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editingId, nodes, handleAddChild, handleAddSibling, handleDelete, handleFinishEdit, handleDoubleClick, handleToggleCollapse, undo, redo, handleArrowKey, selectedRelId, handleDeleteRelationship]);

  useEffect(() => { if (editingId && editingRef.current) { editingRef.current.focus(); editingRef.current.select(); } }, [editingId]);
  useEffect(() => { const h = (e) => { if (contextMenu && !e.target.closest('.context-menu')) setContextMenu(null); }; document.addEventListener('click', h); return () => document.removeEventListener('click', h); }, [contextMenu]);

  const selectedNode = selectedId ? nodes.find(n => n.id === selectedId) : null;
  const isRootSelected = selectedNode ? !selectedNode.parentId : false;

  if (showPresentation) return <PresentationMode nodes={nodes} positions={positions} theme={theme} onClose={() => setShowPresentation(false)} />;
  if (showGantt) return <GanttView nodes={nodes} theme={theme} onClose={() => setShowGantt(false)} />;

  return (
    <div className={`app-container ${zenMode ? 'zen-mode' : ''}`} style={{ backgroundColor: theme.canvasBg }}>
      {!zenMode && <Toolbar
        theme={theme} onUndo={undo} onRedo={redo} canUndo={historyIndexRef.current > 0} canRedo={historyIndexRef.current < historyRef.current.length - 1}
        onAddChild={handleAddChild} onAddSibling={handleAddSibling} onDelete={handleDelete} hasSelection={!!selectedId} isRoot={isRootSelected}
        onFitView={handleFitView} onCenterRoot={handleCenterRoot} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onZoomReset={() => { setScale(1); handleCenterRoot(); }} scale={scale}
        onNewFile={handleNewFile} onExport={handleExportJSON} onImport={handleImportJSON} onExportPNG={handleExportPNG} onExportSVG={handleExportSVG} onExportMarkdown={handleExportMarkdown} onPrint={handlePrint} onMerge={handleMergeJSON}
        themeName={themeName} onThemeChange={handleThemeChange}
        layoutType={layoutType} onLayoutChange={handleLayoutChange}
        onToggleNote={() => setShowNotePanel(p => !p)} onToggleOutline={() => setShowOutline(p => !p)} showNote={showNotePanel} showOutline={showOutline}
        onToggleMarker={selectedId ? (m) => handleToggleMarker(selectedId, m) : undefined}
        onSetPriority={selectedId ? (p) => handleSetPriority(selectedId, p) : undefined}
        onToggleCheckbox={selectedId ? () => handleToggleCheckbox(selectedId) : undefined}
        onAddLabel={selectedId ? (l) => handleAddLabel(selectedId, l) : undefined}
        onSetLink={selectedId ? (l) => handleSetLink(selectedId, l) : undefined}
        onSetSticker={selectedId ? (s) => handleSetSticker(selectedId, s) : undefined}
        onSetTask={selectedId ? (t) => handleSetTask(selectedId, t) : undefined}
        onStartLink={selectedId ? () => handleStartLinking(selectedId) : undefined} isLinking={!!linkingFromId}
        onDeleteRelationship={selectedRelId ? () => handleDeleteRelationship(selectedRelId) : undefined} hasSelectedRel={!!selectedRelId}
        onToggleZen={() => setZenMode(true)} onToggleGantt={() => setShowGantt(true)} onTogglePresentation={() => setShowPresentation(true)}
        onFocusBranch={selectedId ? () => setFocusBranchId(selectedId) : undefined} onUnfocusBranch={() => setFocusBranchId(null)} focusBranchId={focusBranchId}
        onToggleNumbering={() => setShowNumbering(p => !p)} showNumbering={showNumbering}
        onToggleSketchy={() => setSketchyMode(p => !p)} sketchyMode={sketchyMode}
        colorSchemeIdx={colorSchemeIdx} onColorSchemeChange={handleColorSchemeChange} colorSchemes={COLOR_SCHEMES}
        onNewFromTemplate={handleNewFromTemplate} templates={TEMPLATES}
        filter={filter} onFilterChange={setFilter}
        searchText={searchText} onSearch={handleSearch} onSearchNext={handleSearchNext} searchResultCount={searchResults.length} searchResultIdx={searchResultIdx}
        canvasName={canvasName} onCanvasNameChange={setCanvasName}
      />}

      <div className={`mindmap-container ${isPanning ? 'panning' : ''}`} ref={containerRef}
        onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove} onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
        onContextMenu={handleContextMenu} onWheel={handleWheel}
        style={{ backgroundColor: theme.canvasBg, backgroundImage: `radial-gradient(circle, ${theme.canvasDot} 1px, transparent 1px)`, paddingTop: zenMode ? 0 : TOOLBAR_HEIGHT }}
      >
        <div className="mindmap-content" ref={contentRef} style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', filter: sketchyMode ? 'url(#sketchy-filter)' : 'none' }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', overflow: 'visible' }}>
            {sketchyMode && <defs><filter id="sketchy-filter"><feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise" /><feDisplacementMap in="SourceGraphic" in2="noise" scale="2" /></filter></defs>}
            {connections.map(conn => {
              const bc = conn.nodeId ? getBranchColor(nodes, conn.nodeId, colorScheme) : (colorScheme ? colorScheme.root : theme.rootBg);
              const strokeW = conn.isSpine ? 2 : 2.5;
              return <path key={conn.key} d={conn.pathData} stroke={bc} strokeWidth={strokeW} strokeLinecap="round" fill="none" opacity={conn.isSpine ? 0.5 : 0.6} />;
            })}
            {relPaths.map(rp => (
              <g key={rp.key} onClick={() => handleRelClick(rp.relId)} style={{ cursor: 'pointer' }}>
                <path d={rp.pathData} stroke={selectedRelId === rp.relId ? '#e17055' : '#6c5ce7'} strokeWidth={selectedRelId === rp.relId ? 3 : 2} strokeDasharray="6 3" strokeLinecap="round" fill="none" opacity={selectedRelId === rp.relId ? 1 : 0.5} />
                <path d={rp.pathData} stroke="transparent" strokeWidth="12" fill="none" />
                {rp.label && <text x={rp.midX} y={rp.midY - 6} textAnchor="middle" fill={selectedRelId === rp.relId ? '#e17055' : '#6c5ce7'} fontSize="11" fontWeight="500">{rp.label}</text>}
              </g>
            ))}
          </svg>
          {visibleNodes.map(node => {
            const pos = positions[node.id]; if (!pos) return null;
            const level = getNodeLevel(nodes, node.id);
            const isRoot = level === 0;
            const bc = isRoot ? (colorScheme ? colorScheme.root : theme.rootBg) : getBranchColor(nodes, node.id, colorScheme);
            const tc = isRoot ? theme.rootColor : getTextColor(bc);
            const children = getChildren(nodes, node.id);
            return <NodeComponent key={node.id} node={node} pos={pos} level={level} isRoot={isRoot} branchColor={bc} textColor={tc}
              hasChildren={children.length > 0} isSelected={selectedId === node.id} isEditing={editingId === node.id}
              isLinking={!!linkingFromId} isLinkSource={linkingFromId === node.id} theme={theme}
              editingRef={editingId === node.id ? editingRef : null} numbering={showNumbering ? getNodeNumbering(nodes, node.id) : ''}
              onSelect={handleSelectNode} onDoubleClick={handleDoubleClick} onToggleCollapse={handleToggleCollapse}
              onEditText={handleEditText} onFinishEdit={handleFinishEdit} onToggleCheckbox={handleToggleCheckbox} />;
          })}
        </div>
      </div>

      {contextMenu && <ContextMenu contextMenu={contextMenu} theme={theme}
        onAddChild={handleAddChild} onAddSibling={handleAddSibling} onDelete={handleDelete} onToggleCollapse={() => { if (contextMenu.nodeId) handleToggleCollapse(contextMenu.nodeId); setContextMenu(null); }}
        onFitView={handleFitView} onCenterRoot={handleCenterRoot} onExport={handleExportJSON} onImport={handleImportJSON} onNewFile={handleNewFile} onClose={() => setContextMenu(null)}
        isRoot={contextMenu.nodeId ? !nodes.find(n => n.id === contextMenu.nodeId)?.parentId : false}
        node={contextMenu.nodeId ? nodes.find(n => n.id === contextMenu.nodeId) : null}
        layoutType={layoutType} onLayoutChange={handleLayoutChange}
        onToggleMarker={contextMenu.nodeId ? (m) => handleToggleMarker(contextMenu.nodeId, m) : undefined}
        onSetPriority={contextMenu.nodeId ? (p) => handleSetPriority(contextMenu.nodeId, p) : undefined}
        onToggleNote={() => { setShowNotePanel(true); setContextMenu(null); }}
        onStartLink={contextMenu.nodeId ? () => { handleStartLinking(contextMenu.nodeId); setContextMenu(null); } : undefined}
        isLinking={!!linkingFromId} onDeleteRelationship={selectedRelId ? () => { handleDeleteRelationship(selectedRelId); setContextMenu(null); } : undefined} hasSelectedRel={!!selectedRelId}
        onToggleCheckbox={contextMenu.nodeId ? () => { handleToggleCheckbox(contextMenu.nodeId); setContextMenu(null); } : undefined}
        onAddLabel={contextMenu.nodeId ? (l) => { handleAddLabel(contextMenu.nodeId, l); setContextMenu(null); } : undefined}
        onSetLink={contextMenu.nodeId ? (l) => { handleSetLink(contextMenu.nodeId, l); setContextMenu(null); } : undefined}
        onSetSticker={contextMenu.nodeId ? (s) => { handleSetSticker(contextMenu.nodeId, s); setContextMenu(null); } : undefined}
        onSetTask={contextMenu.nodeId ? (t) => { handleSetTask(contextMenu.nodeId, t); setContextMenu(null); } : undefined}
        onFocusBranch={contextMenu.nodeId ? () => { setFocusBranchId(contextMenu.nodeId); setContextMenu(null); } : undefined}
        onExportPNG={handleExportPNG} onExportMarkdown={handleExportMarkdown}
      />}

      {showNotePanel && selectedId && <NotePanel node={selectedNode} theme={theme} onUpdateNote={(note) => handleUpdateNote(selectedId, note)} onClose={() => setShowNotePanel(false)} />}
      {showOutline && <OutlinePanel nodes={nodes} theme={theme} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} onClose={() => setShowOutline(false)} />}
      <MiniMap nodes={visibleNodes} positions={positions} pan={pan} scale={scale} theme={theme} containerWidth={windowSize.width} containerHeight={windowSize.height - TOOLBAR_HEIGHT} onNavigate={(p) => setPan(p)} />

      {linkingFromId && <div style={{ position: 'fixed', top: zenMode ? '20px' : '80px', left: '50%', transform: 'translateX(-50%)', padding: '8px 20px', borderRadius: '20px', backgroundColor: '#6c5ce7', color: '#fff', fontSize: '13px', fontWeight: '600', zIndex: 200, boxShadow: '0 4px 16px rgba(108,92,231,0.4)', pointerEvents: 'none' }}>🔗 关联模式：点击目标节点完成连接 · 按 Esc 取消</div>}

      {!zenMode && <div className="hint" style={{ backgroundColor: theme.hintBg, color: theme.hintColor, borderColor: theme.hintBorder }}>Tab 子节点 · Enter 兄弟 · Del 删除 · F2 编辑 · Space 折叠 · Esc 退出模式</div>}
    </div>
  );
}

export default App;
