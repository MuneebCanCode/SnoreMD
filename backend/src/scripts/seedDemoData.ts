import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'PatientFollowupNotes';

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
 * Generate demo data and seed DynamoDB
 * New ID Format:
 * - Clinics: C001-C100
 * - Clinicians: M001-M100
 * - Patients: P0001-P1000
 * 
 * Structure:
 * - 10 clinics (C001-C010)
 * - 10 clinicians (M001-M010), 1 per clinic
 * - 20 patients (P0001-P0020), 2 per clinician
 * - 40 notes, 2 per patient
 */
async function seedDemoData(): Promise<void> {
  console.log('Starting demo data seeding...');
  console.log(`Target table: ${TABLE_NAME}`);

  const notes: SeedNote[] = [];
  let patientCounter = 1; // Global patient counter: P0001, P0002, etc.

  // Generate data for 10 clinics
  for (let clinicNum = 1; clinicNum <= 10; clinicNum++) {
    const clinicId = `C${String(clinicNum).padStart(3, '0')}`; // C001, C002, etc.
    const clinicianId = `M${String(clinicNum).padStart(3, '0')}`; // M001, M002, etc.

    // Generate 2 patients per clinician
    for (let patientNum = 1; patientNum <= 2; patientNum++) {
      const patientId = `P${String(patientCounter).padStart(4, '0')}`; // P0001, P0002, etc.
      patientCounter++;

      // Generate 2 notes per patient
      for (let noteNum = 1; noteNum <= 2; noteNum++) {
        const noteId = uuidv4();
        const daysAgo = (clinicNum - 1) * 2 + patientNum + noteNum;
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
        
        // Sleep Study ID will be assigned after sorting by date
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
          sleepStudyId: '', // Will be assigned after sorting
          createdBy: clinicianId,
          createdAt,
          clinicId,
        };

        notes.push(note);
      }
    }
  }

  // Sort notes by patient and creation date to assign Sleep Study IDs chronologically
  // Group notes by patient
  const notesByPatient = new Map<string, SeedNote[]>();
  for (const note of notes) {
    if (!notesByPatient.has(note.patientId)) {
      notesByPatient.set(note.patientId, []);
    }
    notesByPatient.get(note.patientId)!.push(note);
  }

  // For each patient, sort notes by createdAt (oldest first) and assign Sleep Study IDs
  for (const [patientId, patientNotes] of notesByPatient.entries()) {
    // Sort by createdAt ascending (oldest first)
    patientNotes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    // Assign Sleep Study IDs: oldest note gets S001, next gets S002, etc.
    patientNotes.forEach((note, index) => {
      note.sleepStudyId = `${patientId}-S${String(index + 1).padStart(3, '0')}`;
    });
  }

  console.log(`Generated ${notes.length} notes to seed`);
  console.log('Structure:');
  console.log('  - 10 clinics (C001 to C010)');
  console.log('  - 10 clinicians (M001 to M010, one per clinic)');
  console.log('  - 20 patients (P0001 to P0020, 2 per clinician)');
  console.log('  - 40 notes (2 per patient)');
  console.log('');
  console.log('Patient-Clinician-Clinic Mapping:');
  console.log('  P0001, P0002 → M001 → C001');
  console.log('  P0003, P0004 → M002 → C002');
  console.log('  P0005, P0006 → M003 → C003');
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
  console.log('Seeding complete!');
  console.log(`  - Created: ${created} notes`);
  console.log(`  - Skipped: ${skipped} notes (already existed)`);
  console.log('');
  console.log('Example patient IDs to try in the frontend:');
  console.log('  - P0001 (Clinic C001, Clinician M001)');
  console.log('  - P0005 (Clinic C003, Clinician M003)');
  console.log('  - P0010 (Clinic C005, Clinician M005)');
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
