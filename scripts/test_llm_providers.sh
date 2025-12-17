#!/bin/bash
# Test MCP LLM Integration with Multiple Providers
# Usage: ./scripts/test_llm_providers.sh [provider]
# Examples:
#   ./scripts/test_llm_providers.sh           # Test all available providers
#   ./scripts/test_llm_providers.sh openai    # Test OpenAI only

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:password@localhost:5432/rateyourbarber_test}"
TEST_FILE="tests/integration/test_mcp_llm.js"

# Load .env if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              MCP LLM Integration - Provider Smoke Tests                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to test a provider
test_provider() {
    local provider=$1
    local provider_name=$2
    local check_var=$3
    local check_val="${!check_var}"
    
    echo -e "${YELLOW}Testing provider: ${provider_name}${NC}"
    
    # Check if provider is configured
    if [ -n "$check_var" ] && ([ -z "$check_val" ] || [ "$check_val" = "your_${check_var,,}_here" ]); then
        echo -e "${YELLOW}⚠️  Skipping ${provider_name} - ${check_var} not configured${NC}"
        echo ""
        return 1
    fi
    
    # Run the test
    echo "Running: LLM_PROVIDER=${provider} node --test ${TEST_FILE}"
    echo ""
    
    if DATABASE_URL="$DATABASE_URL" LLM_PROVIDER="$provider" node --test "$TEST_FILE" 2>&1 | tee /tmp/llm_test_${provider}.log; then
        echo -e "${GREEN}✓ ${provider_name} tests passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}✗ ${provider_name} tests failed${NC}"
        echo ""
        return 1
    fi
}

# Determine which providers to test
SPECIFIC_PROVIDER="$1"
RESULTS=()
FAILED=()

if [ -n "$SPECIFIC_PROVIDER" ]; then
    # Test specific provider
    case "$SPECIFIC_PROVIDER" in
        openai)
            test_provider "openai" "OpenAI" "OPENAI_API_KEY" && RESULTS+=("openai") || FAILED+=("openai")
            ;;
        ollama)
            test_provider "ollama" "Ollama" "" && RESULTS+=("ollama") || FAILED+=("ollama")
            ;;
        mock)
            test_provider "mock" "Mock" "" && RESULTS+=("mock") || FAILED+=("mock")
            ;;
        huggingface|hf)
            test_provider "huggingface" "HuggingFace" "HUGGINGFACE_API_KEY" && RESULTS+=("huggingface") || FAILED+=("huggingface")
            ;;
        replicate)
            test_provider "replicate" "Replicate" "REPLICATE_API_TOKEN" && RESULTS+=("replicate") || FAILED+=("replicate")
            ;;
        *)
            echo -e "${RED}Unknown provider: $SPECIFIC_PROVIDER${NC}"
            echo "Available providers: openai, ollama, mock, huggingface, replicate"
            exit 1
            ;;
    esac
else
    # Test all available providers
    echo -e "${BLUE}Testing all available providers...${NC}"
    echo ""
    
    # Always test mock (no API key needed)
    test_provider "mock" "Mock" "" && RESULTS+=("mock") || FAILED+=("mock")
    
    # Test Ollama if running locally
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:11434/v1/models 2>/dev/null | grep -q "200"; then
        test_provider "ollama" "Ollama" "" && RESULTS+=("ollama") || FAILED+=("ollama")
    else
        echo -e "${YELLOW}⚠️  Skipping Ollama - server not running at http://localhost:11434${NC}"
        echo ""
    fi
    
    # Test OpenAI if configured
    test_provider "openai" "OpenAI" "OPENAI_API_KEY" && RESULTS+=("openai") || FAILED+=("openai")
    
    # Test HuggingFace if configured
    if [ -n "$HUGGINGFACE_API_KEY" ] || [ -n "$HF_API_KEY" ]; then
        test_provider "huggingface" "HuggingFace" "HUGGINGFACE_API_KEY" && RESULTS+=("huggingface") || FAILED+=("huggingface")
    fi
    
    # Test Replicate if configured
    if [ -n "$REPLICATE_API_TOKEN" ] || [ -n "$REPLICATE_API_KEY" ]; then
        test_provider "replicate" "Replicate" "REPLICATE_API_TOKEN" && RESULTS+=("replicate") || FAILED+=("replicate")
    fi
fi

# Print summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                              Test Summary                                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ ${#RESULTS[@]} -gt 0 ]; then
    echo -e "${GREEN}✓ Passed providers (${#RESULTS[@]}):${NC}"
    for provider in "${RESULTS[@]}"; do
        echo "  - $provider"
    done
    echo ""
fi

if [ ${#FAILED[@]} -gt 0 ]; then
    echo -e "${RED}✗ Failed providers (${#FAILED[@]}):${NC}"
    for provider in "${FAILED[@]}"; do
        echo "  - $provider"
    done
    echo ""
    exit 1
fi

if [ ${#RESULTS[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No providers tested. Configure API keys in .env or start Ollama.${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}All tested providers passed!${NC}"
echo ""
