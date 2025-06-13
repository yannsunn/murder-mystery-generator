#!/bin/bash

# 🚀 PRODUCTION DEPLOYMENT SCRIPT
# 商業品質のデプロイメント自動化スクリプト

set -e  # Exit on any error

# Colors and emojis
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

ROCKET="🚀"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
GEAR="⚙️"
SPARKLES="✨"
LOCK="🔒"
TEST="🧪"

echo -e "${PURPLE}${ROCKET} PRODUCTION DEPLOYMENT SYSTEM${NC}"
echo -e "${CYAN}================================================${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "netlify.toml" ]; then
    echo -e "${ERROR} ${RED}Not in project root directory!${NC}"
    echo -e "${WARNING} ${YELLOW}Please run this script from the project root.${NC}"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${ERROR} ${RED}Node.js is not installed!${NC}"
    exit 1
fi

# Check if Netlify CLI is available
if ! command -v netlify &> /dev/null; then
    echo -e "${WARNING} ${YELLOW}Netlify CLI not found. Installing...${NC}"
    npm install -g netlify-cli
fi

# Environment check
echo -e "${GEAR} ${YELLOW}Checking environment...${NC}"
if [ -z "$GROQ_API_KEY" ]; then
    echo -e "${ERROR} ${RED}GROQ_API_KEY environment variable is not set!${NC}"
    echo -e "${WARNING} ${YELLOW}Please set your API key before deploying.${NC}"
    exit 1
fi

echo -e "${CHECK} ${GREEN}Environment variables configured${NC}"

# Pre-deployment validation
echo -e "${TEST} ${YELLOW}Running pre-deployment validation...${NC}"
if node scripts/validate-config.js; then
    echo -e "${CHECK} ${GREEN}Configuration validation passed${NC}"
else
    echo -e "${ERROR} ${RED}Configuration validation failed!${NC}"
    exit 1
fi

# Run pre-build checks
echo -e "${TEST} ${YELLOW}Running pre-build checks...${NC}"
if node scripts/pre-build-checks.js; then
    echo -e "${CHECK} ${GREEN}Pre-build checks passed${NC}"
else
    echo -e "${ERROR} ${RED}Pre-build checks failed!${NC}"
    exit 1
fi

# Security audit
echo -e "${LOCK} ${YELLOW}Running security audit...${NC}"
if [ -f "scripts/security-audit.js" ]; then
    if node scripts/security-audit.js; then
        echo -e "${CHECK} ${GREEN}Security audit passed${NC}"
    else
        echo -e "${WARNING} ${YELLOW}Security audit found issues. Continue? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo -e "${ERROR} ${RED}Deployment cancelled due to security concerns${NC}"
            exit 1
        fi
    fi
else
    echo -e "${WARNING} ${YELLOW}Security audit script not found, skipping...${NC}"
fi

# Build for production
echo -e "${GEAR} ${YELLOW}Building for production...${NC}"
if node scripts/production-build.js; then
    echo -e "${CHECK} ${GREEN}Production build successful${NC}"
else
    echo -e "${ERROR} ${RED}Production build failed!${NC}"
    exit 1
fi

# Git status check
echo -e "${GEAR} ${YELLOW}Checking Git status...${NC}"
if ! git diff-index --quiet HEAD --; then
    echo -e "${WARNING} ${YELLOW}Uncommitted changes detected.${NC}"
    echo -e "${YELLOW}Do you want to commit and push these changes? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${GEAR} ${YELLOW}Committing changes...${NC}"
        git add .
        git commit -m "🚀 Production optimization and deployment preparation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
        git push origin main
        echo -e "${CHECK} ${GREEN}Changes committed and pushed${NC}"
    else
        echo -e "${WARNING} ${YELLOW}Continuing with uncommitted changes...${NC}"
    fi
fi

# Netlify deployment
echo -e "${ROCKET} ${YELLOW}Deploying to Netlify...${NC}"
echo -e "${BLUE}Starting production deployment...${NC}"

# Deploy to production
if netlify deploy --prod --timeout 300; then
    echo -e "${CHECK} ${GREEN}Deployment successful!${NC}"
    
    # Get deployment info
    echo -e "${BLUE}Getting deployment information...${NC}"
    DEPLOY_URL=$(netlify status --json | grep -o '"url":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$DEPLOY_URL" ]; then
        echo -e "${SPARKLES} ${GREEN}Deployment URL: ${DEPLOY_URL}${NC}"
    fi
    
    # Post-deployment checks
    echo -e "${TEST} ${YELLOW}Running post-deployment checks...${NC}"
    
    # Wait for deployment to be ready
    sleep 10
    
    # Check if site is accessible
    if command -v curl &> /dev/null && [ -n "$DEPLOY_URL" ]; then
        if curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" | grep -q "200"; then
            echo -e "${CHECK} ${GREEN}Site is accessible and responding${NC}"
        else
            echo -e "${WARNING} ${YELLOW}Site may not be fully accessible yet${NC}"
        fi
    fi
    
    # Success summary
    echo -e "${CYAN}================================================${NC}"
    echo -e "${SPARKLES} ${GREEN}DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}Your Murder Mystery Generator is now live!${NC}"
    
    if [ -n "$DEPLOY_URL" ]; then
        echo -e "${BLUE}URL: ${DEPLOY_URL}${NC}"
    fi
    
    echo -e "${CYAN}================================================${NC}"
    
    # Log deployment
    echo "$(date): Production deployment successful" >> deployment.log
    
else
    echo -e "${ERROR} ${RED}Deployment failed!${NC}"
    echo -e "${WARNING} ${YELLOW}Check the error messages above for details.${NC}"
    
    # Log deployment failure
    echo "$(date): Production deployment failed" >> deployment.log
    exit 1
fi

# Post-deployment cleanup
echo -e "${GEAR} ${YELLOW}Cleaning up...${NC}"

# Optional: Run post-build optimization
if [ -f "scripts/post-build-optimization.js" ]; then
    node scripts/post-build-optimization.js
fi

echo -e "${CHECK} ${GREEN}Production deployment completed successfully!${NC}"
echo -e "${SPARKLES} ${GREEN}Your application is now live and ready for users!${NC}"