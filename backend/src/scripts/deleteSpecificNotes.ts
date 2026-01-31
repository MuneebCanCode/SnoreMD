import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'PatientFollowupNotes';

/**
 * Delete specific notes for patient P0001 (3rd and 4th notes with Sleep Study IDs S003 and S004)
 */
async function deleteSpecificNotes(): Promise<void> {
  console.log('Deleting 3rd and 4th notes for patient P0001...');
  console.log(`Target table: ${TABLE_NAME}`);
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

    // Filter notes with Sleep Study IDs S003 and S004
    const notesToDelete = notes.filter(
      (note) => note.sleepStudyId === 'P0001-S003' || note.sleepStudyId === 'P0001-S004'
    );

    console.log(`Notes to delete: ${notesToDelete.length}`);
    console.log('');

    if (notesToDelete.length === 0) {
      console.log('No notes found with Sleep Study IDs P0001-S003 or P0001-S004');
      return;
    }

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
    console.log('Deletion complete!');
    console.log(`Total notes deleted: ${notesToDelete.length}`);
  } catch (error) {
    console.error('Error deleting notes:', error);
    throw error;
  }
}

// Run deletion if executed directly
if (require.main === module) {
  deleteSpecificNotes()
    .then(() => {
      console.log('Note deletion completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Note deletion failed:', error);
      process.exit(1);
    });
}

export { deleteSpecificNotes };
