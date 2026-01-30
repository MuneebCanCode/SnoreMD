import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'PatientFollowupNotes';

/**
 * Clear all data from DynamoDB table
 */
async function clearAllData(): Promise<void> {
  console.log('Starting data cleanup...');
  console.log(`Target table: ${TABLE_NAME}`);
  console.log('');

  try {
    let deletedCount = 0;
    let lastEvaluatedKey = undefined;

    do {
      // Scan the table
      const scanCommand: ScanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
      });

      const scanResult = await docClient.send(scanCommand);
      const items = scanResult.Items || [];

      // Delete each item
      for (const item of items) {
        const deleteCommand: DeleteCommand = new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            patientId: item.patientId,
            noteId: item.noteId,
          },
        });

        await docClient.send(deleteCommand);
        deletedCount++;
        
        if (deletedCount % 10 === 0) {
          console.log(`Deleted ${deletedCount} items...`);
        }
      }

      lastEvaluatedKey = scanResult.LastEvaluatedKey as Record<string, any> | undefined;
    } while (lastEvaluatedKey);

    console.log('');
    console.log('Cleanup complete!');
    console.log(`Total items deleted: ${deletedCount}`);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
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
