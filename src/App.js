import React from 'react';
import Header from './components/Header';
import Main from './components/Main';
import { useCalendar } from './hooks/useCalendar';
import './index.css';
import Footer from "./components/Footer";

/**
 * 최상위 컴포넌트: 상태를 한 곳에서 관리하여 Header와 Main을 동기화함
 */
function App() {
    // 훅을 여기서 한 번만 호출하여 모든 자식이 동일한 상태를 바라보게 함
    const calendar = useCalendar();

    return (
        <div className="wrapper">
            {/* Header에 상태와 제어 함수 전달 */}
            <Header
                currentDate={calendar.currentDate}
                handleMoveMonth={calendar.handleMoveMonth}
                handleGoToday={calendar.handleGoToday}
            />

            {/* Main에 나머지 모든 상태 전달 */}
            <Main calendar={calendar} />
            <Footer />
        </div>
    );
}

export default App;