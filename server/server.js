// server/server.js
const app = require('./app'); // 우리가 세팅해둔 app.js를 불러옵니다!

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
});