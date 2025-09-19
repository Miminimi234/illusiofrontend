const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://illusio-b9d0b-default-rtdb.firebaseio.com'
});

const db = admin.database();

async function clearDatabase() {
  try {
    console.log('🔥 Starting to clear Firebase database...');
    
    // Clear the jupiter_tokens node
    await db.ref('jupiter_tokens').remove();
    console.log('✅ Cleared jupiter_tokens data');
    
    // Clear any other data you might have
    await db.ref('tokens').remove();
    console.log('✅ Cleared tokens data');
    
    // Clear metadata
    await db.ref('metadata').remove();
    console.log('✅ Cleared metadata');
    
    console.log('🎉 Firebase database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    process.exit(0);
  }
}

clearDatabase();
