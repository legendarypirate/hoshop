#!/bin/bash

# Security Check Script for Hoshop
# Run this script regularly to check for security issues

echo "🔒 Hoshop Security Check"
echo "========================"
echo ""

# Check Node.js version
echo "📦 Node.js Version:"
node --version
echo ""

# Check npm version
echo "📦 npm Version:"
npm --version
echo ""

# Run npm audit
echo "🔍 Running npm audit..."
npm audit --audit-level=moderate
echo ""

# Check for outdated packages
echo "📋 Checking for outdated packages..."
npm outdated
echo ""

# Check for known vulnerabilities
echo "⚠️  Checking for known CVEs..."
npm audit --json | grep -i "CVE-2025-55182" && echo "⚠️  CVE-2025-55182 found!" || echo "✅ CVE-2025-55182 not found in current packages"
echo ""

# Check if .env files are exposed
echo "🔐 Checking for exposed .env files..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
    if git ls-files --error-unmatch .env .env.local 2>/dev/null; then
        echo "⚠️  WARNING: .env files are tracked in git!"
    else
        echo "✅ .env files are not tracked in git"
    fi
else
    echo "ℹ️  No .env files found"
fi
echo ""

# Check file permissions
echo "📁 Checking file permissions..."
if [ -d ".next" ]; then
    echo "✅ .next directory exists"
else
    echo "ℹ️  .next directory not found (run 'npm run build' first)"
fi
echo ""

# Check for security headers in next.config
echo "🛡️  Checking security configuration..."
if grep -q "X-Content-Type-Options" next.config.ts 2>/dev/null; then
    echo "✅ Security headers configured in next.config.ts"
else
    echo "⚠️  Security headers not found in next.config.ts"
fi
echo ""

# System security check (if running on server)
if [ "$EUID" -eq 0 ]; then
    echo "🖥️  System Security Check:"
    echo "Checking firewall status..."
    if command -v ufw &> /dev/null; then
        ufw status | head -5
    else
        echo "ℹ️  UFW not installed"
    fi
    echo ""
    
    echo "Checking fail2ban status..."
    if command -v fail2ban-client &> /dev/null; then
        fail2ban-client status 2>/dev/null | head -3 || echo "ℹ️  fail2ban not running"
    else
        echo "ℹ️  fail2ban not installed"
    fi
    echo ""
fi

echo "✅ Security check complete!"
echo ""
echo "📝 Recommendations:"
echo "1. Run 'npm audit fix' to fix automatically fixable vulnerabilities"
echo "2. Update packages regularly: 'npm update'"
echo "3. Review SECURITY.md for detailed security guidelines"
echo "4. Monitor logs for suspicious activity"
echo ""

