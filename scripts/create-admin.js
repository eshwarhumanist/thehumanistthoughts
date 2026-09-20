const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    if (!hidden) {
      rl.question(question, resolve);
      return;
    }
    const stdin = process.openStdin();
    process.stdin.on('data', () => {});
    rl.question(question, (answer) => resolve(answer));
  });
}

(async () => {
  console.log('=== Create Admin Account for The Humanist Thoughts ===');
  const username = (await ask('Choose an admin username: ')).trim();
  const password = (await ask('Choose an admin password: ')).trim();
  rl.close();

  if (!username || !password) {
    console.log('Username and password cannot be empty.');
    process.exit(1);
  }
  if (password.length < 8) {
    console.log('Password should be at least 8 characters long.');
    process.exit(1);
  }

  const hash = bcrypt.hashSync(password, 12);
  try {
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(username, hash);
    console.log(`Admin account "${username}" created successfully.`);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      console.log('That username already exists. Updating password instead.');
      db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(hash, username);
      console.log('Password updated.');
    } else {
      console.error('Error creating admin:', err.message);
      process.exit(1);
    }
  }
  process.exit(0);
})();
