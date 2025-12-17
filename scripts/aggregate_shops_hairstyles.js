(async ()=>{
  try {
    const { pool } = require('../api/db');
    // Find all shops
    const shops = await pool.query(`SELECT id FROM shops`);
    console.log('Shops to process:', shops.rowCount);
    for (const s of shops.rows) {
      const shopId = s.id;
      // aggregate from reviews (where shop_id matches) and images (shop_id)
      const q = await pool.query(`
        SELECT h, SUM(cnt) as total FROM (
          SELECT jsonb_array_elements_text(hairstyles) as h, 1 as cnt
          FROM reviews
          WHERE shop_id = $1 AND hairstyles IS NOT NULL
          UNION ALL
          SELECT jsonb_array_elements_text(hairstyles) as h, 1 as cnt
          FROM images
          WHERE shop_id = $1 AND hairstyles IS NOT NULL
        ) t
        GROUP BY h
        ORDER BY total DESC
      `, [shopId]);
      const styles = q.rows.map(r => ({ style: r.h, count: Number(r.total) }));
      await pool.query(`UPDATE shops SET hairstyles = $1 WHERE id = $2`, [JSON.stringify(styles), shopId]);
      if (styles.length) console.log(`Shop ${shopId} ->`, styles);
    }
    console.log('Aggregation complete');
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
