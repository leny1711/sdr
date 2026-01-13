# WebSocket Chat Diagnostic Tool

A comprehensive Node.js-based diagnostic tool to identify and debug issues related to message limits in the chat application. This tool helps diagnose problems that occur after sending 80-90+ messages where the application stops processing messages without clear error logs.

## Features

### 1. WebSocket Testing
- Connects to chat server via WebSocket (Socket.io)
- Authenticates using JWT tokens
- Joins conversations and simulates real chat sessions

### 2. Monitoring and Logging
- Logs all messages sent and received with timestamps
- Counts messages before issues occur
- Tracks time intervals between messages
- Monitors response times (min/max/average)

### 3. Error Detection
- Catches and logs all WebSocket errors
- Detects response timeouts
- Highlights anomalies when no response is received
- Tracks connection drops and reconnections

### 4. Resource Monitoring
- Tracks memory usage during long chat sessions
- Reports peak and average memory usage
- Alerts when memory usage exceeds thresholds
- Periodic memory checks (every 5 seconds)

### 5. Connectivity Check
- Verifies WebSocket connection stability
- Detects unexpected disconnections
- Monitors reconnection attempts
- Tracks connection quality metrics

### 6. Log Export
- Exports logs to JSON or text format
- Includes detailed performance metrics
- Provides actionable suggestions for remediation
- Timestamps all exports for tracking

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

The tool uses existing dependencies:
- `socket.io-client` - WebSocket client
- `typescript` and `ts-node` - TypeScript runtime

## Usage

### Basic Usage

```bash
cd backend/src/diagnostics
ts-node chat-diagnostics.ts -t <your-jwt-token> -c <conversation-id>
```

### With Custom Configuration

```bash
ts-node chat-diagnostics.ts \
  -u http://localhost:5000 \
  -t <your-jwt-token> \
  -c <conversation-id> \
  -n 100 \
  -i 500
```

### Test High Message Volume (80-90+ messages)

```bash
ts-node chat-diagnostics.ts \
  -t <your-jwt-token> \
  -c <conversation-id> \
  -n 90 \
  -i 500
```

### Export to Text Format

```bash
ts-node chat-diagnostics.ts \
  -t <your-jwt-token> \
  -c <conversation-id> \
  -f text \
  -o ./my-logs
```

## Command Line Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--url` | `-u` | Server URL | `http://localhost:5000` |
| `--token` | `-t` | Authentication token (required) | - |
| `--conversation` | `-c` | Conversation ID (required) | - |
| `--count` | `-n` | Number of messages to send | `100` |
| `--interval` | `-i` | Interval between messages (ms) | `500` |
| `--format` | `-f` | Log format (`json` or `text`) | `json` |
| `--output` | `-o` | Output directory for logs | `./logs` |
| `--no-log` | - | Disable log file export | `false` |
| `--help` | `-h` | Show help message | - |

## Environment Variables

You can also configure the tool using environment variables:

```bash
export SERVER_URL=http://localhost:5000
export AUTH_TOKEN=your-jwt-token
export CONVERSATION_ID=conversation-id
export MESSAGE_COUNT=100
export MESSAGE_INTERVAL=500
export LOG_FORMAT=json
export OUTPUT_DIR=./logs

ts-node chat-diagnostics.ts
```

## Getting Authentication Token and Conversation ID

### 1. Get Authentication Token

**Option A: Using the API directly**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Option B: From browser developer tools**
1. Open the web application
2. Login with your credentials
3. Open Developer Tools (F12)
4. Go to Application/Storage → Local Storage
5. Look for `token` or `auth_token`

### 2. Get Conversation ID

**Option A: Using the API**
```bash
curl http://localhost:5000/api/conversations \
  -H "Authorization: Bearer <your-token>"
```

**Option B: From browser**
1. Login to the web application
2. Navigate to a conversation
3. Check the URL or network requests for conversation ID

## Output Examples

### Console Output

```
🚀 Starting WebSocket Chat Diagnostic Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configuration:
  Server URL: http://localhost:5000
  Conversation ID: abc123
  Message Count: 90
  Message Interval: 500ms
  Memory Threshold: 200MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 Connecting to http://localhost:5000...
✅ Connected to server
📥 Joining conversation abc123...
✅ Joined conversation: abc123

📤 Sending 90 messages...
...

📊 Progress: 80/90 messages sent
   Memory: 45MB
   Received: 80 messages

⚠️  ANOMALY DETECTED: No response received for message #85 after 10 seconds

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Test Complete - Generating Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Performance Metrics:
  Duration: 45230ms (45.23s)
  Messages Sent: 90
  Messages Received: 84
  Response Rate: 93.3%
  Total Errors: 0
  Connection Drops: 0
  Response Timeouts: 6

⏱️  Response Times:
  Average: 125ms
  Min: 45ms
  Max: 10250ms

💾 Memory Usage:
  Average: 43MB
  Peak: 48MB

⚠️  Anomalies Detected:
  - [2026-01-13T19:30:15.123Z] No response received for message #85 after 10 seconds
  - [2026-01-13T19:30:18.456Z] No response received for message #87 after 10 seconds

💡 Suggestions:
  - 6 message(s) timed out. The server may be overloaded or there might be a message limit.
  - Issues detected around 90 messages. There may be a server-side message limit or rate limiting.

📄 JSON log exported to: ./logs/chat-diagnostics-2026-01-13T19-30-45-789Z.json

🔌 Disconnected from server

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Diagnostic test completed successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### JSON Export Format

```json
{
  "metadata": {
    "generatedAt": "2026-01-13T19:30:45.789Z",
    "config": {
      "serverUrl": "http://localhost:5000",
      "conversationId": "abc123",
      "messageCount": 90,
      "messageInterval": 500
    }
  },
  "metrics": {
    "totalMessagesSent": 90,
    "totalMessagesReceived": 84,
    "totalErrors": 0,
    "responseTimeouts": 6,
    "averageResponseTime": 125,
    "maxResponseTime": 10250,
    "minResponseTime": 45,
    "peakMemoryUsageMB": 48,
    "averageMemoryUsageMB": 43,
    "connectionDrops": 0,
    "anomaliesDetected": [
      "[2026-01-13T19:30:15.123Z] No response received for message #85 after 10 seconds"
    ]
  },
  "logs": [
    {
      "timestamp": "2026-01-13T19:30:00.000Z",
      "type": "event",
      "event": "connect",
      "data": { "socketId": "abc123" },
      "timeSinceStart": 0,
      "timeSinceLast": 0,
      "memoryUsageMB": 42
    }
    // ... more log entries
  ]
}
```

## Troubleshooting Common Issues

### Connection Errors

**Problem:** `Authentication required` or `Invalid token`
- **Solution:** Verify your JWT token is valid and not expired
- **Check:** Login again to get a fresh token

**Problem:** `Connection timeout`
- **Solution:** Verify the server is running and accessible
- **Check:** `curl http://localhost:5000/health` (if health endpoint exists)

### Conversation Errors

**Problem:** `Invalid conversation`
- **Solution:** Verify the conversation ID exists and you have access
- **Check:** List your conversations via the API

**Problem:** `Rejoignez la conversation avant d'envoyer un message`
- **Solution:** The tool should automatically join, but network issues might prevent it
- **Check:** Server logs for WebSocket events

### Message Issues

**Problem:** Messages timing out after 80-90 messages
- **Possible causes:**
  1. Server-side message limit
  2. Rate limiting on the server
  3. Memory issues in server or client
  4. Database connection pool exhaustion
- **Diagnostics:** Check server logs, database connections, and memory usage

## Interpreting Results

### Healthy System Indicators
- ✅ Response rate: 100%
- ✅ Average response time: < 500ms
- ✅ No timeouts
- ✅ No connection drops
- ✅ Memory usage stable

### Warning Signs
- ⚠️ Response rate: < 95%
- ⚠️ Average response time: > 1000ms
- ⚠️ Timeouts occurring
- ⚠️ Connection drops
- ⚠️ Memory usage increasing

### Critical Issues
- 🚨 Response rate: < 90%
- 🚨 Consistent pattern of failures at specific message count (e.g., 80-90)
- 🚨 Memory usage exceeding threshold
- 🚨 Multiple connection drops

## Integration with CI/CD

You can integrate this tool into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Chat Diagnostics
  run: |
    cd backend/src/diagnostics
    ts-node chat-diagnostics.ts \
      -u ${{ secrets.TEST_SERVER_URL }} \
      -t ${{ secrets.TEST_AUTH_TOKEN }} \
      -c ${{ secrets.TEST_CONVERSATION_ID }} \
      -n 100 \
      -f json \
      -o ./test-results
  
- name: Upload Diagnostic Logs
  uses: actions/upload-artifact@v3
  with:
    name: diagnostic-logs
    path: backend/src/diagnostics/test-results/
```

## Contributing

When adding new diagnostic features:

1. Add new metrics to `PerformanceMetrics` interface
2. Implement tracking in the appropriate methods
3. Update report generation in `finalize()`
4. Add suggestions in `generateSuggestions()`
5. Update this README

## License

ISC

## Support

For issues or questions:
1. Check the console output and exported logs
2. Review suggestions in the report
3. Check server logs for corresponding errors
4. Open an issue in the repository with:
   - Command used
   - Console output
   - Exported log file (redact sensitive info)
   - Server logs (if available)
