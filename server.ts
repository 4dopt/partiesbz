import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type { SavedBooking } from './src/types/booking';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readBookings(): SavedBooking[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBookings(bookings: SavedBooking[]) {
  ensureStorage();
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/bookings', (_req, res) => {
    const bookings = readBookings();
    res.json(bookings);
  });

  app.get('/api/bookings/:id', (req, res) => {
    const bookings = readBookings();
    const found = bookings.find((b) => b.id === req.params.id);
    if (!found) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(found);
  });

  app.post('/api/bookings', (req, res) => {
    const payload = req.body as Partial<SavedBooking>;
    if (!payload?.details?.name || !payload?.selection) {
      res.status(400).json({ error: 'Invalid booking payload' });
      return;
    }

    const totalGuests =
      Math.max(0, Number(payload.details.adults) || 0) +
      Math.max(0, Number(payload.details.kids) || 0);
    if (totalGuests < 45) {
      res.status(400).json({
        error: `A minimum of 45 guests (adults and kids combined) is required to book. Currently entered: ${totalGuests}.`,
      });
      return;
    }

    const areaNormalized = (payload.details.area || '').trim().toLowerCase();
    const hallCapacityMap: Record<string, { name: string; max: number }> = {
      'fairway hall': { name: 'Fairway Hall', max: 60 },
      fairway: { name: 'Fairway Hall', max: 60 },
      'anthem bar': { name: 'Anthem Bar', max: 80 },
      anthem: { name: 'Anthem Bar', max: 80 },
      'bunker bar hall': { name: 'Bunker Bar Hall', max: 120 },
    };
    const matchedHall = hallCapacityMap[areaNormalized];
    if (totalGuests > 120) {
      res.status(400).json({
        error: `Maximum venue hall capacity is 120 guests (Bunker Bar Hall). Currently entered: ${totalGuests}.`,
      });
      return;
    }
    if (matchedHall && totalGuests > matchedHall.max) {
      res.status(400).json({
        error: `${matchedHall.name} holds a maximum of ${matchedHall.max} guests. Please select a larger hall for ${totalGuests} guests.`,
      });
      return;
    }

    const bookings = readBookings();
    const datePart = (payload.details.eventDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const id = payload.id || `BZ-${datePart}-${suffix}`;

    const newBooking: SavedBooking = {
      id,
      createdAt: new Date().toISOString(),
      status: payload.status || 'Locked & Submitted',
      details: payload.details,
      selection: payload.selection,
    };

    const existingIdx = bookings.findIndex((b) => b.id === id);
    if (existingIdx >= 0) {
      bookings[existingIdx] = newBooking;
    } else {
      bookings.unshift(newBooking);
    }

    writeBookings(bookings);
    res.status(201).json(newBooking);
  });

  app.patch('/api/bookings/:id', (req, res) => {
    const bookings = readBookings();
    const idx = bookings.findIndex((b) => b.id === req.params.id);
    if (idx < 0) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    bookings[idx] = {
      ...bookings[idx],
      ...req.body,
      id: bookings[idx].id,
    };
    writeBookings(bookings);
    res.json(bookings[idx]);
  });

  app.delete('/api/bookings/:id', (req, res) => {
    const bookings = readBookings();
    const filtered = bookings.filter((b) => b.id === req.params.id ? false : true);
    writeBookings(filtered);
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
