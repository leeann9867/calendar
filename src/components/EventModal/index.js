import React, { useState } from 'react';
import TimeSettings from './TimeSettings';
import ReminderSettings from './ReminderSettings';
import ColorPicker from './ColorPicker';

function EventModal({ initData, onSave, onDelete, onClose }) {
    const [form, setForm] = useState({
        isNotificationEnabled: true,
        reminders: [10],
        isAllDay: false,
        ...initData
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <input className="input-title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="제목" />

                <TimeSettings form={form} setForm={setForm} />
                <ReminderSettings form={form} setForm={setForm} />
                <ColorPicker selectedColor={form.color} onSelect={c => setForm({...form, color: c})} />

                <div className="btn-group">
                    {form.id && <button onClick={() => setShowDeleteConfirm(true)} className="btn-delete">삭제</button>}
                    <button onClick={onClose}>취소</button>
                    <button onClick={() => onSave(form)} className="btn-save">저장</button>
                </div>

                {showDeleteConfirm && (
                    <div className="confirm-overlay">
                        <div className="confirm-modal">
                            <p>삭제하시겠습니까?</p>
                            <button onClick={() => { onDelete(form.id); onClose(); }}>전체 삭제</button>
                            <button onClick={() => setShowDeleteConfirm(false)}>취소</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EventModal;