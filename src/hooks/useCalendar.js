import { useState, useEffect } from 'react';
import { storage } from '../utils/helpers';

/**
 * 캘린더 데이터 및 모달 상태 제어를 위한 커스텀 훅
 */
export function useCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState(() => storage.load());

    // 모달 통합 상태 (isOpen: 노출여부, event: 수정데이터, date: 신규날짜)
    const [modalConfig, setModalConfig] = useState({ isOpen: false, event: null, date: null });

    useEffect(() => {
        storage.save(events);
    }, [events]);

    const handleSaveEvent = (data) => {
        setEvents(prev => {
            const isUpdate = prev.find(e => e.id === data.id);
            return isUpdate
                ? prev.map(e => e.id === data.id ? data : e)
                : [...prev, { ...data, id: Date.now() }];
        });
        closeModal();
    };

    const handleDeleteEvent = (id) => {
        setEvents(prev => prev.filter(e => e.id !== id));
        closeModal();
    };

    const openModal = (date, event = null) => setModalConfig({ isOpen: true, date, event });
    const closeModal = () => setModalConfig({ isOpen: false, event: null, date: null });

    return {
        currentDate, setCurrentDate,
        events, modalConfig,
        openModal, closeModal,
        handleSaveEvent, handleDeleteEvent
    };
}