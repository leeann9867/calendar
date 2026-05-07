import React, { useState, useEffect } from 'react';
import EventDetail from './modal/EventDetail';
import EventForm from './modal/EventForm';

/**
 * [ModalView]
 * 화면 전체를 덮는 반투명 검은색 배경(Overlay)과 하얀색 모달 컨텐츠 창(Content)을 렌더링합니다.
 */
function ModalView({ selectedDate, initData, events, onClose, onSave, onDelete, openConfirm }) {
    const [mode, setMode] = useState(initData ? 'view' : 'edit');

    // 모달이 열려있는 동안 달력 뒤 배경이 마우스 휠로 인해 오르락내리락(스크롤)하는 현상 차단
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        // onWheel={e => e.stopPropagation()} : 모달 내부의 마우스 휠 이벤트가 부모(배경)로 전파되는 것 방지
        <div className="modal-overlay" onClick={onClose} onWheel={e => e.stopPropagation()}>
            {/* onClick={e => e.stopPropagation()} : 하얀 박스 안쪽을 클릭했을 때는 모달이 꺼지지 않도록 막아줍니다. */}
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {mode === 'view' ? (
                    <EventDetail
                        event={initData}
                        selectedDate={selectedDate}
                        onClose={onClose}
                        onEdit={() => setMode('edit')}
                        onDelete={onDelete}
                        openConfirm={openConfirm}
                    />
                ) : (
                    <EventForm
                        selectedDate={selectedDate}
                        initData={initData}
                        events={events}
                        onClose={onClose}
                        onSave={onSave}
                        onDelete={onDelete}
                        openConfirm={openConfirm}
                    />
                )}
            </div>
        </div>
    );
}

export default ModalView;