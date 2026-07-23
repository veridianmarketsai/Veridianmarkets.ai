// Veridian Markets — Beta Feedback Widget
// Floating button visible to beta users on every page.
// Click → captures a screenshot of the current page → canvas annotation
//       → comment → submit (stored in localStorage + optional AWS endpoint).
//
// Requires html2canvas (loaded via CDN in index.html).
// window.VM_FEEDBACK_URL — optional: POST feedback JSON here.
// Storage key: 'vm_beta_feedback'

const { useState: useStateFb, useEffect: useEffectFb, useRef: useRefFb, useCallback: useCallbackFb } = React;

const FEEDBACK_KEY = 'vm_beta_feedback';
function loadFeedback() { try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'); } catch { return []; } }
function saveFeedback(a) { try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(a)); } catch {} }
Object.assign(window, { loadFeedback, saveFeedback });

// ── Drawing canvas ────────────────────────────────────────────────────────────
function AnnotationCanvas({ screenshotUrl, canvasRef, tool, color, lineWidth }) {
  const drawing = useRefFb(false);
  const lastPos  = useRefFb(null);

  // Draw the screenshot as background once it loads.
  useEffectFb(() => {
    const canvas = canvasRef.current;
    if (!canvas || !screenshotUrl) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.src = screenshotUrl;
  }, [screenshotUrl]);

  const getPos = (e, canvas) => {
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const onStart = e => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };
  const onMove = e => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#F4F1E8' : color;
    ctx.lineWidth   = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.stroke();
    lastPos.current = pos;
  };
  const onEnd = () => { drawing.current = false; lastPos.current = null; };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: tool === 'eraser' ? 'cell' : 'crosshair', display: 'block' }}
    />
  );
}

// ── Single feedback item editor ───────────────────────────────────────────────
function FeedbackEditor({ index, total, screenshot, comment, onCommentChange, canvasRef, tool, setTool, color, setColor, lineWidth, setLineWidth }) {
  const COLORS = ['#e05', '#f80', '#2a8', '#47f', '#ff0', '#1a1814', '#fff'];
  const btnBase = { fontFamily: VM.mono, fontSize: 10, padding: '4px 10px', borderRadius: 6,
    border: '1px solid rgba(0,0,0,0.15)', cursor: 'pointer', letterSpacing: '0.04em' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      {/* Drawing toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        padding: '8px 12px', background: VM.faint, borderRadius: 8 }}>
        <span style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, letterSpacing: '0.06em', marginRight: 2 }}>TOOL</span>
        <button onClick={() => setTool('pen')}
          style={{ ...btnBase, background: tool === 'pen' ? VM.ink : VM.paper, color: tool === 'pen' ? VM.paper : VM.ink }}>
          <i className="ti ti-pencil" style={{ marginRight: 4 }}></i>Draw
        </button>
        <button onClick={() => setTool('eraser')}
          style={{ ...btnBase, background: tool === 'eraser' ? VM.ink : VM.paper, color: tool === 'eraser' ? VM.paper : VM.ink }}>
          <i className="ti ti-eraser" style={{ marginRight: 4 }}></i>Erase
        </button>

        <div style={{ width: 1, height: 18, background: VM.border, margin: '0 4px' }} />

        <span style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, letterSpacing: '0.06em' }}>COLOUR</span>
        {COLORS.map(c => (
          <button key={c} onClick={() => { setColor(c); setTool('pen'); }}
            style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: `3px solid ${color === c ? VM.ink : 'transparent'}`,
              cursor: 'pointer', padding: 0, flexShrink: 0 }} />
        ))}

        <div style={{ width: 1, height: 18, background: VM.border, margin: '0 4px' }} />

        <span style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, letterSpacing: '0.06em' }}>SIZE</span>
        {[2, 5, 10].map(w => (
          <button key={w} onClick={() => setLineWidth(w)}
            style={{ ...btnBase, background: lineWidth === w ? VM.ink : VM.paper, color: lineWidth === w ? VM.paper : VM.ink,
              padding: '3px 8px' }}>
            {w === 2 ? 'Thin' : w === 5 ? 'Med' : 'Thick'}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, background: '#ddd', borderRadius: 8, overflow: 'hidden',
        border: `1.5px solid ${VM.border}`, position: 'relative', minHeight: 200 }}>
        {screenshot ? (
          <AnnotationCanvas screenshotUrl={screenshot} canvasRef={canvasRef}
            tool={tool} color={color} lineWidth={lineWidth} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column', gap: 10, color: VM.ink3 }}>
            <i className="ti ti-loader-2" style={{ fontSize: 28, animation: 'spin 1s linear infinite' }}></i>
            <span style={{ fontFamily: VM.mono, fontSize: 11 }}>Capturing page…</span>
          </div>
        )}
      </div>

      {/* Comment */}
      <div>
        <label style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, letterSpacing: '0.06em',
          display: 'block', marginBottom: 6 }}>FEEDBACK #{index + 1} OF {total}</label>
        <textarea
          value={comment}
          onChange={e => onCommentChange(e.target.value)}
          placeholder="Describe what you noticed, what you liked, what was confusing…"
          rows={3}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontFamily: VM.serif, fontSize: 14,
            border: `1.5px solid ${VM.border}`, background: VM.paper, color: VM.ink, resize: 'vertical',
            outline: 'none', lineHeight: 1.5 }}
          onFocus={e  => e.target.style.borderColor = VM.teal}
          onBlur={e   => e.target.style.borderColor = VM.border}
        />
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
function BetaFeedback({ user }) {
  const [open, setOpen]           = useStateFb(false);
  const [capturing, setCapturing] = useStateFb(false);
  const [items, setItems]         = useStateFb([]);          // [{screenshot, comment}]
  const [activeIdx, setActiveIdx] = useStateFb(0);
  const [tool, setTool]           = useStateFb('pen');
  const [color, setColor]         = useStateFb('#e05');
  const [lineWidth, setLineWidth] = useStateFb(5);
  const [submitting, setSubmit]   = useStateFb(false);
  const [submitted, setSubmitted] = useStateFb(false);
  const canvasRef                 = useRefFb(null);
  const capturedRef               = useRefFb({});            // {idx: dataUrl}

  const captureScreen = useCallbackFb(async idx => {
    if (capturedRef.current[idx]) return capturedRef.current[idx];
    const el = document.getElementById('vm-main') || document.body;
    try {
      const canvas = await html2canvas(el, { scale: 0.6, useCORS: true, logging: false });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      capturedRef.current[idx] = dataUrl;
      return dataUrl;
    } catch {
      return null;
    }
  }, []);

  const openWidget = async () => {
    setSubmitted(false);
    setCapturing(true);
    const initialItem = { screenshot: null, comment: '' };
    setItems([initialItem]);
    setActiveIdx(0);
    setOpen(true);
    const url = await captureScreen(0);
    setItems(prev => prev.map((it, i) => i === 0 ? { ...it, screenshot: url } : it));
    setCapturing(false);
  };

  const addAnother = async () => {
    // Save current canvas state into the current item's screenshot.
    const canvas = canvasRef.current;
    if (canvas) {
      const url = canvas.toDataURL('image/jpeg', 0.85);
      setItems(prev => prev.map((it, i) => i === activeIdx ? { ...it, screenshot: url } : it));
    }
    const nextIdx = items.length;
    setItems(prev => [...prev, { screenshot: null, comment: '' }]);
    setActiveIdx(nextIdx);
    // Re-capture for the new item (might be on a different page if user navigated).
    const url = await captureScreen(nextIdx);
    setItems(prev => prev.map((it, i) => i === nextIdx ? { ...it, screenshot: url } : it));
  };

  const updateComment = (val) => {
    setItems(prev => prev.map((it, i) => i === activeIdx ? { ...it, comment: val } : it));
  };

  const submit = async () => {
    // Flush current canvas drawing into the active item.
    const canvas = canvasRef.current;
    const finalScreenshot = canvas ? canvas.toDataURL('image/jpeg', 0.85) : items[activeIdx].screenshot;
    const finalItems = items.map((it, i) => i === activeIdx ? { ...it, screenshot: finalScreenshot } : it);

    const feedback = {
      id:        Math.random().toString(36).slice(2, 12),
      page:      location.pathname,
      route:     location.pathname.replace(/^\//, '') || 'front',
      ts:        Date.now(),
      userEmail: user?.email || 'unknown',
      userName:  user?.name  || 'unknown',
      items:     finalItems.map(it => ({ screenshot: it.screenshot, comment: it.comment })),
      status:    'new',
    };

    setSubmit(true);
    const all = loadFeedback();
    all.push(feedback);
    saveFeedback(all);

    if (window.VM_FEEDBACK_URL) {
      fetch(window.VM_FEEDBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...feedback, items: finalItems.map(it => ({ comment: it.comment })) }),
      }).catch(() => {});
    }

    setSubmit(false);
    setSubmitted(true);
    setTimeout(() => { setOpen(false); setItems([]); setActiveIdx(0); capturedRef.current = {}; }, 2200);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button onClick={openWidget}
          style={{ position: 'fixed', bottom: 80, left: 16, zIndex: 500,
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
            background: VM.forest, color: VM.paper, border: 'none', borderRadius: 999,
            fontFamily: VM.mono, fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(29,78,58,0.35)', transition: 'transform .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <i className="ti ti-message-2-star" style={{ fontSize: 14 }}></i>
          Feedback
        </button>
      )}

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16,
          background: 'rgba(10,8,6,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>

          <div style={{ background: VM.paper, borderRadius: 16, width: '100%', maxWidth: 820,
            maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            border: `1px solid ${VM.border}`, boxShadow: '0 24px 80px rgba(10,8,6,0.3)', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: `1px solid ${VM.borderSoft}` }}>
              <div>
                <div style={{ fontFamily: VM.serif, fontSize: 17, fontWeight: 700, color: VM.ink }}>Leave feedback</div>
                <div style={{ fontFamily: VM.mono, fontSize: 10, color: VM.ink3, marginTop: 2, letterSpacing: '0.04em' }}>
                  Draw on the screenshot and add a comment
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Item tabs */}
                {items.length > 1 && items.map((_, i) => (
                  <button key={i} onClick={() => setActiveIdx(i)}
                    style={{ fontFamily: VM.mono, fontSize: 11, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                      background: activeIdx === i ? VM.ink : VM.faint, color: activeIdx === i ? VM.paper : VM.ink3,
                      border: 'none' }}>
                    #{i + 1}
                  </button>
                ))}
                <button onClick={() => setOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer',
                    color: VM.ink3, fontSize: 20, lineHeight: 1, padding: '2px 6px' }}>✕</button>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
              {submitted ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', minHeight: 300, gap: 16, textAlign: 'center' }}>
                  <i className="ti ti-circle-check" style={{ fontSize: 52, color: VM.teal }}></i>
                  <div style={{ fontFamily: VM.serif, fontSize: 20, fontWeight: 700, color: VM.ink }}>
                    Thank you!
                  </div>
                  <div style={{ fontFamily: VM.serif, fontSize: 15, color: VM.ink3, maxWidth: 320 }}>
                    Your feedback has been saved. Carlos will review it shortly.
                  </div>
                </div>
              ) : (
                <FeedbackEditor
                  index={activeIdx}
                  total={items.length}
                  screenshot={items[activeIdx]?.screenshot || null}
                  comment={items[activeIdx]?.comment || ''}
                  onCommentChange={updateComment}
                  canvasRef={canvasRef}
                  tool={tool} setTool={setTool}
                  color={color} setColor={setColor}
                  lineWidth={lineWidth} setLineWidth={setLineWidth}
                />
              )}
            </div>

            {/* Footer */}
            {!submitted && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderTop: `1px solid ${VM.borderSoft}`, gap: 10 }}>
                <button onClick={addAnother}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: VM.mono, fontSize: 12,
                    padding: '8px 16px', borderRadius: 8, border: `1px solid ${VM.border}`, background: VM.faint,
                    color: VM.ink2, cursor: 'pointer' }}>
                  <i className="ti ti-plus" style={{ fontSize: 13 }}></i>
                  Add another suggestion
                </button>
                <button onClick={submit} disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: VM.serif, fontSize: 15,
                    fontWeight: 600, padding: '9px 24px', borderRadius: 8, border: 'none',
                    background: VM.teal, color: VM.paper, cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Submitting…' : `Submit ${items.length > 1 ? `${items.length} suggestions` : 'feedback'}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

Object.assign(window, { BetaFeedback });
