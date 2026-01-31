import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'PatientFollowupNotes';
const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME || 'SleepStudyCounters';

async function verifyP0001Notes(): Promise<void> {
  console.log('Verifying notes for patient P0001...');
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

    console.log(`Total notes found: ${notes.length}`);
    console.log('');

    // Sort by sleepStudyId
    notes.sort((a, b) => {
      if (a.sleepStudyId && b.sleepStudyId) {
        return a.sleepStudyId.localeCompare(b.sleepStudyId);
      }
      return 0;
    });

    // Display each note
    notes.forEach((note, index) => {
      console.log(`Note ${index + 1}:`);
      console.log(`  Sleep Study ID: ${note.sleepStudyId}`);
      console.log(`  Note ID: ${note.noteId}`);
      console.log(`  Created By: ${note.createdBy}`);
      console.log(`  Created At: ${note.createdAt}`);
      console.log(`  Note Text: ${note.noteText.substring(0, 50)}...`);
      console.log('');
    });

    // Check counter value
    const getCounterCommand = new GetCommand({
      TableName: COUNTER_TABLE_NAME,
      Key: {
        patientId: patientId,
      },
    });

    const counterResult = await docClient.send(getCounterCommand);
    
    if (counterResult.Item) {
      console.log(`Current counter value: ${counterResult.Item.counter}`);
      console.log(`Next Sleep Study ID will be: P0001-S${String(counterResult.Item.counter + 1).padStart(3, '0')}`);
    } else {
      console.log('No counter found for P0001');
    }

  } catch (error) {
    console.error('Error verifying notes:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  verifyP0001Notes()
    .then(() => {
      console.log('');
      console.log('Verification complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export { verifyP0001Notes };
