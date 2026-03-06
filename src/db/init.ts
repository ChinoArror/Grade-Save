export async function ensureTables(db: D1Database) {
    // Users table
    await db.prepare(
        'CREATE TABLE IF NOT EXISTS users (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'uuid TEXT NOT NULL UNIQUE,' +
        'user_id INTEGER,' +
        'name TEXT,' +
        'username TEXT,' +
        'token TEXT,' +
        'first_seen TEXT NOT NULL,' +
        'last_seen TEXT NOT NULL' +
        ')'
    ).run();

    // Subjects table
    await db.prepare(
        'CREATE TABLE IF NOT EXISTS subjects (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'user_uuid TEXT NOT NULL,' +
        'name TEXT NOT NULL,' +
        'created_at INTEGER NOT NULL,' +
        'FOREIGN KEY(user_uuid) REFERENCES users(uuid)' +
        ')'
    ).run();

    // Categories table
    await db.prepare(
        'CREATE TABLE IF NOT EXISTS categories (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'user_uuid TEXT NOT NULL,' +
        'name TEXT NOT NULL,' +
        'subject_id INTEGER NOT NULL,' +
        'created_at INTEGER NOT NULL,' +
        'FOREIGN KEY(user_uuid) REFERENCES users(uuid),' +
        'FOREIGN KEY(subject_id) REFERENCES subjects(id)' +
        ')'
    ).run();

    // Records table
    await db.prepare(
        'CREATE TABLE IF NOT EXISTS records (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'user_uuid TEXT NOT NULL,' +
        'date INTEGER NOT NULL,' +
        'subject_id INTEGER NOT NULL,' +
        'category_id INTEGER NOT NULL,' +
        'is_assigned_grading INTEGER NOT NULL DEFAULT 0,' +
        'score REAL,' +
        'raw_score REAL,' +
        'assigned_score REAL,' +
        'class_rank INTEGER,' +
        'grade_rank INTEGER,' +
        'reflection TEXT,' +
        'peer_scores TEXT,' +
        'FOREIGN KEY(user_uuid) REFERENCES users(uuid),' +
        'FOREIGN KEY(subject_id) REFERENCES subjects(id),' +
        'FOREIGN KEY(category_id) REFERENCES categories(id)' +
        ')'
    ).run();
}
