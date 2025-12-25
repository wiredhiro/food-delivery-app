const mysql = require('mysql2/promise');

async function addColumns() {
  const connection = await mysql.createConnection({
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
  });

  try {
    // Check if columns exist
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM addresses WHERE Field IN ('name', 'phone_number')"
    );

    if (columns.length === 0) {
      // Add name column after user_id
      await connection.query(
        "ALTER TABLE addresses ADD COLUMN name VARCHAR(100) NOT NULL COMMENT '宛名' AFTER user_id"
      );
      console.log('✓ Added name column');

      // Add phone_number column after address_line2
      await connection.query(
        "ALTER TABLE addresses ADD COLUMN phone_number VARCHAR(20) NOT NULL COMMENT '電話番号' AFTER address_line2"
      );
      console.log('✓ Added phone_number column');
    } else {
      console.log('✓ Columns already exist');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addColumns();
