import fs from 'fs';
import path from 'path';
import db from '#db/client';

await db.connect();
await seed();
await db.end();
console.log('🌱 Database seeded.');

async function seed() {
  const schemaPath = path.resolve('db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  // run schema
  await db.query(sql);

  // helpers
  async function createTrack(name, duration_ms) {
    const { rows } = await db.query(
      'INSERT INTO tracks (name, duration_ms) VALUES ($1, $2) RETURNING *',
      [name, duration_ms]
    );
    return rows[0];
  }

  async function createPlaylist(name, description) {
    const { rows } = await db.query(
      'INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    return rows[0];
  }

  async function createPlaylistTrack(playlist_id, track_id) {
    const { rows } = await db.query(
      'INSERT INTO playlists_tracks (playlist_id, track_id) VALUES ($1, $2) RETURNING *',
      [playlist_id, track_id]
    );
    return rows[0];
  }

  // create 20 tracks
  for (let i = 1; i <= 20; i++) {
    await createTrack(`Track ${i}`, 50000 + i * 1000);
  }

  // create 10 playlists
  for (let i = 1; i <= 10; i++) {
    await createPlaylist(`Playlist ${i}`, `Description for playlist ${i}`);
  }

  // create 15 playlist_tracks: distribute tracks into playlists
  for (let i = 1; i <= 15; i++) {
    const playlistId = 1 + ((i - 1) % 10);
    const trackId = i; // track ids 1..15
    await createPlaylistTrack(playlistId, trackId);
  }
}
