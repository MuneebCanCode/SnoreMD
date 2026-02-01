# Snore MD Patient Follow-Up Notes System

A full-stack serverless application for managing patient follow-up notes after sleep studies.

## Tech Stack

- **Frontend:** React with TypeScript
- **Backend:** Node.js/TypeScript + AWS Lambda
- **API:** Amazon API Gateway (HTTP API)
- **Database:** Amazon DynamoDB
- **Infrastructure:** AWS CDK (TypeScript)

## Project Structure

```
snoremd-patient-notes/
├── backend/          # Lambda functions and services
├── frontend/         # React application
├── infra/           # AWS CDK infrastructure
└── README.md
```

## Prerequisites

- Node.js 18+
- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install infrastructure dependencies
cd infra
npm install
cd ..
```

### 2. Build Backend

```bash
cd backend
npm run build
cd ..
```

### 3. Deploy Infrastructure to AWS

```bash
cd infra

# First time only - bootstrap CDK
npx cdk bootstrap

# Deploy the stack
npx cdk deploy

# Note the outputs:
# - ApiGatewayUrl: Your API endpoint
# - DynamoDBTableName: Your table name
cd ..
```

**Important:** Copy the `ApiGatewayUrl` from the deployment output. You'll need it for the next steps.

### 4. Seed Demo Data

```bash
cd backend

# Set the table name (use the value from CDK output or default)
export TABLE_NAME=PatientFollowupNotes

# Run the seeding script
npm run seed

cd ..
```

### 5. Configure Frontend

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
echo "REACT_APP_API_URL=<YOUR_API_GATEWAY_URL>" > .env
cd ..
```

Replace `<YOUR_API_GATEWAY_URL>` with the URL from step 3 (without trailing slash).

Example:
```
REACT_APP_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com
```

### 6. Start Frontend

```bash
cd frontend
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Quick Test

After deployment and seeding:

1. Open the frontend in your browser
2. The default patient ID is `patient-001` (no notes yet)
3. Try these seeded patient IDs:
   - `clinic-001-patient-01`
   - `clinic-001-patient-02`
   - `clinic-005-patient-01`
4. Create a new note for any patient
5. Verify the note appears in the list

## Development

- **Run backend tests:** `npm run test:backend`
- **Run frontend tests:** `npm run test:frontend`
- **Build all:** `npm run build:backend && npm run build:frontend`

## API Documentation

See individual component READMEs for detailed API documentation.

## License

ISC


## Demo Data

The system includes a seeding script that creates realistic demo data:

- **10 clinics:** clinic-001 through clinic-010
- **10 clinicians:** user-001 through user-010 (one per clinic)
- **20 patients:** 2 per clinic (e.g., clinic-001-patient-01, clinic-001-patient-02)
- **40 notes:** 2 per patient

### Example Patient IDs to Try

After seeding, you can view notes for these patients in the frontend:
- `clinic-001-patient-01`
- `clinic-001-patient-02`
- `clinic-005-patient-01`

### Running the Seeding Script

```bash
cd backend
export TABLE_NAME=PatientFollowupNotes
npm run seed
```

The script is idempotent - running it multiple times won't create duplicates.

## API Documentation

### Authentication

The system uses header-based authentication (stubbed for development):
- `x-user-id`: User identifier (defaults to "user-001")
- `x-clinic-id`: Clinic identifier (defaults to "clinic-001")

In production, this would be replaced with Amazon Cognito JWT validation.

### Endpoints

#### Create Note
```
POST /patients/{patientId}/notes
Headers:
  Content-Type: application/json
  x-user-id: user-001
  x-clinic-id: clinic-001

Body:
{
  "noteText": "Patient follow-up note text",
  "sleepStudyId": "study-123",  // optional
  "visibility": "internal"       // optional, default: "internal"
}

Response (201):
{
  "patientId": "patient-001",
  "noteId": "uuid",
  "noteText": "Patient follow-up note text",
  "sleepStudyId": "study-123",
  "visibility": "internal",
  "createdBy": "user-001",
  "createdAt": "2024-01-29T12:00:00.000Z",
  "clinicId": "clinic-001"
}
```

#### Get Notes
```
GET /patients/{patientId}/notes?limit=20&cursor=<cursor>

Response (200):
{
  "notes": [
    {
      "patientId": "patient-001",
      "noteId": "uuid",
      "noteText": "Patient follow-up note text",
      "sleepStudyId": "study-123",
      "visibility": "internal",
      "createdBy": "user-001",
      "createdAt": "2024-01-29T12:00:00.000Z",
      "clinicId": "clinic-001"
    }
  ],
  "nextCursor": "base64-encoded-cursor"  // present if more results available
}
```

## Architecture

### System Components

- **Frontend:** React SPA with TypeScript
- **API Gateway:** HTTP API routing requests to Lambda functions
- **Lambda Functions:**
  - `CreateNoteFunction`: Handles POST requests to create notes
  - `GetNotesFunction`: Handles GET requests to retrieve notes
- **DynamoDB:** NoSQL database with GSI for efficient querying
- **CDK:** Infrastructure as code for deployment

### DynamoDB Schema

**Table:** PatientFollowupNotes
- **Partition Key:** patientId (String)
- **Sort Key:** noteId (String)
- **GSI:** CreatedAtIndex
  - Partition Key: patientId
  - Sort Key: createdAt
  - Enables querying notes sorted by creation date

## Assumptions and Limitations

### Current Implementation
- Authentication is stubbed with header-based user/clinic identification
- CORS is enabled for all origins (development only)
- DynamoDB table has `DESTROY` removal policy (development only)
- No rate limiting or throttling
- No data validation beyond basic input checks

### Production Considerations
- Replace header-based auth with Amazon Cognito JWT validation
- Restrict CORS to specific origins
- Change DynamoDB removal policy to `RETAIN`
- Add API Gateway throttling and rate limiting
- Implement comprehensive logging and monitoring
- Add data encryption in transit and at rest
- Implement backup and disaster recovery procedures
- Add CloudWatch alarms for errors and performance
