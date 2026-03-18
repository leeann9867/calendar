import React from 'react';
import Header from './components/Header';
import Main from './components/Main'; // 기존 CalendarSection을 포함한 메인 컨텐츠
import Footer from './components/Footer';
import './index.css';

/**
 * 애플리케이션 최상위 컴포넌트
 * 레이아웃 구조(Header, Main, Footer) 정의에만 집중
 */
function App() {
    return (
        <div className="wrapper">
            <Header />
            <Main />
            <Footer />
        </div>
    );
}

export default App;