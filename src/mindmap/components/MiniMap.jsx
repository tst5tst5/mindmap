import React, { useMemo, useCallback, useRef } from 'react';

const MiniMap = React.memo(({
  nodes,
  positions,
  pan,
  scale,
  theme,
  containerWidth,
  containerHeight,
  onNavigate,
}) => {
  const minimapRef = useRef(null);
  const MINIMAP_WIDTH = 180;
  const MINIMAP_HEIGHT = 120;
  const PADDING = 10;

  const { minimapScale, offsetX, offsetY, contentWidth, contentHeight } = useMemo(() => {
    if (Object.keys(positions).length === 0) {
      return { minimapScale: 1, offsetX: 0, offsetY: 0, contentWidth: 0, contentHeight: 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.values(positions).forEach(pos => {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + pos.width);
      maxY = Math.max(maxY, pos.y + pos.height);
    });

    const cw = maxX - minX;
    const ch = maxY - minY;
    const ms = Math.min(
      (MINIMAP_WIDTH - PADDING * 2) / Math.max(cw, 1),
      (MINIMAP_HEIGHT - PADDING * 2) / Math.max(ch, 1)
    );

    return {
      minimapScale: ms,
      offsetX: minX,
      offsetY: minY,
      contentWidth: cw,
      contentHeight: ch,
    };
  }, [positions]);

  const viewportRect = useMemo(() => {
    const left = (-pan.x / scale - offsetX) * minimapScale + PADDING;
    const top = (-pan.y / scale - offsetY) * minimapScale + PADDING;
    const width = (containerWidth / scale) * minimapScale;
    const height = (containerHeight / scale) * minimapScale;
    return { left, top, width, height };
  }, [pan, scale, offsetX, offsetY, minimapScale, containerWidth, containerHeight]);

  const handleMinimapClick = useCallback((e) => {
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = (clickX - PADDING) / minimapScale + offsetX;
    const worldY = (clickY - PADDING) / minimapScale + offsetY;

    const newPanX = -(worldX * scale - containerWidth / 2);
    const newPanY = -(worldY * scale - containerHeight / 2);

    onNavigate({ x: newPanX, y: newPanY });
  }, [minimapScale, offsetX, offsetY, scale, containerWidth, containerHeight, onNavigate]);

  return (
    <div
      ref={minimapRef}
      className="minimap"
      style={{
        position: 'fixed',
        bottom: '60px',
        right: '20px',
        width: `${MINIMAP_WIDTH}px`,
        height: `${MINIMAP_HEIGHT}px`,
        backgroundColor: theme.miniMapBg,
        border: `1px solid ${theme.miniMapBorder}`,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        zIndex: 50,
        backdropFilter: 'blur(8px)',
      }}
      onClick={handleMinimapClick}
    >
      <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT}>
        {nodes.map(node => {
          const pos = positions[node.id];
          if (!pos) return null;
          return (
            <rect
              key={node.id}
              x={(pos.x - offsetX) * minimapScale + PADDING}
              y={(pos.y - offsetY) * minimapScale + PADDING}
              width={Math.max(pos.width * minimapScale, 2)}
              height={Math.max(pos.height * minimapScale, 2)}
              rx="2"
              fill={theme.miniMapNode}
              opacity="0.6"
            />
          );
        })}
        <rect
          x={viewportRect.left}
          y={viewportRect.top}
          width={viewportRect.width}
          height={viewportRect.height}
          fill={theme.miniMapViewport}
          stroke={theme.miniMapViewport}
          strokeWidth="1"
          rx="2"
        />
      </svg>
    </div>
  );
});

export default MiniMap;
