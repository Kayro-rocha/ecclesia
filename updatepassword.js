const bcrypt = require('./node_modules/bcryptjs');
const mysql = require('./node_modules/mysql2/promise');

async function main() {
  const hash = bcrypt.hashSync('123456', 10);
  console.log('Hash:', hash);

  const conn = await mysql.createConnection({
    host: '72.61.222.225',
    user: 'root',
    password: 'Grande@vix',
    database: 'ecclesia'
  });

  await conn.execute(
    'UPDATE User SET password = ? WHERE email = ?',
    [hash, 'pastor@teste.com']
  );

  const [rows] = await conn.execute(
    'SELECT email, password FROM User WHERE email = ?',
    ['pastor@teste.com']
  );

  console.log('Salvo no banco:', rows);
  await conn.end();
}

main().catch(console.error);