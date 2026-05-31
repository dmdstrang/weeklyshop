import { useRef, useState, useEffect } from 'react';

/**
 * Reusable drag-to-close bottom sheet wrapper.
 * Children are rendered inside the sheet.
 */
export default function BottomSheet({ onClose, children, maxHeight = '82dvh' }) {
  const sheetRef = useRef(null);
  const dragStartY = useRef(null);
  const dragCurrentY = useRef(0);
  const [translateY, setTranslateY] = useState(0);
  const [closing, setClosing] = useState(false);

  function startClose() {
    setClosing(true);
    setTimeout(onClose, 220);
  }

  function onPointerDown(e) {
    // Only drag from the handle area
    if (!e.target.closest('.sheet-handle-zone')) return;
    dragStartY.current = e.clientY;
    sheetRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    if (dragStartY.current === null) return;
    const delta = Math.max(0, e.clientY - dragStartY.current);
    dragCurrentY.current = delta;
    setTranslateY(delta);
  }

  function onPointerUp() {
    if (dragStartY.current === null) return;
    if (dragCurrentY.current > 80) {
      startClose();
    } else {
      setTranslateY(0);
    }
    dragStartY.current = null;
    dragCurrentY.current = 0;
  }

  // Keyboard open — don't let it resize the sheet
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, interactive-widget=resizes-content';
    document.head.appendChild(meta);
    return () => document.head.removeChild(meta);
  }, []);

  return (
    <div
      className="swapper-overlay"
      onClick={startClose}
      style={{ alignItems: 'flex-end' }}
    >
      <div
        ref={sheetRef}
        className={`bottom-sheet ${closing ? 'bottom-sheet--closing' : ''}`}
        style={{ transform: `translateY(${translateY}px)`, maxHeight }}
        onClick={e => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Drag handle zone — touch anywhere in top strip to drag */}
        <div className="sheet-handle-zone">
          <div className="swapper-handle" style={{ margin: '0 auto' }} />
        </div>
        {children}
      </div>
    </div>
  );
}
