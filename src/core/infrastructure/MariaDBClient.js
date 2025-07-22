import mariadb from 'mariadb';
import DatabaseClientInterface from "#src/core/database/DatabaseClientInterface.js";

export default class MariaDBClient extends DatabaseClientInterface {
  constructor(cfg) {
    super();
    this.pool = mariadb.createPool(cfg);
  }

  async query(sql, params = []) {
    const conn = await this.pool.getConnection();
    try {
      return conn.query(sql, params);
    } catch (error) {
      throw e;
    } finally {
      if (conn) conn.release();
    }
  }

  async transaction(work) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await work(conn);
      await conn.commit();
      return result;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      if (conn) conn.release();
    }
  }
}
