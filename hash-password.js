const bcrypt = require('bcryptjs');
const fs = require('fs');

const user = JSON.parse(fs.readFileSync('admin_user.json', 'utf-8'));

bcrypt.hash(user.password, 10, (err, hash) => {
  if (err) {
    console.error(err);
    return;
  }
  user.password = hash;
  fs.writeFileSync('admin_user_hashed.json', JSON.stringify(user, null, 2));
  console.log('Password hashed and saved to admin_user_hashed.json');
});
