import React, { useState } from 'react';
import TimeSettings from './TimeSettings';
import RepeatSettings from './RepeatSettings';
import ReminderSettings from './ReminderSettings';
import ColorPicker from './ColorPicker';

export default function EventModal({ initData, onSave, onDelete, onClose }) {
    const [form, setForm] = useState(initData);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>

                {/* 1. 제목 & 컬러피커 (이미지 상단 우측 배치용) */}
                <div className="modal-header-row">
                    <input
                        className="input-title-main"
                        value={form.title || ''}
                        onChange={e => updateForm('title', e.target.value)}
                        placeholder="일정 제목"
                        autoFocus
                    />
                    <div className="color-picker-wrapper">
                        <span className="color-label">색상</span>
                        <ColorPicker
                            selectedColor={form.color}
                            onChange={(color) => updateForm('color', color)}
                        />
                    </div>
                </div>

                <div className="modal-scroll-area">
                    {/* 2. 시간 설정 (하루종일 스위치 + 24시 셀렉트) */}
                    <div className="modal-row-group">
                        <TimeSettings form={form} onChange={updateForm} />
                    </div>

                    {/* 3. 반복 설정 (매일/매주 + 종료일) */}
                    <div className="modal-row-group">
                        <RepeatSettings form={form} onChange={updateForm} />
                    </div>

                    {/* 4. 알림 설정 (칩 스타일) */}
                    <div className="modal-row-group">
                        <ReminderSettings form={form} onChange={updateForm} />
                    </div>
                </div>

                {/* 5. 하단 버튼 (취소/저장/삭제) */}
                <div className="modal-actions">
                    {initData.id && (
                        <button className="btn-delete-trigger" onClick={() => setShowDeleteConfirm(true)}>삭제</button>
                    )}
                    <div className="right-group">
                        <button className="btn-cancel" onClick={onClose}>취소</button>
                        <button className="btn-save" onClick={() => onSave(form)}>저장</button>
                    </div>
                </div>

                {/* 삭제 컨펌 레이어 */}
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