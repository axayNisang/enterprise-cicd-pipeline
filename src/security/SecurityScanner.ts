export interface Vulnerability {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  package: string;
  cve: string;
}

export class SecurityScanner {
  public scanContainerImage(imageTag: string): { passed: boolean; vulnerabilities: Vulnerability[] } {
    // Simulating AST / Container vulnerability gate
    const vulnerabilities: Vulnerability[] = [];
    const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length;

    const passed = criticalCount === 0 && highCount === 0;
    return { passed, vulnerabilities };
  }
}
