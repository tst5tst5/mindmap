import React, { useState, useMemo } from 'react';
import { getChildren, getRootNode } from '../dataModel';

const PresentationMode = React.memo(({ nodes, positions, theme, onClose }) => {
  const root = getRootNode(nodes);
  const slides = useMemo(() => {
    if (!root) return [];
    const result = [{ id: root.id, text: root.text, level: 0 }];
    getChildren(nodes, root.id).forEach(child => {
      result.push({ id: child.id, text: child.text, level: 1 });
      getChildren(nodes, child.id).forEach(gc => {
        result.push({ id: gc.id, text: gc.text, level: 2 });
      });
    });
    return result;
  }, [nodes, root]);

  const [currentSlide, setCurrentSlide] = useState(0);

  const goNext = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  const goPrev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') goNext();
    else if (e.key === 'ArrowLeft') goPrev();
    else if (e.key === 'Escape') onClose();
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (slides.length === 0) return null;
  const slide = slides[currentSlide];

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative' }}>
      <div style={{ fontSize: slide.level === 0 ? '48px' : slide.level === 1 ? '36px' : '24px', fontWeight: slide.level === 0 ? '700' : '500', textAlign: 'center', maxWidth: '80%', lineHeight: '1.4' }}>
        {slide.text}
      </div>
      <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '20px', opacity: 0.5 }}>
        <button onClick={goPrev} disabled={currentSlide === 0} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: currentSlide === 0 ? 'default' : 'pointer', opacity: currentSlide === 0 ? 0.3 : 1 }}>◀ 上一页</button>
        <span style={{ fontSize: '14px' }}>{currentSlide + 1} / {slides.length}</span>
        <button onClick={goNext} disabled={currentSlide === slides.length - 1} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: currentSlide === slides.length - 1 ? 'default' : 'pointer', opacity: currentSlide === slides.length - 1 ? 0.3 : 1 }}>下一页 ▶</button>
      </div>
      <button onClick={onClose} style={{ position: 'fixed', top: '20px', right: '20px', background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>退出演说 (Esc)</button>
    </div>
  );
});

export default PresentationMode;
