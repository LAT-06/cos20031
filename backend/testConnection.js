const sequelize = require("./config/database");

async function test() {
  try {
    console.log("Testing database connection...");
    await sequelize.authenticate();
    console.log("✓ Connected successfully!");
    
    console.log("\nDatabase config:");
    console.log("- Host:", process.env.DB_HOST);
    console.log("- Port:", process.env.DB_PORT);
    console.log("- Database:", process.env.DB_NAME);
    console.log("- User:", process.env.DB_USER);
    
    process.exit(0);
  } catch (error) {
    console.error("✗ Connection failed:", error.message);
    process.exit(1);
  }
}

test();
