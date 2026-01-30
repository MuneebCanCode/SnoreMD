import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Construct } from 'constructs';
import * as path from 'path';

export class SnoreMdNotesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // DynamoDB Table
    // ========================================
    const notesTable = new dynamodb.Table(this, 'PatientFollowupNotesTable', {
      tableName: 'PatientFollowupNotes',
      partitionKey: {
        name: 'patientId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'noteId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // Add Global Secondary Index for querying by createdAt
    notesTable.addGlobalSecondaryIndex({
      indexName: 'CreatedAtIndex',
      partitionKey: {
        name: 'patientId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add Global Secondary Index for querying by clinic
    notesTable.addGlobalSecondaryIndex({
      indexName: 'ClinicIndex',
      partitionKey: {
        name: 'clinicId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add Global Secondary Index for querying by clinician
    notesTable.addGlobalSecondaryIndex({
      indexName: 'ClinicianIndex',
      partitionKey: {
        name: 'createdBy',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ========================================
    // Lambda Functions
    // ========================================
    const lambdaEnvironment = {
      TABLE_NAME: notesTable.tableName,
    };

    // Create Note Lambda
    const createNoteLambda = new lambda.Function(this, 'CreateNoteFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/createNote.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      description: 'Creates patient follow-up notes',
    });

    // Get Notes Lambda
    const getNotesLambda = new lambda.Function(this, 'GetNotesFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/getNotes.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      description: 'Retrieves patient follow-up notes',
    });

    // Update Note Lambda
    const updateNoteLambda = new lambda.Function(this, 'UpdateNoteFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handlers/updateNote.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      environment: lambdaEnvironment,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      description: 'Updates patient follow-up notes',
    });

    // Grant DynamoDB permissions to Lambda functions
    notesTable.grantWriteData(createNoteLambda);
    notesTable.grantReadData(getNotesLambda);
    notesTable.grantReadWriteData(updateNoteLambda);
    
    // Grant explicit permission to query the GSI
    getNotesLambda.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['dynamodb:Query'],
      resources: [
        notesTable.tableArn,
        `${notesTable.tableArn}/index/*`
      ],
    }));

    // ========================================
    // API Gateway HTTP API
    // ========================================
    const httpApi = new apigateway.HttpApi(this, 'PatientNotesApi', {
      apiName: 'SnoreMdPatientNotesApi',
      description: 'HTTP API for Snore MD Patient Notes',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'X-User-Id', 'X-Clinic-Id'],
      },
    });

    // Create Lambda integrations
    const createNoteIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'CreateNoteIntegration',
      createNoteLambda
    );

    const getNotesIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'GetNotesIntegration',
      getNotesLambda
    );

    const updateNoteIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'UpdateNoteIntegration',
      updateNoteLambda
    );

    // Add routes
    httpApi.addRoutes({
      path: '/patients/{patientId}/notes',
      methods: [apigateway.HttpMethod.POST],
      integration: createNoteIntegration,
    });

    httpApi.addRoutes({
      path: '/patients/{patientId}/notes',
      methods: [apigateway.HttpMethod.GET],
      integration: getNotesIntegration,
    });

    httpApi.addRoutes({
      path: '/patients/{patientId}/notes/{noteId}',
      methods: [apigateway.HttpMethod.PUT],
      integration: updateNoteIntegration,
    });

    // ========================================
    // Stack Outputs
    // ========================================
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: httpApi.apiEndpoint,
      description: 'API Gateway endpoint URL',
      exportName: 'SnoreMdApiUrl',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: notesTable.tableName,
      description: 'DynamoDB table name',
      exportName: 'SnoreMdTableName',
    });

    new cdk.CfnOutput(this, 'CreateNoteLambdaArn', {
      value: createNoteLambda.functionArn,
      description: 'Create Note Lambda function ARN',
      exportName: 'SnoreMdCreateNoteLambdaArn',
    });

    new cdk.CfnOutput(this, 'GetNotesLambdaArn', {
      value: getNotesLambda.functionArn,
      description: 'Get Notes Lambda function ARN',
      exportName: 'SnoreMdGetNotesLambdaArn',
    });

    new cdk.CfnOutput(this, 'UpdateNoteLambdaArn', {
      value: updateNoteLambda.functionArn,
      description: 'Update Note Lambda function ARN',
      exportName: 'SnoreMdUpdateNoteLambdaArn',
    });
  }
}
