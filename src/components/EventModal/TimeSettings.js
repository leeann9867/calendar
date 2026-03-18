import React from 'react';

function TimeSettings({ form, setForm }) {
    const handleStartTimeChange = (e) => {
        const newStart = e.target.value; // "HH:mm"
        const [h, m] = newStart.split(':').map(Number);
        const newEnd = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        setForm({ ...form, time: newStart, endTime: newEnd });
    };

    return (
        <div className="time-section">
            <div className="setting-item justify-between">
                <span>🕒 하루 종일</span>
                <label className="ios-switch">
                    <input
                        type="checkbox"
                        checked={form.isAllDay}
                        onChange={(e) => setForm({...form, isAllDay: e.target.checked})}
                    />
                    <span className="slider round"></span>
                </label>
            </div>

            {!form.isAllDay && (
                <div className="time-picker-row">
                    <input type="time" value={form.time} onChange={handleStartTimeChange} className="time-input" />
                    <span className="arrow">→</span>
                    <input type="time" value={form.endTime} onChange={(e) => setForm({...form, endTime: e.target.value})} className="time-input" />
                </div>
            )}
        </div>
    );
}

export default TimeSettings;