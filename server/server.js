// server/server.js
const app = require('./app'); // 우리가 세팅해둔 app.js를 불러옵니다!

// 여기서 진짜 서버 문을 엽니다.
app.listen(() => {
    console.log(`🚀 서버가 실행 중입니다.`);
});