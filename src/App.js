import React from 'react';
import Header from './components/Header';
import Main from './components/Main';
import './index.css';
import Footer from "./components/Footer";

/**
 * 최상위 컴포넌트: 상태를 한 곳에서 관리하여 Header와 Main을 동기화함
 */
function App() {

    return (
        <div className="wrapper">
            <Main />
        </div>
    );
}

export default App;