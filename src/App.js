import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CalendarSection from './components/CalendarSection';
import { useNotification } from './hooks/useNotification';
import { checkEventConflict } from './utils/calendarHelpers';
import { saveEventsToStorage, loadEventsFromStorage } from './utils/storage'; // 저장 유틸
import './index.css';

function App() {
    const [currentDate, setCurrentDate] = useState(new Date());
    // 시작 시 LocalStorage에서 데이터 로드
    const [events, setEvents] = useState(() => loadEventsFromStorage());

    // 알림 훅 연결
    useNotification(events);

    // events가 변경될 때마다 LocalStorage에 저장
    useEffect(() => {
        saveEventsToStorage(events);
    }, [events]);

    const handleSaveEvent = (updatedEvent) => {
        if (checkEventConflict(updatedEvent, events)) {
            if (!window.confirm("⚠️ 겹치는 시간대에 일정이 있습니다. 계속할까요?")) return;
        }

        setEvents((prev) => {
            const isExist = prev.find((e) => e.id === updatedEvent.id);
            return isExist
                ? prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
                : [...prev, updatedEvent];
        });
    };

    const handleDeleteEvent = (id) => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
    };

    return (
        <div className="wrapper">
            <Header
                currentDate={currentDate}
                onPrev={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                onNext={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                onToday={() => setCurrentDate(new Date())}
            />
            <CalendarSection
                currentDate={currentDate}
                events={events}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
            />
        </div>
    );
}

export default App;