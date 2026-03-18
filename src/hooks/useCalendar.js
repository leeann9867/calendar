import { useState, useEffect } from 'react';
import { storage } from '../utils/helpers';

/**
 * 전역적인 캘린더 상태 관리를 위한 커스텀 훅
 */
export function useCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState(() => storage.load());
    const [modalConfig, setModalConfig] = useState({ isOpen: false, event: null, date: null });

    useEffect(() => {
        storage.save(events);
    }, [events]);

    const handleMoveMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const handleGoToday = () => setCurrentDate(new Date());

    const openModal = (date, event = null) => setModalConfig({ isOpen: true, date, event });
    const closeModal = () => setModalConfig({ isOpen: false, event: null, date: null });

    const handleSaveEvent = (data) => {
        setEvents(prev => {
            const isUpdate = prev.find(e => e.id === data.id);
            return isUpdate ? prev.map(e => e.id === data.id ? data : e) : [...prev, { ...data, id: Date.now() }];
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