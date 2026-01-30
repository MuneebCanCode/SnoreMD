"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnoreMdNotesStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const apigatewayIntegrations = __importStar(require("aws-cdk-lib/aws-apigatewayv2-integrations"));
const path = __importStar(require("path"));
class SnoreMdNotesStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        // Grant DynamoDB permissions to Lambda functions
        notesTable.grantWriteData(createNoteLambda);
        notesTable.grantReadData(getNotesLambda);
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
                    apigateway.CorsHttpMethod.OPTIONS,
                ],
                allowHeaders: ['Content-Type', 'X-User-Id', 'X-Clinic-Id'],
            },
        });
        // Create Lambda integrations
        const createNoteIntegration = new apigatewayIntegrations.HttpLambdaIntegration('CreateNoteIntegration', createNoteLambda);
        const getNotesIntegration = new apigatewayIntegrations.HttpLambdaIntegration('GetNotesIntegration', getNotesLambda);
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
    }
}
exports.SnoreMdNotesStack = SnoreMdNotesStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmEtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsbUVBQXFEO0FBQ3JELCtEQUFpRDtBQUNqRCx5RUFBMkQ7QUFDM0Qsa0dBQW9GO0FBRXBGLDJDQUE2QjtBQUU3QixNQUFhLGlCQUFrQixTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzlDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsMkNBQTJDO1FBQzNDLGlCQUFpQjtRQUNqQiwyQ0FBMkM7UUFDM0MsTUFBTSxVQUFVLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSwyQkFBMkIsRUFBRTtZQUN2RSxTQUFTLEVBQUUsc0JBQXNCO1lBQ2pDLFlBQVksRUFBRTtnQkFDWixJQUFJLEVBQUUsV0FBVztnQkFDakIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNwQztZQUNELE9BQU8sRUFBRTtnQkFDUCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUNqRCxVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXO1lBQ2hELG1CQUFtQixFQUFFLElBQUk7WUFDekIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLHVCQUF1QjtTQUNsRSxDQUFDLENBQUM7UUFFSCx1REFBdUQ7UUFDdkQsVUFBVSxDQUFDLHVCQUF1QixDQUFDO1lBQ2pDLFNBQVMsRUFBRSxnQkFBZ0I7WUFDM0IsWUFBWSxFQUFFO2dCQUNa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ZGstbGliJztcclxuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcclxuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djInO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5SW50ZWdyYXRpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5djItaW50ZWdyYXRpb25zJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5leHBvcnQgY2xhc3MgU25vcmVNZE5vdGVzU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIER5bmFtb0RCIFRhYmxlXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBub3Rlc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdQYXRpZW50Rm9sbG93dXBOb3Rlc1RhYmxlJywge1xyXG4gICAgICB0YWJsZU5hbWU6ICdQYXRpZW50Rm9sbG93dXBOb3RlcycsXHJcbiAgICAgIHBhcnRpdGlvbktleToge1xyXG4gICAgICAgIG5hbWU6ICdwYXRpZW50SWQnLFxyXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxyXG4gICAgICB9LFxyXG4gICAgICBzb3J0S2V5OiB7XHJcbiAgICAgICAgbmFtZTogJ25vdGVJZCcsXHJcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXHJcbiAgICAgIH0sXHJcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXHJcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5BV1NfTUFOQUdFRCxcclxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcclxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRldmVsb3BtZW50IG9ubHlcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCBHbG9iYWwgU2Vjb25kYXJ5IEluZGV4IGZvciBxdWVyeWluZyBieSBjcmVhdGVkQXRcclxuICAgIG5vdGVzVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xyXG4gICAgICBpbmRleE5hbWU6ICdDcmVhdGVkQXRJbmRleCcsXHJcbiAgICAgIHBhcnRpdGlvbktleToge1xyXG4gICAgICAgIG5hbWU6ICdwYXRpZW50SWQnLFxyXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxyXG4gICAgICB9LFxyXG4gICAgICBzb3J0S2V5OiB7XHJcbiAgICAgICAgbmFtZTogJ2NyZWF0ZWRBdCcsXHJcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXHJcbiAgICAgIH0sXHJcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBMYW1iZGEgRnVuY3Rpb25zXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBsYW1iZGFFbnZpcm9ubWVudCA9IHtcclxuICAgICAgVEFCTEVfTkFNRTogbm90ZXNUYWJsZS50YWJsZU5hbWUsXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIENyZWF0ZSBOb3RlIExhbWJkYVxyXG4gICAgY29uc3QgY3JlYXRlTm90ZUxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0NyZWF0ZU5vdGVGdW5jdGlvbicsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVycy9jcmVhdGVOb3RlLmhhbmRsZXInLFxyXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2JhY2tlbmQvZGlzdCcpKSxcclxuICAgICAgZW52aXJvbm1lbnQ6IGxhbWJkYUVudmlyb25tZW50LFxyXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXHJcbiAgICAgIG1lbW9yeVNpemU6IDI1NixcclxuICAgICAgZGVzY3JpcHRpb246ICdDcmVhdGVzIHBhdGllbnQgZm9sbG93LXVwIG5vdGVzJyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEdldCBOb3RlcyBMYW1iZGFcclxuICAgIGNvbnN0IGdldE5vdGVzTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnR2V0Tm90ZXNGdW5jdGlvbicsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVycy9nZXROb3Rlcy5oYW5kbGVyJyxcclxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi8uLi9iYWNrZW5kL2Rpc3QnKSksXHJcbiAgICAgIGVudmlyb25tZW50OiBsYW1iZGFFbnZpcm9ubWVudCxcclxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxyXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnUmV0cmlldmVzIHBhdGllbnQgZm9sbG93LXVwIG5vdGVzJyxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEdyYW50IER5bmFtb0RCIHBlcm1pc3Npb25zIHRvIExhbWJkYSBmdW5jdGlvbnNcclxuICAgIG5vdGVzVGFibGUuZ3JhbnRXcml0ZURhdGEoY3JlYXRlTm90ZUxhbWJkYSk7XHJcbiAgICBub3Rlc1RhYmxlLmdyYW50UmVhZERhdGEoZ2V0Tm90ZXNMYW1iZGEpO1xyXG5cclxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuICAgIC8vIEFQSSBHYXRld2F5IEhUVFAgQVBJXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBjb25zdCBodHRwQXBpID0gbmV3IGFwaWdhdGV3YXkuSHR0cEFwaSh0aGlzLCAnUGF0aWVudE5vdGVzQXBpJywge1xyXG4gICAgICBhcGlOYW1lOiAnU25vcmVNZFBhdGllbnROb3Rlc0FwaScsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnSFRUUCBBUEkgZm9yIFNub3JlIE1EIFBhdGllbnQgTm90ZXMnLFxyXG4gICAgICBjb3JzUHJlZmxpZ2h0OiB7XHJcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBbJyonXSxcclxuICAgICAgICBhbGxvd01ldGhvZHM6IFtcclxuICAgICAgICAgIGFwaWdhdGV3YXkuQ29yc0h0dHBNZXRob2QuR0VULFxyXG4gICAgICAgICAgYXBpZ2F0ZXdheS5Db3JzSHR0cE1ldGhvZC5QT1NULFxyXG4gICAgICAgICAgYXBpZ2F0ZXdheS5Db3JzSHR0cE1ldGhvZC5PUFRJT05TLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdYLVVzZXItSWQnLCAnWC1DbGluaWMtSWQnXSxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENyZWF0ZSBMYW1iZGEgaW50ZWdyYXRpb25zXHJcbiAgICBjb25zdCBjcmVhdGVOb3RlSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheUludGVncmF0aW9ucy5IdHRwTGFtYmRhSW50ZWdyYXRpb24oXHJcbiAgICAgICdDcmVhdGVOb3RlSW50ZWdyYXRpb24nLFxyXG4gICAgICBjcmVhdGVOb3RlTGFtYmRhXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGdldE5vdGVzSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheUludGVncmF0aW9ucy5IdHRwTGFtYmRhSW50ZWdyYXRpb24oXHJcbiAgICAgICdHZXROb3Rlc0ludGVncmF0aW9uJyxcclxuICAgICAgZ2V0Tm90ZXNMYW1iZGFcclxuICAgICk7XHJcblxyXG4gICAgLy8gQWRkIHJvdXRlc1xyXG4gICAgaHR0cEFwaS5hZGRSb3V0ZXMoe1xyXG4gICAgICBwYXRoOiAnL3BhdGllbnRzL3twYXRpZW50SWR9L25vdGVzJyxcclxuICAgICAgbWV0aG9kczogW2FwaWdhdGV3YXkuSHR0cE1ldGhvZC5QT1NUXSxcclxuICAgICAgaW50ZWdyYXRpb246IGNyZWF0ZU5vdGVJbnRlZ3JhdGlvbixcclxuICAgIH0pO1xyXG5cclxuICAgIGh0dHBBcGkuYWRkUm91dGVzKHtcclxuICAgICAgcGF0aDogJy9wYXRpZW50cy97cGF0aWVudElkfS9ub3RlcycsXHJcbiAgICAgIG1ldGhvZHM6IFthcGlnYXRld2F5Lkh0dHBNZXRob2QuR0VUXSxcclxuICAgICAgaW50ZWdyYXRpb246IGdldE5vdGVzSW50ZWdyYXRpb24sXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvLyBTdGFjayBPdXRwdXRzXHJcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpR2F0ZXdheVVybCcsIHtcclxuICAgICAgdmFsdWU6IGh0dHBBcGkuYXBpRW5kcG9pbnQsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgZW5kcG9pbnQgVVJMJyxcclxuICAgICAgZXhwb3J0TmFtZTogJ1Nub3JlTWRBcGlVcmwnLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0R5bmFtb0RCVGFibGVOYW1lJywge1xyXG4gICAgICB2YWx1ZTogbm90ZXNUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnRHluYW1vREIgdGFibGUgbmFtZScsXHJcbiAgICAgIGV4cG9ydE5hbWU6ICdTbm9yZU1kVGFibGVOYW1lJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDcmVhdGVOb3RlTGFtYmRhQXJuJywge1xyXG4gICAgICB2YWx1ZTogY3JlYXRlTm90ZUxhbWJkYS5mdW5jdGlvbkFybixcclxuICAgICAgZGVzY3JpcHRpb246ICdDcmVhdGUgTm90ZSBMYW1iZGEgZnVuY3Rpb24gQVJOJyxcclxuICAgICAgZXhwb3J0TmFtZTogJ1Nub3JlTWRDcmVhdGVOb3RlTGFtYmRhQXJuJyxcclxuICAgIH0pO1xyXG5cclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdHZXROb3Rlc0xhbWJkYUFybicsIHtcclxuICAgICAgdmFsdWU6IGdldE5vdGVzTGFtYmRhLmZ1bmN0aW9uQXJuLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ0dldCBOb3RlcyBMYW1iZGEgZnVuY3Rpb24gQVJOJyxcclxuICAgICAgZXhwb3J0TmFtZTogJ1Nub3JlTWRHZXROb3Rlc0xhbWJkYUFybicsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19