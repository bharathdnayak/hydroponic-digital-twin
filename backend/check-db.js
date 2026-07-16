const fs = require('fs');

const logPath = 'C:\\Users\\Dell\\.gemini\\antigravity\\brain\\327674bd-45d9-4acf-b425-8e4af18c7e3e\\.system_generated\\tasks\\task-435.log';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log('Total log lines:', lines.length);
  console.log('Last 25 lines of log:');
  console.log(lines.slice(-25).join('\n'));
} catch (err) {
  console.error(err);
}
