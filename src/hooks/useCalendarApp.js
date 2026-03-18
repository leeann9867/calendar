import { useState, useEffect } from 'react';
import { saveEventsToStorage, loadEventsFromStorage } from '../utils/storage';

export function useCalendarApp() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState(() => loadEventsFromStorage());

    useEffect(() => {
        saveEventsToStorage(events);
    }, [events]);

    const handleSaveEvent = (updatedEvent) => {
        setEvents(prev => {
            const isExist = prev.find(e => e.id === updatedEvent.id);
            return isExist
                ? prev.map(e => e.id === updatedEvent.id ? updatedEvent : e)
                : [...prev, updatedEvent];
        });
    };

    const handleDeleteEvent = (id) => {
        setEvents(prev => prev.filter(e => e.id !== id));
    };

    const handleMoveMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return {
        currentDate, events, setEvents,
        handleSaveEvent, handleDeleteEvent, handleMoveMonth
    };
}