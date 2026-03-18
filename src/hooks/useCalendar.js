import { useState, useEffect } from 'react';
import { storage } from '../utils/helpers';

export function useCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState(() => storage.load());
    const [modalConfig, setModalConfig] = useState({ isOpen: false, event: null, date: null });

    useEffect(() => {
        storage.save(events);
    }, [events]);

    const handleMoveMonth = (offset) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const handleGoToday = () => setCurrentDate(new Date());

    /**
     * 모달 열기 - 기본값을 '하루 종일'로 설정
     */
    const openModal = (date, event = null) => {
        setModalConfig({
            isOpen: true,
            date: date,
            event: event || {
                date: date,
                title: '',
                isAllDay: true,
                time: "09:00",
                endTime: "10:00",
                repeat: 'none',
                until: date, // 기본 종료일은 당일
                isNotificationEnabled: true,
                reminders: [10],
                color: 'blue'
            }
        });
    };

    const closeModal = () => setModalConfig({ isOpen: false, event: null, date: null });

    const handleSaveEvent = (data) => {
        setEvents(prev => {
            const isUpdate = prev.find(e => e.id === data.id);
            return isUpdate ? prev.map(e => (e.id === data.id ? data : e)) : [...prev, { ...data, id: Date.now() }];
        });
        closeModal();
    };

    const handleDeleteEvent = (id) => {
        setEvents(prev => prev.filter(e => e.id !== id));
        closeModal();
    };

    return {
        currentDate, events, modalConfig,
        handleMoveMonth, handleGoToday,
        openModal, closeModal, handleSaveEvent, handleDeleteEvent
    };
}