const sequelize = require('./config/database');

async function checkSchema() {
  try {
    console.log('Checking ScoreRecord schema...');
    
    const [results] = await sequelize.query(
      `DESCRIBE ScoreRecord`,
      { raw: true, type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\nScoreRecord columns:');
    console.log(results);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error.message);
    process.exit(1);
  }
}

checkSchema();
