import express from "express";
import db from "#db/client";

const app = express();
app.use(express.json());

// Tracks
app.get("/tracks", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tracks ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/tracks/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be a number" });
  try {
    const { rows } = await db.query("SELECT * FROM tracks WHERE id = $1", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Playlists
app.get("/playlists", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM playlists ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/playlists", async (req, res) => {
  const { name, description } = req.body ?? {};
  if (!name || !description) return res.status(400).json({ error: "missing required fields" });
  try {
    const { rows } = await db.query(
      "INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/playlists/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be a number" });
  try {
    const { rows } = await db.query("SELECT * FROM playlists WHERE id = $1", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/playlists/:id/tracks", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "id must be a number" });
  try {
    const pl = await db.query("SELECT id FROM playlists WHERE id = $1", [id]);
    if (pl.rows.length === 0) return res.status(404).json({ error: "playlist not found" });

    const { rows } = await db.query(
      `SELECT t.* FROM tracks t
       JOIN playlists_tracks pt ON pt.track_id = t.id
       WHERE pt.playlist_id = $1
       ORDER BY t.id`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/playlists/:id/tracks", async (req, res) => {
  const id = Number(req.params.id);
  const { trackId } = req.body ?? {};
  if (!Number.isInteger(id)) return res.status(400).json({ error: "playlist id must be a number" });
  if (trackId === undefined) return res.status(400).json({ error: "missing body" });
  if (!Number.isInteger(Number(trackId))) return res.status(400).json({ error: "trackId must be a number" });

  try {
    const pl = await db.query("SELECT id FROM playlists WHERE id = $1", [id]);
    if (pl.rows.length === 0) return res.status(404).json({ error: "playlist not found" });

    const tr = await db.query("SELECT id FROM tracks WHERE id = $1", [trackId]);
    if (tr.rows.length === 0) return res.status(400).json({ error: "track not found" });

    const existing = await db.query(
      "SELECT id FROM playlists_tracks WHERE playlist_id = $1 AND track_id = $2",
      [id, trackId]
    );
    if (existing.rows.length > 0) return res.status(400).json({ error: "already in playlist" });

    const { rows } = await db.query(
      "INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2) RETURNING *",
      [id, trackId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
