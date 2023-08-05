import express, { Request, Response } from 'express';
import { PipelineOrchestrator } from './PipelineOrchestrator';
import { DeploymentEngine } from './deployment/DeploymentEngine';
import { SecurityScanner } from './security/SecurityScanner';
import { DeploymentConfig } from './types';

const app = express();
app.use(express.json());

const securityScanner = new SecurityScanner();
const deploymentEngine = new DeploymentEngine();
const orchestrator = new PipelineOrchestrator(securityScanner, deploymentEngine);

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'enterprise-cicd-pipeline' }));

app.get('/api/deployment/active-slot', (req, res) => {
  res.json({ activeSlot: deploymentEngine.getActiveSlot() });
});

app.post('/api/pipeline/trigger', async (req: Request, res: Response) => {
  const { commitSha, branch, imageTag, maxErrorRatePercent } = req.body;
  const config: DeploymentConfig = {
    environment: 'production',
    targetCluster: 'prod-k8s-cluster-us-east',
    imageTag: imageTag || 'v1.4.0',
    strategy: 'BLUE_GREEN',
    healthCheckUrl: 'http://localhost:8091/health',
    maxErrorRatePercent: maxErrorRatePercent !== undefined ? maxErrorRatePercent : 1.0
  };

  try {
    const report = await orchestrator.run(
      commitSha || 'c0ffee1',
      branch || 'main',
      config,
      async () => ({ healthy: true, latencyMs: 24, errorRatePercent: 0.1 })
    );
    return res.status(report.overallSuccess ? 200 : 500).json(report);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/pipeline/simulate-canary-failure', async (req: Request, res: Response) => {
  const { commitSha, branch, imageTag, errorRatePercent } = req.body;
  const simulatedErrorRate = errorRatePercent !== undefined ? errorRatePercent : 5.8;
  const config: DeploymentConfig = {
    environment: 'production',
    targetCluster: 'prod-k8s-cluster-us-east',
    imageTag: imageTag || 'v1.4.1-broken',
    strategy: 'BLUE_GREEN',
    healthCheckUrl: 'http://localhost:8091/health',
    maxErrorRatePercent: 1.0
  };

  try {
    const report = await orchestrator.run(
      commitSha || 'badf00d',
      branch || 'feature/experiment',
      config,
      async () => ({ healthy: false, latencyMs: 820, errorRatePercent: simulatedErrorRate })
    );
    return res.status(200).json({
      status: 'ROLLBACK_TRIGGERED',
      report,
      activeSlotAfterRollback: deploymentEngine.getActiveSlot()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = 8091;
app.listen(PORT, () => console.log(`[CI/CD Engine] Running on port ${PORT}`));
