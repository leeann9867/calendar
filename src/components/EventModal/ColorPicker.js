import React from 'react';

const COLORS = [
    { id: 'ev-blue', code: '#1a73e8' }, { id: 'ev-red', code: '#d93025' },
    { id: 'ev-green', code: '#0b8043' }, { id: 'ev-yellow', code: '#f4b400' },
    { id: 'ev-purple', code: '#8e24aa' }, { id: 'ev-default', code: '#5f6368' }
];

const ColorPicker = ({ selectedColor, onSelect }) => (
    <div className="form-group">
        <label>색상</label>
        <div className="color-picker">
            {COLORS.map(c => (
                <div
                    key={c.id}
                    className={`color-dot ${c.id} ${selectedColor === c.id ? 'active' : ''}`}
                    style={{ backgroundColor: c.code }}
                    onClick={() => onSelect(c.id)}
                />
            ))}
        </div>
    </div>
);

export default ColorPicker;