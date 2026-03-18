import React from 'react';
import Header from './components/Header';
import CalendarSection from './components/CalendarSection';
import { useCalendarApp } from './hooks/useCalendarApp';
import { useNotification } from './hooks/useNotification';
import './index.css';

function App() {
    const { currentDate, events, handleSaveEvent, handleDeleteEvent, handleMoveMonth } = useCalendarApp();

    // 알림 서비스 실행
    useNotification(events);

    return (
        <div className="wrapper">
            <Header
                currentDate={currentDate}
                onPrev={() => handleMoveMonth(-1)}
                onNext={() => handleMoveMonth(1)}
                onToday={() => handleMoveMonth(0)} // 로직에 따라 수정 가능
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