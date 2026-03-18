import React, { useState } from 'react';

const OPTIONS = [
    { label: '일정 시작 시간', value: 0 },
    { label: '10분 전', value: 10 },
    { label: '1시간 전', value: 60 },
    { label: '1일 전', value: 1440 },
];

function ReminderSettings({ reminders = [], setReminders }) {
    const [isCustom, setIsCustom] = useState(false);
    const [customVal, setCustomVal] = useState('');

    const toggle = (val) => {
        // 이미지 스타일처럼 하나만 선택되도록 처리 (다중 선택 원하시면 [...reminders, val] 로직으로 변경 가능)
        if (reminders.includes(val)) {
            setReminders([]);
        } else {
            setReminders([val]);
        }
    };

    const handleAddCustom = () => {
        const val = parseInt(customVal);
        if (!isNaN(val) && val >= 0) {
            toggle(val);
            setCustomVal('');
            setIsCustom(false);
        }
    };

    return (
        <div className="reminder-container">
            <label className="section-label">알림</label>

            <div className="reminder-list-card">
                {/* 기본 옵션 리스트 */}
                {OPTIONS.map(opt => (
                    <div
                        key={opt.value}
                        className={`reminder-item ${reminders.includes(opt.value) ? 'active' : ''}`}
                        onClick={() => toggle(opt.value)}
                    >
                        <div className="check-circle">
                            {reminders.includes(opt.value) && <span className="check-mark">✓</span>}
                        </div>
                        <span className="item-label">{opt.label}</span>
                    </div>
                ))}

                {/* 직접 설정 입력창 (활성화 시 노출) */}
                {isCustom && (
                    <div className="reminder-item custom-input-item">
                        <div className="check-circle" />
                        <input
                            type="number"
                            className="custom-input"
                            placeholder="분 단위 입력"
                            value={customVal}
                            onChange={(e) => setCustomVal(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                        />
                        <button type="button" className="confirm-mini-btn" onClick={handleAddCustom}>확인</button>
                    </div>
                )}

                {/* 직접 설정 추가 버튼 */}
                {!isCustom && (
                    <div className="reminder-item custom-add-btn" onClick={() => setIsCustom(true)}>
                        <span className="plus-icon">+</span>
                        <span>직접 설정</span>
                    </div>
                )}
            </div>

            {/* 하단 알림 받지 않는 날 설정 (이미지 참고 디자인) */}
            <div className="reminder-list-card" style={{ marginTop: '12px' }}>
                <div className="reminder-item justify-between">
                    <span>알림 받지 않는 날 설정</span>
                    <div className="toggle-switch-dummy" />
                </div>
            </div>
        </div>
    );
}

export default ReminderSettings;