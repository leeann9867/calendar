import React from 'react';
import ColorPicker from './ColorPicker';
import RepeatSettings from './RepeatSettings';
import NotificationSettings from './NotificationSettings'; // 추가

export default function ModalView({ form, updateForm, onSave, onDelete, onClose, isEdit }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* 제목 입력 */}
                <div className="modal-section">
                    <input
                        className="input-title-main"
                        value={form.title}
                        onChange={e => updateForm('title', e.target.value)}
                        placeholder="일정 제목 (선택 사항)"
                        autoFocus
                    />
                </div>

                {/* 색상 선택 */}
                <div className="modal-section color-picker-section">
                    <ColorPicker selectedColor={form.color} onChange={c => updateForm('color', c)} />
                </div>

                {/* 반복 설정 */}
                <RepeatSettings form={form} onChange={updateForm} />

                {/* 알림 설정 추가 */}
                <NotificationSettings form={form} onChange={updateForm} />

                {/* 하단 버튼 */}
                <div className="modal-actions">
                    {isEdit && (
                        <button className="btn-delete-trigger" onClick={() => onDelete(form.id)}>삭제</button>
                    )}
                    <div className="main-btns">
                        <button className="btn-cancel" onClick={onClose}>취소</button>
                        <button className="btn-save" onClick={onSave}>저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
}