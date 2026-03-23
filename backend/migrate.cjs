const handleDBUpdates = async () => {
    require('dotenv').config();
    const pool = require('./config/database.js');
    try {
        console.log('Adding sumaTotalInsumos to recetas...');
        await pool.query('ALTER TABLE recetas ADD COLUMN sumaTotalInsumos DECIMAL(12,4) DEFAULT 0;');
        console.log('Added!');
    } catch(e) {
        if(e.code === 'ER_DUP_FIELDNAME') {
            console.log('Field already exists.');
        } else {
            console.error('Error adding field:', e);
        }
    } finally {
        process.exit();
    }
};

handleDBUpdates();
