import React, { useState, useEffect, useRef } from 'react';

/**
 * [WheelableTimeUnit]
 * 데스크톱에서는 '마우스 휠', 모바일에서는 '상하 드래그'를 통해
 * 숫자를 순환(Wrap-around)시키는 공통 타임 피커 컴포넌트입니다.
 */
const WheelableTimeUnit = ({ value, max, onChange }) => {
    // 현재 값을 최신 상태로 유지하기 위한 Ref (이벤트 리스너 안에서 최신값 참조용)
    const valRef = useRef(parseInt(value, 10));
    const wheelRef = useRef(null); // DOM 엘리먼트 직접 참조

    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef(0); // 드래그 시작 Y좌표

    // 부모로부터 받은 value가 바뀔 때마다 내부 Ref 동기화
    useEffect(() => {
        valRef.current = parseInt(value, 10);
    }, [value]);

    // --------------------------------------------------------
    // 1. 데스크톱 환경: 마우스 휠 이벤트 처리
    // --------------------------------------------------------
    useEffect(() => {
        const handleWheel = (e) => {
            e.preventDefault(); // 휠을 굴릴 때 배경(모달창 전체)이 스크롤되는 현상 차단
            const direction = e.deltaY > 0 ? -1 : 1; // 휠을 아래로 굴리면 감소(-), 위로 굴리면 증가(+)

            let newVal = valRef.current + direction;

            // 숫자가 범위를 넘어가면 자연스럽게 순환되도록 처리 (예: 23시 -> 00시)
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

    // --------------------------------------------------------
    // 2. 모바일 환경: 터치 드래그 이벤트 처리
    // --------------------------------------------------------
    const handlePointerDown = (e) => {
        setIsDragging(true);
        startYRef.current = e.clientY;
        e.target.setPointerCapture(e.pointerId); // 마우스/터치가 요소 밖을 벗어나도 이벤트를 놓치지 않도록 캡처
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startYRef.current;
        const sensitivity = 15; // 15픽셀 이동할 때마다 숫자가 1씩 변함 (민감도)

        if (Math.abs(deltaY) > sensitivity) {
            const steps = Math.floor(Math.abs(deltaY) / sensitivity);
            const direction = deltaY > 0 ? -1 : 1;

            let newVal = valRef.current + (steps * direction);

            // 음수가 될 경우를 대비한 안전한 모듈러 연산 공식
            while (newVal < 0) newVal += (max + 1);
            newVal = newVal % (max + 1);

            onChange(String(newVal).padStart(2, '0'));
            startYRef.current = e.clientY; // 한 칸 이동 후 현재 위치를 다시 기준점으로 설정 (연속 스크롤 가능)
        }
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId); // 드래그 종료 시 캡처 해제
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