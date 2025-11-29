import mysql from "mysql2/promise";

// Database configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "WJ28@krhps",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

async function testDatabase() {
  let connection;

  try {
    console.log("🔗 Testing MySQL connection...");
    console.log("Host:", dbConfig.host);
    console.log("User:", dbConfig.user);
    console.log("Password:", "*".repeat(dbConfig.password.length));

    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL successfully!");

    const [rows] = await connection.execute("SELECT VERSION() as version");
    console.log("📊 MySQL Version:", rows[0].version);

    const [databases] = await connection.execute("SHOW DATABASES");
    const hasDB = databases.some((db) => db.Database === "campuseats");
    console.log("🗄️ CampusEats database exists:", hasDB ? "✅ Yes" : "❌ No");

    if (hasDB) {
      await connection.execute("USE campuseats");
      const [tables] = await connection.execute("SHOW TABLES");
      console.log("📋 Tables in database:", tables.length);
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${Object.values(table)[0]}`);
      });

      for (const table of tables) {
        const tableName = Object.values(table)[0];
        try {
          const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`📊 ${tableName}: ${count[0].count} records`);
        } catch (error) {
          console.log(`❌ Error counting ${tableName}:`, error.message);
        }
      }
    }

    console.log("\n🎉 Database test completed successfully!");
  } catch (error) {
    console.error("❌ Database test failed:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("\n💡 Solutions:");
      console.error("1. Check username and password");
      console.error("2. Make sure MySQL server is running");
      console.error("3. Verify user has proper permissions");
    } else if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Solutions:");
      console.error("1. Start MySQL server");
      console.error("2. Check if MySQL is running on port 3306");
      console.error("3. Verify firewall settings");
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Connection closed");
    }
  }
}

testDatabase();
