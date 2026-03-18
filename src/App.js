import React from 'react';
import Header from './components/Header';
import Main from './components/Main';
import Footer from './components/Footer';
import './index.css';

/**
 * 애플리케이션 최상위 레이아웃
 * 화면의 전체적인 구조(Header, Main)를 정의함
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