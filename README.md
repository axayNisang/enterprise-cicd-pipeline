# Enterprise CI/CD Pipeline Automation 🔄

[![CI Pipeline](https://github.com/axayNisang/enterprise-cicd-pipeline/actions/workflows/deploy.yml/badge.svg)](https://github.com/axayNisang/enterprise-cicd-pipeline/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![AWS](https://img.shields.io/badge/AWS-ECS%20%7C%20ECR-FF9900.svg?logo=amazon-aws)](https://aws.amazon.com)

A robust, enterprise-grade Continuous Integration & Continuous Delivery (CI/CD) orchestration engine built for microservices and cloud workloads. Features automated container vulnerability gating, Blue/Green zero-downtime routing, and instant automated rollbacks triggered by real-time healthcheck thresholds.

---

## 🏗 Pipeline Execution Architecture

```
                  Git Push (main)
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  Stage 1: Lint & Static Analysis │
        └────────────────┬─────────────────┘
                         ▼
        ┌──────────────────────────────────┐
        │  Stage 2: Unit & Integration Test│
        └────────────────┬─────────────────┘
                         ▼
        ┌──────────────────────────────────┐
        │  Stage 3: Security & Trivy Scan  │ (Block on Critical/High)
        └────────────────┬─────────────────┘
                         ▼
        ┌──────────────────────────────────┐
        │  Stage 4: Deploy to Inactive Slot│ (Deploy to GREEN)
        └────────────────┬─────────────────┘
                         ▼
        ┌──────────────────────────────────┐
        │  Stage 5: Live Smoke Healthcheck │
        └────────────────┬─────────────────┘
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
    [Healthy (Error < 1%)]     [Unhealthy (> 1%)]
           │                           │
  Flip Production Router     Instant Auto-Rollback
 (Active Slot: GREEN)        (Preserve BLUE Slot)
```

---

## 🚀 Key Production Capabilities

- **Zero-Downtime Blue/Green Deployments**: Transitions client workloads seamlessly between isolated production slots (`BLUE` and `GREEN`).
- **Automated Rollback Safeguards**: Post-deployment probes measure error rates and latency. If error rates exceed $1.0\%$, the router immediately aborts and holds previous stable slot.
- **Security Gating**: Automatically scans container images for CVE vulnerabilities and enforces zero critical/high CVE policies before deployment.
- **GitHub Actions Workflows**: Fully declarative `.github/workflows/deploy.yml` with OIDC role assumption (`aws-actions/configure-aws-credentials`).

---

## 🧪 Testing

```bash
npm install
npm test
```

---

## 📄 License
MIT License. Created by [Akshay Nisang](https://github.com/axayNisang).
