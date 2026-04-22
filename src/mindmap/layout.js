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
    case 'bracket':
      return layoutBracket(nodes, root);
    case 'timeline-h':
      return layoutTimelineH(nodes, root);
    case 'timeline-v':
      return layoutTimelineV(nodes, root);
    default:
      return layoutMindMapBoth(nodes, root);
  }
}

function layoutMindMapBoth(nodes, root) {
  const positions = {};
  const rootW = measureTextWidth(root.text, 0);
  const rootH = ROOT_HEIGHT;

  positions[root.id] = {
    x: -rootW / 2, y: -rootH / 2, width: rootW, height: rootH, direction: 'center',
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
    x: -rootW / 2, y: -rootH / 2, width: rootW, height: rootH, direction: 'center',
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
      x: childX, y: centerY - childH / 2, width: childW, height: childH, direction,
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
    x: -rootW / 2, y: -rootH / 2, width: rootW, height: rootH, direction,
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
      x: centerX - childW / 2, y: childY, width: childW, height: childH, direction,
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
    x: -rootW / 2, y: -rootH / 2, width: rootW, height: rootH, direction: 'center',
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
      x: childX, y: centerY - childH / 2, width: childW, height: childH,
      direction: hDir, fishbone: vDir,
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

function layoutBracket(nodes, root) {
  const positions = {};
  const rootW = measureTextWidth(root.text, 0);
  const rootH = ROOT_HEIGHT;
  positions[root.id] = { x: -rootW / 2, y: -rootH / 2, width: rootW, height: rootH, direction: 'bracket' };

  const rootChildren = getChildren(nodes, root.id);
  if (rootChildren.length === 0) return positions;

  const subtreeHeights = rootChildren.map(child =>
    calcSubtreeSize(nodes, child.id, 1, 'right').height
  );

  let totalHeight = 0;
  subtreeHeights.forEach((h, i) => {
    totalHeight += h;
    if (i < subtreeHeights.length - 1) totalHeight += V_GAP;
  });

  const rootCenterY = positions[root.id].y + rootH / 2;
  let currentY = rootCenterY - totalHeight / 2;
  const bracketGap = 30;

  rootChildren.forEach((child, i) => {
    const subtreeH = subtreeHeights[i];
    const childW = measureTextWidth(child.text, 1);
    const childH = getNodeHeight(1);
    const centerY = currentY + subtreeH / 2;

    positions[child.id] = {
      x: positions[root.id].x + rootW + H_GAP,
      y: centerY - childH / 2,
      width: childW, height: childH,
      direction: 'bracket',
    };

    if (!child.collapsed) {
      layoutBracketBranch(nodes, child, positions, 2);
    }

    currentY += subtreeH + V_GAP;
  });

  return positions;
}

function layoutBracketBranch(nodes, parent, positions, level) {
  const children = getChildren(nodes, parent.id);
  if (children.length === 0) return;

  const parentPos = positions[parent.id];
  const subtreeHeights = children.map(child =>
    calcSubtreeSize(nodes, child.id, level, 'right').height
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

    positions[child.id] = {
      x: parentPos.x + parentPos.width + H_GAP,
      y: centerY - childH / 2,
      width: childW, height: childH,
      direction: 'bracket',
    };

    if (!child.collapsed) {
      layoutBracketBranch(nodes, child, positions, level + 1);
    }

    currentY += subtreeH + V_GAP;
  });
}

function layoutTimelineH(nodes, root) {
  const positions = {};
  const rootW = measureTextWidth(root.text, 0);
  const rootH = ROOT_HEIGHT;
  positions[root.id] = { x: 0, y: -rootH / 2, width: rootW, height: rootH, direction: 'center', timeline: 'h' };

  const rootChildren = getChildren(nodes, root.id);
  let currentX = rootW + H_GAP;

  rootChildren.forEach((child, i) => {
    const childW = measureTextWidth(child.text, 1);
    const childH = getNodeHeight(1);
    const y = i % 2 === 0 ? -childH - 20 : rootH / 2 + 20;

    positions[child.id] = { x: currentX, y, width: childW, height: childH, direction: 'right', timeline: 'h' };

    if (!child.collapsed) {
      const grandChildren = getChildren(nodes, child.id);
      layoutHorizontalBranch(nodes, grandChildren, child, 'right', positions, 2);
    }
    currentX += childW + H_GAP;
  });

  return positions;
}

function layoutTimelineV(nodes, root) {
  const positions = {};
  const rootW = measureTextWidth(root.text, 0);
  const rootH = ROOT_HEIGHT;
  positions[root.id] = { x: -rootW / 2, y: 0, width: rootW, height: rootH, direction: 'down', timeline: 'v' };

  const rootChildren = getChildren(nodes, root.id);
  let currentY = rootH + H_GAP;

  rootChildren.forEach((child, i) => {
    const childW = measureTextWidth(child.text, 1);
    const childH = getNodeHeight(1);
    const x = i % 2 === 0 ? -childW - 20 : rootW / 2 + 20;

    positions[child.id] = { x, y: currentY, width: childW, height: childH, direction: 'down', timeline: 'v' };

    if (!child.collapsed) {
      const grandChildren = getChildren(nodes, child.id);
      layoutVerticalBranch(nodes, grandChildren, child, 'down', positions, 2);
    }
    currentY += childH + H_GAP;
  });

  return positions;
}

export function getConnectionPaths(nodes, positions, layoutType = 'mind-map') {
  const paths = [];

  if (layoutType === 'bracket') {
    return getBracketPaths(nodes, positions);
  }
  if (layoutType === 'fishbone-right' || layoutType === 'fishbone-left') {
    return getFishbonePaths(nodes, positions, layoutType);
  }
  if (layoutType === 'timeline-h') {
    return getTimelineHPaths(nodes, positions);
  }
  if (layoutType === 'timeline-v') {
    return getTimelineVPaths(nodes, positions);
  }
  if (layoutType === 'org-down' || layoutType === 'org-up' || layoutType === 'tree-down') {
    return getOrthogonalPaths(nodes, positions, layoutType);
  }

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
    let pathData;
    if (direction === 'right') {
      const cp = Math.abs(dx) * 0.4;
      pathData = `M ${startX} ${startY} C ${startX + cp} ${startY}, ${endX - cp} ${endY}, ${endX} ${endY}`;
    } else if (direction === 'left') {
      const cp = Math.abs(dx) * 0.4;
      pathData = `M ${startX} ${startY} C ${startX - cp} ${startY}, ${endX + cp} ${endY}, ${endX} ${endY}`;
    } else if (direction === 'down') {
      const cp = Math.abs(endY - startY) * 0.4;
      pathData = `M ${startX} ${startY} C ${startX} ${startY + cp}, ${endX} ${endY - cp}, ${endX} ${endY}`;
    } else if (direction === 'up') {
      const cp = Math.abs(endY - startY) * 0.4;
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

function getBracketPaths(nodes, positions) {
  const paths = [];
  const parentChildMap = {};

  nodes.forEach(node => {
    if (!node.parentId) return;
    if (!parentChildMap[node.parentId]) parentChildMap[node.parentId] = [];
    parentChildMap[node.parentId].push(node.id);
  });

  Object.entries(parentChildMap).forEach(([parentId, childIds]) => {
    const parentPos = positions[parentId];
    if (!parentPos) return;

    const validChildren = childIds.filter(id => positions[id]);
    if (validChildren.length === 0) return;

    const startX = parentPos.x + parentPos.width;
    const parentCenterY = parentPos.y + parentPos.height / 2;

    if (validChildren.length === 1) {
      const childPos = positions[validChildren[0]];
      const endX = childPos.x;
      const endY = childPos.y + childPos.height / 2;
      const midX = startX + (endX - startX) / 2;
      paths.push({
        key: `${parentId}-${validChildren[0]}`,
        pathData: `M ${startX} ${parentCenterY} L ${midX} ${parentCenterY} L ${midX} ${endY} L ${endX} ${endY}`,
        direction: 'bracket',
        parentId,
        nodeId: validChildren[0],
      });
    } else {
      const childYs = validChildren.map(id => positions[id].y + positions[id].height / 2);
      const minY = Math.min(...childYs);
      const maxY = Math.max(...childYs);
      const midX = startX + 15;

      paths.push({
        key: `${parentId}-bracket-spine`,
        pathData: `M ${startX} ${parentCenterY} L ${midX} ${parentCenterY} M ${midX} ${minY} L ${midX} ${maxY}`,
        direction: 'bracket',
        parentId,
        nodeId: null,
        isSpine: true,
      });

      validChildren.forEach(childId => {
        const childPos = positions[childId];
        const endX = childPos.x;
        const endY = childPos.y + childPos.height / 2;
        paths.push({
          key: `${parentId}-${childId}`,
          pathData: `M ${midX} ${endY} L ${endX} ${endY}`,
          direction: 'bracket',
          parentId,
          nodeId: childId,
        });
      });
    }
  });

  return paths;
}

function getFishbonePaths(nodes, positions, layoutType) {
  const paths = [];
  const hDir = layoutType === 'fishbone-right' ? 'right' : 'left';

  const root = nodes.find(n => !n.parentId);
  if (!root) return paths;
  const rootPos = positions[root.id];
  if (!rootPos) return paths;

  const rootCenterY = rootPos.y + rootPos.height / 2;
  const rootRightX = rootPos.x + rootPos.width;
  const rootLeftX = rootPos.x;

  const rootChildren = getChildren(nodes, root.id);
  const halfIdx = Math.ceil(rootChildren.length / 2);
  const topChildren = rootChildren.slice(0, halfIdx);
  const bottomChildren = rootChildren.slice(halfIdx);

  const lastTop = topChildren.length > 0 ? positions[topChildren[topChildren.length - 1]?.id] : null;
  const lastBottom = bottomChildren.length > 0 ? positions[bottomChildren[bottomChildren.length - 1]?.id] : null;

  let spineEndX;
  if (hDir === 'right') {
    const maxChildRight = Math.max(
      lastTop ? lastTop.x + lastTop.width : rootRightX,
      lastBottom ? lastBottom.x + lastBottom.width : rootRightX,
      rootRightX
    );
    spineEndX = maxChildRight + 20;
    paths.push({
      key: 'fishbone-spine',
      pathData: `M ${rootRightX} ${rootCenterY} L ${spineEndX} ${rootCenterY}`,
      direction: 'fishbone',
      parentId: root.id,
      nodeId: null,
      isSpine: true,
    });
  } else {
    const minChildLeft = Math.min(
      lastTop ? lastTop.x : rootLeftX,
      lastBottom ? lastBottom.x : rootLeftX,
      rootLeftX
    );
    spineEndX = minChildLeft - 20;
    paths.push({
      key: 'fishbone-spine',
      pathData: `M ${rootLeftX} ${rootCenterY} L ${spineEndX} ${rootCenterY}`,
      direction: 'fishbone',
      parentId: root.id,
      nodeId: null,
      isSpine: true,
    });
  }

  nodes.forEach(node => {
    if (!node.parentId) return;
    const parentPos = positions[node.parentId];
    const nodePos = positions[node.id];
    if (!parentPos || !nodePos) return;

    const vDir = nodePos.fishbone;

    if (nodePos.fishbone) {
      const parentRightX = parentPos.x + parentPos.width;
      const parentLeftX = parentPos.x;
      const parentCenterY = parentPos.y + parentPos.height / 2;
      const childCenterY = nodePos.y + nodePos.height / 2;
      const childLeftX = nodePos.x;
      const childRightX = nodePos.x + nodePos.width;

      let startX, startY, endX, endY;
      if (hDir === 'right') {
        startX = parentRightX;
        endX = childLeftX;
      } else {
        startX = parentLeftX;
        endX = childRightX;
      }
      startY = parentCenterY;
      endY = childCenterY;

      paths.push({
        key: `${node.parentId}-${node.id}`,
        pathData: `M ${startX} ${startY} L ${endX} ${endY}`,
        direction: 'fishbone',
        parentId: node.parentId,
        nodeId: node.id,
      });
    } else {
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
      }

      const cp = Math.abs(endX - startX) * 0.4;
      if (direction === 'right') {
        paths.push({
          key: `${node.parentId}-${node.id}`,
          pathData: `M ${startX} ${startY} C ${startX + cp} ${startY}, ${endX - cp} ${endY}, ${endX} ${endY}`,
          direction,
          parentId: node.parentId,
          nodeId: node.id,
        });
      } else {
        paths.push({
          key: `${node.parentId}-${node.id}`,
          pathData: `M ${startX} ${startY} C ${startX - cp} ${startY}, ${endX + cp} ${endY}, ${endX} ${endY}`,
          direction,
          parentId: node.parentId,
          nodeId: node.id,
        });
      }
    }
  });

  return paths;
}

function getTimelineHPaths(nodes, positions) {
  const paths = [];
  const root = nodes.find(n => !n.parentId);
  if (!root) return paths;
  const rootPos = positions[root.id];
  if (!rootPos) return paths;

  const rootCenterY = rootPos.y + rootPos.height / 2;
  const rootRightX = rootPos.x + rootPos.width;

  const rootChildren = getChildren(nodes, root.id);
  if (rootChildren.length === 0) return paths;

  const lastChild = positions[rootChildren[rootChildren.length - 1]?.id];
  const spineEndX = lastChild ? lastChild.x + lastChild.width / 2 + 20 : rootRightX + 40;

  paths.push({
    key: 'timeline-h-spine',
    pathData: `M ${rootPos.x} ${rootCenterY} L ${spineEndX} ${rootCenterY}`,
    direction: 'timeline',
    parentId: root.id,
    nodeId: null,
    isSpine: true,
  });

  rootChildren.forEach(child => {
    const childPos = positions[child.id];
    if (!childPos) return;

    const childCenterX = childPos.x + childPos.width / 2;
    const childTopY = childPos.y;
    const childBottomY = childPos.y + childPos.height;

    if (childCenterX < rootPos.x || childCenterX > rootPos.x + rootPos.width) {
      if (childBottomY < rootCenterY) {
        paths.push({
          key: `timeline-${child.id}`,
          pathData: `M ${childCenterX} ${rootCenterY} L ${childCenterX} ${childBottomY}`,
          direction: 'timeline',
          parentId: root.id,
          nodeId: child.id,
        });
      } else {
        paths.push({
          key: `timeline-${child.id}`,
          pathData: `M ${childCenterX} ${rootCenterY} L ${childCenterX} ${childTopY}`,
          direction: 'timeline',
          parentId: root.id,
          nodeId: child.id,
        });
      }
    }
  });

  nodes.forEach(node => {
    if (!node.parentId) return;
    if (rootChildren.some(c => c.id === node.id)) return;
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
    } else {
      startX = parentPos.x;
      startY = parentPos.y + parentPos.height / 2;
      endX = nodePos.x + nodePos.width;
      endY = nodePos.y + nodePos.height / 2;
    }

    const cp = Math.abs(endX - startX) * 0.4;
    if (direction === 'right') {
      paths.push({
        key: `${node.parentId}-${node.id}`,
        pathData: `M ${startX} ${startY} C ${startX + cp} ${startY}, ${endX - cp} ${endY}, ${endX} ${endY}`,
        direction,
        parentId: node.parentId,
        nodeId: node.id,
      });
    } else {
      paths.push({
        key: `${node.parentId}-${node.id}`,
        pathData: `M ${startX} ${startY} C ${startX - cp} ${startY}, ${endX + cp} ${endY}, ${endX} ${endY}`,
        direction,
        parentId: node.parentId,
        nodeId: node.id,
      });
    }
  });

  return paths;
}

function getTimelineVPaths(nodes, positions) {
  const paths = [];
  const root = nodes.find(n => !n.parentId);
  if (!root) return paths;
  const rootPos = positions[root.id];
  if (!rootPos) return paths;

  const rootCenterX = rootPos.x + rootPos.width / 2;
  const rootBottomY = rootPos.y + rootPos.height;

  const rootChildren = getChildren(nodes, root.id);
  if (rootChildren.length === 0) return paths;

  const lastChild = positions[rootChildren[rootChildren.length - 1]?.id];
  const spineEndY = lastChild ? lastChild.y + lastChild.height / 2 + 20 : rootBottomY + 40;

  paths.push({
    key: 'timeline-v-spine',
    pathData: `M ${rootCenterX} ${rootPos.y} L ${rootCenterX} ${spineEndY}`,
    direction: 'timeline',
    parentId: root.id,
    nodeId: null,
    isSpine: true,
  });

  rootChildren.forEach(child => {
    const childPos = positions[child.id];
    if (!childPos) return;

    const childCenterY = childPos.y + childPos.height / 2;
    const childLeftX = childPos.x;
    const childRightX = childPos.x + childPos.width;

    if (childRightX < rootCenterX) {
      paths.push({
        key: `timeline-${child.id}`,
        pathData: `M ${rootCenterX} ${childCenterY} L ${childRightX} ${childCenterY}`,
        direction: 'timeline',
        parentId: root.id,
        nodeId: child.id,
      });
    } else if (childLeftX > rootCenterX) {
      paths.push({
        key: `timeline-${child.id}`,
        pathData: `M ${rootCenterX} ${childCenterY} L ${childLeftX} ${childCenterY}`,
        direction: 'timeline',
        parentId: root.id,
        nodeId: child.id,
      });
    }
  });

  nodes.forEach(node => {
    if (!node.parentId) return;
    if (rootChildren.some(c => c.id === node.id)) return;
    const parentPos = positions[node.parentId];
    const nodePos = positions[node.id];
    if (!parentPos || !nodePos) return;

    const direction = nodePos.direction || 'down';
    let startX, startY, endX, endY;

    if (direction === 'down') {
      startX = parentPos.x + parentPos.width / 2;
      startY = parentPos.y + parentPos.height;
      endX = nodePos.x + nodePos.width / 2;
      endY = nodePos.y;
    } else {
      startX = parentPos.x + parentPos.width / 2;
      startY = parentPos.y;
      endX = nodePos.x + nodePos.width / 2;
      endY = nodePos.y + nodePos.height;
    }

    const cp = Math.abs(endY - startY) * 0.4;
    if (direction === 'down') {
      paths.push({
        key: `${node.parentId}-${node.id}`,
        pathData: `M ${startX} ${startY} C ${startX} ${startY + cp}, ${endX} ${endY - cp}, ${endX} ${endY}`,
        direction,
        parentId: node.parentId,
        nodeId: node.id,
      });
    } else {
      paths.push({
        key: `${node.parentId}-${node.id}`,
        pathData: `M ${startX} ${startY} C ${startX} ${startY - cp}, ${endX} ${endY + cp}, ${endX} ${endY}`,
        direction,
        parentId: node.parentId,
        nodeId: node.id,
      });
    }
  });

  return paths;
}

function getOrthogonalPaths(nodes, positions, layoutType) {
  const paths = [];
  const direction = layoutType === 'org-up' ? 'up' : 'down';

  const parentChildMap = {};
  nodes.forEach(node => {
    if (!node.parentId) return;
    if (!parentChildMap[node.parentId]) parentChildMap[node.parentId] = [];
    parentChildMap[node.parentId].push(node.id);
  });

  Object.entries(parentChildMap).forEach(([parentId, childIds]) => {
    const parentPos = positions[parentId];
    if (!parentPos) return;

    const validChildren = childIds.filter(id => positions[id]);
    if (validChildren.length === 0) return;

    if (direction === 'down') {
      const startX = parentPos.x + parentPos.width / 2;
      const startY = parentPos.y + parentPos.height;
      const midY = startY + H_GAP / 2;

      if (validChildren.length === 1) {
        const childPos = positions[validChildren[0]];
        const endX = childPos.x + childPos.width / 2;
        const endY = childPos.y;
        paths.push({
          key: `${parentId}-${validChildren[0]}`,
          pathData: `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`,
          direction: 'down',
          parentId,
          nodeId: validChildren[0],
        });
      } else {
        const childXs = validChildren.map(id => positions[id].x + positions[id].width / 2);
        const minCX = Math.min(...childXs);
        const maxCX = Math.max(...childXs);

        paths.push({
          key: `${parentId}-hbar`,
          pathData: `M ${startX} ${startY} L ${startX} ${midY} M ${minCX} ${midY} L ${maxCX} ${midY}`,
          direction: 'down',
          parentId,
          nodeId: null,
          isSpine: true,
        });

        validChildren.forEach(childId => {
          const childPos = positions[childId];
          const endX = childPos.x + childPos.width / 2;
          const endY = childPos.y;
          paths.push({
            key: `${parentId}-${childId}`,
            pathData: `M ${endX} ${midY} L ${endX} ${endY}`,
            direction: 'down',
            parentId,
            nodeId: childId,
          });
        });
      }
    } else {
      const startX = parentPos.x + parentPos.width / 2;
      const startY = parentPos.y;
      const midY = startY - H_GAP / 2;

      if (validChildren.length === 1) {
        const childPos = positions[validChildren[0]];
        const endX = childPos.x + childPos.width / 2;
        const endY = childPos.y + childPos.height;
        paths.push({
          key: `${parentId}-${validChildren[0]}`,
          pathData: `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`,
          direction: 'up',
          parentId,
          nodeId: validChildren[0],
        });
      } else {
        const childXs = validChildren.map(id => positions[id].x + positions[id].width / 2);
        const minCX = Math.min(...childXs);
        const maxCX = Math.max(...childXs);

        paths.push({
          key: `${parentId}-hbar`,
          pathData: `M ${startX} ${startY} L ${startX} ${midY} M ${minCX} ${midY} L ${maxCX} ${midY}`,
          direction: 'up',
          parentId,
          nodeId: null,
          isSpine: true,
        });

        validChildren.forEach(childId => {
          const childPos = positions[childId];
          const endX = childPos.x + childPos.width / 2;
          const endY = childPos.y + childPos.height;
          paths.push({
            key: `${parentId}-${childId}`,
            pathData: `M ${endX} ${midY} L ${endX} ${endY}`,
            direction: 'up',
            parentId,
            nodeId: childId,
          });
        });
      }
    }
  });

  return paths;
}

export function getRelationshipPaths(relationships, positions) {
  const paths = [];

  relationships.forEach(rel => {
    const fromPos = positions[rel.fromId];
    const toPos = positions[rel.toId];
    if (!fromPos || !toPos) return;

    const fromCenterX = fromPos.x + fromPos.width / 2;
    const fromCenterY = fromPos.y + fromPos.height / 2;
    const toCenterX = toPos.x + toPos.width / 2;
    const toCenterY = toPos.y + toPos.height / 2;

    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    let startX, startY, endX, endY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        startX = fromPos.x + fromPos.width;
        startY = fromCenterY;
        endX = toPos.x;
        endY = toCenterY;
      } else {
        startX = fromPos.x;
        startY = fromCenterY;
        endX = toPos.x + toPos.width;
        endY = toCenterY;
      }
    } else {
      if (dy > 0) {
        startX = fromCenterX;
        startY = fromPos.y + fromPos.height;
        endX = toCenterX;
        endY = toPos.y;
      } else {
        startX = fromCenterX;
        startY = fromPos.y;
        endX = toCenterX;
        endY = toPos.y + toPos.height;
      }
    }

    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const offset = Math.max(30, Math.sqrt(dx * dx + dy * dy) * 0.15);

    let cp1X, cp1Y, cp2X, cp2Y;
    if (Math.abs(dx) > Math.abs(dy)) {
      cp1X = startX + (dx > 0 ? offset : -offset);
      cp1Y = startY;
      cp2X = endX - (dx > 0 ? offset : -offset);
      cp2Y = endY;
    } else {
      cp1X = startX;
      cp1Y = startY + (dy > 0 ? offset : -offset);
      cp2X = endX;
      cp2Y = endY - (dy > 0 ? offset : -offset);
    }

    const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

    paths.push({
      key: rel.id,
      pathData,
      relId: rel.id,
      label: rel.label,
      midX,
      midY,
      fromId: rel.fromId,
      toId: rel.toId,
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
