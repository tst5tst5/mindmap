import { getChildren } from './dataModel';

const H_GAP = 60;
const V_GAP = 14;
const ROOT_HEIGHT = 50;
const LEVEL_HEIGHTS = [50, 40, 36, 32];

function getNodeHeight(level) {
  return LEVEL_HEIGHTS[Math.min(level, LEVEL_HEIGHTS.length - 1)];
}

function measureTextWidth(text, level) {
  const fontSize = level === 0 ? 18 : level === 1 ? 14 : level === 2 ? 13 : 12;
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g) || []).length;
  const otherChars = text.length - cjkChars;
  const padding = level === 0 ? 64 : level === 1 ? 48 : level === 2 ? 40 : 32;
  return Math.max(level === 0 ? 120 : 80, cjkChars * fontSize + otherChars * fontSize * 0.6 + padding);
}

function calcSubtreeSize(nodes, nodeId, level, direction) {
  const node = nodes.find(n => n.id === nodeId);
  const children = getChildren(nodes, nodeId);
  const nodeW = measureTextWidth(node.text, level);
  const nodeH = getNodeHeight(level);

  if (children.length === 0 || node.collapsed) {
    return { width: nodeW, height: nodeH };
  }

  const isVertical = direction === 'down' || direction === 'up';
  const gap = isVertical ? H_GAP : V_GAP;

  let totalChildSize = 0;
  children.forEach((child, i) => {
    const childSize = calcSubtreeSize(nodes, child.id, level + 1, direction);
    totalChildSize += isVertical ? childSize.width : childSize.height;
    if (i < children.length - 1) totalChildSize += gap;
  });

  if (isVertical) {
    return {
      width: Math.max(nodeW, totalChildSize),
      height: nodeH + (children.length > 0 ? H_GAP + Math.max(...children.map(c =>
        calcSubtreeSize(nodes, c.id, level + 1, direction).height
      )) : 0),
    };
  } else {
    return {
      width: nodeW + (children.length > 0 ? H_GAP + Math.max(...children.map(c =>
        calcSubtreeSize(nodes, c.id, level + 1, direction).width
      )) : 0),
      height: Math.max(nodeH, totalChildSize),
    };
  }
}

export function layoutMindMap(nodes, layoutType = 'mind-map') {
  const root = nodes.find(n => !n.parentId);
  if (!root) return {};

  switch (layoutType) {
    case 'mind-map':
      return layoutMindMapBoth(nodes, root);
    case 'logic-right':
      return layoutDirectional(nodes, root, 'right');
    case 'logic-left':
      return layoutDirectional(nodes, root, 'left');
    case 'org-down':
      return layoutVertical(nodes, root, 'down');
    case 'org-up':
      return layoutVertical(nodes, root, 'up');
    case 'fishbone-right':
      return layoutFishbone(nodes, root, 'right');
    case 'fishbone-left':
      return layoutFishbone(nodes, root, 'left');
    case 'tree-down':
      return layoutTreeDown(nodes, root);
    default:
      return layoutMindMapBoth(nodes, root);
  }
}

function layoutMindMapBoth(nodes, root) {
  const positions = {};
  const rootW = measureTextWidth(root.text, 0);
  const rootH = ROOT_HEIGHT;

  positions[root.id] = {
    x: -rootW / 2,
    y: -rootH / 2,
    width: rootW,
    height: rootH,
    direction: 'center',
  };

  const rootChildren = getChildren(nodes, root.id);
  const rightChildren = rootChildren.filter((_, i) => i % 2 === 0);
  const leftChildren = rootChildren.filter((_, i) => i % 2 === 1);

  layoutHorizontalBranch(nodes, rightChildren, root, 'right', positions, 1);
  layoutHorizontalBranch(nodes, leftChildren, root, 'left', positions, 1);

  return positions;
}

function layoutDirectional(nodes, root, direction) {
  const positions = {};
  const rootW = measureTextWidth(root.text, 0);
  const rootH = ROOT_HEIGHT;

  positions[root.id] = {
    x: direction === 'right' ? -rootW / 2 : -rootW / 2,
    y: -rootH / 2,
    width: rootW,
    height: rootH,
    direction: 'center',
  };

  const rootChildren = getChildren(nodes, root.id);
  layoutHorizontalBranch(nodes, rootChildren, root, direction, positions, 1);

  return positions;
}

function layoutHorizontalBranch(nodes, children, parent, direction, positions, level) {
  if (children.length === 0) return;

  const parentPos = positions[parent.id];
  const subtreeHeights = children.map(child =>
    calcSubtreeSize(nodes, child.id, level, direction).height
  );

  let totalHeight = 0;
  subtreeHeights.forEach((h, i) => {
    totalHeight += h;
    if (i < subtreeHeights.length - 1) totalHeight += V_GAP;
  });

  const parentCenterY = parentPos.y + parentPos.height / 2;
  let currentY = parentCenterY - totalHeight / 2;

  children.forEach((child, i) => {
    const subtreeH = subtreeHeights[i];
    const childW = measureTextWidth(child.text, level);
    const childH = getNodeHeight(level);
    const centerY = currentY + subtreeH / 2;

    let childX;
    if (direction === 'right') {
      childX = parentPos.x + parentPos.width + H_GAP;
    } else {
      childX = parentPos.x - H_GAP - childW;
    }

    positions[child.id] = {
      x: childX,
      y: centerY - childH / 2,
      width: childW,
      height: childH,
      direction,
    };

    if (!child.collapsed) {
      const grandChildren = getChildren(nodes, child.id);
      layoutHorizontalBranch(nodes, grandChildren, child, direction, positions, level + 1);
    }

    currentY += subtreeH + V_GAP;
  });
}

function layoutVertical(nodes, root, direction) {
  const positions = {};
  const rootW = measureTextWidth(root.text, 0);
  const rootH = ROOT_HEIGHT;

  positions[root.id] = {
    x: -rootW / 2,
    y: direction === 'down' ? -rootH / 2 : -rootH / 2,
    width: rootW,
    height: rootH,
    direction: direction,
  };

  const rootChildren = getChildren(nodes, root.id);
  layoutVerticalBranch(nodes, rootChildren, root, direction, positions, 1);

  return positions;
}

function layoutVerticalBranch(nodes, children, parent, direction, positions, level) {
  if (children.length === 0) return;

  const parentPos = positions[parent.id];
  const subtreeWidths = children.map(child =>
    calcSubtreeSize(nodes, child.id, level, direction).width
  );

  let totalWidth = 0;
  subtreeWidths.forEach((w, i) => {
    totalWidth += w;
    if (i < subtreeWidths.length - 1) totalWidth += H_GAP;
  });

  const parentCenterX = parentPos.x + parentPos.width / 2;
  let currentX = parentCenterX - totalWidth / 2;

  children.forEach((child, i) => {
    const subtreeW = subtreeWidths[i];
    const childW = measureTextWidth(child.text, level);
    const childH = getNodeHeight(level);
    const centerX = currentX + subtreeW / 2;

    let childY;
    if (direction === 'down') {
      childY = parentPos.y + parentPos.height + H_GAP;
    } else {
      childY = parentPos.y - H_GAP - childH;
    }

    positions[child.id] = {
      x: centerX - childW / 2,
      y: childY,
      width: childW,
      height: childH,
      direction,
    };

    if (!child.collapsed) {
      const grandChildren = getChildren(nodes, child.id);
      layoutVerticalBranch(nodes, grandChildren, child, direction, positions, level + 1);
    }

    currentX += subtreeW + H_GAP;
  });
}

function layoutFishbone(nodes, root, direction) {
  const positions = {};
  const rootW = measureTextWidth(root.text, 0);
  const rootH = ROOT_HEIGHT;

  positions[root.id] = {
    x: -rootW / 2,
    y: -rootH / 2,
    width: rootW,
    height: rootH,
    direction: 'center',
  };

  const rootChildren = getChildren(nodes, root.id);
  const halfIdx = Math.ceil(rootChildren.length / 2);
  const topChildren = rootChildren.slice(0, halfIdx);
  const bottomChildren = rootChildren.slice(halfIdx);

  layoutFishboneBranch(nodes, topChildren, root, direction, 'up', positions, 1);
  layoutFishboneBranch(nodes, bottomChildren, root, direction, 'down', positions, 1);

  return positions;
}

function layoutFishboneBranch(nodes, children, parent, hDir, vDir, positions, level) {
  if (children.length === 0) return;

  const parentPos = positions[parent.id];
  const subtreeHeights = children.map(child =>
    calcSubtreeSize(nodes, child.id, level, hDir).height
  );

  let totalHeight = 0;
  subtreeHeights.forEach((h, i) => {
    totalHeight += h;
    if (i < subtreeHeights.length - 1) totalHeight += V_GAP;
  });

  const parentCenterY = parentPos.y + parentPos.height / 2;
  let currentY = vDir === 'up'
    ? parentCenterY - totalHeight
    : parentCenterY;

  children.forEach((child, i) => {
    const subtreeH = subtreeHeights[i];
    const childW = measureTextWidth(child.text, level);
    const childH = getNodeHeight(level);

    let childX;
    if (hDir === 'right') {
      childX = parentPos.x + parentPos.width + H_GAP;
    } else {
      childX = parentPos.x - H_GAP - childW;
    }

    const centerY = currentY + subtreeH / 2;

    positions[child.id] = {
      x: childX,
      y: centerY - childH / 2,
      width: childW,
      height: childH,
      direction: hDir,
    };

    if (!child.collapsed) {
      const grandChildren = getChildren(nodes, child.id);
      layoutHorizontalBranch(nodes, grandChildren, child, hDir, positions, level + 1);
    }

    currentY += subtreeH + V_GAP;
  });
}

function layoutTreeDown(nodes, root) {
  return layoutVertical(nodes, root, 'down');
}

export function getConnectionPaths(nodes, positions) {
  const paths = [];

  nodes.forEach(node => {
    if (!node.parentId) return;
    const parentPos = positions[node.parentId];
    const nodePos = positions[node.id];
    if (!parentPos || !nodePos) return;

    const direction = nodePos.direction || 'right';
    let startX, startY, endX, endY;

    if (direction === 'right') {
      startX = parentPos.x + parentPos.width;
      startY = parentPos.y + parentPos.height / 2;
      endX = nodePos.x;
      endY = nodePos.y + nodePos.height / 2;
    } else if (direction === 'left') {
      startX = parentPos.x;
      startY = parentPos.y + parentPos.height / 2;
      endX = nodePos.x + nodePos.width;
      endY = nodePos.y + nodePos.height / 2;
    } else if (direction === 'down') {
      startX = parentPos.x + parentPos.width / 2;
      startY = parentPos.y + parentPos.height;
      endX = nodePos.x + nodePos.width / 2;
      endY = nodePos.y;
    } else if (direction === 'up') {
      startX = parentPos.x + parentPos.width / 2;
      startY = parentPos.y;
      endX = nodePos.x + nodePos.width / 2;
      endY = nodePos.y + nodePos.height;
    }

    const dx = endX - startX;
    const dy = endY - startY;

    let pathData;
    if (direction === 'right') {
      const cp = Math.abs(dx) * 0.4;
      pathData = `M ${startX} ${startY} C ${startX + cp} ${startY}, ${endX - cp} ${endY}, ${endX} ${endY}`;
    } else if (direction === 'left') {
      const cp = Math.abs(dx) * 0.4;
      pathData = `M ${startX} ${startY} C ${startX - cp} ${startY}, ${endX + cp} ${endY}, ${endX} ${endY}`;
    } else if (direction === 'down') {
      const cp = Math.abs(dy) * 0.4;
      pathData = `M ${startX} ${startY} C ${startX} ${startY + cp}, ${endX} ${endY - cp}, ${endX} ${endY}`;
    } else if (direction === 'up') {
      const cp = Math.abs(dy) * 0.4;
      pathData = `M ${startX} ${startY} C ${startX} ${startY - cp}, ${endX} ${endY + cp}, ${endX} ${endY}`;
    }

    paths.push({
      key: `${node.parentId}-${node.id}`,
      pathData,
      direction,
      parentId: node.parentId,
      nodeId: node.id,
    });
  });

  return paths;
}

export function fitToView(nodes, positions, canvasWidth, canvasHeight) {
  if (Object.keys(positions).length === 0) return { panX: 0, panY: 0, scale: 1 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  Object.values(positions).forEach(pos => {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  });

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const padding = 80;

  if (contentWidth === 0 || contentHeight === 0) return { panX: 0, panY: 0, scale: 1 };

  const scaleX = (canvasWidth - padding * 2) / contentWidth;
  const scaleY = (canvasHeight - padding * 2) / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1.5);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const panX = canvasWidth / 2 - centerX * scale;
  const panY = canvasHeight / 2 - centerY * scale;

  return { panX, panY, scale };
}
