#!/bin/bash

# Chat Diagnostic Tool Runner Script
# This script helps run the diagnostic tool with common configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     WebSocket Chat Diagnostic Tool                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if ts-node is available
if ! command -v ts-node &> /dev/null; then
    echo -e "${RED}Error: ts-node is not installed${NC}"
    echo "Please run: npm install -g ts-node"
    echo "Or run from backend directory: npm install"
    exit 1
fi

# Check if .env file exists
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} Found .env file, loading configuration..."
    source .env
else
    echo -e "${YELLOW}⚠${NC} No .env file found. You can create one from .env.example"
    echo ""
fi

# Show help menu
show_help() {
    echo "Usage: ./run-diagnostics.sh [preset]"
    echo ""
    echo "Presets:"
    echo "  quick      - Quick test with 20 messages"
    echo "  standard   - Standard test with 50 messages"
    echo "  stress     - High message count (90 messages)"
    echo "  extreme    - Extreme test (150 messages)"
    echo "  custom     - Run with custom parameters (interactive)"
    echo ""
    echo "Examples:"
    echo "  ./run-diagnostics.sh quick"
    echo "  ./run-diagnostics.sh stress"
    echo ""
    echo "You can also run the tool directly:"
    echo "  ts-node chat-diagnostics.ts -t <token> -c <conversation-id>"
    echo ""
}

# Validate required config
validate_config() {
    if [ -z "$AUTH_TOKEN" ]; then
        echo -e "${RED}Error: AUTH_TOKEN is required${NC}"
        echo "Set it in .env file or export AUTH_TOKEN=your-token"
        exit 1
    fi
    
    if [ -z "$CONVERSATION_ID" ]; then
        echo -e "${RED}Error: CONVERSATION_ID is required${NC}"
        echo "Set it in .env file or export CONVERSATION_ID=your-conversation-id"
        exit 1
    fi
}

# Run with preset
run_preset() {
    local preset=$1
    local count=100
    local interval=500
    local description=""
    
    case $preset in
        quick)
            count=20
            interval=1000
            description="Quick Test (20 messages)"
            ;;
        standard)
            count=50
            interval=500
            description="Standard Test (50 messages)"
            ;;
        stress)
            count=90
            interval=500
            description="Stress Test (90 messages - testing message limit)"
            ;;
        extreme)
            count=150
            interval=300
            description="Extreme Test (150 messages)"
            ;;
        custom)
            echo -e "${GREEN}Custom Test Configuration${NC}"
            echo ""
            read -p "Number of messages [100]: " count
            count=${count:-100}
            read -p "Interval between messages (ms) [500]: " interval
            interval=${interval:-500}
            description="Custom Test ($count messages)"
            ;;
        *)
            echo -e "${RED}Unknown preset: $preset${NC}"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Running: $description${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Configuration:"
    echo "  Server URL: ${SERVER_URL:-http://localhost:5000}"
    echo "  Messages: $count"
    echo "  Interval: ${interval}ms"
    echo "  Log Format: ${LOG_FORMAT:-json}"
    echo ""
    read -p "Press Enter to start, or Ctrl+C to cancel..."
    echo ""
    
    # Run the diagnostic tool
    ts-node chat-diagnostics.ts \
        -u "${SERVER_URL:-http://localhost:5000}" \
        -t "$AUTH_TOKEN" \
        -c "$CONVERSATION_ID" \
        -n "$count" \
        -i "$interval" \
        -f "${LOG_FORMAT:-json}" \
        -o "${OUTPUT_DIR:-./logs}"
}

# Main script
if [ $# -eq 0 ]; then
    echo "Please specify a test preset:"
    echo ""
    show_help
    exit 1
fi

case $1 in
    -h|--help|help)
        show_help
        exit 0
        ;;
    *)
        validate_config
        run_preset "$1"
        ;;
esac

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Diagnostic test completed!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Show log location if logs were generated
if [ -d "${OUTPUT_DIR:-./logs}" ]; then
    echo -e "Logs saved to: ${GREEN}${OUTPUT_DIR:-./logs}${NC}"
    echo ""
    latest_log=$(ls -t "${OUTPUT_DIR:-./logs}" | head -1)
    if [ ! -z "$latest_log" ]; then
        echo -e "Latest log: ${GREEN}${OUTPUT_DIR:-./logs}/$latest_log${NC}"
    fi
fi
