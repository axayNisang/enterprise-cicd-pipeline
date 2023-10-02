import { PipelineOrchestrator } from '../src/PipelineOrchestrator';
import { SecurityScanner } from '../src/security/SecurityScanner';
import { DeploymentEngine } from '../src/deployment/DeploymentEngine';
import { DeploymentConfig } from '../src/types';

describe('PipelineOrchestrator & Automated Rollback', () => {
  let orchestrator: PipelineOrchestrator;
  let deploymentEngine: DeploymentEngine;

  beforeEach(() => {
    const scanner = new SecurityScanner();
    deploymentEngine = new DeploymentEngine();
    orchestrator = new PipelineOrchestrator(scanner, deploymentEngine);
  });

  const baseConfig: DeploymentConfig = {
    environment: 'production',
    strategy: 'BLUE_GREEN',
    targetCluster: 'prod-ecs-cluster',
    imageTag: 'app:v2.1.0',
    healthCheckUrl: 'https://api.prod/health',
    maxErrorRatePercent: 1.0
  };

  test('successfully deploys when healthcheck passes within thresholds', async () => {
    const report = await orchestrator.run('git_sha_abc123', 'main', baseConfig, async () => ({
      healthy: true,
      latencyMs: 38,
      errorRatePercent: 0.1
    }));

    expect(report.overallSuccess).toBe(true);
    expect(report.rollbackTriggered).toBe(false);
    expect(deploymentEngine.getActiveSlot()).toBe('GREEN');
  });

  test('triggers automated rollback and preserves blue slot on elevated error rates', async () => {
    const report = await orchestrator.run('git_sha_bad456', 'main', baseConfig, async () => ({
      healthy: false,
      latencyMs: 1500,
      errorRatePercent: 8.5
    }));

    expect(report.overallSuccess).toBe(false);
    expect(report.rollbackTriggered).toBe(true);
    expect(report.rollbackReason).toContain('exceeded threshold');
    expect(deploymentEngine.getActiveSlot()).toBe('BLUE');
  });
});
