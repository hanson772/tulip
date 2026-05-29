const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");
const log = require("./logger");

const DB_PATH = path.join(
  process.env.DB_PATH || path.join(__dirname, "..", "..", "data"),
  "tulip.db",
);

let db;

function getDb() {
  if (!db) {
    const dir = path.dirname(DB_PATH);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Add avatar column if not exists (migration for existing databases)
    try {
      db.exec("ALTER TABLE users ADD COLUMN avatar TEXT");
    } catch (_) {
      // Column already exists
    }
    try {
      db.exec("ALTER TABLE users ADD COLUMN nickname TEXT");
    } catch (_) {
      // Column already exists
    }
    try {
      db.exec("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1");
    } catch (_) {
      // Column already exists
    }
    try {
      db.exec("ALTER TABLE users ADD COLUMN disabled INTEGER DEFAULT 0");
    } catch (_) {
      // Column already exists
    }
    try {
      db.exec("ALTER TABLE users ADD COLUMN muted INTEGER DEFAULT 0");
    } catch (_) {
      // Column already exists
    }

    // Topics table
    db.exec(`
      CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    db.exec("CREATE INDEX IF NOT EXISTS idx_topics_user_id ON topics(user_id)");

    // Opinions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS opinions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        visible INTEGER DEFAULT 1,
        selectable INTEGER DEFAULT 1,
        support_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_opinions_topic_id ON opinions(topic_id)",
    );

    // Migration: add new columns to opinions if not exist
    try {
      db.exec("ALTER TABLE opinions ADD COLUMN visible INTEGER DEFAULT 1");
    } catch (_) {}
    try {
      db.exec("ALTER TABLE opinions ADD COLUMN selectable INTEGER DEFAULT 1");
    } catch (_) {}
    try {
      db.exec(
        "ALTER TABLE opinions ADD COLUMN support_count INTEGER DEFAULT 0",
      );
    } catch (_) {}

    // Migration: add status column to topics
    try {
      db.exec('ALTER TABLE topics ADD COLUMN status TEXT DEFAULT "draft"');
    } catch (_) {}
    db.prepare(
      "UPDATE topics SET status = 'published' WHERE status IS NULL",
    ).run();

    // Migration: add deadline column to topics
    try {
      db.exec("ALTER TABLE topics ADD COLUMN deadline TEXT");
    } catch (_) {}

    // Tags table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    // Topic-Tags junction table
    db.exec(`
      CREATE TABLE IF NOT EXISTS topic_tags (
        topic_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (topic_id, tag_id),
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_topic_tags_topic_id ON topic_tags(topic_id)",
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_topic_tags_tag_id ON topic_tags(tag_id)",
    );

    // Supports table - one support per user per topic
    db.exec(`
      CREATE TABLE IF NOT EXISTS supports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        topic_id INTEGER NOT NULL,
        opinion_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, topic_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        FOREIGN KEY (opinion_id) REFERENCES opinions(id) ON DELETE CASCADE
      )
    `);
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_supports_topic_id ON supports(topic_id)",
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_supports_user_id ON supports(user_id)",
    );

    // Comments table
    db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_comments_topic_id ON comments(topic_id)",
    );

    // Migration: add parent_id and reply_to_user_id for reply-to-comment feature
    try {
      db.exec("ALTER TABLE comments ADD COLUMN parent_id INTEGER DEFAULT NULL");
    } catch (_) {}
    try {
      db.exec(
        "ALTER TABLE comments ADD COLUMN reply_to_user_id INTEGER DEFAULT NULL",
      );
    } catch (_) {}
    try {
      db.exec(
        "CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)",
      );
    } catch (_) {}

    // Favorites table
    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        topic_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, topic_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
      )
    `);
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)",
    );
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_favorites_topic_id ON favorites(topic_id)",
    );

    // Roles table
    db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // User-Roles junction table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      )
    `);

    // Seed default roles
    const insertRole = db.prepare(
      "INSERT OR IGNORE INTO roles (name, description) VALUES (?, ?)",
    );
    insertRole.run("user", "普通用户");
    insertRole.run("admin", "管理员");
  }
  return db;
}

module.exports = { getDb };
