const bcrypt = require('./node_modules/bcryptjs');
const { execSync } = require('child_process');

const hash = bcrypt.hashSync('123456', 10);

console.log('Hash gerado:', hash);

const cmd = `mysql -h 72.61.222.225 -u root -p'Grande@vix' ecclesia -e "INSERT INTO User (id, churchId, name, email, password, role, createdAt) VALUES ('user_test_01', 'church_test_01', 'Pastor Teste', 'pastor@teste.com', '${hash}', 'PASTOR', NOW());"`;

execSync(cmd, { stdio: 'inherit' });
console.log('Usuário criado com sucesso!');