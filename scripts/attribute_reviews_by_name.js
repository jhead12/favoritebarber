(async ()=>{
  try {
    const { pool } = require('../api/db');

    // Find reviews with extracted_names and no barber_id
    const res = await pool.query(`
      SELECT id, extracted_names, text
      FROM reviews
      WHERE barber_id IS NULL
        AND extracted_names IS NOT NULL
        AND extracted_names <> ''
      LIMIT 500
    `);

    console.log('Candidate reviews:', res.rowCount);

    for (const row of res.rows) {
      const namesRaw = (row.extracted_names || '').split(',').map(s => s.trim()).filter(Boolean);
      let matched = null;
      for (const n of namesRaw) {
        // Try exact match first, then ILIKE partial matches
        const q = await pool.query(
          `SELECT id, name FROM barbers WHERE lower(name) = lower($1) LIMIT 1`,
          [n]
        );
        if (q.rowCount === 0) {
          const q2 = await pool.query(
            `SELECT id, name FROM barbers WHERE name ILIKE $1 OR name ILIKE $2 LIMIT 1`,
            [`% ${n}%`, `${n}%`]
          );
          if (q2.rowCount) matched = q2.rows[0];
        } else {
          matched = q.rows[0];
        }
        if (matched) break;
      }

      if (matched) {
        await pool.query(`UPDATE reviews SET barber_id = $1 WHERE id = $2`, [matched.id, row.id]);
        console.log(`Attributed review ${row.id} -> barber ${matched.id} (${matched.name})`);

        // Recompute hairstyle aggregation for the barber
        const aggQ = await pool.query(`
          SELECT h, SUM(cnt) as total FROM (
            SELECT jsonb_array_elements_text(hairstyles) as h, 1 as cnt
            FROM reviews
            WHERE barber_id = $1 AND hairstyles IS NOT NULL
            UNION ALL
            SELECT jsonb_array_elements_text(hairstyles) as h, 1 as cnt
            FROM images
            WHERE barber_id = $1 AND hairstyles IS NOT NULL
          ) t
          GROUP BY h
          ORDER BY total DESC
        `, [matched.id]);
        const styles = aggQ.rows.map(r => ({ style: r.h, count: Number(r.total) }));
        await pool.query(`UPDATE barbers SET hairstyles = $1 WHERE id = $2`, [JSON.stringify(styles), matched.id]);
        console.log(`  -> Updated barber ${matched.id} hairstyles:`, styles);
      }
    }

    console.log('Attribution complete.');
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
