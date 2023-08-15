export type PipelineStage = 'LINT' | 'TEST' | 'SECURITY_SCAN' | 'BUILD' | 'DEPLOY' | 'VERIFY';

export interface StageResult {
  stage: PipelineStage;
  success: boolean;
  durationMs: number;
  output: string;
  error?: string;
}

export interface PipelineExecutionReport {
  pipelineId: string;
  commitSha: string;
  branch: string;
  stages: StageResult[];
  overallSuccess: boolean;
  rollbackTriggered: boolean;
  rollbackReason?: string;
  startedAt: string;
  finishedAt: string;
}

export interface DeploymentConfig {
  environment: 'staging' | 'production';
  strategy: 'ROLLING' | 'BLUE_GREEN' | 'CANARY';
  targetCluster: string;
  imageTag: string;
  healthCheckUrl: string;
  maxErrorRatePercent: number;
}
