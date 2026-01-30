#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SnoreMdNotesStack } from '../lib/infra-stack';

const app = new cdk.App();

new SnoreMdNotesStack(app, 'SnoreMdNotesStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Snore MD Patient Follow-Up Notes System Infrastructure',
});

app.synth();
