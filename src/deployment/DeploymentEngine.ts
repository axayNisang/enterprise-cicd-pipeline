import { DeploymentConfig } from '../types';

export interface HealthCheckOutcome {
  healthy: boolean;
  latencyMs: number;
  errorRatePercent: number;
}

export class DeploymentEngine {
  private activeSlot: 'BLUE' | 'GREEN' = 'BLUE';
  private previousSlot: 'BLUE' | 'GREEN' = 'GREEN';

  public async deployBlueGreen(
    config: DeploymentConfig,
    probeSimulator?: () => Promise<HealthCheckOutcome>
  ): Promise<{ success: boolean; activeSlot: string; rolledBack: boolean; reason?: string }> {
    const nextSlot = this.activeSlot === 'BLUE' ? 'GREEN' : 'BLUE';

    // 1. Deploy new container to idle target slot
    // 2. Perform post-deployment smoke test
    const check = probeSimulator ? await probeSimulator() : { healthy: true, latencyMs: 45, errorRatePercent: 0 };

    if (!check.healthy || check.errorRatePercent > config.maxErrorRatePercent) {
      // Automatic Rollback
      return {
        success: false,
        activeSlot: this.activeSlot, // remains on previous stable slot
        rolledBack: true,
        reason: `Healthcheck failed: error rate ${check.errorRatePercent}% exceeded threshold ${config.maxErrorRatePercent}%`
      };
    }

    // 3. Flip traffic router
    this.previousSlot = this.activeSlot;
    this.activeSlot = nextSlot;

    return {
      success: true,
      activeSlot: this.activeSlot,
      rolledBack: false
    };
  }

  public getActiveSlot(): 'BLUE' | 'GREEN' {
    return this.activeSlot;
  }
}
