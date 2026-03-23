const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/gastroflow.db');

db.all("SELECT COUNT(*) as count FROM recetas", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log("Recetas count:", rows[0].count);
    }
    db.close();
});
