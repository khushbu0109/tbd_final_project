import express from 'express';
import { query } from '../db.js';
import { requireAdminAuth } from '../middleware/auth.js';
import { getActor, logActivity } from '../utils/logger.js';

const router = express.Router();

function parseJsonSafe(val, fallback) {
  if (val == null) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// ---------------- BLOG MANAGEMENT ----------------
router.get('/blogs', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM journal_articles ORDER BY is_featured DESC, created_at DESC');
    res.json(
      rows.map((r) => ({
        id: r.id,
        digestNumber: r.digest_number,
        title: r.title,
        category: r.category,
        readTime: r.read_time,
        author: r.author,
        authorRole: r.author_role,
        date: r.published_label,
        studyRef: r.study_ref || undefined,
        image: r.image_url,
        excerpt: r.excerpt,
        body: parseJsonSafe(r.body_json, [r.excerpt]),
        featured: Boolean(r.is_featured),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/blogs', requireAdminAuth, async (req, res) => {
  try {
    const b = req.body;
    const id =
      b.id ||
      `${String(b.title || 'article')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 48)}-${Date.now()}`;
    const paragraphs = Array.isArray(b.body)
      ? b.body
      : String(b.body || b.excerpt || '')
          .split(/\n+/)
          .map((s) => s.trim())
          .filter(Boolean);

    await query(
      `INSERT INTO journal_articles (
        id, digest_number, title, category, read_time, author, author_role,
        published_label, study_ref, image_url, excerpt, body_json, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        b.digestNumber || 'Digest New',
        b.title,
        b.category || 'Wellness',
        b.readTime || '5 min read',
        b.author || 'Dr. Rhea Sen',
        b.authorRole || 'Clinical Researcher',
        b.date ||
          new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        b.studyRef || null,
        b.image || '/images/ing-astaxanthin.png',
        b.excerpt || paragraphs[0] || '',
        JSON.stringify(paragraphs.length ? paragraphs : [b.excerpt || '']),
        b.featured ? 1 : 0,
      ]
    );
    await logActivity({
      ...getActor(req),
      actionType: 'CREATE',
      entityType: 'blog',
      entityId: id,
      details: `Published blog "${b.title}"`,
    });
    res.status(201).json({ id, ...b, body: paragraphs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/blogs/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM journal_articles WHERE id = ?', [req.params.id]);
    await logActivity({
      ...getActor(req),
      actionType: 'DELETE',
      entityType: 'blog',
      entityId: req.params.id,
      details: `Deleted blog article ${req.params.id}`,
    });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- BLOG CATEGORIES ----------------
router.get('/blog-categories', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM blog_categories ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/blog-categories', requireAdminAuth, async (req, res) => {
  try {
    const { name, slug, description = '', is_active = 1 } = req.body;
    const finalSlug =
      slug || String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const result = await query(
      'INSERT INTO blog_categories (name, slug, description, is_active) VALUES (?, ?, ?, ?)',
      [name, finalSlug, description, is_active ? 1 : 0]
    );
    const rows = await query('SELECT * FROM blog_categories WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/blog-categories/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM blog_categories WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- WEBSITE CONTENT ----------------
router.get('/website-content', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM website_content ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/website-content', requireAdminAuth, async (req, res) => {
  try {
    const { content_key, title, content_value } = req.body;
    await query(
      `INSERT INTO website_content (content_key, title, content_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), content_value = VALUES(content_value)`,
      [content_key, title, content_value]
    );
    const rows = await query('SELECT * FROM website_content WHERE content_key = ?', [content_key]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/website-content/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM website_content WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- HOMEPAGE SECTIONS ----------------
router.get('/homepage-sections', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM homepage_sections ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/homepage-sections', requireAdminAuth, async (req, res) => {
  try {
    const { section_key, heading, subheading = '', sort_order = 1, is_visible = 1 } = req.body;
    await query(
      `INSERT INTO homepage_sections (section_key, heading, subheading, sort_order, is_visible)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE heading = VALUES(heading), subheading = VALUES(subheading), sort_order = VALUES(sort_order), is_visible = VALUES(is_visible)`,
      [section_key, heading, subheading, Number(sort_order), is_visible ? 1 : 0]
    );
    const rows = await query('SELECT * FROM homepage_sections WHERE section_key = ?', [section_key]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/homepage-sections/:id', requireAdminAuth, async (req, res) => {
  try {
    const { is_visible, heading, subheading } = req.body;
    if (heading !== undefined) {
      await query(
        'UPDATE homepage_sections SET heading = ?, subheading = ?, is_visible = ? WHERE id = ?',
        [heading, subheading || '', is_visible ? 1 : 0, req.params.id]
      );
    } else {
      await query('UPDATE homepage_sections SET is_visible = ? WHERE id = ?', [
        is_visible ? 1 : 0,
        req.params.id,
      ]);
    }
    const rows = await query('SELECT * FROM homepage_sections WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ABOUT US CONTENT ----------------
router.get('/about-us', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM about_us_content ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/about-us', requireAdminAuth, async (req, res) => {
  try {
    const { block_key, heading, body, metric_value = '', sort_order = 1 } = req.body;
    await query(
      `INSERT INTO about_us_content (block_key, heading, body, metric_value, sort_order)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE heading = VALUES(heading), body = VALUES(body), metric_value = VALUES(metric_value), sort_order = VALUES(sort_order)`,
      [block_key, heading, body, metric_value, Number(sort_order)]
    );
    const rows = await query('SELECT * FROM about_us_content WHERE block_key = ?', [block_key]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/about-us/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM about_us_content WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- HOW IT WORKS ----------------
router.get('/how-it-works', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM how_it_works_steps ORDER BY step_number ASC, id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/how-it-works', requireAdminAuth, async (req, res) => {
  try {
    const { step_number, title, description, outcome_label = '' } = req.body;
    const result = await query(
      'INSERT INTO how_it_works_steps (step_number, title, description, outcome_label) VALUES (?, ?, ?, ?)',
      [Number(step_number), title, description, outcome_label]
    );
    const rows = await query('SELECT * FROM how_it_works_steps WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/how-it-works/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM how_it_works_steps WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- INGREDIENTS ----------------
router.get('/ingredients', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM ingredients ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ingredients', requireAdminAuth, async (req, res) => {
  try {
    const {
      id,
      name,
      dosage,
      category = 'Amino Acids',
      image_url = '/images/ing-l-arginine.png',
      benefit_1 = '',
      benefit_2 = '',
      clinical_note = '',
      sort_order = 12,
    } = req.body;
    const finalId =
      id || String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await query(
      `INSERT INTO ingredients (id, name, dosage, category, image_url, benefit_1, benefit_2, clinical_note, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), dosage = VALUES(dosage), category = VALUES(category),
       benefit_1 = VALUES(benefit_1), benefit_2 = VALUES(benefit_2), clinical_note = VALUES(clinical_note)`,
      [finalId, name, dosage, category, image_url, benefit_1, benefit_2, clinical_note, Number(sort_order)]
    );
    const rows = await query('SELECT * FROM ingredients WHERE id = ?', [finalId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/ingredients/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM ingredients WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- TESTIMONIALS ----------------
router.get('/testimonials', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM testimonials ORDER BY is_featured DESC, id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/testimonials', requireAdminAuth, async (req, res) => {
  try {
    const { author_name, author_role, quote, product_name = 'COREAA™ Daily Vitality', is_featured = 1 } =
      req.body;
    const result = await query(
      'INSERT INTO testimonials (author_name, author_role, quote, product_name, is_featured) VALUES (?, ?, ?, ?, ?)',
      [author_name, author_role, quote, product_name, is_featured ? 1 : 0]
    );
    const rows = await query('SELECT * FROM testimonials WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/testimonials/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- REVIEWS & RATINGS ----------------
router.get('/reviews', async (_req, res) => {
  try {
    const rows = await query('SELECT * FROM reviews_ratings ORDER BY created_at DESC');
    res.json(
      rows.map((r) => ({
        id: r.id,
        author: r.author,
        initials: r.initials,
        location: r.location,
        role: r.role,
        rating: Number(r.rating),
        productName: r.product_name,
        title: r.title,
        quote: r.quote,
        batchCode: r.batch_code,
        date: r.review_date_label,
        verified: Boolean(r.verified),
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reviews', async (req, res) => {
  try {
    const r = req.body;
    const id = `rev-${Date.now()}`;
    const parts = String(r.author || 'TBD User').trim().split(/\s+/);
    const initials = parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'TW';
    const dateLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    await query(
      `INSERT INTO reviews_ratings (id, product_id, product_name, author, initials, location, role, rating, title, quote, batch_code, review_date_label, verified)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 'LOT-2025-VER', ?, 1)`,
      [
        id,
        r.productName || 'COREAA™ Daily Vitality',
        r.author,
        initials,
        r.location || 'India',
        r.role || 'Verified Patient',
        Math.min(5, Math.max(1, Number(r.rating || 5))),
        r.title,
        r.quote,
        dateLabel,
      ]
    );
    res.status(201).json({
      id,
      author: r.author,
      initials,
      location: r.location || 'India',
      role: r.role || 'Verified Patient',
      rating: Number(r.rating || 5),
      productName: r.productName || 'COREAA™ Daily Vitality',
      title: r.title,
      quote: r.quote,
      batchCode: 'LOT-2025-VER',
      date: dateLabel,
      verified: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/reviews/:id', requireAdminAuth, async (req, res) => {
  try {
    const { verified } = req.body;
    await query('UPDATE reviews_ratings SET verified = ? WHERE id = ?', [
      verified ? 1 : 0,
      req.params.id,
    ]);
    res.json({ id: req.params.id, verified: Boolean(verified) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/reviews/:id', requireAdminAuth, async (req, res) => {
  try {
    await query('DELETE FROM reviews_ratings WHERE id = ?', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- NEWSLETTER ----------------
router.post('/newsletter', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const source = String(req.body?.source || 'Storefront');
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    await query(
      'INSERT IGNORE INTO newsletter_subscribers (email, source) VALUES (?, ?)',
      [email, source]
    );
    res.status(201).json({ subscribed: true, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
