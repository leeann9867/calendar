const STORAGE_KEY = 'my_calendar_events';

export const saveEventsToStorage = (events) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

export const loadEventsFromStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
};