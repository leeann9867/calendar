import { useState, useMemo, useCallback } from 'react';
import { formatDate } from '../utils/helpers';

export function useCalendar(initialEvents = []) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState(initialEvents);

    // 1. 모달 상태 관리 (Main.js에서 요구하는 구조)
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        date: null,
        event: null
    });

    // 2. 달력 데이터 생성 (6주 42칸 고정 로직)
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0); // 이번 달 마지막 날 객체
        const startDay = firstDayOfMonth.getDay();
        const days = [];

        // 이전 달 날짜 채우기
        const prevLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevLastDay - i),
                isCurrentMonth: false
            });
        }

        // 이번 달 날짜 채우기
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // 다음 달 날짜 채우기 (42칸 맞춤)
        const remainingSlots = 42 - days.length;
        for (let i = 1; i <= remainingSlots; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }
        return days;
    }, [currentDate]);

    // 3. 모달 제어 함수 (알림 기본값 포함)
    const openModal = useCallback((date, event = null) => {
        setModalConfig({
            isOpen: true,
            date: date,
            event: event || {
                date: date,
                title: '',
                color: 'blue',
                repeat: 'none',
                until: null,
                time: "09:00",
                endTime: "10:00",
                isNotificationEnabled: true, // 알림 기본 활성화
                reminders: [10]               // 10분 전 알림 기본값
            }
        });
    }, []);

    const closeModal = useCallback(() => {
        setModalConfig({ isOpen: false, date: null, event: null });
    }, []);

    // 4. 이벤트 조작 함수 (Main.js 연결)
    const handleSaveEvent = useCallback((eventData) => {
        if (eventData.id) {
            // 수정
            setEvents(prev => prev.map(ev => ev.id === eventData.id ? eventData : ev));
        } else {
            // 신규 등록
            setEvents(prev => [...prev, { ...eventData, id: Date.now() }]);
        }
        closeModal();
    }, [closeModal]);

    const handleDeleteEvent = useCallback((id) => {
        setEvents(prev => prev.filter(ev => ev.id !== id));
        closeModal();
    }, [closeModal]);

    // 5. 날짜 이동 함수 (Header.js 연결)
    const handleMoveMonth = useCallback((step) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + step, 1));
    }, []);

    const handleGoToday = useCallback(() => setCurrentDate(new Date()), []);

    // 6. 날짜별 일정 필터링 (반복 및 무기한 반복 대응)
    const getEventsForDate = useCallback((date) => {
        if (!Array.isArray(events)) return [];

        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();

        return events.filter(ev => {
            // 시작일 이전 제외
            if (dateStr < ev.date) return false;

            // 종료일(until)이 있고, 종료일을 넘었으면 제외 (until이 null이면 무한 반복)
            if (ev.until && dateStr > ev.until) return false;

            // 반복 유형별 필터
            if (!ev.repeat || ev.repeat === 'none') return ev.date === dateStr;
            if (ev.repeat === 'daily') return true;
            if (ev.repeat === 'weekly') {
                const startDay = new Date(ev.date).getDay();
                return dayOfWeek === startDay;
            }
            if (ev.repeat === 'monthly') {
                const startDate = new Date(ev.date).getDate();
                return date.getDate() === startDate;
            }
            if (ev.repeat === 'yearly') {
                const startObj = new Date(ev.date);
                return (
                    date.getMonth() === startObj.getMonth() &&
                    date.getDate() === startObj.getDate()
                );
            }
            return false;
        });
    }, [events]);

    // 모든 컴포넌트에서 필요한 핵심 인터페이스 반환
    return {
        currentDate,
        calendarData,
        events,
        modalConfig,
        getEventsForDate,
        openModal,
        closeModal,
        handleSaveEvent,
        handleDeleteEvent,
        handleMoveMonth,
        handleGoToday
    };
}