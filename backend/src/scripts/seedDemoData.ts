import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'PatientFollowupNotes';
const COUNTER_TABLE_NAME = process.env.COUNTER_TABLE_NAME || 'SleepStudyCounters';

interface SeedNote {
  patientId: string;
  noteId: string;
  noteText: string;
  sleepStudyId?: string;
  createdBy: string;
  createdAt: string;
  clinicId: string;
}

/**
 * Check if a note already exists for a patient
 */
async function noteExists(patientId: string, noteId: string): Promise<boolean> {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'patientId = :patientId AND noteId = :noteId',
      ExpressionAttributeValues: {
        ':patientId': patientId,
        ':noteId': noteId,
      },
      Limit: 1,
    });

    const result = await docClient.send(command);
    return (result.Items?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking note existence:', error);
    return false;
  }
}

/**
 * Create a single note in DynamoDB
 */
async function createNote(note: SeedNote): Promise<void> {
  try {
    // Check if note already exists (idempotency)
    const exists = await noteExists(note.patientId, note.noteId);
    if (exists) {
      console.log(`Note ${note.noteId} for patient ${note.patientId} already exists, skipping...`);
      return;
    }

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: note,
    });

    await docClient.send(command);
    console.log(`Created note ${note.noteId} for patient ${note.patientId}`);
  } catch (error) {
    console.error(`Error creating note for patient ${note.patientId}:`, error);
    throw error;
  }
}

/**
 * Initialize counter for a patient
 */
async function initializeCounter(patientId: string, count: number): Promise<void> {
  try {
    const command = new PutCommand({
      TableName: COUNTER_TABLE_NAME,
      Item: {
        patientId: patientId,
        counter: count,
      },
    });

    await docClient.send(command);
    console.log(`Initialized counter for ${patientId} to ${count}`);
  } catch (error) {
    console.error(`Error initializing counter for ${patientId}:`, error);
    throw error;
  }
}

/**
 * Generate demo data and seed DynamoDB
 * New Structure:
 * - 10 clinics (clinic-001 to clinic-010)
 * - 20 clinicians (2 per clinic)
 *   - Clinic 1: clinic-001-user-001, clinic-001-user-002
 *   - Clinic 2: clinic-002-user-001, clinic-002-user-002
 *   - etc.
 * - 40 patients (P0001 to P0040), 2 per clinician
 *   - clinic-001-user-001 → P0001, P0002
 *   - clinic-001-user-002 → P0003, P0004
 *   - clinic-002-user-001 → P0005, P0006
 *   - clinic-002-user-002 → P0007, P0008
 *   - etc.
 * - 80 notes (2 per patient)
 *   - P0001: P0001-S001, P0001-S002 (when you add 3rd note, it will be P0001-S003)
 *   - P0002: P0002-S001, P0002-S002 (when you add 3rd note, it will be P0002-S003)
 *   - etc.
 */
async function seedDemoData(): Promise<void> {
  console.log('Starting demo data seeding...');
  console.log(`Target table: ${TABLE_NAME}`);
  console.log(`Counter table: ${COUNTER_TABLE_NAME}`);

  const notes: SeedNote[] = [];
  const patientIds: string[] = [];
  let patientCounter = 1; // Global patient counter: P0001, P0002, etc.

  // Generate data for 10 clinics
  for (let clinicNum = 1; clinicNum <= 10; clinicNum++) {
    const clinicId = `clinic-${String(clinicNum).padStart(3, '0')}`; // clinic-001, clinic-002, etc.

    // Each clinic has 2 clinicians
    for (let clinicianNum = 1; clinicianNum <= 2; clinicianNum++) {
      const clinicianId = `${clinicId}-user-${String(clinicianNum).padStart(3, '0')}`; // clinic-001-user-001, etc.

      // Each clinician handles 2 patients
      for (let patientNum = 1; patientNum <= 2; patientNum++) {
        const patientId = `P${String(patientCounter).padStart(4, '0')}`; // P0001, P0002, etc.
        patientIds.push(patientId);
        patientCounter++;

        // Generate 2 notes per patient
        for (let noteNum = 1; noteNum <= 2; noteNum++) {
          const noteId = uuidv4();
          // Create notes with different timestamps (older notes first)
          const daysAgo = (patientCounter - 1) * 2 + (2 - noteNum); // Older notes have higher daysAgo
          const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
          
          // Assign Sleep Study ID: first note gets S001, second gets S002
          const sleepStudyId = `${patientId}-S${String(noteNum).padStart(3, '0')}`;

          const note: SeedNote = {
            patientId,
            noteId,
            noteText: `Follow-up note ${noteNum} for patient ${patientId}. Patient shows ${
              noteNum === 1 ? 'good progress' : 'continued improvement'
            } with sleep therapy. ${
              clinicNum % 2 === 0
                ? 'Recommend follow-up in 3 months.'
                : 'Continue current treatment plan.'
            }`,
            sleepStudyId,
            createdBy: clinicianId,
            createdAt,
            clinicId,
          };

          notes.push(note);
        }
      }
    }
  }

  console.log(`Generated ${notes.length} notes to seed`);
  console.log('Structure:');
  console.log('  - 10 clinics (clinic-001 to clinic-010)');
  console.log('  - 20 clinicians (2 per clinic)');
  console.log('  - 40 patients (P0001 to P0040, 2 per clinician)');
  console.log('  - 80 notes (2 per patient)');
  console.log('');
  console.log('Patient-Clinician-Clinic Mapping:');
  console.log('  P0001, P0002 → clinic-001-user-001 → clinic-001');
  console.log('  P0003, P0004 → clinic-001-user-002 → clinic-001');
  console.log('  P0005, P0006 → clinic-002-user-001 → clinic-002');
  console.log('  P0007, P0008 → clinic-002-user-002 → clinic-002');
  console.log('  ... and so on');
  console.log('');
  console.log('Sleep Study ID Pattern:');
  console.log('  P0001: P0001-S001, P0001-S002 (next will be P0001-S003)');
  console.log('  P0002: P0002-S001, P0002-S002 (next will be P0002-S003)');
  console.log('  ... and so on');
  console.log('');

  // Seed notes one by one
  let created = 0;
  let skipped = 0;

  for (const note of notes) {
    const exists = await noteExists(note.patientId, note.noteId);
    if (exists) {
      skipped++;
    } else {
      await createNote(note);
      created++;
    }
  }

  console.log('');
  console.log('Initializing counters for all patients...');
  
  // Initialize counters for all patients to 2 (since we created 2 notes each)
  let countersInitialized = 0;
  for (const patientId of patientIds) {
    await initializeCounter(patientId, 2);
    countersInitialized++;
  }

  console.log('');
  console.log('Seeding complete!');
  console.log(`  - Created: ${created} notes`);
  console.log(`  - Skipped: ${skipped} notes (already existed)`);
  console.log(`  - Initialized: ${countersInitialized} counters`);
  console.log('');
  console.log('Example patient IDs to try in the frontend:');
  console.log('  - P0001 (clinic-001, clinic-001-user-001)');
  console.log('  - P0005 (clinic-002, clinic-002-user-001)');
  console.log('  - P0010 (clinic-003, clinic-003-user-002)');
  console.log('');
  console.log('When you create a new note for P0001, it will get Sleep Study ID: P0001-S003');
}

// Run seeding if executed directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      console.log('Demo data seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Demo data seeding failed:', error);
      process.exit(1);
    });
}

export { seedDemoData };
