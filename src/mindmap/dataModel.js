let idCounter = 0;

export function generateId() {
  return `node_${Date.now()}_${++idCounter}`;
}

export function createNode(text = '新节点', parentId = null) {
  return {
    id: generateId(),
    text,
    parentId,
    collapsed: false,
    markers: [],
    note: '',
    label: '',
    priority: null,
    style: {},
  };
}

export function createDefaultData() {
  const root = createNode('中心主题');
  root.id = 'root';

  const child1 = createNode('分支一', root.id);
  child1.id = 'child1';
  child1.priority = 1;
  const child1_1 = createNode('子主题 1-1', child1.id);
  child1_1.id = 'child1_1';
  const child1_2 = createNode('子主题 1-2', child1.id);
  child1_2.id = 'child1_2';

  const child2 = createNode('分支二', root.id);
  child2.id = 'child2';
  child2.priority = 2;
  const child2_1 = createNode('子主题 2-1', child2.id);
  child2_1.id = 'child2_1';
  const child2_2 = createNode('子主题 2-2', child2.id);
  child2_2.id = 'child2_2';
  const child2_3 = createNode('子主题 2-3', child2.id);
  child2_3.id = 'child2_3';

  const child3 = createNode('分支三', root.id);
  child3.id = 'child3';
  const child3_1 = createNode('子主题 3-1', child3.id);
  child3_1.id = 'child3_1';

  const child4 = createNode('分支四', root.id);
  child4.id = 'child4';

  return [
    root,
    child1, child1_1, child1_2,
    child2, child2_1, child2_2, child2_3,
    child3, child3_1,
    child4,
  ];
}

export function getChildren(nodes, parentId) {
  return nodes.filter(n => n.parentId === parentId);
}

export function getNodeLevel(nodes, nodeId) {
  let level = 0;
  let current = nodes.find(n => n.id === nodeId);
  while (current && current.parentId) {
    level++;
    current = nodes.find(n => n.id === current.parentId);
  }
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

export function getVisibleNodes(nodes) {
  return nodes.filter(n => isNodeVisible(nodes, n.id));
}

export function getDescendantIds(nodes, nodeId) {
  const ids = [];
  const children = nodes.filter(n => n.parentId === nodeId);
  children.forEach(child => {
    ids.push(child.id);
    ids.push(...getDescendantIds(nodes, child.id));
  });
  return ids;
}

export function getRootNode(nodes) {
  return nodes.find(n => !n.parentId);
}

export function addNodeToParent(nodes, parentId, text = '新节点') {
  const newNode = createNode(text, parentId);
  const parent = nodes.find(n => n.id === parentId);
  if (parent && parent.collapsed) {
    const updated = nodes.map(n =>
      n.id === parentId ? { ...n, collapsed: false } : n
    );
    return [...updated, newNode];
  }
  return [...nodes, newNode];
}

export function addSiblingNode(nodes, nodeId, text = '新节点') {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.parentId) return nodes;
  const newNode = createNode(text, node.parentId);
  const newNodes = [...nodes];
  const lastSiblingIndex = newNodes.findLastIndex(n => n.parentId === node.parentId);
  newNodes.splice(lastSiblingIndex + 1, 0, newNode);
  return newNodes;
}

export function deleteNodeById(nodes, nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.parentId) return nodes;
  const descendantIds = getDescendantIds(nodes, nodeId);
  const idsToDelete = new Set([nodeId, ...descendantIds]);
  return nodes.filter(n => !idsToDelete.has(n.id));
}

export function updateNodeText(nodes, nodeId, text) {
  return nodes.map(n => n.id === nodeId ? { ...n, text } : n);
}

export function toggleCollapse(nodes, nodeId) {
  return nodes.map(n =>
    n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n
  );
}

export function updateNodeStyle(nodes, nodeId, style) {
  return nodes.map(n =>
    n.id === nodeId ? { ...n, style: { ...n.style, ...style } } : n
  );
}

export function updateNodeNote(nodes, nodeId, note) {
  return nodes.map(n =>
    n.id === nodeId ? { ...n, note } : n
  );
}

export function updateNodeLabel(nodes, nodeId, label) {
  return nodes.map(n =>
    n.id === nodeId ? { ...n, label } : n
  );
}

export function toggleNodeMarker(nodes, nodeId, marker) {
  return nodes.map(n => {
    if (n.id !== nodeId) return n;
    const markers = n.markers || [];
    const newMarkers = markers.includes(marker)
      ? markers.filter(m => m !== marker)
      : [...markers, marker];
    return { ...n, markers: newMarkers };
  });
}

export function setNodePriority(nodes, nodeId, priority) {
  return nodes.map(n => {
    if (n.id !== nodeId) return n;
    return { ...n, priority: n.priority === priority ? null : priority };
  });
}

export const LAYOUT_TYPES = {
  MIND_MAP: 'mind-map',
  LOGIC_RIGHT: 'logic-right',
  LOGIC_LEFT: 'logic-left',
  ORG_DOWN: 'org-down',
  ORG_UP: 'org-up',
  FISHBONE_RIGHT: 'fishbone-right',
  FISHBONE_LEFT: 'fishbone-left',
  TREE_DOWN: 'tree-down',
};

export const LAYOUT_LABELS = {
  [LAYOUT_TYPES.MIND_MAP]: '思维导图',
  [LAYOUT_TYPES.LOGIC_RIGHT]: '逻辑图(右)',
  [LAYOUT_TYPES.LOGIC_LEFT]: '逻辑图(左)',
  [LAYOUT_TYPES.ORG_DOWN]: '组织结构(下)',
  [LAYOUT_TYPES.ORG_UP]: '组织结构(上)',
  [LAYOUT_TYPES.FISHBONE_RIGHT]: '鱼骨图(右)',
  [LAYOUT_TYPES.FISHBONE_LEFT]: '鱼骨图(左)',
  [LAYOUT_TYPES.TREE_DOWN]: '树状图(下)',
};

export const PRIORITY_ICONS = {
  1: '🔴',
  2: '🟠',
  3: '🟡',
  4: '🟢',
  5: '🔵',
};

export const MARKER_ICONS = {
  star: '⭐',
  flag: '🚩',
  people: '👤',
  heart: '❤️',
  check: '✅',
  cross: '❌',
  question: '❓',
  exclaim: '❗',
  arrow_up: '⬆️',
  arrow_down: '⬇️',
};
