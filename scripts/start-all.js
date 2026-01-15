#!/usr/bin/env node

/**
 * Start All Services Script
 * Starts Authentik and all applications (Lunacycle + Nigredo)
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(colors.green, '✓', message);
}

function logInfo(message) {
  log(colors.blue, '→', message);
}

function logWarning(message) {
  log(colors.yellow, '!', message);
}

function logError(message) {
  log('\x1b[31m', '✗', message);
}

async function checkDockerRunning() {
  return new Promise((resolve) => {
    const docker = spawn('docker', ['info'], { stdio: 'ignore' });
    docker.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function startAuthentik() {
  logInfo('Starting Authentik with Docker Compose...');

  return new Promise((resolve, reject) => {
    const dockerCompose = spawn('docker-compose', ['up', '-d'], {
      cwd: './infrastructure/authentik',
      stdio: 'pipe'
    });

    let output = '';
    dockerCompose.stdout.on('data', (data) => {
      output += data.toString();
    });

    dockerCompose.stderr.on('data', (data) => {
      output += data.toString();
    });

    dockerCompose.on('close', (code) => {
      if (code === 0) {
        logSuccess('Authentik started successfully');
        resolve();
      } else {
        logError('Failed to start Authentik');
        console.log(output);
        reject(new Error('Authentik failed to start'));
      }
    });
  });
}

async function waitForAuthentik() {
  logInfo('Waiting for Authentik to be ready...');

  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch('http://localhost:9000/api/v3/core/applications/', {
        method: 'HEAD'
      });

      if (response.status < 500) {
        logSuccess('Authentik is ready!');
        return true;
      }
    } catch (error) {
      // Authentik not ready yet
    }

    attempts++;
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('');
  logWarning('Authentik may still be starting up, continuing anyway...');
  return false;
}

function startNxApps() {
  logInfo('Starting all applications...');

  const nx = spawn('pnpm', ['nx', 'run-many', '-t', 'serve', '-p',
    'lunacycle-web', 'lunacycle-server', 'nigredo-web', 'nigredo-server'], {
    stdio: 'inherit',
    shell: true
  });

  return nx;
}

async function main() {
  console.log('');
  console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║   🚀 Starting All Services                ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  // Check if Docker is running
  const dockerRunning = await checkDockerRunning();
  if (!dockerRunning) {
    logError('Docker is not running!');
    logInfo('Please start Docker Desktop and try again.');
    process.exit(1);
  }

  try {
    // Start Authentik
    await startAuthentik();

    // Wait for Authentik to be ready
    await waitForAuthentik();

    console.log('');
    logSuccess('All infrastructure ready! Starting applications...');
    console.log('');

    // Start NX apps
    const nxProcess = startNxApps();

    console.log('');
    console.log(`${colors.bright}${colors.green}╔═══════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.green}║   ✓ All Services Started!                 ║${colors.reset}`);
    console.log(`${colors.bright}${colors.green}╚═══════════════════════════════════════════╝${colors.reset}`);
    console.log('');
    console.log(`${colors.cyan}Access your applications:${colors.reset}`);
    console.log(`  ${colors.bright}Authentik:${colors.reset}      http://localhost:9000`);
    console.log(`  ${colors.bright}Lunacycle Web:${colors.reset}  http://localhost:8080`);
    console.log(`  ${colors.bright}Lunacycle API:${colors.reset}  http://localhost:3000/api`);
    console.log(`  ${colors.bright}Nigredo Web:${colors.reset}    http://localhost:8081`);
    console.log(`  ${colors.bright}Nigredo API:${colors.reset}    http://localhost:3001/api`);
    console.log('');
    console.log(`${colors.yellow}Press Ctrl+C to stop all services${colors.reset}`);
    console.log('');

    // Handle cleanup on exit
    process.on('SIGINT', () => {
      console.log('');
      logInfo('Stopping services...');
      nxProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    logError(`Failed to start services: ${error.message}`);
    process.exit(1);
  }
}

main();
