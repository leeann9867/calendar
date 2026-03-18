import React from 'react';

const RepeatSettings = ({ form, setForm }) => (
    <>
        <div className="form-group">
            <label>반복</label>
            <select value={form.repeat} onChange={e => setForm({...form, repeat: e.target.value})}>
                <option value="none">반복 안함</option>
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
                <option value="custom">사용자 지정...</option>
            </select>
        </div>
        {form.repeat === 'custom' && (
            <div className="custom-repeat-box">
                <input type="number" min="1" value={form.repeatInterval} onChange={e => setForm({...form, repeatInterval: e.target.value})} />
                <select value={form.repeatUnit} onChange={e => setForm({...form, repeatUnit: e.target.value})}>
                    <option value="day">일마다</option>
                    <option value="week">주마다</option>
                    <option value="month">개월마다</option>
                </select>
            </div>
        )}
    </>
);

export default RepeatSettings;