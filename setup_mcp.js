const fs = require('fs');
const path = require('path');

const userProfile = process.env.USERPROFILE || 'C:\\Users\\HP';
const configDir = path.join(userProfile, '.gemini', 'antigravity');
const configFile = path.join(configDir, 'mcp_config.json');

fs.mkdirSync(configDir, { recursive: true });

let config = {};
if (fs.existsSync(configFile)) {
  try {
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (e) {
    console.error('Warning: could not parse existing mcp_config.json, starting fresh');
  }
}

config.mcpServers = config.mcpServers || {};
config.mcpServers.supabase = {
  serverUrl: 'https://mcp.supabase.com/mcp?project_ref=ymyyziehzxoflieyffcz&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching'
};

fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
console.log('Successfully written MCP config to:', configFile);
console.log(JSON.stringify(config, null, 2));
