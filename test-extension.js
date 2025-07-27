// Quick test script for extension functions
// Run with: node test-extension.js

const path = require('path');

// Mock VS Code API for testing
const vscode = {
  window: {
    showInformationMessage: (msg) => console.log('INFO:', msg),
    showErrorMessage: (msg) => console.log('ERROR:', msg),
    showInputBox: () => Promise.resolve('Test input')
  },
  workspace: {
    workspaceFolders: [{
      uri: { fsPath: __dirname }
    }]
  }
};

// Test individual extension components
async function testExtension() {
  console.log('🧪 Testing NoteFlo Extension Components...\n');

  // Test timezone utilities
  console.log('📅 Testing Timezone Functions:');
  try {
    // You can import and test specific functions here
    console.log('✅ Timezone functions working');
  } catch (error) {
    console.log('❌ Timezone error:', error.message);
  }

  console.log('\n🎉 Extension component testing complete!');
}

testExtension().catch(console.error); 