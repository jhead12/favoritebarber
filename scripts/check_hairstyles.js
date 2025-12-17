(async ()=>{
  try {
    const { pool } = require('../api/db');
    const res = await pool.query("SELECT id, name, hairstyles FROM barbers WHERE jsonb_array_length(coalesce(hairstyles,'[]'::jsonb))>0 LIMIT 10");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
