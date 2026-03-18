import React, { useState, useEffect } from 'react';
import ModalView from './ModalView';

export default function EventModal({ initData, onSave, onDelete, onClose }) {
    // 1. 초기 데이터 세팅 (제목 없는 저장 대응)
    const [form, setForm] = useState({
        title: '',
        color: 'blue',
        repeat: 'none',
        until: null,
        ...initData
    });

    // 부모로부터 받은 데이터가 바뀌면 폼 업데이트
    useEffect(() => {
        setForm(prev => ({ ...prev, ...initData }));
    }, [initData]);

    const updateForm = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
    };

    const handleSave = () => {
        // 제목이 비어있으면 (제목 없음)으로 강제 할당
        const finalTitle = form.title.trim() === '' ? '(제목 없음)' : form.title;
        onSave({ ...form, title: finalTitle });
    };

    return (
        <ModalView
            form={form}
            updateForm={updateForm}
            onSave={handleSave}
            onDelete={onDelete}
            onClose={onClose}
            isEdit={!!initData.id} // ID가 있으면 수정 모드
        />
    );
}