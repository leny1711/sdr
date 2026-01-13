#!/usr/bin/env ts-node
/**
 * Mock Demo of Chat Diagnostic Tool
 * 
 * This script demonstrates the diagnostic tool output without requiring
 * a running server, authentication, or real conversation.
 * 
 * Useful for:
 * - Understanding the tool's capabilities
 * - Testing the logging and reporting features
 * - Training and documentation
 */

import { DiagnosticConfig } from './chat-diagnostics';

// Simulated performance metrics
interface MockMetrics {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalErrors: number;
  responseTimeouts: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  peakMemoryUsageMB: number;
  averageMemoryUsageMB: number;
  connectionDrops: number;
  anomaliesDetected: string[];
}

class MockDiagnosticDemo {
  private config: DiagnosticConfig;
  private messageCount: number;
  private scenario: 'healthy' | 'message-limit' | 'degradation';

  constructor(scenario: 'healthy' | 'message-limit' | 'degradation' = 'message-limit') {
    this.scenario = scenario;
    this.messageCount = 90;
    this.config = {
      serverUrl: 'http://localhost:5000',
      token: 'mock-jwt-token',
      conversationId: 'demo-conversation-123',
      messageCount: this.messageCount,
      messageInterval: 500,
      logToFile: false,
      logFormat: 'json',
      outputDir: './logs',
      memoryCheckInterval: 5000,
      memoryThresholdMB: 200,
      connectionTimeoutMs: 10000,
      messageTimeoutMs: 10000,
    };
  }

  private simulateHealthyScenario(): MockMetrics {
    return {
      totalMessagesSent: this.messageCount,
      totalMessagesReceived: this.messageCount,
      totalErrors: 0,
      responseTimeouts: 0,
      averageResponseTime: 125,
      maxResponseTime: 250,
      minResponseTime: 45,
      peakMemoryUsageMB: 48,
      averageMemoryUsageMB: 43,
      connectionDrops: 0,
      anomaliesDetected: [],
    };
  }

  private simulateMessageLimitScenario(): MockMetrics {
    const messagesReceived = 84;
    const timeouts = this.messageCount - messagesReceived;
    const anomalies = [];

    for (let i = 85; i <= this.messageCount; i += 2) {
      anomalies.push(`[${new Date().toISOString()}] No response received for message #${i} after 10 seconds`);
    }

    return {
      totalMessagesSent: this.messageCount,
      totalMessagesReceived: messagesReceived,
      totalErrors: 0,
      responseTimeouts: timeouts,
      averageResponseTime: 125,
      maxResponseTime: 10250,
      minResponseTime: 45,
      peakMemoryUsageMB: 48,
      averageMemoryUsageMB: 43,
      connectionDrops: 0,
      anomaliesDetected: anomalies,
    };
  }

  private simulateDegradationScenario(): MockMetrics {
    return {
      totalMessagesSent: this.messageCount,
      totalMessagesReceived: 85,
      totalErrors: 2,
      responseTimeouts: 5,
      averageResponseTime: 1500,
      maxResponseTime: 8000,
      minResponseTime: 45,
      peakMemoryUsageMB: 185,
      averageMemoryUsageMB: 120,
      connectionDrops: 1,
      anomaliesDetected: [
        `[${new Date().toISOString()}] High average response time detected`,
        `[${new Date().toISOString()}] Connection dropped unexpectedly`,
      ],
    };
  }

  private generateSuggestions(metrics: MockMetrics): string[] {
    const suggestions: string[] = [];

    const deliveryRate = (metrics.totalMessagesReceived / metrics.totalMessagesSent) * 100;
    if (deliveryRate < 90) {
      suggestions.push(
        `Low message delivery rate (${deliveryRate.toFixed(1)}%). Check server logs and network stability.`
      );
    }

    if (metrics.responseTimeouts > 0) {
      suggestions.push(
        `${metrics.responseTimeouts} message(s) timed out. The server may be overloaded or there might be a message limit.`
      );
    }

    if (metrics.averageResponseTime > 1000) {
      suggestions.push(
        `High average response time (${metrics.averageResponseTime}ms). Consider optimizing server performance.`
      );
    }

    if (metrics.peakMemoryUsageMB > this.config.memoryThresholdMB) {
      suggestions.push(
        `Memory usage exceeded threshold (${metrics.peakMemoryUsageMB}MB > ${this.config.memoryThresholdMB}MB). Check for memory leaks.`
      );
    }

    if (metrics.connectionDrops > 0) {
      suggestions.push(
        `Connection dropped ${metrics.connectionDrops} time(s). Investigate network stability or server restarts.`
      );
    }

    if (metrics.totalErrors > 0) {
      suggestions.push(
        `${metrics.totalErrors} error(s) occurred. Check error logs for details.`
      );
    }

    if (metrics.totalMessagesSent >= 80 && metrics.responseTimeouts > 0) {
      suggestions.push(
        `Issues detected around ${metrics.totalMessagesSent} messages. There may be a server-side message limit or rate limiting.`
      );
    }

    if (suggestions.length === 0) {
      suggestions.push('All metrics look good! No issues detected.');
    }

    return suggestions;
  }

  public run(): void {
    console.log('🎭 Mock WebSocket Chat Diagnostic Demo');
    console.log('━'.repeat(60));
    console.log(`Scenario: ${this.scenario.toUpperCase()}`);
    console.log('━'.repeat(60));
    console.log('Configuration:');
    console.log(`  Server URL: ${this.config.serverUrl}`);
    console.log(`  Conversation ID: ${this.config.conversationId}`);
    console.log(`  Message Count: ${this.config.messageCount}`);
    console.log(`  Message Interval: ${this.config.messageInterval}ms`);
    console.log('━'.repeat(60));

    console.log('\n🔌 Connecting to server... (simulated)');
    console.log('✅ Connected to server');
    console.log('📥 Joining conversation... (simulated)');
    console.log('✅ Joined conversation');
    console.log(`\n📤 Sending ${this.config.messageCount} messages... (simulated)\n`);

    // Simulate progress updates
    [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach((i) => {
      if (i <= this.messageCount) {
        console.log(`📊 Progress: ${i}/${this.config.messageCount} messages sent`);
        if (this.scenario === 'message-limit' && i === 80) {
          console.log('   💡 Approaching the typical failure threshold (80-90 messages)...');
        }
      }
    });

    // Get metrics based on scenario
    let metrics: MockMetrics;
    switch (this.scenario) {
      case 'healthy':
        metrics = this.simulateHealthyScenario();
        break;
      case 'degradation':
        metrics = this.simulateDegradationScenario();
        break;
      case 'message-limit':
      default:
        metrics = this.simulateMessageLimitScenario();
        break;
    }

    // Display anomalies during simulation
    if (this.scenario === 'message-limit' && metrics.anomaliesDetected.length > 0) {
      console.log('\n⚠️  Starting to detect issues around message #85...');
      console.log('⚠️  ANOMALY DETECTED: No response received for message #85');
      console.log('⚠️  ANOMALY DETECTED: No response received for message #87');
      console.log('⚠️  ANOMALY DETECTED: No response received for message #89');
    }

    console.log('\n⏳ Waiting for final responses... (simulated)');

    // Generate report
    console.log('\n' + '━'.repeat(60));
    console.log('📊 Test Complete - Generating Report');
    console.log('━'.repeat(60));

    const durationMs = this.messageCount * this.config.messageInterval + 5000;

    console.log('\n📈 Performance Metrics:');
    console.log(`  Duration: ${durationMs}ms (${(durationMs / 1000).toFixed(2)}s)`);
    console.log(`  Messages Sent: ${metrics.totalMessagesSent}`);
    console.log(`  Messages Received: ${metrics.totalMessagesReceived}`);
    console.log(
      `  Response Rate: ${((metrics.totalMessagesReceived / metrics.totalMessagesSent) * 100).toFixed(1)}%`
    );
    console.log(`  Total Errors: ${metrics.totalErrors}`);
    console.log(`  Connection Drops: ${metrics.connectionDrops}`);
    console.log(`  Response Timeouts: ${metrics.responseTimeouts}`);

    console.log('\n⏱️  Response Times:');
    console.log(`  Average: ${metrics.averageResponseTime}ms`);
    console.log(`  Min: ${metrics.minResponseTime}ms`);
    console.log(`  Max: ${metrics.maxResponseTime}ms`);

    console.log('\n💾 Memory Usage:');
    console.log(`  Average: ${metrics.averageMemoryUsageMB}MB`);
    console.log(`  Peak: ${metrics.peakMemoryUsageMB}MB`);

    if (metrics.anomaliesDetected.length > 0) {
      console.log('\n⚠️  Anomalies Detected:');
      metrics.anomaliesDetected.forEach((anomaly) => {
        console.log(`  - ${anomaly}`);
      });
    } else {
      console.log('\n✅ No anomalies detected');
    }

    console.log('\n💡 Suggestions:');
    const suggestions = this.generateSuggestions(metrics);
    suggestions.forEach((suggestion) => {
      console.log(`  - ${suggestion}`);
    });

    console.log('\n🔌 Disconnected from server (simulated)');

    console.log('\n━'.repeat(60));
    console.log('✅ Mock diagnostic demo completed');
    console.log('━'.repeat(60));

    // Scenario-specific explanations
    console.log('\n📚 What This Scenario Demonstrates:');
    switch (this.scenario) {
      case 'healthy':
        console.log('  ✅ A healthy system with 100% message delivery');
        console.log('  ✅ Consistent response times');
        console.log('  ✅ Stable memory usage');
        console.log('  ✅ No errors or anomalies');
        break;
      case 'message-limit':
        console.log('  ⚠️  The classic 80-90 message limit issue');
        console.log('  ⚠️  Messages stop being processed after ~84 messages');
        console.log('  ⚠️  Server stops responding without clear errors');
        console.log('  💡 Likely causes: Message limit, rate limiting, or resource exhaustion');
        break;
      case 'degradation':
        console.log('  📉 Progressive performance degradation');
        console.log('  📉 Increasing response times over time');
        console.log('  📉 Memory pressure building up');
        console.log('  💡 Likely causes: Memory leak, connection pool exhaustion, or resource contention');
        break;
    }

    console.log('\n💡 Next Steps (in real usage):');
    console.log('  1. Check server logs for errors at the timestamp of anomalies');
    console.log('  2. Review database query performance and connection pool');
    console.log('  3. Inspect server-side rate limiting configuration');
    console.log('  4. Monitor server resource usage (CPU, memory, connections)');
    console.log('  5. Review message processing logic for bottlenecks');
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  let scenario: 'healthy' | 'message-limit' | 'degradation' = 'message-limit';

  if (args.includes('--healthy')) {
    scenario = 'healthy';
  } else if (args.includes('--degradation')) {
    scenario = 'degradation';
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Mock WebSocket Chat Diagnostic Demo

Usage: ts-node demo.ts [scenario]

Scenarios:
  (default)        Simulate the message limit issue (80-90 messages)
  --healthy        Simulate a healthy system with no issues
  --degradation    Simulate progressive performance degradation
  --help, -h       Show this help message

Examples:
  ts-node demo.ts                    # Message limit scenario
  ts-node demo.ts --healthy          # Healthy scenario
  ts-node demo.ts --degradation      # Degradation scenario
    `);
    return;
  }

  const demo = new MockDiagnosticDemo(scenario);
  demo.run();
}

if (require.main === module) {
  main();
}
