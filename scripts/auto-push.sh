#!/bin/bash

# 🚀 ULTRA AUTO-PUSH SCRIPT V3.0
# Intelligent Git automation with Claude Code integration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis for better UX
ROCKET="🚀"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
GEAR="⚙️"
SPARKLES="✨"

echo -e "${PURPLE}${ROCKET} ULTRA AUTO-PUSH SYSTEM V3.0${NC}"
echo -e "${CYAN}================================${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${ERROR} ${RED}Not in a git repository!${NC}"
    exit 1
fi

# Check for changes
echo -e "${GEAR} ${YELLOW}Checking for changes...${NC}"
if git diff-index --quiet HEAD --; then
    echo -e "${WARNING} ${YELLOW}No changes to commit.${NC}"
    exit 0
fi

# Show status
echo -e "${BLUE}Current status:${NC}"
git status --short

# Stage all changes
echo -e "${GEAR} ${YELLOW}Staging all changes...${NC}"
git add .

# Generate intelligent commit message
echo -e "${GEAR} ${YELLOW}Generating intelligent commit message...${NC}"

# Count changes
MODIFIED=$(git diff --cached --name-only | wc -l)
NEW_FILES=$(git diff --cached --name-only --diff-filter=A | wc -l)
DELETED_FILES=$(git diff --cached --name-only --diff-filter=D | wc -l)

# Detect file types
CSS_CHANGES=$(git diff --cached --name-only | grep -E '\.(css|scss)$' | wc -l)
JS_CHANGES=$(git diff --cached --name-only | grep -E '\.(js|ts)$' | wc -l)
HTML_CHANGES=$(git diff --cached --name-only | grep -E '\.(html)$' | wc -l)
API_CHANGES=$(git diff --cached --name-only | grep -E '^api/' | wc -l)

# Generate commit message based on changes
COMMIT_MSG="${SPARKLES} Auto-update: "

if [ $CSS_CHANGES -gt 0 ] && [ $JS_CHANGES -gt 0 ]; then
    COMMIT_MSG="${ROCKET} UI/UX & Logic Enhancement"
elif [ $CSS_CHANGES -gt 0 ]; then
    COMMIT_MSG="${SPARKLES} UI/UX Style Improvements"
elif [ $JS_CHANGES -gt 0 ]; then
    COMMIT_MSG="${GEAR} JavaScript Logic Updates"
elif [ $HTML_CHANGES -gt 0 ]; then
    COMMIT_MSG="${SPARKLES} HTML Structure Updates"
elif [ $API_CHANGES -gt 0 ]; then
    COMMIT_MSG="${ROCKET} API Enhancement"
else
    COMMIT_MSG="${SPARKLES} General improvements"
fi

# Add details
DETAILS=""
if [ $NEW_FILES -gt 0 ]; then
    DETAILS="$DETAILS\n- Added $NEW_FILES new files"
fi
if [ $MODIFIED -gt $NEW_FILES ]; then
    MODIFIED_COUNT=$((MODIFIED - NEW_FILES))
    DETAILS="$DETAILS\n- Modified $MODIFIED_COUNT files"
fi
if [ $DELETED_FILES -gt 0 ]; then
    DETAILS="$DETAILS\n- Deleted $DELETED_FILES files"
fi

# Add technical details
TECH_DETAILS=""
if [ $CSS_CHANGES -gt 0 ]; then
    TECH_DETAILS="$TECH_DETAILS\n- CSS/Style updates: $CSS_CHANGES files"
fi
if [ $JS_CHANGES -gt 0 ]; then
    TECH_DETAILS="$TECH_DETAILS\n- JavaScript updates: $JS_CHANGES files"
fi
if [ $HTML_CHANGES -gt 0 ]; then
    TECH_DETAILS="$TECH_DETAILS\n- HTML structure updates: $HTML_CHANGES files"
fi
if [ $API_CHANGES -gt 0 ]; then
    TECH_DETAILS="$TECH_DETAILS\n- API endpoint updates: $API_CHANGES files"
fi

# Build full commit message
FULL_COMMIT_MSG="$COMMIT_MSG

Auto-generated commit summary:$DETAILS$TECH_DETAILS

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

echo -e "${BLUE}Commit message:${NC}"
echo "$COMMIT_MSG"

# Commit
echo -e "${GEAR} ${YELLOW}Creating commit...${NC}"
git commit -m "$FULL_COMMIT_MSG"

# Push
echo -e "${ROCKET} ${YELLOW}Pushing to remote...${NC}"
git push origin main

echo -e "${CHECK} ${GREEN}Successfully pushed changes!${NC}"
echo -e "${SPARKLES} ${GREEN}Auto-push completed successfully!${NC}"

# Show final status
echo -e "${BLUE}Final status:${NC}"
git log --oneline -1