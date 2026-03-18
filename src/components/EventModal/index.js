import React, { useState } from 'react';
import TimeSettings from './TimeSettings';
import RepeatSettings from './RepeatSettings';
import ReminderSettings from './ReminderSettings';
import ColorPicker from './ColorPicker';

export default function EventModal({ initData, onSave, onDelete, onClose }) {
    // 제목이 없으면 '(제목 없음)'으로 저장되거나 빈 값으로 저장 가능
    const [form, setForm] = useState({
        ...initData,
        title: initData.title || ''
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSave = () => {
        // 제목이 없어도 저장 가능 (필요시 기본값 할당)
        const finalForm = {
            ...form,
            title: form.title.trim() === '' ? '(제목 없음)' : form.title
        };
        onSave(finalForm);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>

                {/* 제목 입력 */}
                <input
                    className="input-title-main"
                    value={form.title}
                    onChange={e => updateForm('title', e.target.value)}
                    placeholder="일정 제목 (선택 사항)"
                    autoFocus
                />

                {/* 색상 선택기: 제목 아래 가로 배치 */}
                <div className="color-picker-horizontal">
                    <ColorPicker selectedColor={form.color} onChange={(c) => updateForm('color', c)} />
                </div>

                <div className="modal-scroll-area">
                    <div className="modal-row-group">
                        <TimeSettings form={form} onChange={updateForm} />
                    </div>
                    <div className="modal-row-group">
                        <RepeatSettings form={form} onChange={updateForm} />
                    </div>
                    <div className="modal-row-group">
                        <ReminderSettings form={form} onChange={updateForm} />
                    </div>
                </div>

                <div className="modal-actions">
                    {initData.id && (
                        <button className="btn-delete-trigger" onClick={() => setShowDeleteConfirm(true)}>삭제</button>
                    )}
                    <div className="right-group">
                        <button className="btn-cancel" onClick={onClose}>취소</button>
                        <button className="btn-save" onClick={handleSave}>저장</button>
                    </div>
                </div>

                {showDeleteConfirm && (
                    <div className="sub-confirm-overlay">
                        <div className="sub-confirm-box">
                            <p>일정을 삭제할까요?</p>
                            <div className="sub-confirm-btns">
                                <button className="btn-cancel-sub" onClick={() => setShowDeleteConfirm(false)}>취소</button>
                                <button className="btn-danger-final" onClick={() => onDelete(form.id)}>삭제</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}