#!/usr/bin/env ts-node
/**
 * WebSocket Chat Diagnostic Tool
 * 
 * This tool helps identify and debug issues related to message limits
 * in the chat application by monitoring WebSocket connections, logging
 * messages, tracking performance, and detecting anomalies.
 */

import { io, Socket } from 'socket.io-client';
import fs from 'fs';
import path from 'path';

// Configuration interface
interface DiagnosticConfig {
  serverUrl: string;
  token: string;
  conversationId: string;
  messageCount: number;
  messageInterval: number; // milliseconds between messages
  logToFile: boolean;
  logFormat: 'json' | 'text';
  outputDir: string;
  memoryCheckInterval: number; // milliseconds
  memoryThresholdMB: number;
  connectionTimeoutMs: number;
  messageTimeoutMs: number;
}

// Message log entry
interface MessageLog {
  timestamp: string;
  type: 'sent' | 'received' | 'error' | 'event';
  event?: string;
  data?: any;
  messageNumber?: number;
  timeSinceStart: number; // milliseconds
  timeSinceLast: number; // milliseconds
  memoryUsageMB: number;
}

// Performance metrics
interface PerformanceMetrics {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalErrors: number;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  responseTimeouts: number;
  peakMemoryUsageMB: number;
  averageMemoryUsageMB: number;
  connectionDrops: number;
  anomaliesDetected: string[];
}

class ChatDiagnosticTool {
  private config: DiagnosticConfig;
  private socket: Socket | null = null;
  private logs: MessageLog[] = [];
  private metrics: PerformanceMetrics;
  private lastMessageTime: number = 0;
  private messagesSent: number = 0;
  private messagesReceived: number = 0;
  private responseTimes: number[] = [];
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private messageTimeout: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config: DiagnosticConfig) {
    this.config = config;
    this.metrics = {
      totalMessagesSent: 0,
      totalMessagesReceived: 0,
      totalErrors: 0,
      startTime: Date.now(),
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimeouts: 0,
      peakMemoryUsageMB: 0,
      averageMemoryUsageMB: 0,
      connectionDrops: 0,
      anomaliesDetected: [],
    };
  }

  /**
   * Get current memory usage in MB
   */
  private getMemoryUsageMB(): number {
    const usage = process.memoryUsage();
    return Math.round(usage.heapUsed / 1024 / 1024);
  }

  /**
   * Log an event
   */
  private log(
    type: 'sent' | 'received' | 'error' | 'event',
    data: any,
    event?: string,
    messageNumber?: number
  ): void {
    const now = Date.now();
    const memoryUsageMB = this.getMemoryUsageMB();
    
    const logEntry: MessageLog = {
      timestamp: new Date().toISOString(),
      type,
      event,
      data,
      messageNumber,
      timeSinceStart: now - this.metrics.startTime,
      timeSinceLast: this.lastMessageTime ? now - this.lastMessageTime : 0,
      memoryUsageMB,
    };

    this.logs.push(logEntry);
    this.lastMessageTime = now;

    // Update peak memory usage
    if (memoryUsageMB > this.metrics.peakMemoryUsageMB) {
      this.metrics.peakMemoryUsageMB = memoryUsageMB;
    }

    // Check memory threshold
    if (memoryUsageMB > this.config.memoryThresholdMB) {
      this.detectAnomaly(`Memory usage exceeded threshold: ${memoryUsageMB}MB > ${this.config.memoryThresholdMB}MB`);
    }

    // Console output
    const prefix = `[${logEntry.timestamp}] [${type.toUpperCase()}]`;
    if (type === 'error') {
      console.error(`${prefix}`, data);
    } else {
      const parts = [prefix];
      if (event) parts.push(event);
      if (messageNumber !== undefined) parts.push(`#${messageNumber}`);
      parts.push(JSON.stringify(data).substring(0, 100));
      console.log(parts.join(' '));
    }
  }

  /**
   * Detect and log an anomaly
   */
  private detectAnomaly(description: string): void {
    this.metrics.anomaliesDetected.push(`[${new Date().toISOString()}] ${description}`);
    console.warn(`⚠️  ANOMALY DETECTED: ${description}`);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      const memoryUsageMB = this.getMemoryUsageMB();
      this.log('event', { memoryUsageMB }, 'memory_check');
    }, this.config.memoryCheckInterval);
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  /**
   * Connect to WebSocket server
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🔌 Connecting to ${this.config.serverUrl}...`);
      
      this.socket = io(this.config.serverUrl, {
        auth: {
          token: this.config.token,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Connection events
      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
        this.log('event', { socketId: this.socket?.id }, 'connect');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        this.log('error', { message: error.message }, 'connect_error');
        this.metrics.totalErrors++;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
        this.log('event', { reason }, 'disconnect');
        this.metrics.connectionDrops++;
        
        if (this.isRunning) {
          this.detectAnomaly(`Unexpected disconnection: ${reason}`);
        }
      });

      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
        this.log('error', error, 'socket_error');
        this.metrics.totalErrors++;
      });

      // Message events
      this.socket.on('message:new', (data) => {
        this.messagesReceived++;
        this.metrics.totalMessagesReceived++;
        
        // Calculate response time
        const responseTime = Date.now() - this.lastMessageTime;
        this.responseTimes.push(responseTime);
        
        if (responseTime > this.metrics.maxResponseTime) {
          this.metrics.maxResponseTime = responseTime;
        }
        if (responseTime < this.metrics.minResponseTime) {
          this.metrics.minResponseTime = responseTime;
        }

        this.log('received', data, 'message:new', this.messagesReceived);
        
        // Clear timeout if waiting for response
        if (this.messageTimeout) {
          clearTimeout(this.messageTimeout);
          this.messageTimeout = null;
        }
      });

      this.socket.on('conversation:joined', (data) => {
        console.log('✅ Joined conversation:', data.conversationId);
        this.log('event', data, 'conversation:joined');
      });

      // Timeout for initial connection
      setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error('Connection timeout'));
        }
      }, this.config.connectionTimeoutMs);
    });
  }

  /**
   * Join a conversation
   */
  private async joinConversation(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log(`📥 Joining conversation ${this.config.conversationId}...`);
      
      const timeout = setTimeout(() => {
        reject(new Error('Join conversation timeout'));
      }, 5000);

      this.socket.once('conversation:joined', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.emit('join:conversation', {
        conversationId: this.config.conversationId,
      });
    });
  }

  /**
   * Send a test message
   */
  private async sendMessage(messageNumber: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const content = `Test message #${messageNumber} - ${new Date().toISOString()}`;
      this.messagesSent++;
      this.metrics.totalMessagesSent++;

      // Set timeout for response
      this.messageTimeout = setTimeout(() => {
        this.metrics.responseTimeouts++;
        this.detectAnomaly(`No response received for message #${messageNumber} after ${this.config.messageTimeoutMs / 1000} seconds`);
        this.messageTimeout = null;
        resolve(); // Continue anyway
      }, this.config.messageTimeoutMs);

      this.log('sent', { content }, 'message:text', messageNumber);
      
      this.socket.emit('message:text', {
        conversationId: this.config.conversationId,
        content,
      });

      // Resolve after a short delay
      setTimeout(resolve, 100);
    });
  }

  /**
   * Run the diagnostic test
   */
  public async run(): Promise<void> {
    console.log('🚀 Starting WebSocket Chat Diagnostic Tool');
    console.log('━'.repeat(60));
    console.log('Configuration:');
    console.log(`  Server URL: ${this.config.serverUrl}`);
    console.log(`  Conversation ID: ${this.config.conversationId}`);
    console.log(`  Message Count: ${this.config.messageCount}`);
    console.log(`  Message Interval: ${this.config.messageInterval}ms`);
    console.log(`  Memory Threshold: ${this.config.memoryThresholdMB}MB`);
    console.log('━'.repeat(60));

    this.isRunning = true;
    this.startMemoryMonitoring();

    try {
      // Connect to server
      await this.connect();

      // Join conversation
      await this.joinConversation();

      // Send messages
      console.log(`\n📤 Sending ${this.config.messageCount} messages...`);
      for (let i = 1; i <= this.config.messageCount; i++) {
        await this.sendMessage(i);
        
        // Progress indicator
        if (i % 10 === 0) {
          console.log(`\n📊 Progress: ${i}/${this.config.messageCount} messages sent`);
          console.log(`   Memory: ${this.getMemoryUsageMB()}MB`);
          console.log(`   Received: ${this.messagesReceived} messages`);
        }

        // Wait before next message
        if (i < this.config.messageCount) {
          await new Promise(resolve => setTimeout(resolve, this.config.messageInterval));
        }
      }

      // Wait a bit for final responses
      console.log('\n⏳ Waiting for final responses...');
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      console.error('❌ Test failed:', error);
      this.log('error', error, 'test_failed');
      this.metrics.totalErrors++;
    } finally {
      this.isRunning = false;
      this.stopMemoryMonitoring();
      await this.finalize();
    }
  }

  /**
   * Finalize the test and generate reports
   */
  private async finalize(): Promise<void> {
    console.log('\n' + '━'.repeat(60));
    console.log('📊 Test Complete - Generating Report');
    console.log('━'.repeat(60));

    // Calculate final metrics
    this.metrics.endTime = Date.now();
    this.metrics.durationMs = this.metrics.endTime - this.metrics.startTime;
    
    if (this.responseTimes.length > 0) {
      this.metrics.averageResponseTime = Math.round(
        this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      );
    }

    const memoryUsages = this.logs
      .filter(log => log.memoryUsageMB)
      .map(log => log.memoryUsageMB);
    
    if (memoryUsages.length > 0) {
      this.metrics.averageMemoryUsageMB = Math.round(
        memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
      );
    }

    // Print summary
    console.log('\n📈 Performance Metrics:');
    console.log(`  Duration: ${this.metrics.durationMs}ms (${(this.metrics.durationMs / 1000).toFixed(2)}s)`);
    console.log(`  Messages Sent: ${this.metrics.totalMessagesSent}`);
    console.log(`  Messages Received: ${this.metrics.totalMessagesReceived}`);
    console.log(`  Response Rate: ${((this.metrics.totalMessagesReceived / this.metrics.totalMessagesSent) * 100).toFixed(1)}%`);
    console.log(`  Total Errors: ${this.metrics.totalErrors}`);
    console.log(`  Connection Drops: ${this.metrics.connectionDrops}`);
    console.log(`  Response Timeouts: ${this.metrics.responseTimeouts}`);
    
    console.log('\n⏱️  Response Times:');
    console.log(`  Average: ${this.metrics.averageResponseTime}ms`);
    console.log(`  Min: ${this.metrics.minResponseTime === Infinity ? 'N/A' : this.metrics.minResponseTime + 'ms'}`);
    console.log(`  Max: ${this.metrics.maxResponseTime}ms`);
    
    console.log('\n💾 Memory Usage:');
    console.log(`  Average: ${this.metrics.averageMemoryUsageMB}MB`);
    console.log(`  Peak: ${this.metrics.peakMemoryUsageMB}MB`);
    
    if (this.metrics.anomaliesDetected.length > 0) {
      console.log('\n⚠️  Anomalies Detected:');
      this.metrics.anomaliesDetected.forEach(anomaly => {
        console.log(`  - ${anomaly}`);
      });
    } else {
      console.log('\n✅ No anomalies detected');
    }

    // Generate suggestions
    console.log('\n💡 Suggestions:');
    const suggestions = this.generateSuggestions();
    suggestions.forEach(suggestion => {
      console.log(`  - ${suggestion}`);
    });

    // Export logs if configured
    if (this.config.logToFile) {
      await this.exportLogs();
    }

    // Disconnect
    if (this.socket) {
      this.socket.disconnect();
      console.log('\n🔌 Disconnected from server');
    }

    console.log('\n━'.repeat(60));
    console.log('✅ Diagnostic test completed successfully');
    console.log('━'.repeat(60));
  }

  /**
   * Generate suggestions based on metrics
   */
  private generateSuggestions(): string[] {
    const suggestions: string[] = [];

    // Message delivery issues
    const deliveryRate = (this.metrics.totalMessagesReceived / this.metrics.totalMessagesSent) * 100;
    if (deliveryRate < 90) {
      suggestions.push(
        `Low message delivery rate (${deliveryRate.toFixed(1)}%). Check server logs and network stability.`
      );
    }

    // Response timeout issues
    if (this.metrics.responseTimeouts > 0) {
      suggestions.push(
        `${this.metrics.responseTimeouts} message(s) timed out. The server may be overloaded or there might be a message limit.`
      );
    }

    // High response time
    if (this.metrics.averageResponseTime > 1000) {
      suggestions.push(
        `High average response time (${this.metrics.averageResponseTime}ms). Consider optimizing server performance.`
      );
    }

    // Memory issues
    if (this.metrics.peakMemoryUsageMB > this.config.memoryThresholdMB) {
      suggestions.push(
        `Memory usage exceeded threshold (${this.metrics.peakMemoryUsageMB}MB > ${this.config.memoryThresholdMB}MB). Check for memory leaks.`
      );
    }

    // Connection drops
    if (this.metrics.connectionDrops > 0) {
      suggestions.push(
        `Connection dropped ${this.metrics.connectionDrops} time(s). Investigate network stability or server restarts.`
      );
    }

    // Error rate
    if (this.metrics.totalErrors > 0) {
      suggestions.push(
        `${this.metrics.totalErrors} error(s) occurred. Check error logs for details.`
      );
    }

    // Message count issues (80-90 message threshold)
    if (this.metrics.totalMessagesSent >= 80 && this.metrics.responseTimeouts > 0) {
      suggestions.push(
        `Issues detected around ${this.metrics.totalMessagesSent} messages. There may be a server-side message limit or rate limiting.`
      );
    }

    if (suggestions.length === 0) {
      suggestions.push('All metrics look good! No issues detected.');
    }

    return suggestions;
  }

  /**
   * Export logs to file
   */
  private async exportLogs(): Promise<void> {
    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(this.config.outputDir)) {
        fs.mkdirSync(this.config.outputDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseFilename = `chat-diagnostics-${timestamp}`;

      // Export in requested format
      if (this.config.logFormat === 'json') {
        const jsonFilepath = path.join(this.config.outputDir, `${baseFilename}.json`);
        const data = {
          metadata: {
            generatedAt: new Date().toISOString(),
            config: this.config,
          },
          metrics: this.metrics,
          logs: this.logs,
        };
        fs.writeFileSync(jsonFilepath, JSON.stringify(data, null, 2));
        console.log(`\n📄 JSON log exported to: ${jsonFilepath}`);
      } else {
        const textFilepath = path.join(this.config.outputDir, `${baseFilename}.txt`);
        let content = '='.repeat(80) + '\n';
        content += 'WEBSOCKET CHAT DIAGNOSTIC REPORT\n';
        content += '='.repeat(80) + '\n\n';
        
        content += 'CONFIGURATION:\n';
        content += '-'.repeat(80) + '\n';
        content += `Server URL: ${this.config.serverUrl}\n`;
        content += `Conversation ID: ${this.config.conversationId}\n`;
        content += `Message Count: ${this.config.messageCount}\n`;
        content += `Message Interval: ${this.config.messageInterval}ms\n`;
        content += `Memory Threshold: ${this.config.memoryThresholdMB}MB\n\n`;

        content += 'PERFORMANCE METRICS:\n';
        content += '-'.repeat(80) + '\n';
        content += `Duration: ${this.metrics.durationMs!}ms (${(this.metrics.durationMs! / 1000).toFixed(2)}s)\n`;
        content += `Messages Sent: ${this.metrics.totalMessagesSent}\n`;
        content += `Messages Received: ${this.metrics.totalMessagesReceived}\n`;
        content += `Response Rate: ${((this.metrics.totalMessagesReceived / this.metrics.totalMessagesSent) * 100).toFixed(1)}%\n`;
        content += `Total Errors: ${this.metrics.totalErrors}\n`;
        content += `Connection Drops: ${this.metrics.connectionDrops}\n`;
        content += `Response Timeouts: ${this.metrics.responseTimeouts}\n`;
        content += `Average Response Time: ${this.metrics.averageResponseTime}ms\n`;
        content += `Min Response Time: ${this.metrics.minResponseTime === Infinity ? 'N/A' : this.metrics.minResponseTime + 'ms'}\n`;
        content += `Max Response Time: ${this.metrics.maxResponseTime}ms\n`;
        content += `Average Memory Usage: ${this.metrics.averageMemoryUsageMB}MB\n`;
        content += `Peak Memory Usage: ${this.metrics.peakMemoryUsageMB}MB\n\n`;

        if (this.metrics.anomaliesDetected.length > 0) {
          content += 'ANOMALIES DETECTED:\n';
          content += '-'.repeat(80) + '\n';
          this.metrics.anomaliesDetected.forEach(anomaly => {
            content += `- ${anomaly}\n`;
          });
          content += '\n';
        }

        content += 'SUGGESTIONS:\n';
        content += '-'.repeat(80) + '\n';
        const suggestions = this.generateSuggestions();
        suggestions.forEach(suggestion => {
          content += `- ${suggestion}\n`;
        });
        content += '\n';

        content += 'MESSAGE LOGS:\n';
        content += '-'.repeat(80) + '\n';
        this.logs.forEach(log => {
          content += `[${log.timestamp}] [${log.type.toUpperCase()}] `;
          if (log.event) content += `${log.event} `;
          if (log.messageNumber) content += `#${log.messageNumber} `;
          content += `(+${log.timeSinceLast}ms, ${log.memoryUsageMB}MB)\n`;
          if (log.data) {
            content += `  Data: ${JSON.stringify(log.data).substring(0, 200)}\n`;
          }
        });

        fs.writeFileSync(textFilepath, content);
        console.log(`\n📄 Text log exported to: ${textFilepath}`);
      }
    } catch (error) {
      console.error('❌ Failed to export logs:', error);
    }
  }
}

// Parse command line arguments
function parseArgs(): Partial<DiagnosticConfig> {
  const args = process.argv.slice(2);
  const config: Partial<DiagnosticConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const value = args[i + 1];

    switch (arg) {
      case '--url':
      case '-u':
        config.serverUrl = value;
        i++;
        break;
      case '--token':
      case '-t':
        config.token = value;
        i++;
        break;
      case '--conversation':
      case '-c':
        config.conversationId = value;
        i++;
        break;
      case '--count':
      case '-n':
        config.messageCount = parseInt(value);
        i++;
        break;
      case '--interval':
      case '-i':
        config.messageInterval = parseInt(value);
        i++;
        break;
      case '--format':
      case '-f':
        config.logFormat = value as 'json' | 'text';
        i++;
        break;
      case '--output':
      case '-o':
        config.outputDir = value;
        i++;
        break;
      case '--no-log':
        config.logToFile = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return config;
}

// Print help message
function printHelp(): void {
  console.log(`
WebSocket Chat Diagnostic Tool

Usage: ts-node chat-diagnostics.ts [options]

Options:
  -u, --url <url>              Server URL (default: http://localhost:5000)
  -t, --token <token>          Authentication token (required)
  -c, --conversation <id>      Conversation ID (required)
  -n, --count <number>         Number of messages to send (default: 100)
  -i, --interval <ms>          Interval between messages in ms (default: 500)
  -f, --format <json|text>     Log format (default: json)
  -o, --output <directory>     Output directory for logs (default: ./logs)
  --no-log                     Disable log file export
  -h, --help                   Show this help message

Environment Variables:
  SERVER_URL                   Server URL
  AUTH_TOKEN                   Authentication token
  CONVERSATION_ID              Conversation ID
  MESSAGE_COUNT                Number of messages
  MESSAGE_INTERVAL             Interval between messages

Examples:
  # Basic usage
  ts-node chat-diagnostics.ts -t <token> -c <conversation-id>

  # Custom configuration
  ts-node chat-diagnostics.ts -u http://localhost:5000 -t <token> -c <conv-id> -n 100 -i 1000

  # Export to text format
  ts-node chat-diagnostics.ts -t <token> -c <conv-id> -f text -o ./my-logs

  # Test high message volume (90 messages)
  ts-node chat-diagnostics.ts -t <token> -c <conv-id> -n 90 -i 500
  `);
}

// Main function
async function main(): Promise<void> {
  // Parse command line arguments
  const cliConfig = parseArgs();

  // Build configuration with defaults
  const config: DiagnosticConfig = {
    serverUrl: cliConfig.serverUrl || process.env.SERVER_URL || 'http://localhost:5000',
    token: cliConfig.token || process.env.AUTH_TOKEN || '',
    conversationId: cliConfig.conversationId || process.env.CONVERSATION_ID || '',
    messageCount: cliConfig.messageCount || parseInt(process.env.MESSAGE_COUNT || '100'),
    messageInterval: cliConfig.messageInterval || parseInt(process.env.MESSAGE_INTERVAL || '500'),
    logToFile: cliConfig.logToFile !== false,
    logFormat: cliConfig.logFormat || (process.env.LOG_FORMAT as 'json' | 'text') || 'json',
    outputDir: cliConfig.outputDir || process.env.OUTPUT_DIR || './logs',
    memoryCheckInterval: 5000, // Check memory every 5 seconds
    memoryThresholdMB: 200, // Alert if memory exceeds 200MB
    connectionTimeoutMs: 10000, // 10 seconds for initial connection
    messageTimeoutMs: 10000, // 10 seconds for message response
  };

  // Validate required configuration
  if (!config.token) {
    console.error('❌ Error: Authentication token is required');
    console.log('Use -t or --token option, or set AUTH_TOKEN environment variable');
    process.exit(1);
  }

  if (!config.conversationId) {
    console.error('❌ Error: Conversation ID is required');
    console.log('Use -c or --conversation option, or set CONVERSATION_ID environment variable');
    process.exit(1);
  }

  // Run diagnostic tool
  const tool = new ChatDiagnosticTool(config);
  await tool.run();
}

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { ChatDiagnosticTool, DiagnosticConfig };
