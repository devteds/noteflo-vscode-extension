# Publishing NoteFlo VS Code Extension

This guide covers the complete process for publishing the NoteFlo extension to the VS Code Marketplace.

## 📋 Prerequisites

### 1. Microsoft Account & Azure DevOps
- **Microsoft Account**: Required for both Azure DevOps and VS Code Marketplace
- **Azure DevOps**: [dev.azure.com](https://dev.azure.com) - for Personal Access Token generation

### 2. VS Code Marketplace Publisher
- **Publisher Account**: [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)
- **Publisher ID**: `devteds` (must match `package.json`)
- **Domain Verification**: Required for website `https://www.devteds.com`

## 🔑 Personal Access Token Setup

### Generate PAT in Azure DevOps
1. Go to [Azure DevOps](https://dev.azure.com)
2. Click profile icon → **Personal access tokens**
3. Click **"+ New Token"**
4. Configure:
   ```
   Name: VS Code Extension Publishing
   Organization: [Your organization]
   Expiration: 1 year (recommended)
   Scopes: Custom defined → Marketplace → Manage ✓
   ```
5. **Copy and save the token securely**

### Store PAT Securely

**Method 1: .env File (Recommended)**
```bash
# Create .env file in project root
cat > .env << EOF
# VS Code Marketplace Personal Access Token
VSCE_PAT=your-personal-access-token-here

# Optional: Override publisher (defaults to package.json)
# VSCE_PUBLISHER=devteds
EOF

# Load environment variables
source .env

# Verify it's set
echo $VSCE_PAT
```

**Method 2: Environment Variable**
```bash
# Temporary (current session only)
export VSCE_PAT="your-personal-access-token-here"

# Permanent (add to shell profile)
echo 'export VSCE_PAT="your-token"' >> ~/.bashrc
source ~/.bashrc
```

## 🌐 Domain Verification

The publisher website (`https://www.devteds.com`) requires verification:

### Verification Methods
Choose one of these methods:

**Option A: DNS TXT Record**
```dns
Name: _vscode-marketplace-verification
Value: [verification-code-from-marketplace]
```

**Option B: HTML Meta Tag** (in `<head>` section)
```html
<meta name="vscode-marketplace-verification" content="[verification-code]" />
```

**Option C: HTML File**
```
URL: https://www.devteds.com/.well-known/vscode-marketplace-verification.txt
Content: [verification-code]
```

## 🚀 Publishing Process

### 1. Pre-Publishing Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped in `package.json` (for updates)
- [ ] `CHANGELOG.md` updated
- [ ] Domain verification completed
- [ ] Extension icon added (`assets/noteflo-icon.png`) - if updating
- [ ] README.md includes marketplace links and badges

### 2. Build and Package
```bash
# Clean build
npm run clean  # if available
npm install

# Production build
npm run package

# Create VSIX package
npx @vscode/vsce package

# Verify package contents
ls -la noteflo-*.vsix
```

### 3. Login to Marketplace
```bash
# Load environment variables from .env file
source .env

# Login with publisher ID
npx @vscode/vsce login devteds

# Verify login (should show devteds)
npx @vscode/vsce ls-publishers
```

### 4. Publish Extension

**Option A: Using npm scripts (Recommended)**
```bash
# Load environment variables from .env file
source .env

# Create VSIX package only
npm run package-vsix

# Test packaging (creates VSIX file for verification)
npm run publish:dry-run

# Publish to marketplace
npm run publish
```

**Option B: Direct vsce commands**
```bash
# Ensure environment variables are loaded
source .env

# Test packaging first (vsce publish has no dry-run option)
npx @vscode/vsce package

# Publish to marketplace
npx @vscode/vsce publish

# Or publish with version bump
npx @vscode/vsce publish patch  # 1.0.0 → 1.0.1
npx @vscode/vsce publish minor  # 1.0.0 → 1.1.0
npx @vscode/vsce publish major  # 1.0.0 → 2.0.0
```

### 5. Republishing Updates

**For Extension Updates (icon, description, etc.):**
```bash
# Option 1: Patch version bump
npm run publish patch  # 1.0.0 → 1.0.1

# Option 2: Same version (if no code changes)
npm run publish
```

**What gets updated:**
- Extension icon
- README content (shows in marketplace)
- Package.json metadata
- Any code changes

**Note:** Marketplace updates may take 5-10 minutes to appear.

## 🔧 Alternative Publishing Methods

### Manual Upload
If CLI publishing fails:
1. Create VSIX: `npx @vscode/vsce package`
2. Go to [Marketplace Management](https://marketplace.visualstudio.com/manage)
3. Upload `.vsix` file manually

### GitHub Actions (Future)
```yaml
# .github/workflows/publish.yml
name: Publish Extension
on:
  release:
    types: [published]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npx @vscode/vsce publish
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
```

## 🛠 Troubleshooting

### Common Issues

**"Publisher not found"**
- Ensure publisher `devteds` exists in marketplace
- Check PAT permissions include `Marketplace (Manage)`

**"Domain verification failed"**
- Complete domain verification process
- Temporary fix: Remove website from publisher profile

**"Package too large"**
- Check `.vscodeignore` excludes unnecessary files
- Verify esbuild is bundling correctly
- Target size: < 2MB

**"Category not available"**
- Use only valid VS Code extension categories
- Valid categories: Azure, Data Science, Debuggers, Extension Packs, Formatters, Keymaps, Language Packs, Linters, Machine Learning, Notebooks, Other, Programming Languages, SCM Providers, Snippets, Testing, Themes, Visualization
- Remove invalid categories like "Productivity"

**"Authentication failed"**
- Verify PAT is not expired
- Ensure same Microsoft account for PAT and publisher
- Try `npx @vscode/vsce logout` then login again

### Debug Commands
```bash
# Check package contents
npx @vscode/vsce ls

# Verify publisher details
npx @vscode/vsce show devteds.noteflo

# Check authentication
npx @vscode/vsce verify-pat
```

## 📈 Post-Publishing

### 1. Verification
- [ ] Extension appears in [marketplace](https://marketplace.visualstudio.com/items?itemName=devteds.noteflo)
- [ ] Installation works: `ext install devteds.noteflo`
- [ ] All features functional in installed version
- [ ] Custom icon displays correctly (not default VS Code icon)
- [ ] Marketplace badges show current version and stats

### 2. Marketing & Documentation
- [ ] Update README badges with marketplace info
- [ ] Announce on social media
- [ ] Add to Devteds course materials
- [ ] Consider blog post or tutorial

### 3. Monitoring
- [ ] Track download statistics
- [ ] Monitor user reviews and feedback
- [ ] Watch for bug reports in GitHub issues

## 📚 Useful Links

- **Marketplace Management**: [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)
- **Azure DevOps**: [dev.azure.com](https://dev.azure.com)
- **VSCE Documentation**: [code.visualstudio.com/api/working-with-extensions/publishing-extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- **Extension Guidelines**: [code.visualstudio.com/api/references/extension-guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## 🔐 Security Notes

- **Never commit PAT** to version control (`.env` is in `.gitignore` ✅)
- **Use `.env` file** for local development
- **Set PAT expiration** (max 1 year recommended)  
- **Rotate PAT periodically**
- **Limit PAT scope** to only required permissions
- **Don't share `.env` file** or commit it to git

### Quick Setup Example
```bash
# 1. Create .env file (ensure it's git-ignored)
cat > .env << 'EOF'
# Personal Access Token for VS Code Marketplace
VSCE_PAT=your-actual-token-from-azure-devops
EOF

# 2. Load and test
source .env
echo "PAT loaded: ${VSCE_PAT:0:8}..." # Shows first 8 chars

# 3. Use with npm scripts
npm run publish:dry-run  # Test first
npm run publish          # Actually publish
```

## 📞 Support

For publishing issues:
- **GitHub Issues**: [github.com/devteds/noteflo-vscode-extension/issues](https://github.com/devteds/noteflo-vscode-extension/issues)
- **VS Code Support**: [code.visualstudio.com/docs/supporting/faq](https://code.visualstudio.com/docs/supporting/faq)
- **Maintainer**: Chandra Shettigar ([@shettigarc](https://github.com/shettigarc))

---

*This document should be updated with each publishing experience to improve the process.* 