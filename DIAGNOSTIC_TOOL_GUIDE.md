# WebSocket Chat Diagnostic Tool - Quick Start Guide

This guide explains how to use the WebSocket diagnostic tool to identify and debug message limit issues in the chat application.

## Problem Statement

The chat application experiences issues after sending 80-90 messages where it stops processing messages without clear error logs. This diagnostic tool helps identify the root cause.

## Location

The diagnostic tool is located in:
```
backend/src/diagnostics/
```

## Quick Start

### Prerequisites

1. Backend server must be running
2. Valid authentication token
3. Existing conversation ID

### Option 1: Using NPM Scripts (Recommended)

```bash
cd backend

# Show help
npm run diagnostics:help

# Run with environment variables
export AUTH_TOKEN="your-jwt-token"
export CONVERSATION_ID="your-conversation-id"
npm run diagnostics -- -n 90 -i 500
```

### Option 2: Using the Shell Script

```bash
cd backend/src/diagnostics

# Create .env file from example
cp .env.example .env
# Edit .env with your values

# Run quick test (20 messages)
./run-diagnostics.sh quick

# Run stress test (90 messages - tests message limit)
./run-diagnostics.sh stress
```

### Option 3: Direct Execution

```bash
cd backend/src/diagnostics

ts-node chat-diagnostics.ts \
  -t your-jwt-token \
  -c your-conversation-id \
  -n 90 \
  -i 500
```

## Getting Required Information

### 1. Get Authentication Token

**Option A: Login via API**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' | jq -r '.token'
```

**Option B: From Browser DevTools**
1. Open web application and login
2. Open DevTools (F12) → Application → Local Storage
3. Copy the `token` value

### 2. Get Conversation ID

**Option A: List conversations via API**
```bash
curl http://localhost:5000/api/conversations \
  -H "Authorization: Bearer your-token" | jq '.[0].id'
```

**Option B: From Browser**
1. Login and open a conversation
2. Check URL or network requests for conversation ID

## Test Scenarios

### Test 1: Quick Health Check (20 messages)
```bash
./run-diagnostics.sh quick
```
Expected result: All messages delivered successfully

### Test 2: Standard Load Test (50 messages)
```bash
./run-diagnostics.sh standard
```
Expected result: Consistent performance throughout

### Test 3: Stress Test - Message Limit (90 messages)
```bash
./run-diagnostics.sh stress
```
**Purpose:** This specifically tests the 80-90 message threshold where issues occur

Expected issues to detect:
- Response timeouts after message #80-85
- Connection drops
- Memory spikes
- Rate limiting triggers

### Test 4: Extreme Load (150 messages)
```bash
./run-diagnostics.sh extreme
```
Expected result: Identifies if issues persist beyond 90 messages

## Understanding the Output

### Console Output

The tool provides real-time feedback:
```
🔌 Connecting to http://localhost:5000...
✅ Connected to server
📥 Joining conversation abc123...
✅ Joined conversation: abc123

📤 Sending 90 messages...

📊 Progress: 80/90 messages sent
   Memory: 45MB
   Received: 80 messages

⚠️  ANOMALY DETECTED: No response received for message #85 after 10 seconds
```

### Key Metrics

After the test completes, you'll see:

**Performance Metrics:**
- Duration: Total test time
- Messages Sent/Received: Success rate
- Response Rate: Percentage of messages acknowledged
- Response Times: Min/Max/Average latency

**Memory Usage:**
- Average and Peak: Memory consumption during test
- Alerts if threshold exceeded

**Anomalies:**
- Response timeouts
- Connection drops
- Unexpected errors

**Suggestions:**
- Actionable recommendations based on detected issues

### Log Files

Logs are saved to `backend/src/diagnostics/logs/` by default.

**JSON Format** (default):
```json
{
  "metadata": { ... },
  "metrics": {
    "totalMessagesSent": 90,
    "totalMessagesReceived": 84,
    "responseTimeouts": 6
  },
  "logs": [ ... ]
}
```

**Text Format**:
```
================================================================================
WEBSOCKET CHAT DIAGNOSTIC REPORT
================================================================================

CONFIGURATION:
--------------------------------------------------------------------------------
Server URL: http://localhost:5000
Message Count: 90
...
```

## Interpreting Results

### Scenario 1: All Tests Pass ✅
```
Messages Sent: 90
Messages Received: 90
Response Rate: 100%
No anomalies detected
```
**Conclusion:** No message limit issues

### Scenario 2: Issues at 80-90 Messages ⚠️
```
Messages Sent: 90
Messages Received: 84
Response Rate: 93.3%
Response Timeouts: 6
Anomaly: Issues detected around 90 messages
```
**Likely Causes:**
- Server-side message limit per conversation
- Rate limiting configuration
- Database query performance degradation
- Memory leak in message processing

**Next Steps:**
1. Check server logs for errors around message #80-90
2. Review database query performance
3. Check for rate limiting configuration
4. Inspect memory usage on server

### Scenario 3: Progressive Degradation 📉
```
Messages Sent: 90
Average Response Time: 1500ms
Max Response Time: 8000ms
```
**Likely Causes:**
- Database connection pool exhaustion
- Memory pressure
- CPU saturation

**Next Steps:**
1. Check database connection pool size
2. Monitor server resource usage
3. Review query optimization

## Advanced Usage

### Custom Test Parameters
```bash
ts-node chat-diagnostics.ts \
  -t token \
  -c conversation-id \
  -n 100 \
  -i 1000 \
  -f text \
  -o ./custom-logs
```

### Using Environment Variables
```bash
export SERVER_URL=http://localhost:5000
export AUTH_TOKEN=token
export CONVERSATION_ID=conv-id
export MESSAGE_COUNT=90
export MESSAGE_INTERVAL=500

npm run diagnostics
```

### Exporting Only Text Logs
```bash
ts-node chat-diagnostics.ts \
  -t token \
  -c conv-id \
  -f text
```

### Disable Log Export (Console Only)
```bash
ts-node chat-diagnostics.ts \
  -t token \
  -c conv-id \
  --no-log
```

## Troubleshooting

### "Authentication required"
- Token expired → Login again to get fresh token
- Invalid token → Verify token format

### "Connection timeout"
- Server not running → Start backend: `npm run dev`
- Wrong URL → Check SERVER_URL

### "Conversation invalide"
- Wrong ID → Verify conversation exists
- No access → Check user permissions

### No response after 80-90 messages
- This is the expected issue! ✅
- Check suggestions in diagnostic output
- Review server logs at that timestamp
- Consider database query optimization

## Server-Side Investigation

After running diagnostics, check server side:

```bash
# Check server logs
tail -f backend/logs/app.log

# Monitor database queries (if logging enabled)
# Look for slow queries around message #80-90

# Check database connection pool
# Review Prisma connection configuration

# Monitor server memory
# Use tools like htop, ps, or container metrics
```

## Common Issues and Solutions

### Issue: High Memory Usage
**Solution:** Check for memory leaks in:
- Message event handlers
- Socket connection management
- Database query caching

### Issue: Response Timeouts
**Solution:** Review:
- Rate limiting configuration
- Message processing logic
- Database query performance
- Server resource constraints

### Issue: Connection Drops
**Solution:** Investigate:
- Network stability
- Server restarts
- WebSocket timeout settings
- Load balancer configuration

## Integration with Development Workflow

### During Development
```bash
# Quick check after changes
./run-diagnostics.sh quick

# Full test before commit
./run-diagnostics.sh stress
```

### Before Deployment
```bash
# Run full test suite
./run-diagnostics.sh standard
./run-diagnostics.sh stress
./run-diagnostics.sh extreme

# Review all logs
ls -lh logs/
```

### In Production (Careful!)
```bash
# Use production URL and valid production token
ts-node chat-diagnostics.ts \
  -u https://api.yourapp.com \
  -t prod-token \
  -c test-conversation \
  -n 50 \
  -i 1000
```

## Further Documentation

- Full documentation: `backend/src/diagnostics/README.md`
- Configuration examples: `backend/src/diagnostics/.env.example`
- Tool source code: `backend/src/diagnostics/chat-diagnostics.ts`

## Support

If issues persist:
1. Save diagnostic logs
2. Capture server logs at the same time
3. Note the exact message count where failure occurs
4. Document any error messages
5. Share findings with the development team

## Summary

This tool helps you:
- ✅ Identify message limit issues
- ✅ Monitor WebSocket connection health
- ✅ Track performance metrics
- ✅ Detect anomalies and errors
- ✅ Get actionable recommendations
- ✅ Export detailed logs for analysis

Run the stress test to reproduce the 80-90 message issue and gather diagnostic data for fixing the root cause.
