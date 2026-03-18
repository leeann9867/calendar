import React from 'react';

const COLORS = [
    { name: 'blue', hex: '#007aff' },
    { name: 'red', hex: '#ff5252' },
    { name: 'green', hex: '#34c759' },
    { name: 'orange', hex: '#ff9500' },
    { name: 'purple', hex: '#af52de' }
];

export default function ColorPicker({ selectedColor, onChange }) {
    return (
        <div style={{ display: 'flex', gap: '15px', padding: '10px 0', justifyContent: 'center' }}>
            {COLORS.map(color => (
                <div
                    key={color.name}
                    onClick={() => onChange(color.name)}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: color.hex,
                        cursor: 'pointer',
                        border: selectedColor === color.name ? '3px solid #333' : '2px solid transparent',
                        transform: selectedColor === color.name ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.2s'
                    }}
                />
            ))}
        </div>
    );
}