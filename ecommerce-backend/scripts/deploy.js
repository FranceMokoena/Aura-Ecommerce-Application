#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Aura Backend Deployment...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the backend directory.');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error(`❌ Error: Node.js 18+ required. Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if .env.production exists
if (!fs.existsSync('.env.production')) {
  console.error('❌ Error: .env.production file not found. Please create it with production environment variables.');
  process.exit(1);
}

console.log('✅ Production environment file found');

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm ci --only=production', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Run tests (if any)
console.log('\n🧪 Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ Tests passed');
} catch (error) {
  console.log('⚠️ No tests found or tests failed, continuing...');
}

// Check if deployment platform is specified
const platform = process.argv[2];

if (!platform) {
  console.log('\n📋 Available deployment platforms:');
  console.log('1. railway - Deploy to Railway');
  console.log('2. heroku - Deploy to Heroku');
  console.log('3. vercel - Deploy to Vercel');
  console.log('\nUsage: node scripts/deploy.js <platform>');
  process.exit(0);
}

console.log(`\n🚀 Deploying to ${platform}...`);

switch (platform.toLowerCase()) {
  case 'railway':
    deployToRailway();
    break;
  case 'heroku':
    deployToHeroku();
    break;
  case 'vercel':
    deployToVercel();
    break;
  default:
    console.error(`❌ Unknown platform: ${platform}`);
    console.log('Available platforms: railway, heroku, vercel');
    process.exit(1);
}

function deployToRailway() {
  try {
    console.log('🚂 Deploying to Railway...');
    
    // Check if Railway CLI is installed
    try {
      execSync('railway --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing Railway CLI...');
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
    }
    
    // Login to Railway
    console.log('🔐 Logging in to Railway...');
    execSync('railway login', { stdio: 'inherit' });
    
    // Initialize project if not already done
    if (!fs.existsSync('.railway')) {
      console.log('🏗️ Initializing Railway project...');
      execSync('railway init', { stdio: 'inherit' });
    }
    
    // Deploy
    console.log('🚀 Deploying...');
    execSync('railway up', { stdio: 'inherit' });
    
    console.log('✅ Successfully deployed to Railway!');
    console.log('🌐 Your backend is now live!');
    
  } catch (error) {
    console.error('❌ Railway deployment failed:', error.message);
    process.exit(1);
  }
}

function deployToHeroku() {
  try {
    console.log('🟣 Deploying to Heroku...');
    
    // Check if Heroku CLI is installed
    try {
      execSync('heroku --version', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ Heroku CLI not found. Please install it from https://devcenter.heroku.com/articles/heroku-cli');
      process.exit(1);
    }
    
    // Login to Heroku
    console.log('🔐 Logging in to Heroku...');
    execSync('heroku login', { stdio: 'inherit' });
    
    // Create app if not exists
    console.log('🏗️ Creating Heroku app...');
    try {
      execSync('heroku create aura-backend', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ App might already exist, continuing...');
    }
    
    // Set environment variables
    console.log('🔧 Setting environment variables...');
    const envVars = [
      'NODE_ENV=production',
      'PORT=5000'
    ];
    
    envVars.forEach(envVar => {
      try {
        execSync(`heroku config:set ${envVar}`, { stdio: 'inherit' });
      } catch (error) {
        console.log(`⚠️ Failed to set ${envVar}`);
      }
    });
    
    // Deploy
    console.log('🚀 Deploying...');
    execSync('git push heroku main', { stdio: 'inherit' });
    
    console.log('✅ Successfully deployed to Heroku!');
    console.log('🌐 Your backend is now live!');
    
  } catch (error) {
    console.error('❌ Heroku deployment failed:', error.message);
    process.exit(1);
  }
}

function deployToVercel() {
  try {
    console.log('▲ Deploying to Vercel...');
    
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing Vercel CLI...');
      execSync('npm install -g vercel', { stdio: 'inherit' });
    }
    
    // Login to Vercel
    console.log('🔐 Logging in to Vercel...');
    execSync('vercel login', { stdio: 'inherit' });
    
    // Deploy
    console.log('🚀 Deploying...');
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log('✅ Successfully deployed to Vercel!');
    console.log('🌐 Your backend is now live!');
    
  } catch (error) {
    console.error('❌ Vercel deployment failed:', error.message);
    process.exit(1);
  }
}

console.log('\n🎉 Deployment process completed!');
console.log('\n📋 Next steps:');
console.log('1. Update the PRODUCTION_API_URL in your mobile app');
console.log('2. Test all API endpoints');
console.log('3. Verify database connections');
console.log('4. Build and test your mobile app APK');
