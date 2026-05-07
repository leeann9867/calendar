import React from 'react';

function ConfirmModal({ config, onClose }) {
    if (!config.isOpen) return null;

    return (
        <div
            className="sub-modal-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100vw', height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100000
            }}
        >
            <div
                className="sub-modal-content"
                onClick={e => e.stopPropagation()}
                style={{
                    // 🌟 [수정 포인트] 모달을 더 넓고 시원하게! (85% -> 90%, 350px -> 420px)
                    width: '90%',
                    maxWidth: '420px',
                    backgroundColor: 'var(--bg-card)',
                    padding: '25px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    boxShadow: '0 10px 40px var(--shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}
            >
                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                    {config.title}
                </h4>

                <p style={{ margin: '0 0 20px 0', fontSize: '1rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {config.message}
                </p>

                <div className="sub-modal-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {config.options.map((opt, idx) => (
                        <button
                            key={idx}
                            className={opt.className || "sub-btn"}
                            onClick={() => { opt.action(); onClose(); }}
                            style={{
                                backgroundColor: 'var(--bg-body)',
                                border: 'none',
                                padding: '14px',
                                borderRadius: '10px',
                                fontSize: '1rem',
                                fontWeight: '700',
                                color: opt.className && opt.className.includes('delete') ? 'var(--sun-red)' : 'var(--text-main)',
                                cursor: 'pointer'
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                    <button
                        className="sub-btn-cancel"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '10px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            marginTop: '4px'
                        }}
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;