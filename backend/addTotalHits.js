const sequelize = require('./config/database');

async function addTotalHits() {
  try {
    console.log('Adding TotalHits column to ScoreRecord...');
    
    await sequelize.query(`
      ALTER TABLE ScoreRecord 
      ADD COLUMN IF NOT EXISTS TotalHits INT DEFAULT 0 AFTER TotalScore
    `);
    
    console.log('✓ TotalHits column added successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding TotalHits column:', error);
    process.exit(1);
  }
}

addTotalHits();
