(async ()=>{
  try {
    const { pool } = require('../api/db');
    const res = await pool.query("SELECT id, barber_id, text, hairstyles FROM reviews WHERE hairstyles IS NOT NULL LIMIT 20");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
