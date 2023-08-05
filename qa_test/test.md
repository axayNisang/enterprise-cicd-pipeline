# Senior Manual QA Test Report: Enterprise Blue/Green CI/CD Pipeline & Orchestration Engine

**Role:** Senior Manual QA Tester / DevOps & Reliability Engineering Reviewer  
**Target Service:** `enterprise-cicd-pipeline`  
**Protocol:** REST API over HTTP  
**Port:** 8091  
**Test Date:** 2026-11-25  
**Overall Verdict:** PASSED (Full pipeline lifecycle, automated blue/green traffic switching, and instant rollback validated)

---

## 1. Scope & Test Objectives
As a Senior QA Tester, I manually validated the end-to-end execution of `enterprise-cicd-pipeline`. The orchestrator executes gated stages:
1. Static analysis & Linting
2. Automated Unit/Integration test suites
3. Security scanning for high/critical vulnerabilities
4. Blue/Green zero-downtime deployment
5. Automated rollback on anomalous canary error metrics ($>1.0\%$)

---

## 2. Live Step-by-Step Execution & Results

### Step 1: Healthcheck
- **Command:**
```bash
curl -i -X GET http://localhost:8091/health
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"status":"UP","service":"enterprise-cicd-pipeline"}
```
- **Verdict:** PASSED.

---

### Step 2: Initial Active Slot Verification
- **Description:** Verifies starting traffic routing state.
- **Command:**
```bash
curl -i -X GET http://localhost:8091/api/deployment/active-slot
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"activeSlot":"BLUE"}
```
- **Verdict:** PASSED. Traffic initially routed to BLUE.

---

### Step 3: Trigger Production Release (Happy Path)
- **Description:** Initiates release `v2.1.0` on `main` branch.
- **Command:**
```bash
curl -i -X POST http://localhost:8091/api/pipeline/trigger \
  -H 'Content-Type: application/json' \
  -d '{
    "commitSha": "7a3b49f",
    "branch": "main",
    "imageTag": "registry.corp.internal/core-api:v2.1.0",
    "maxErrorRatePercent": 1.0
  }'
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "pipelineId": "pipe_1795612485528",
  "commitSha": "7a3b49f",
  "branch": "main",
  "stages": [
    {"stage": "LINT", "success": true, "durationMs": 1200, "output": "ESLint passed with 0 errors"},
    {"stage": "TEST", "success": true, "durationMs": 4500, "output": "14 unit test suites passed"},
    {"stage": "SECURITY_SCAN", "success": true, "durationMs": 3100, "output": "Container scan clean: 0 Critical, 0 High vulnerabilities"},
    {"stage": "DEPLOY", "success": true, "durationMs": 8200, "output": "Swapped active traffic to slot GREEN"}
  ],
  "overallSuccess": true,
  "rollbackTriggered": false
}
```
- **Verdict:** PASSED. All stages succeeded; traffic promoted to slot GREEN.

---

### Step 4: Verify Traffic Promotion to GREEN
- **Command:**
```bash
curl -i -X GET http://localhost:8091/api/deployment/active-slot
```
- **Live Response:**
```http
HTTP/1.1 200 OK
{"activeSlot":"GREEN"}
```
- **Verdict:** PASSED. Traffic router confirms active slot is now GREEN.

---

### Step 5: [Edge Case] Canary Anomaly & Instant Rollback
- **Description:** Simulating deployment of a buggy image (`v2.1.1-buggy`) that generates a 6.2% error rate in smoke tests (exceeding the 1.0% threshold).
- **Command:**
```bash
curl -i -X POST http://localhost:8091/api/pipeline/simulate-canary-failure \
  -H 'Content-Type: application/json' \
  -d '{
    "commitSha": "9c118bb",
    "branch": "hotfix/experimental-cache",
    "imageTag": "registry.corp.internal/core-api:v2.1.1-buggy",
    "errorRatePercent": 6.2
  }'
```
- **Live Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "status": "ROLLBACK_TRIGGERED",
  "report": {
    "commitSha": "9c118bb",
    "overallSuccess": false,
    "rollbackTriggered": true,
    "rollbackReason": "Healthcheck failed: error rate 6.2% exceeded threshold 1%",
    "stages": [
      {"stage": "LINT", "success": true},
      {"stage": "TEST", "success": true},
      {"stage": "SECURITY_SCAN", "success": true},
      {"stage": "DEPLOY", "success": false, "output": "Healthcheck failed: error rate 6.2% exceeded threshold 1%"}
    ]
  },
  "activeSlotAfterRollback": "GREEN"
}
```
- **Verdict:** PASSED. Failed health probe aborted traffic switch and initiated immediate rollback.

---

### Step 6: Verify Zero-Downtime Traffic Preservation
- **Command:**
```bash
curl -i -X GET http://localhost:8091/api/deployment/active-slot
```
- **Live Response:**
```http
HTTP/1.1 200 OK
{"activeSlot":"GREEN"}
```
- **Verdict:** PASSED. Stable slot GREEN continued serving production traffic without interruption.
