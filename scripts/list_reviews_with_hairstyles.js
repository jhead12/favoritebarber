(async ()=>{
  try {
    const { pool } = require('../api/db');
    const res = await pool.query("SELECT id, barber_id, shop_id, text, hairstyles FROM reviews WHERE jsonb_typeof(hairstyles) IS NOT NULL AND COALESCE(jsonb_array_length(hairstyles),0) > 0 ORDER BY id DESC LIMIT 50");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
