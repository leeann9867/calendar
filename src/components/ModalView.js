import React, { useState, useEffect } from 'react';
import EventDetail from './modal/EventDetail';
import EventForm from './modal/EventForm';

/**
 * [ModalView]
 * 화면 전체를 덮는 반투명 검은색 배경(Overlay)을 렌더링하고,
 * 상황에 따라 '상세 보기(EventDetail)' 창을 띄울지 '입력/수정 폼(EventForm)' 창을 띄울지
 * 결정해주는 라우터(Router) 역할을 하는 컴포넌트입니다.
 */
function ModalView({ selectedDate, initData, events, onClose, onSave, onDelete }) {
    // 🌟 데이터가 존재하면(기존 일정을 클릭함) 'view(조회)' 모드,
    // 🌟 데이터가 없으면(빈 날짜나 + 버튼을 클릭함) 'edit(편집)' 모드로 초기 상태 설정!
    const [mode, setMode] = useState(initData ? 'view' : 'edit');

    // 모달이 열려있는 동안 달력 뒤 배경이 마우스 휠로 인해 오르락내리락(스크롤)하는 현상 차단
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        // onWheel={e => e.stopPropagation()} : 모달 내부의 마우스 휠 이벤트가 부모(배경)로 전파되는 것 방지
        <div className="modal-overlay" onClick={onClose} onWheel={e => e.stopPropagation()}>
            {mode === 'view' ? (
                <EventDetail
                    event={initData}
                    selectedDate={selectedDate}
                    onClose={onClose}
                    onEdit={() => setMode('edit')} // 수정 버튼을 누르면 폼(EventForm) 모드로 전환
                    onDelete={onDelete}
                />
            ) : (
                <EventForm
                    selectedDate={selectedDate}
                    initData={initData}
                    events={events}
                    onClose={onClose}
                    onSave={onSave}
                    onDelete={onDelete}
                />
            )}
        </div>
    );
}

export default ModalView;