import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'PatientFollowupNotes';
const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME || 'SleepStudyCounters';

/**
 * Clear all data from a DynamoDB table
 */
async function clearTable(tableName: string, keySchema: string[]): Promise<number> {
  console.log(`Clearing table: ${tableName}`);
  
  try {
    let deletedCount = 0;
    let lastEvaluatedKey = undefined;

    do {
      // Scan the table
      const scanCommand: ScanCommand = new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const scanResult = await docClient.send(scanCommand);
      const items = scanResult.Items || [];

      // Delete each item
      for (const item of items) {
        const key: Record<string, any> = {};
        for (const keyName of keySchema) {
          key[keyName] = item[keyName];
        }

        const deleteCommand: DeleteCommand = new DeleteCommand({
          TableName: tableName,
          Key: key,
        });

        await docClient.send(deleteCommand);
        deletedCount++;
        
        if (deletedCount % 10 === 0) {
          console.log(`  Deleted ${deletedCount} items...`);
        }
      }

      lastEvaluatedKey = scanResult.LastEvaluatedKey as Record<string, any> | undefined;
    } while (lastEvaluatedKey);

    console.log(`  Total deleted from ${tableName}: ${deletedCount}`);
    return deletedCount;
  } catch (error) {
    console.error(`Error clearing ${tableName}:`, error);
    throw error;
  }
}

/**
 * Clear all data from both DynamoDB tables
 */
async function clearAllData(): Promise<void> {
  console.log('Starting data cleanup...');
  console.log('');

  let totalDeleted = 0;

  // Clear main notes table
  const notesDeleted = await clearTable(TABLE_NAME, ['patientId', 'noteId']);
  totalDeleted += notesDeleted;

  console.log('');

  // Clear counter table
  const countersDeleted = await clearTable(COUNTER_TABLE_NAME, ['patientId']);
  totalDeleted += countersDeleted;

  console.log('');
  console.log('Cleanup complete!');
  console.log(`Total items deleted: ${totalDeleted}`);
}

// Run cleanup if executed directly
if (require.main === module) {
  clearAllData()
    .then(() => {
      console.log('Data cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Data cleanup failed:', error);
      process.exit(1);
    });
}

export { clearAllData };
