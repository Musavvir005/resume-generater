require("dotenv").config();
const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "resume-generator-secret-key-123456";
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, "database.db");

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many login/registration attempts from this IP, please try again after 15 minutes." }
});

// Middleware
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend static assets directly!

// Database Initialization
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to SQLite database at:", DB_PATH);
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // Create profiles table to store full resume form data as JSON
    db.run(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        profile_data TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
  });
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token is missing." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token is invalid or expired." });
    }
    req.user = user;
    next();
  });
}

// API Routes

// 1. User Registration
app.post("/api/auth/register", authLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters long." });
  }
  if (password.length < 5) {
    return res.status(400).json({ error: "Password must be at least 5 characters long." });
  }

  // Check if username already exists
  db.get("SELECT id FROM users WHERE username = ?", [trimmedUsername], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database query error." });
    }
    if (row) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    // Hash password and store user
    bcrypt.hash(password, 10, (hashErr, hash) => {
      if (hashErr) {
        return res.status(500).json({ error: "Password hashing failed." });
      }

      db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [trimmedUsername, hash],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: "Failed to create user account." });
          }
          res.status(201).json({ message: "Registration successful! You can now log in." });
        }
      );
    });
  });
});

// 2. User Login
app.post("/api/auth/login", authLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  db.get("SELECT * FROM users WHERE username = ?", [username.trim()], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Database query error." });
    }
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    bcrypt.compare(password, user.password, (compErr, isMatch) => {
      if (compErr) {
        return res.status(500).json({ error: "Password verification failed." });
      }
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid username or password." });
      }

      // Generate JWT
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        token,
        username: user.username,
        message: "Login successful!",
      });
    });
  });
});

// 3. Fetch User Profile Data
app.get("/api/profile", authenticateToken, (req, res) => {
  db.get("SELECT profile_data FROM profiles WHERE user_id = ?", [req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Failed to query profile database." });
    }
    if (!row) {
      return res.json({ profile: null });
    }

    try {
      const profile = JSON.parse(row.profile_data);
      res.json({ profile });
    } catch (parseErr) {
      res.status(500).json({ error: "Failed to parse saved profile data." });
    }
  });
});

// 4. Save/Update User Profile Data
app.post("/api/profile", authenticateToken, (req, res) => {
  const { profile } = req.body;

  if (!profile) {
    return res.status(400).json({ error: "Profile details payload is missing." });
  }

  const profileString = JSON.stringify(profile);

  // Use SQLite UPSERT pattern (supported in newer versions) or simple REPLACE/check logic
  db.get("SELECT id FROM profiles WHERE user_id = ?", [req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database check failed." });
    }

    if (row) {
      // Update existing profile
      db.run(
        "UPDATE profiles SET profile_data = ? WHERE user_id = ?",
        [profileString, req.user.id],
        function (updateErr) {
          if (updateErr) {
            return res.status(500).json({ error: "Failed to update profile details." });
          }
          res.json({ message: "Profile saved successfully to SQLite database." });
        }
      );
    } else {
      // Insert new profile
      db.run(
        "INSERT INTO profiles (user_id, profile_data) VALUES (?, ?)",
        [req.user.id, profileString],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ error: "Failed to save profile details." });
          }
          res.json({ message: "Profile created and saved successfully to SQLite database." });
        }
      );
    }
  });
});

// Fallback to index.html for UI client-side rendering
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Full-stack server active at http://localhost:${PORT}`);
  console.log(`📁 Local SQLite Database location: ${DB_PATH}`);
  console.log(`======================================================\n`);
});
