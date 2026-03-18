import React from 'react';

export default function TimeSettings({ form, onChange }) {
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = ["00", "10", "20", "30", "40", "50"];

    const handleTime = (type, unit, val) => {
        const parts = (form[type] || "09:00").split(':');
        if (unit === 'h') parts[0] = val; else parts[1] = val;
        onChange(type, parts.join(':'));
    };

    return (
        <>
            <div className="settings-row">
                <span className="label">🕒 하루 종일</span>
                <input type="checkbox" checked={form.isAllDay} onChange={e => onChange('isAllDay', e.target.checked)} />
            </div>
            {!form.isAllDay && (
                <div className="time-picker-24h-grid">
                    <div className="time-unit">
                        <span className="sub-label">시작</span>
                        <div className="custom-select-group">
                            <select value={form.time.split(':')[0]} onChange={e => handleTime('time', 'h', e.target.value)}>
                                {hours.map(h => <option key={h} value={h}>{h}시</option>)}
                            </select>
                            <select value={form.time.split(':')[1]} onChange={e => handleTime('time', 'm', e.target.value)}>
                                {minutes.map(m => <option key={m} value={m}>{m}분</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="time-unit">
                        <span className="sub-label">종료</span>
                        <div className="custom-select-group">
                            <select value={form.endTime.split(':')[0]} onChange={e => handleTime('endTime', 'h', e.target.value)}>
                                {hours.map(h => <option key={h} value={h}>{h}시</option>)}
                            </select>
                            <select value={form.endTime.split(':')[1]} onChange={e => handleTime('endTime', 'm', e.target.value)}>
                                {minutes.map(m => <option key={m} value={m}>{m}분</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}