import React, { useState, useEffect, useRef } from 'react';

/**
 * [WheelableTimeUnit Component]
 * 데스크톱의 '마우스 휠'과 모바일의 '상하 스와이프(드래그)' 제스처를 통해
 * 시간(Hour)과 분(Minute) 숫자를 직관적으로 증감시키는 커스텀 UI 위젯입니다.
 * @param {string|number} value - 현재 표시할 시간/분 값
 * @param {number} max - 증가 한계값 (시간은 23, 분은 59)
 * @param {function} onChange - 숫자가 바뀔 때마다 부모로 전달할 콜백 함수
 */
const WheelableTimeUnit = ({ value, max, onChange }) => {
    const valRef = useRef(parseInt(value, 10));
    const wheelRef = useRef(null);

    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef(0);

    useEffect(() => {
        valRef.current = parseInt(value, 10);
    }, [value]);

    useEffect(() => {
        const handleWheel = (e) => {
            e.preventDefault();
            const direction = e.deltaY > 0 ? -1 : 1;

            let newVal = valRef.current + direction;

            if (newVal < 0) newVal = max;
            if (newVal > max) newVal = 0;

            onChange(String(newVal).padStart(2, '0'));
        };

        const el = wheelRef.current;
        if (el) el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            if (el) el.removeEventListener('wheel', handleWheel);
        };
    }, [max, onChange]);

    const handlePointerDown = (e) => {
        setIsDragging(true);
        startYRef.current = e.clientY;
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startYRef.current;
        const sensitivity = 15;

        if (Math.abs(deltaY) > sensitivity) {
            const steps = Math.floor(Math.abs(deltaY) / sensitivity);
            const direction = deltaY > 0 ? -1 : 1;

            let newVal = valRef.current + (steps * direction);

            while (newVal < 0) newVal += (max + 1);
            newVal = newVal % (max + 1);

            onChange(String(newVal).padStart(2, '0'));
            startYRef.current = e.clientY;
        }
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId);
    };

    return (
        <div
            ref={wheelRef}
            className="time-wheel-unit"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            title="마우스 휠을 굴리거나 위아래로 드래그하세요"
        >
            {String(value).padStart(2, '0')}
        </div>
    );
};

export default WheelableTimeUnit;