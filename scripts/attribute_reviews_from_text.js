(async ()=>{
  try {
    const { pool } = require('../api/db');
    const res = await pool.query(`
      SELECT id, text, hairstyles
      FROM reviews
      WHERE barber_id IS NULL
        AND hairstyles IS NOT NULL
        AND jsonb_array_length(hairstyles) > 0
      ORDER BY id DESC
      LIMIT 500
    `);

    console.log('Candidate reviews with hairstyles:', res.rowCount);

    function extract_candidate_names(text) {
      const patterns = [
        /to\s+([A-Z][a-z]{1,20})\s+at/gi,
        /to\s+([A-Z][a-z]{1,20})[\.\!]/gi,
        /by\s+([A-Z][a-z]{1,20})/gi,
        /ask for\s+([A-Z][a-z]{1,20})/gi,
        /mention[:\s]+([A-Z][a-z]{1,20})/gi,
        /shoutout to\s+([A-Z][a-z]{1,20})/gi,
        /special mention[:\s]*([A-Z][a-z]{1,20})/gi,
        /today\s+([A-Z][a-z]{1,20})\s+was/gi,
        /with\s+([A-Z][a-z]{1,20})\s+after/gi,
        /see\s+([A-Z][a-z]{1,20})/gi
      ];
      const cands = new Set();
      for (const p of patterns) {
        let m;
        while ((m = p.exec(text)) !== null) {
          const name = m[1].charAt(0).toUpperCase() + m[1].slice(1);
          cands.add(name);
        }
      }
      // fallback capitalized tokens
      const words = text.match(/\b([A-Z][a-z]{1,20})\b/g) || [];
      for (const w of words) cands.add(w);
      // remove obvious stopwords
      const stop = new Set(['Main','Street','Barbershop','Downtown','Barber','Shop','If','I']);
      return Array.from(cands).filter(x => !stop.has(x));
    }

    for (const r of res.rows) {
      const names = extract_candidate_names(r.text || '');
      if (names.length === 0) continue;
      let matched = null;
      for (const n of names) {
        const q = await pool.query(`SELECT id, name FROM barbers WHERE lower(name)=lower($1) LIMIT 1`, [n]);
        if (q.rowCount) { matched = q.rows[0]; }
        else {
          const q2 = await pool.query(`SELECT id, name FROM barbers WHERE name ILIKE $1 OR name ILIKE $2 LIMIT 1`, [`% ${n}%`, `${n}%`]);
          if (q2.rowCount) matched = q2.rows[0];
        }
        if (matched) break;
      }
      if (matched) {
        await pool.query(`UPDATE reviews SET barber_id = $1 WHERE id = $2`, [matched.id, r.id]);
        console.log(`Attributed review ${r.id} -> barber ${matched.id} (${matched.name})`);
        // recompute aggregation
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

    console.log('Done.');
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
