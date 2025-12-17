(async ()=>{
  try {
    const { pool } = require('../api/db');
    const res = await pool.query("SELECT COUNT(*)::int AS cnt FROM reviews WHERE jsonb_typeof(hairstyles) IS NOT NULL AND COALESCE(jsonb_array_length(hairstyles),0) > 0");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
