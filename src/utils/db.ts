import sql, { ConnectionPool } from 'mssql';

let connection: ConnectionPool | null = null;

export const sqlConnection = async () => {
  if (!connection) {    
    const sqlConfig = {
      user: "sa",
      password: "Komsak007.lert",
      database: "node_next",
      server: "localhost",
      options: {
        trustServerCertificate: true,
      },
    };
    connection = await sql.connect(sqlConfig);
  }

  return connection;
};