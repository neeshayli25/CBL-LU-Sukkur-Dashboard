const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log("Running npm run build...");
  const output = execSync('npm run build', { cwd: __dirname, encoding: 'utf-8', stdio: 'pipe' });
  fs.writeFileSync('build_output.txt', output);
  console.log("Build successful.");
} catch (error) {
  console.log("Build failed. Writing output to build_output.txt...");
  let out = error.stdout ? error.stdout.toString() : '';
  let err = error.stderr ? error.stderr.toString() : '';
  fs.writeFileSync('build_output.txt', out + '\n' + err);
}
