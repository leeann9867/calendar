// server/init-db.js
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function initDB() {
    try {
        await client.connect();
        console.log('✅ Supabase 클라우드 DB 연결 성공! 테이블 세팅을 시작합니다...');

        await client.query("DROP TABLE IF EXISTS event_exceptions CASCADE");
        await client.query("DROP TABLE IF EXISTS event_details CASCADE");
        await client.query("DROP TABLE IF EXISTS events CASCADE");

        await client.query(`
            CREATE TABLE events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title VARCHAR(255) NOT NULL,
                start_at TIMESTAMPTZ NOT NULL,
                end_at TIMESTAMPTZ NOT NULL,
                timezone VARCHAR(50) DEFAULT 'UTC'
            )
        `);
        console.log("✅ 1/3 events 테이블 생성 완료");

        // 🌟 [핵심 변경점] reminder 컬럼들을 지우고 is_alarm_on, alarms 컬럼 추가!
        await client.query(`
            CREATE TABLE event_details (
                event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
                is_all_day BOOLEAN DEFAULT FALSE,
                tag VARCHAR(50),
                color VARCHAR(20),
                memo TEXT,

                is_alarm_on BOOLEAN DEFAULT TRUE,
                alarms VARCHAR(255) DEFAULT '10',

                repeat_value INTEGER DEFAULT 0,
                repeat_unit VARCHAR(10) DEFAULT 'none',
                repeat_end_date TIMESTAMPTZ
            )
        `);
        console.log("✅ 2/3 event_details 테이블 생성 완료 (다중 알림 지원 패치 완료!)");

        await client.query(`
            CREATE TABLE event_exceptions (
                id SERIAL PRIMARY KEY,
                event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                excluded_date DATE NOT NULL
            )
        `);
        console.log("✅ 3/3 event_exceptions 테이블 생성 완료");

        console.log("🎉 완벽합니다! 모든 테이블이 클라우드(Supabase)에 배포되었습니다!");

    } catch (err) {
        console.error('🚨 에러 발생:', err.message);
    } finally {
        await client.end();
    }
}

initDB();