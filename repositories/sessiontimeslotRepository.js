const pool = require("../config/db");

class SessionTimeslotRepository {
  async create(sessionTimeslotData) {
    const { SessionID, TimeslotID } = sessionTimeslotData;

    const query = `
      INSERT INTO sessiontimeslot (SessionID, TimeslotID)
      VALUES (?, ?)
    `;

    const [result] = await pool.execute(query, [SessionID, TimeslotID]);

    return { sessiontimeslotID: result.insertId, ...sessionTimeslotData };
  }

  async findById(id) {
    const query = `
      SELECT 
        st.*,
        s.Title as sessionTitle,
        t.Date,
        t.StartTime,
        t.EndTime,
        t.Location
      FROM sessiontimeslot st
      LEFT JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      WHERE st.sessiontimeslotID = ?
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  }

  async findBySessionId(sessionId) {
    const query = `
      SELECT 
        st.*,
        t.Date,
        t.StartTime,
        t.EndTime,
        t.Location
      FROM sessiontimeslot st
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      WHERE st.SessionID = ?
      ORDER BY t.Date ASC, t.StartTime ASC
    `;

    const [rows] = await pool.execute(query, [sessionId]);
    return rows;
  }

  async findByTimeslotId(timeslotId) {
    const query = `
      SELECT 
        st.*,
        s.Title as sessionTitle
      FROM sessiontimeslot st
      LEFT JOIN session s ON st.SessionID = s.SessionID
      WHERE st.TimeslotID = ?
    `;

    const [rows] = await pool.execute(query, [timeslotId]);
    return rows;
  }

  async findAll() {
    const query = `
      SELECT 
        st.*,
        s.Title as sessionTitle,
        t.Date,
        t.StartTime,
        t.EndTime,
        t.Location
      FROM sessiontimeslot st
      LEFT JOIN session s ON st.SessionID = s.SessionID
      LEFT JOIN timeslot t ON st.TimeslotID = t.TimeslotID
      ORDER BY t.Date ASC, t.StartTime ASC
    `;

    const [rows] = await pool.execute(query);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields.map((field) => `${field} = ?`).join(", ");

    const query = `UPDATE sessiontimeslot SET ${setClause} WHERE sessiontimeslotID = ?`;
    const [result] = await pool.execute(query, [...values, id]);

    if (result.affectedRows === 0) return null;

    return await this.findById(id);
  }

  async delete(id) {
    const query = `DELETE FROM sessiontimeslot WHERE sessiontimeslotID = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }

  async exists(id) {
    const query = `SELECT 1 FROM sessiontimeslot WHERE sessiontimeslotID = ?`;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0;
  }

  async deleteBySessionId(sessionId) {
    const query = `DELETE FROM sessiontimeslot WHERE SessionID = ?`;
    const [result] = await pool.execute(query, [sessionId]);
    return result.affectedRows;
  }

  async checkSessionTimeslotExists(sessionId, timeslotId) {
    const query = `SELECT 1 FROM sessiontimeslot WHERE SessionID = ? AND TimeslotID = ?`;
    const [rows] = await db.query(query, [sessionId, timeslotId]);
    return rows.length > 0;
  }
}

module.exports = new SessionTimeslotRepository();
