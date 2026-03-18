import React from 'react';

const colors = [
    { name: 'blue', value: '#007aff' },
    { name: 'red', value: '#ff5252' },
    { name: 'green', value: '#4caf50' },
    { name: 'orange', value: '#ff9500' },
    { name: 'purple', value: '#af52de' }
];

export default function ColorPicker({ selectedColor, onChange }) {
    return (
        <div className="color-picker-container">
            {colors.map(c => (
                <div
                    key={c.name}
                    className={`color-dot ${c.name} ${selectedColor === c.name ? 'active' : ''}`}
                    onClick={() => onChange(c.name)}
                />
            ))}
        </div>
    );
}