import React, { useState } from 'react';
import { getAutoEndTime } from '../../utils/helpers';

/**
 * 일정 추가/수정 모달 통합 컴포넌트
 */
export default function EventModal({ initData, onSave, onDelete, onClose }) {
    const [form, setForm] = useState(initData);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleSave = () => {
        if (!form.title) return alert("제목을 입력하세요.");
        onSave(form);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <input
                    className="input-title-main"
                    value={form.title || ''}
                    onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="일정 제목 추가"
                />

                {/* 내부 부품: 시간 설정 */}
                <TimeSection
                    form={form}
                    setForm={setForm}
                    onStartChange={(val) => setForm({ ...form, time: val, endTime: getAutoEndTime(val) })}
                />

                {/* 내부 부품: 알림 설정 */}
                <ReminderSection
                    form={form}
                    setForm={setForm}
                />

                <div className="modal-actions">
                    <button onClick={onClose} className="btn-cancel">취소</button>
                    <button onClick={handleSave} className="btn-save">저장</button>
                    {initData.id && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="btn-delete-trigger">삭제</button>
                    )}
                </div>
            </div>

            {/* 삭제 확인 서브 모달 */}
            {showDeleteConfirm && (
                <div className="confirm-overlay">
                    <div className="confirm-box">
                        <p>이 일정을 삭제하시겠습니까?</p>
                        <button onClick={() => onDelete(form.id)}>확인</button>
                        <button onClick={() => setShowDeleteConfirm(false)}>취소</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- 모달 내부용 하위 컴포넌트 (파일 내 통합) ---

const TimeSection = ({ form, setForm, onStartChange }) => (
    <div className="modal-row-group">
        <div className="row-item">
            <span>하루 종일</span>
            <input type="checkbox" checked={form.isAllDay} onChange={e => setForm({...form, isAllDay: e.target.checked})} />
        </div>
        {!form.isAllDay && (
            <div className="time-picker-row">
                <input type="time" value={form.time} onChange={e => onStartChange(e.target.value)} />
                <span className="separator">→</span>
                <input type="time" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
            </div>
        )}
    </div>
);

const ReminderSection = ({ form, setForm }) => {
    const options = [
        { label: '시작 시간', value: 0 },
        { label: '10분 전', value: 10 },
        { label: '1시간 전', value: 60 }
    ];

    return (
        <div className="reminder-container-custom">
            <div className="reminder-list-box">
                {options.map(opt => (
                    <div
                        key={opt.value}
                        className={`reminder-item ${form.reminders?.includes(opt.value) ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, reminders: [opt.value] })}
                    >
                        <div className="radio-circle" />
                        <span>{opt.label}</span>
                    </div>
                ))}
            </div>
            <div className="toggle-block" onClick={() => setForm({ ...form, isNotificationEnabled: !form.isNotificationEnabled })}>
                <span>알림 설정 끄기</span>
                <input type="checkbox" checked={!form.isNotificationEnabled} readOnly />
            </div>
        </div>
    );
};