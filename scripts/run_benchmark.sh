#!/bin/bash
# Benchmark runner for LLM providers against golden dataset
# Usage: ./scripts/run_benchmark.sh [provider1,provider2,... | all | mock]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
RESULTS_DIR="$ROOT_DIR/tests/results"

# Create results directory if it doesn't exist
mkdir -p "$RESULTS_DIR"

# Parse arguments
PROVIDERS="${1:-mock}"

if [ "$PROVIDERS" = "all" ]; then
    PROVIDERS="mock,ollama,openai"
fi

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULT_FILE="$RESULTS_DIR/benchmark_${PROVIDERS//,/_}_${TIMESTAMP}.txt"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║               LLM Provider Benchmark - Golden Dataset Test                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Testing providers: ${PROVIDERS}${NC}"
echo -e "${YELLOW}Golden dataset: tests/fixtures/llm_golden.json (50 cases)${NC}"
echo ""

# Run benchmark
cd "$ROOT_DIR"
node workers/llm/benchmark_providers.js "$PROVIDERS" | tee "$RESULT_FILE"

echo ""
echo -e "${GREEN}✅ Results saved to: ${RESULT_FILE}${NC}"
echo ""
echo -e "${BLUE}Available commands:${NC}"
echo -e "  npm run test:llm:benchmark         # Quick benchmark (mock only)"
echo -e "  npm run test:llm:benchmark:all     # Full benchmark (all providers)"
echo -e "  npm run test:llm:golden            # Golden dataset validation (mock)"
echo -e "  ./scripts/run_benchmark.sh ollama,openai  # Custom provider selection"
echo ""
