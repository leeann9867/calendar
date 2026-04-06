import React, { useState, useEffect } from 'react';
import EventDetail from './modal/EventDetail';
import EventForm from './modal/EventForm';

function ModalView({ selectedDate, initData, events, onClose, onSave, onDelete }) {
    // 🌟 데이터가 있으면(기존 일정) 'view' 모드, 데이터가 없으면(새 일정) 'edit' 모드로 시작!
    const [mode, setMode] = useState(initData ? 'view' : 'edit');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="modal-overlay" onClick={onClose} onWheel={e => e.stopPropagation()}>
            {mode === 'view' ? (
                <EventDetail
                    event={initData}
                    selectedDate={selectedDate}
                    onClose={onClose}
                    onEdit={() => setMode('edit')}
                    onDelete={onDelete}
                />
            ) : (
                <EventForm
                    selectedDate={selectedDate}
                    initData={initData}
                    events={events}
                    onClose={onClose}
                    onSave={onSave}
                    onDelete={onDelete}
                />
            )}
        </div>
    );
}

export default ModalView;