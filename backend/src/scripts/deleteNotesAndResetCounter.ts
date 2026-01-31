import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'PatientFollowupNotes';
const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME || 'SleepStudyCounters';

/**
 * Delete notes P0001-S005 and P0001-S006, then reset counter to 2
 */
async function deleteNotesAndResetCounter(): Promise<void> {
  console.log('Deleting notes P0001-S007 and P0001-S008 for patient P0001...');
  console.log(`Target table: ${TABLE_NAME}`);
  console.log(`Counter table: ${COUNTER_TABLE_NAME}`);
  console.log('');

  const patientId = 'P0001';

  try {
    // Query all notes for P0001
    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'patientId = :patientId',
      ExpressionAttributeValues: {
        ':patientId': patientId,
      },
    });

    const result = await docClient.send(queryCommand);
    const notes = result.Items || [];

    console.log(`Found ${notes.length} notes for patient ${patientId}`);

    // Filter notes with Sleep Study IDs S007 and S008
    const notesToDelete = notes.filter(
      (note) => note.sleepStudyId === 'P0001-S007' || note.sleepStudyId === 'P0001-S008'
    );

    console.log(`Notes to delete: ${notesToDelete.length}`);
    console.log('');

    if (notesToDelete.length === 0) {
      console.log('No notes found with Sleep Study IDs P0001-S007 or P0001-S008');
    } else {
      // Delete each note
      for (const note of notesToDelete) {
        console.log(`Deleting note: ${note.sleepStudyId} (noteId: ${note.noteId})`);
        
        const deleteCommand = new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            patientId: note.patientId,
            noteId: note.noteId,
          },
        });

        await docClient.send(deleteCommand);
        console.log(`  ✓ Deleted successfully`);
      }

      console.log('');
      console.log(`Total notes deleted: ${notesToDelete.length}`);
    }

    // Reset counter to 2 (so next note will be S003)
    console.log('');
    console.log('Resetting counter for P0001 to 2...');
    
    const updateCounterCommand = new UpdateCommand({
      TableName: COUNTER_TABLE_NAME,
      Key: {
        patientId: patientId,
      },
      UpdateExpression: 'SET currentCounter = :newCounter',
      ExpressionAttributeValues: {
        ':newCounter': 2,
      },
    });

    await docClient.send(updateCounterCommand);
    console.log('  ✓ Counter reset to 2 (next note will be P0001-S003)');

    console.log('');
    console.log('Operation complete!');
  } catch (error) {
    console.error('Error during operation:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  deleteNotesAndResetCounter()
    .then(() => {
      console.log('Operation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Operation failed:', error);
      process.exit(1);
    });
}

export { deleteNotesAndResetCounter };
