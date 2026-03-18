import { useState, useMemo, useCallback } from 'react';
import { formatDate } from '../utils/helpers';

/**
 * 캘린더 상태 및 이벤트 CRUD 비즈니스 로직 관리 훅
 * 기존 변수명 및 함수 구조를 100% 유지하며, 정밀한 삭제/필터링 로직을 포함함
 */
export function useCalendar(initialEvents = []) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState(initialEvents);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, date: null, event: null });

    // 1. 6주(42일) 분량의 캘린더 날짜 배열 생성
    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const days = [];
        const prevLastDay = new Date(year, month, 0).getDate();

        // 이전 달 날짜 채우기
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ date: new Date(year, month - 1, prevLastDay - i), isCurrentMonth: false });
        }
        // 이번 달 날짜 채우기
        for (let i = 1; i <= lastDate; i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }
        // 다음 달 날짜 채우기 (총 42칸 유지)
        while (days.length < 42) {
            days.push({ date: new Date(year, month + 1, days.length - (firstDay + lastDate) + 1), isCurrentMonth: false });
        }
        return days;
    }, [currentDate]);

    // 2. 모달 제어: 기존 데이터 필드 구조 보존
    const openModal = useCallback((date, event = null) => {
        setModalConfig({
            isOpen: true,
            date: date,
            event: event ? { ...event, clickDate: date } : {
                date: date,
                endDate: date,
                title: '',
                color: 'blue',
                repeat: 'none',
                until: null,
                time: "09:00",
                endTime: "10:00",
                isNotificationEnabled: true,
                reminders: [10],
                excludedDates: []
            }
        });
    }, []);

    const closeModal = useCallback(() => setModalConfig({ isOpen: false, date: null, event: null }), []);

    // 3. 이벤트 저장: 밤샘/연속 일정 대응을 위한 종료일 유효성 검사 포함
    const handleSaveEvent = useCallback((data) => {
        const validatedData = {
            ...data,
            endDate: data.endDate < data.date ? data.date : data.endDate
        };

        if (data.id) {
            setEvents(prev => prev.map(ev => ev.id === data.id ? validatedData : ev));
        } else {
            setEvents(prev => [...prev, { ...validatedData, id: Date.now(), excludedDates: [] }]);
        }
        closeModal();
    }, [closeModal]);

    // 4. 이벤트 삭제: single(특정일), future(이후 전체), all(완전 삭제) 모드 케어
    const handleDeleteEvent = useCallback((id, mode, targetDate) => {
        setEvents(prev => {
            const target = prev.find(ev => ev.id === id);
            if (!target) return prev;

            if (mode === 'single') {
                const updated = { ...target, excludedDates: [...(target.excludedDates || []), targetDate] };
                return prev.map(ev => ev.id === id ? updated : ev);
            } else if (mode === 'future') {
                const d = new Date(targetDate);
                d.setDate(d.getDate() - 1);
                const untilDate = formatDate(d);
                if (untilDate < target.date) return prev.filter(ev => ev.id !== id);
                return prev.map(ev => ev.id === id ? { ...target, until: untilDate } : ev);
            }
            return prev.filter(ev => ev.id !== id);
        });
        closeModal();
    }, [closeModal]);

    // 5. 날짜별 이벤트 필터링: 반복 타입(daily, weekly, monthly, yearly) 정밀 대응
    const getEventsForDate = useCallback((date) => {
        const dStr = formatDate(date);
        const day = date.getDay();
        return events.filter(ev => {
            if (ev.excludedDates?.includes(dStr)) return false;

            const isWithinRange = dStr >= ev.date && dStr <= (ev.endDate || ev.date);
            if (!ev.repeat || ev.repeat === 'none') return isWithinRange;

            if (dStr < ev.date) return false;
            if (ev.until && dStr > ev.until) return false;

            if (ev.repeat === 'daily') return true;
            if (ev.repeat === 'weekly') return day === new Date(ev.date).getDay();
            if (ev.repeat === 'monthly') return date.getDate() === new Date(ev.date).getDate();
            if (ev.repeat === 'yearly') {
                const s = new Date(ev.date);
                return date.getMonth() === s.getMonth() && date.getDate() === s.getDate();
            }
            return false;
        });
    }, [events]);

    return {
        currentDate, calendarData, events, modalConfig, getEventsForDate,
        openModal, closeModal, handleSaveEvent, handleDeleteEvent,
        handleMoveMonth: (s) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + s, 1)),
        handleGoToday: () => setCurrentDate(new Date())
    };
}