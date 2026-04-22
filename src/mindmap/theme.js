export const BRANCH_COLORS = [
  '#4A90D9', '#E8635A', '#47C9AF', '#F5A623', '#9B59B6',
  '#1ABC9C', '#E67E22', '#5DADE2', '#EC407A', '#26A69A',
  '#8BC34A', '#FF7043', '#607D8B',
];

export function getBranchColor(nodes, nodeId, colorScheme = null) {
  let current = nodes.find(n => n.id === nodeId);
  if (!current) return BRANCH_COLORS[0];

  if (!current.parentId) return colorScheme ? colorScheme.root : '#6c5ce7';

  while (current.parentId) {
    const parent = nodes.find(n => n.id === current.parentId);
    if (!parent) break;
    if (!parent.parentId) {
      if (colorScheme) {
        const rootChildren = nodes.filter(n => n.parentId === parent.id);
        const idx = rootChildren.findIndex(n => n.id === current.id);
        return colorScheme.colors[idx % colorScheme.colors.length];
      }
      const rootChildren = nodes.filter(n => n.parentId === parent.id);
      const idx = rootChildren.findIndex(n => n.id === current.id);
      return BRANCH_COLORS[idx % BRANCH_COLORS.length];
    }
    current = parent;
  }

  return BRANCH_COLORS[0];
}

export function getTextColor(bgColor) {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#2d3436' : '#ffffff';
}

export const THEMES = {
  dark: {
    name: '深色',
    canvasBg: '#1a1a2e',
    canvasDot: 'rgba(255,255,255,0.03)',
    toolbarBg: 'rgba(26,26,46,0.95)',
    toolbarBorder: 'rgba(255,255,255,0.08)',
    toolbarBtnBg: 'rgba(255,255,255,0.06)',
    toolbarBtnBorder: 'rgba(255,255,255,0.1)',
    toolbarBtnColor: 'rgba(255,255,255,0.85)',
    toolbarBtnHoverBg: 'rgba(255,255,255,0.12)',
    toolbarBtnHoverBorder: 'rgba(255,255,255,0.2)',
    toolbarBtnDisabledColor: 'rgba(255,255,255,0.25)',
    contextMenuBg: 'rgba(30,30,50,0.96)',
    contextMenuBorder: 'rgba(255,255,255,0.1)',
    contextMenuItemColor: 'rgba(255,255,255,0.85)',
    contextMenuItemHoverBg: 'rgba(255,255,255,0.08)',
    rootBg: '#6c5ce7',
    rootColor: '#fff',
    rootShadow: 'rgba(108,92,231,0.35)',
    selectedOutline: 'rgba(255,255,255,0.85)',
    hintBg: 'rgba(26,26,46,0.92)',
    hintColor: 'rgba(255,255,255,0.4)',
    hintBorder: 'rgba(255,255,255,0.06)',
    nodeShadow: 'rgba(0,0,0,0.25)',
    collapseBtnBg: 'rgba(255,255,255,0.9)',
    collapseBtnColor: '#555',
    collapseBtnBorder: 'rgba(0,0,0,0.1)',
    miniMapBg: 'rgba(26,26,46,0.9)',
    miniMapBorder: 'rgba(255,255,255,0.1)',
    miniMapViewport: 'rgba(108,92,231,0.3)',
    miniMapNode: 'rgba(255,255,255,0.5)',
    separatorColor: 'rgba(255,255,255,0.08)',
  },
  light: {
    name: '浅色',
    canvasBg: '#f5f5f5',
    canvasDot: 'rgba(0,0,0,0.04)',
    toolbarBg: 'rgba(255,255,255,0.95)',
    toolbarBorder: 'rgba(0,0,0,0.08)',
    toolbarBtnBg: 'rgba(0,0,0,0.04)',
    toolbarBtnBorder: 'rgba(0,0,0,0.08)',
    toolbarBtnColor: 'rgba(0,0,0,0.75)',
    toolbarBtnHoverBg: 'rgba(0,0,0,0.08)',
    toolbarBtnHoverBorder: 'rgba(0,0,0,0.15)',
    toolbarBtnDisabledColor: 'rgba(0,0,0,0.25)',
    contextMenuBg: 'rgba(255,255,255,0.96)',
    contextMenuBorder: 'rgba(0,0,0,0.08)',
    contextMenuItemColor: 'rgba(0,0,0,0.75)',
    contextMenuItemHoverBg: 'rgba(0,0,0,0.06)',
    rootBg: '#6c5ce7',
    rootColor: '#fff',
    rootShadow: 'rgba(108,92,231,0.25)',
    selectedOutline: 'rgba(108,92,231,0.8)',
    hintBg: 'rgba(255,255,255,0.92)',
    hintColor: 'rgba(0,0,0,0.35)',
    hintBorder: 'rgba(0,0,0,0.06)',
    nodeShadow: 'rgba(0,0,0,0.1)',
    collapseBtnBg: 'rgba(255,255,255,0.95)',
    collapseBtnColor: '#555',
    collapseBtnBorder: 'rgba(0,0,0,0.1)',
    miniMapBg: 'rgba(255,255,255,0.9)',
    miniMapBorder: 'rgba(0,0,0,0.08)',
    miniMapViewport: 'rgba(108,92,231,0.25)',
    miniMapNode: 'rgba(0,0,0,0.3)',
    separatorColor: 'rgba(0,0,0,0.08)',
  },
  classic: {
    name: '经典',
    canvasBg: '#faf8f0',
    canvasDot: 'rgba(0,0,0,0.03)',
    toolbarBg: 'rgba(250,248,240,0.95)',
    toolbarBorder: 'rgba(0,0,0,0.06)',
    toolbarBtnBg: 'rgba(0,0,0,0.03)',
    toolbarBtnBorder: 'rgba(0,0,0,0.06)',
    toolbarBtnColor: 'rgba(0,0,0,0.7)',
    toolbarBtnHoverBg: 'rgba(0,0,0,0.06)',
    toolbarBtnHoverBorder: 'rgba(0,0,0,0.12)',
    toolbarBtnDisabledColor: 'rgba(0,0,0,0.2)',
    contextMenuBg: 'rgba(250,248,240,0.96)',
    contextMenuBorder: 'rgba(0,0,0,0.06)',
    contextMenuItemColor: 'rgba(0,0,0,0.7)',
    contextMenuItemHoverBg: 'rgba(0,0,0,0.04)',
    rootBg: '#e17055',
    rootColor: '#fff',
    rootShadow: 'rgba(225,112,85,0.25)',
    selectedOutline: 'rgba(225,112,85,0.8)',
    hintBg: 'rgba(250,248,240,0.92)',
    hintColor: 'rgba(0,0,0,0.3)',
    hintBorder: 'rgba(0,0,0,0.04)',
    nodeShadow: 'rgba(0,0,0,0.08)',
    collapseBtnBg: 'rgba(255,255,255,0.95)',
    collapseBtnColor: '#555',
    collapseBtnBorder: 'rgba(0,0,0,0.08)',
    miniMapBg: 'rgba(250,248,240,0.9)',
    miniMapBorder: 'rgba(0,0,0,0.06)',
    miniMapViewport: 'rgba(225,112,85,0.25)',
    miniMapNode: 'rgba(0,0,0,0.25)',
    separatorColor: 'rgba(0,0,0,0.06)',
  },
};
