let idCounter = 0;

export function generateId() {
  return `node_${Date.now()}_${++idCounter}`;
}

export const APP_VERSION = '2.0.0';

export function createNode(text = '新节点', parentId = null) {
  return {
    id: generateId(),
    text,
    parentId,
    collapsed: false,
    markers: [],
    note: '',
    labels: [],
    priority: null,
    checkbox: null,
    link: '',
    topicLink: '',
    image: '',
    sticker: '',
    style: {},
    task: null,
    isFree: false,
  };
}

export function createDefaultData() {
  const root = createNode('中心主题');
  root.id = 'root';
  const child1 = createNode('分支一', root.id); child1.id = 'child1'; child1.priority = 1;
  const child1_1 = createNode('子主题 1-1', child1.id); child1_1.id = 'child1_1'; child1_1.checkbox = false;
  const child1_2 = createNode('子主题 1-2', child1.id); child1_2.id = 'child1_2'; child1_2.checkbox = true;
  const child2 = createNode('分支二', root.id); child2.id = 'child2'; child2.priority = 2;
  const child2_1 = createNode('子主题 2-1', child2.id); child2_1.id = 'child2_1';
  const child2_2 = createNode('子主题 2-2', child2.id); child2_2.id = 'child2_2';
  const child2_3 = createNode('子主题 2-3', child2.id); child2_3.id = 'child2_3';
  const child3 = createNode('分支三', root.id); child3.id = 'child3';
  const child3_1 = createNode('子主题 3-1', child3.id); child3_1.id = 'child3_1';
  const child4 = createNode('分支四', root.id); child4.id = 'child4';
  return [root, child1, child1_1, child1_2, child2, child2_1, child2_2, child2_3, child3, child3_1, child4];
}

export const TEMPLATES = {
  blank: { name: '空白', create: () => { const r = createNode('中心主题'); r.id = 'root'; return [r]; } },
  meeting: { name: '会议记录', create: () => {
    const r = createNode('会议记录'); r.id = 'root';
    const c1 = createNode('会议主题', r.id); c1.id = 'c1';
    const c2 = createNode('参会人员', r.id); c2.id = 'c2';
    const c3 = createNode('会议决议', r.id); c3.id = 'c3';
    const c4 = createNode('待办事项', r.id); c4.id = 'c4';
    const c4_1 = createNode('任务1', c4.id); c4_1.id = 'c4_1'; c4_1.checkbox = false;
    const c4_2 = createNode('任务2', c4.id); c4_2.id = 'c4_2'; c4_2.checkbox = false;
    return [r, c1, c2, c3, c4, c4_1, c4_2];
  }},
  project: { name: '项目规划', create: () => {
    const r = createNode('项目名称'); r.id = 'root';
    const c1 = createNode('目标', r.id); c1.id = 'c1';
    const c2 = createNode('时间线', r.id); c2.id = 'c2';
    const c3 = createNode('资源', r.id); c3.id = 'c3';
    const c4 = createNode('风险', r.id); c4.id = 'c4';
    const c5 = createNode('里程碑', r.id); c5.id = 'c5';
    return [r, c1, c2, c3, c4, c5];
  }},
  study: { name: '学习笔记', create: () => {
    const r = createNode('学习主题'); r.id = 'root';
    const c1 = createNode('核心概念', r.id); c1.id = 'c1';
    const c2 = createNode('关键公式', r.id); c2.id = 'c2';
    const c3 = createNode('例题', r.id); c3.id = 'c3';
    const c4 = createNode('疑问', r.id); c4.id = 'c4'; c4.markers = ['question'];
    return [r, c1, c2, c3, c4];
  }},
  weekly: { name: '周计划', create: () => {
    const r = createNode('本周计划'); r.id = 'root';
    const days = ['周一','周二','周三','周四','周五'];
    return [r, ...days.map((d, i) => { const c = createNode(d, r.id); c.id = `day${i}`; c.checkbox = false; return c; })];
  }},
};

export function getChildren(nodes, parentId) { return nodes.filter(n => n.parentId === parentId); }

export function getNodeLevel(nodes, nodeId) {
  let level = 0, current = nodes.find(n => n.id === nodeId);
  while (current && current.parentId) { level++; current = nodes.find(n => n.id === current.parentId); }
  return level;
}

export function isNodeVisible(nodes, nodeId) {
  let current = nodes.find(n => n.id === nodeId);
  while (current && current.parentId) {
    const parent = nodes.find(n => n.id === current.parentId);
    if (!parent) break;
    if (parent.collapsed) return false;
    current = parent;
  }
  return true;
}

export function getVisibleNodes(nodes) { return nodes.filter(n => isNodeVisible(nodes, n.id)); }

export function getDescendantIds(nodes, nodeId) {
  const ids = [];
  nodes.filter(n => n.parentId === nodeId).forEach(child => { ids.push(child.id); ids.push(...getDescendantIds(nodes, child.id)); });
  return ids;
}

export function getRootNode(nodes) { return nodes.find(n => !n.parentId); }

export function addNodeToParent(nodes, parentId, text = '新节点') {
  const newNode = createNode(text, parentId);
  const parent = nodes.find(n => n.id === parentId);
  if (parent && parent.collapsed) { return [...nodes.map(n => n.id === parentId ? { ...n, collapsed: false } : n), newNode]; }
  return [...nodes, newNode];
}

export function addSiblingNode(nodes, nodeId, text = '新节点') {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.parentId) return nodes;
  const newNode = createNode(text, node.parentId);
  const newNodes = [...nodes];
  newNodes.splice(newNodes.findLastIndex(n => n.parentId === node.parentId) + 1, 0, newNode);
  return newNodes;
}

export function deleteNodeById(nodes, nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.parentId) return nodes;
  const idsToDelete = new Set([nodeId, ...getDescendantIds(nodes, nodeId)]);
  return nodes.filter(n => !idsToDelete.has(n.id));
}

export function updateNodeText(nodes, nodeId, text) { return nodes.map(n => n.id === nodeId ? { ...n, text } : n); }
export function toggleCollapse(nodes, nodeId) { return nodes.map(n => n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n); }
export function updateNodeStyle(nodes, nodeId, style) { return nodes.map(n => n.id === nodeId ? { ...n, style: { ...n.style, ...style } } : n); }
export function updateNodeNote(nodes, nodeId, note) { return nodes.map(n => n.id === nodeId ? { ...n, note } : n); }

export function toggleNodeMarker(nodes, nodeId, marker) {
  return nodes.map(n => {
    if (n.id !== nodeId) return n;
    const markers = n.markers || [];
    return { ...n, markers: markers.includes(marker) ? markers.filter(m => m !== marker) : [...markers, marker] };
  });
}

export function setNodePriority(nodes, nodeId, priority) {
  return nodes.map(n => n.id !== nodeId ? n : { ...n, priority: n.priority === priority ? null : priority });
}

export function toggleCheckbox(nodes, nodeId) {
  return nodes.map(n => n.id !== nodeId ? n : { ...n, checkbox: n.checkbox === null ? false : n.checkbox ? null : true });
}

export function setCheckbox(nodes, nodeId, value) {
  return nodes.map(n => n.id !== nodeId ? n : { ...n, checkbox: value });
}

export function addLabel(nodes, nodeId, label) {
  return nodes.map(n => {
    if (n.id !== nodeId) return n;
    const labels = n.labels || [];
    if (labels.includes(label)) return n;
    return { ...n, labels: [...labels, label] };
  });
}

export function removeLabel(nodes, nodeId, label) {
  return nodes.map(n => {
    if (n.id !== nodeId) return n;
    return { ...n, labels: (n.labels || []).filter(l => l !== label) };
  });
}

export function setNodeLink(nodes, nodeId, link) { return nodes.map(n => n.id === nodeId ? { ...n, link } : n); }
export function setNodeTopicLink(nodes, nodeId, topicLink) { return nodes.map(n => n.id === nodeId ? { ...n, topicLink } : n); }
export function setNodeImage(nodes, nodeId, image) { return nodes.map(n => n.id === nodeId ? { ...n, image } : n); }
export function setNodeSticker(nodes, nodeId, sticker) { return nodes.map(n => n.id === nodeId ? { ...n, sticker } : n); }
export function setNodeTask(nodes, nodeId, task) { return nodes.map(n => n.id === nodeId ? { ...n, task } : n); }
export function setNodeFree(nodes, nodeId, isFree) { return nodes.map(n => n.id === nodeId ? { ...n, isFree } : n); }

export function moveNodeToParent(nodes, nodeId, newParentId) {
  return nodes.map(n => n.id === nodeId ? { ...n, parentId: newParentId } : n);
}

export function moveNodeToIndex(nodes, nodeId, newParentId, insertIndex) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return nodes;
  let newNodes = nodes.filter(n => n.id !== nodeId);
  const siblings = newNodes.filter(n => n.parentId === newParentId);
  const otherNodes = newNodes.filter(n => n.parentId !== newParentId);
  const updatedNode = { ...node, parentId: newParentId };
  siblings.splice(Math.min(insertIndex, siblings.length), 0, updatedNode);
  const parentChildren = newNodes.filter(n => n.parentId === newParentId && n.id !== nodeId);
  const idx = parentChildren.findIndex(n => n.id === nodeId);
  newNodes = [...otherNodes, ...siblings];
  return newNodes;
}

export function getNodeNumbering(nodes, nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.parentId) return '';
  const siblings = nodes.filter(n => n.parentId === node.parentId);
  const idx = siblings.findIndex(n => n.id === nodeId);
  const parentNum = getNodeNumbering(nodes, node.parentId);
  return parentNum ? `${parentNum}.${idx + 1}` : `${idx + 1}`;
}

export function getFilteredNodes(nodes, filters) {
  if (!filters || Object.keys(filters).length === 0) return nodes;
  return nodes.filter(n => {
    if (filters.priority && n.priority !== filters.priority) return false;
    if (filters.marker && !(n.markers || []).includes(filters.marker)) return false;
    if (filters.checkbox === 'unchecked' && n.checkbox !== false) return false;
    if (filters.checkbox === 'checked' && n.checkbox !== true) return false;
    if (filters.label && !(n.labels || []).includes(filters.label)) return false;
    return true;
  });
}

export const LAYOUT_TYPES = {
  MIND_MAP: 'mind-map', LOGIC_RIGHT: 'logic-right', LOGIC_LEFT: 'logic-left',
  ORG_DOWN: 'org-down', ORG_UP: 'org-up', FISHBONE_RIGHT: 'fishbone-right',
  FISHBONE_LEFT: 'fishbone-left', TREE_DOWN: 'tree-down',
  BRACKET: 'bracket', TIMELINE_H: 'timeline-h', TIMELINE_V: 'timeline-v',
};

export const LAYOUT_LABELS = {
  [LAYOUT_TYPES.MIND_MAP]: '思维导图', [LAYOUT_TYPES.LOGIC_RIGHT]: '逻辑图(右)',
  [LAYOUT_TYPES.LOGIC_LEFT]: '逻辑图(左)', [LAYOUT_TYPES.ORG_DOWN]: '组织结构(下)',
  [LAYOUT_TYPES.ORG_UP]: '组织结构(上)', [LAYOUT_TYPES.FISHBONE_RIGHT]: '鱼骨图(右)',
  [LAYOUT_TYPES.FISHBONE_LEFT]: '鱼骨图(左)', [LAYOUT_TYPES.TREE_DOWN]: '树状图(下)',
  [LAYOUT_TYPES.BRACKET]: '括号图', [LAYOUT_TYPES.TIMELINE_H]: '时间轴(横)',
  [LAYOUT_TYPES.TIMELINE_V]: '时间轴(纵)',
};

export const PRIORITY_ICONS = { 1: '🔴', 2: '🟠', 3: '🟡', 4: '🟢', 5: '🔵' };

export const MARKER_ICONS = {
  star: '⭐', flag: '🚩', people: '👤', heart: '❤️', check: '✅',
  cross: '❌', question: '❓', exclaim: '❗', arrow_up: '⬆️', arrow_down: '⬇️',
};

export const STICKER_LIST = ['💡','🎯','🚀','💪','🔥','✨','🎉','📌','🔑','💎','🌟','🏆','📊','🎨','🌈','🍀','🌸','🐱','🐶','🦊'];

export const COLOR_SCHEMES = [
  { name: '经典紫', root: '#6c5ce7', colors: ['#4A90D9','#E8635A','#47C9AF','#F5A623','#9B59B6','#1ABC9C'] },
  { name: '海洋蓝', root: '#0984e3', colors: ['#74b9ff','#0984e3','#00cec9','#81ecec','#a29bfe','#6c5ce7'] },
  { name: '森林绿', root: '#00b894', colors: ['#55efc4','#00b894','#00cec9','#81ecec','#badc58','#6ab04c'] },
  { name: '落日橙', root: '#e17055', colors: ['#fab1a0','#e17055','#fdcb6e','#f39c12','#e74c3c','#d63031'] },
  { name: '樱花粉', root: '#fd79a8', colors: ['#fd79a8','#e84393','#fab1a0','#f8a5c2','#f78fb3','#c44569'] },
  { name: '极简灰', root: '#636e72', colors: ['#b2bec3','#636e72','#dfe6e9','#95a5a6','#7f8c8d','#bdc3c7'] },
];

let relIdCounter = 0;
export function createRelationship(fromId, toId, label = '') { return { id: `rel_${Date.now()}_${++relIdCounter}`, fromId, toId, label }; }
export function addRelationship(relationships, fromId, toId, label = '') {
  if (relationships.some(r => (r.fromId === fromId && r.toId === toId) || (r.fromId === toId && r.toId === fromId))) return relationships;
  return [...relationships, createRelationship(fromId, toId, label)];
}
export function removeRelationship(relationships, relId) { return relationships.filter(r => r.id !== relId); }
export function updateRelationshipLabel(relationships, relId, label) { return relationships.map(r => r.id === relId ? { ...r, label } : r); }
export function getRelationshipsForNode(relationships, nodeId) { return relationships.filter(r => r.fromId === nodeId || r.toId === nodeId); }
export function cleanupRelationships(relationships, nodes) { const ids = new Set(nodes.map(n => n.id)); return relationships.filter(r => ids.has(r.fromId) && ids.has(r.toId)); }

export function loadFromLocalStorage() {
  try {
    const data = localStorage.getItem('mindmap_data');
    if (!data) return null;
    return JSON.parse(data);
  } catch { return null; }
}

export function saveToLocalStorage(data) {
  try { localStorage.setItem('mindmap_data', JSON.stringify(data)); } catch {}
}
