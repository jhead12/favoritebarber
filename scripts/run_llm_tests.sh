#!/bin/bash
#
# LLM Test Runner - Automated testing with result file generation
# Usage: ./scripts/run_llm_tests.sh [test-type] [provider]
#
# Examples:
#   ./scripts/run_llm_tests.sh comparison      # Compare OpenAI vs Ollama
#   ./scripts/run_llm_tests.sh accuracy        # Full 8-test suite with current provider
#   ./scripts/run_llm_tests.sh accuracy openai # Full 8-test suite with OpenAI
#   ./scripts/run_llm_tests.sh all             # Run all tests
#

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RESULTS_DIR="tests/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Ensure results directory exists
mkdir -p "$RESULTS_DIR"

# Check if .env exists and source it
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Function to print colored messages
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to run comparison test
run_comparison_test() {
    local provider=${1:-""}
    local output_file="${RESULTS_DIR}/openai_vs_ollama_${TIMESTAMP}.txt"
    
    log_info "Running OpenAI vs Ollama comparison test..."
    log_info "Output will be saved to: ${output_file}"
    echo ""
    
    if [ -n "$provider" ] && [ "$provider" = "openai" ]; then
        if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
            log_error "OPENAI_API_KEY not configured in .env"
            log_info "Get your API key from: https://platform.openai.com/api-keys"
            return 1
        fi
        LLM_PROVIDER=openai node workers/llm/test_openai_vs_ollama.js 2>&1 | tee "$output_file"
    else
        node workers/llm/test_openai_vs_ollama.js 2>&1 | tee "$output_file"
    fi
    
    echo ""
    log_success "Test completed! Results saved to: ${output_file}"
    echo ""
    show_file_info "$output_file"
}

# Function to run accuracy test
run_accuracy_test() {
    local provider=${1:-"ollama"}
    local output_file="${RESULTS_DIR}/ai_accuracy_${provider}_${TIMESTAMP}.txt"
    
    log_info "Running full AI accuracy test (8 cases) with ${provider}..."
    log_info "Output will be saved to: ${output_file}"
    echo ""
    
    if [ "$provider" = "openai" ]; then
        if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
            log_error "OPENAI_API_KEY not configured in .env"
            log_info "Get your API key from: https://platform.openai.com/api-keys"
            return 1
        fi
        LLM_PROVIDER=openai timeout 120 node workers/llm/test_ai_accuracy.js 2>&1 | tee "$output_file"
    else
        timeout 120 node workers/llm/test_ai_accuracy.js 2>&1 | tee "$output_file"
    fi
    
    echo ""
    log_success "Test completed! Results saved to: ${output_file}"
    echo ""
    show_file_info "$output_file"
}

# Function to show file info
show_file_info() {
    local file=$1
    if [ -f "$file" ]; then
        local size=$(ls -lh "$file" | awk '{print $5}')
        log_info "File size: ${size}"
        log_info "View results: cat ${file}"
        log_info "View summary: tail -50 ${file}"
    fi
}

# Function to show usage
show_usage() {
    echo ""
    echo "LLM Test Runner - Automated testing with result file generation"
    echo ""
    echo "Usage: $0 [test-type] [provider]"
    echo ""
    echo "Test Types:"
    echo "  comparison    Compare OpenAI vs Ollama (6 test cases)"
    echo "  accuracy      Full accuracy test (8 test cases)"
    echo "  all           Run all tests"
    echo ""
    echo "Providers:"
    echo "  ollama        Use local Ollama (default, free)"
    echo "  openai        Use OpenAI/ChatGPT (requires API key)"
    echo ""
    echo "Examples:"
    echo "  $0 comparison              # Compare both providers"
    echo "  $0 accuracy                # Full test with Ollama"
    echo "  $0 accuracy openai         # Full test with OpenAI"
    echo "  $0 all                     # Run all tests"
    echo ""
    echo "Results are saved to: ${RESULTS_DIR}/"
    echo ""
}

# Main script logic
TEST_TYPE=${1:-""}
PROVIDER=${2:-"ollama"}

case "$TEST_TYPE" in
    comparison)
        run_comparison_test "$PROVIDER"
        ;;
    accuracy)
        run_accuracy_test "$PROVIDER"
        ;;
    all)
        log_info "Running all tests..."
        echo ""
        run_comparison_test
        echo ""
        echo "════════════════════════════════════════════════════════════════════════"
        echo ""
        run_accuracy_test "ollama"
        echo ""
        if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your_openai_api_key_here" ]; then
            echo "════════════════════════════════════════════════════════════════════════"
            echo ""
            run_accuracy_test "openai"
        fi
        echo ""
        log_success "All tests completed!"
        log_info "Results saved to: ${RESULTS_DIR}/"
        ls -lht "$RESULTS_DIR"/*.txt 2>/dev/null | head -10
        ;;
    "")
        show_usage
        exit 0
        ;;
    *)
        log_error "Unknown test type: $TEST_TYPE"
        show_usage
        exit 1
        ;;
esac

# Show all recent results
echo ""
log_info "Recent test results:"
ls -lht "$RESULTS_DIR"/*.txt 2>/dev/null | head -5 || echo "No results found"
echo ""
