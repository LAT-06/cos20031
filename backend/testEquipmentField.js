const { Round } = require('./models');

async function testEquipment() {
  try {
    console.log('Testing Equipment field...\n');
    
    // Test create with equipment
    const testRound = await Round.create({
      Name: 'Test Equipment Round',
      Description: 'Testing equipment field',
      Equipment: 'Recurve'
    });
    
    console.log('✅ Created round with Equipment:', testRound.toJSON());
    
    // Test find with equipment
    const found = await Round.findByPk(testRound.RoundID);
    console.log('\n✅ Found round Equipment:', found.Equipment);
    
    // Test update equipment
    found.Equipment = 'Compound';
    await found.save();
    console.log('\n✅ Updated Equipment to:', found.Equipment);
    
    // Cleanup
    await found.destroy();
    console.log('\n✅ Test round deleted');
    
    console.log('\n🎯 Equipment field is working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testEquipment();
