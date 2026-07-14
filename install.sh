#!/bin/bash
# Universal AI Skill Installer for Simple Elegant Design Standards

echo "Installing Simple Elegant Design Standards into your AI ecosystem..."

# Define the source of the rules
REPO_URL="https://raw.githubusercontent.com/Abhijeet-Vadera/simple-elegant-design-standards/main"
RULES_FILE="README.md"

TMP_FILE=$(mktemp)
echo "Downloading rules from GitHub..."
curl -fsSL "$REPO_URL/$RULES_FILE" -o "$TMP_FILE"

if [ $? -ne 0 ]; then
  echo "❌ Failed to download design standards. Please ensure the repository is public."
  rm -f "$TMP_FILE"
  exit 1
fi

echo "✓ Download successful."

# 1. Install for Cursor
cat "$TMP_FILE" > .cursorrules
echo "✓ Installed for Cursor IDE (created .cursorrules)"

# 2. Install for Windsurf
cat "$TMP_FILE" > .windsurfrules
echo "✓ Installed for Windsurf IDE (created .windsurfrules)"

# 3. Install for GitHub Copilot
mkdir -p .github
cat "$TMP_FILE" > .github/copilot-instructions.md
echo "✓ Installed for GitHub Copilot (created .github/copilot-instructions.md)"

# 4. General fallback for CLI agents (Claude Code, Antigravity, OpenCode, etc.)
cat "$TMP_FILE" > design-standards-skill.md
echo "✓ Installed for CLI Agents (created design-standards-skill.md)"

rm -f "$TMP_FILE"
echo ""
echo "🎉 Installation complete! Your AI is now equipped with professional design standards."
