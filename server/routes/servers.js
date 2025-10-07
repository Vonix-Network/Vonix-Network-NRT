



const express = require('express');
const axios = require('axios');
const { getDatabase } = require('../database/init');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');
const { validateServer, validateId } = require('../middleware/validation');

const router = express.Router();

// Get all servers
router.get('/', cacheMiddleware(60), async (req, res) => {
  const db = getDatabase();
  const servers = db.prepare('SELECT * FROM servers ORDER BY order_index ASC').all();

  // Fetch live status from MCStatus.io for each server
  const serversWithStatus = await Promise.all(
    servers.map(async (server) => {
      try {
        const response = await axios.get(
          `https://api.mcstatus.io/v2/status/java/${server.ip_address}:${server.port}`,
          { timeout: 5000 }
        );

        if (response.data.online) {
          return {
            ...server,
            status: 'online',
            players_online: response.data.players?.online || 0,
            players_max: response.data.players?.max || 0,
            version: response.data.version?.name_clean || server.version,
            motd: response.data.motd?.clean || '',
            icon: response.data.icon || null
          };
        }
      } catch (error) {
        console.error(`Error fetching status for ${server.name}:`, error.message);
      }

      return {
        ...server,
        status: 'offline',
        players_online: 0
      };
    })
  );

  res.json(serversWithStatus);
});

// Get single server
router.get('/:id', cacheMiddleware(30), async (req, res) => {
  const db = getDatabase();
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);

  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  // Fetch live status
  try {
    const response = await axios.get(
      `https://api.mcstatus.io/v2/status/java/${server.ip_address}:${server.port}`,
      { timeout: 5000 }
    );

    if (response.data.online) {
      server.status = 'online';
      server.players_online = response.data.players?.online || 0;
      server.players_max = response.data.players?.max || 0;
      server.version = response.data.version?.name_clean || server.version;
      server.motd = response.data.motd?.clean || '';
      server.icon = response.data.icon || null;
      // Normalize player list to always expose a 'name' property for the UI
      const rawList = response.data.players?.list || [];
      server.player_list = rawList.map(p => ({
        name: p.name_clean || p.name_raw || p.name || 'Unknown',
        uuid: p.uuid
      }));
    }
  } catch (error) {
    console.error(`Error fetching status for ${server.name}:`, error.message);
    server.status = 'offline';
  }

  res.json(server);
});

// Create server (admin only)
router.post('/', authenticateToken, isAdmin, validateServer, (req, res) => {
  const { name, description, ip_address, port, modpack_name, bluemap_url, curseforge_url } = req.body;

  if (!name || !ip_address) {
    return res.status(400).json({ error: 'Name and IP address are required' });
  }

  const db = getDatabase();
  
  // Get max order_index
  const maxOrder = db.prepare('SELECT MAX(order_index) as max FROM servers').get();
  const newOrder = (maxOrder.max || 0) + 1;

  const stmt = db.prepare(`
    INSERT INTO servers (name, description, ip_address, port, modpack_name, bluemap_url, curseforge_url, order_index) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    name,
    description || '',
    ip_address,
    port || 25565,
    modpack_name || '',
    bluemap_url || '',
    curseforge_url || '',
    newOrder
  );

  const newServer = db.prepare('SELECT * FROM servers WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json(newServer);
});

// Update server (admin only)
router.put('/:id', authenticateToken, isAdmin, validateId, validateServer, (req, res) => {
  const { name, description, ip_address, port, modpack_name, bluemap_url, curseforge_url, order_index } = req.body;

  const db = getDatabase();
  const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);

  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }

  const stmt = db.prepare(`
    UPDATE servers 
    SET name = ?, description = ?, ip_address = ?, port = ?, 
        modpack_name = ?, bluemap_url = ?, curseforge_url = ?, 
        order_index = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    name || server.name,
    description !== undefined ? description : server.description,
    ip_address || server.ip_address,
    port !== undefined ? port : server.port,
    modpack_name !== undefined ? modpack_name : server.modpack_name,
    bluemap_url !== undefined ? bluemap_url : server.bluemap_url,
    curseforge_url !== undefined ? curseforge_url : server.curseforge_url,
    order_index !== undefined ? order_index : server.order_index,
    req.params.id
  );

  const updatedServer = db.prepare('SELECT * FROM servers WHERE id = ?').get(req.params.id);

  res.json(updatedServer);
});

// Delete server (admin only)
router.delete('/:id', authenticateToken, isAdmin, validateId, (req, res) => {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM servers WHERE id = ?');
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Server not found' });
  }

  res.json({ message: 'Server deleted successfully' });
});

module.exports = router;
