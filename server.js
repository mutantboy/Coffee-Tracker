const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

//db stuff
const db = new sqlite3.Database('./coffee_tracker.db', (err) => {
  if (err) {
    console.error('Err opening database:', err);
  } else {
    console.log('Connected to  db');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      coffee_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Err creating table:', err);
    } else {
      console.log('Database i ready');
    }
  });
}

//API endpoints

// GET --> Get all students
app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY name ASC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ students: rows });

    console.log(rows.map(student => student.name))
  });
});

// GET --> Get top 3 coffee drinkers
app.get('/api/leaderboard', (req, res) => {
  db.all(
    'SELECT * FROM students ORDER BY coffee_count DESC LIMIT 3',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ leaderboard: rows });
    }
  );
});

// POST --> Add a new student
app.post('/api/students', (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    res.status(400).json({ error: 'Name required' });
    return;
  }

  db.run(
    'INSERT INTO students (name) VALUES (?)',
    [name.trim()],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          res.status(400).json({ error: 'Student already exists' });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }
      res.status(201).json({
        id: this.lastID,
        name: name.trim(),
        coffee_count: 0
      });
    }
  );
});

// POST --> Increment coffee count
app.post('/api/students/:id/coffee', (req, res) => {
  const { id } = req.params;

  db.run(
    'UPDATE students SET coffee_count = coffee_count + 1 WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(row);

        console.log(`Student: ${row.name}, New Coffee Count: ${row.coffee_count}`);
      });
    }
  );
});

// DELETE--> Delete a student (did not use that in demo, for showcasing only)
app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    res.json({ message: 'Student deleted', id: parseInt(id) });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
