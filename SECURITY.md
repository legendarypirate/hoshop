# Security Guide - Preventing React2Shell (CVE-2025-55182) and Command Injection

## Overview
React2Shell vulnerabilities typically involve command injection through React Server Components or API routes. This guide provides comprehensive security measures to protect your VPS and application.

## Immediate Actions

### 1. Update Dependencies
```bash
# Check for outdated packages with known vulnerabilities
npm audit

# Fix automatically fixable vulnerabilities
npm audit fix

# Update Next.js and React to latest secure versions
npm update next react react-dom

# Check for specific CVE
npm audit | grep CVE-2025-55182
```

### 2. VPS Hardening

#### A. Firewall Configuration (UFW)
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

#### B. Fail2Ban Setup
```bash
# Install fail2ban
sudo apt-get update
sudo apt-get install fail2ban

# Configure fail2ban for SSH and web attacks
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### C. SSH Hardening
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Add/update these settings:
PermitRootLogin no
PasswordAuthentication no  # Use SSH keys only
PubkeyAuthentication yes
Port 2222  # Change default port (optional)
MaxAuthTries 3

# Restart SSH
sudo systemctl restart sshd
```

### 3. Application-Level Security

#### A. Input Validation & Sanitization
- ✅ **Current Status**: Your code uses parameterized queries (good!)
- ⚠️ **Improvement Needed**: Add input validation middleware

#### B. Security Headers
Add to `next.config.ts`:
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

#### C. Rate Limiting
Install and configure rate limiting:
```bash
npm install express-rate-limit
```

### 4. Database Security

#### A. PostgreSQL Hardening
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/postgresql.conf

# Recommended settings:
listen_addresses = 'localhost'  # Only local connections
ssl = on

# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Ensure only local connections:
local   all   all   md5
host    all   all   127.0.0.1/32   md5
```

#### B. Database User Permissions
```sql
-- Create limited user (not superuser)
CREATE USER hoshop_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE hos TO hoshop_user;
GRANT USAGE ON SCHEMA public TO hoshop_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hoshop_user;
```

### 5. File Upload Security

Your Excel import route needs additional validation:

```typescript
// Add file type and size validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv'
];

if (!ALLOWED_MIME_TYPES.includes(file.type)) {
  return NextResponse.json(
    { error: 'Invalid file type' },
    { status: 400 }
  );
}

if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: 'File too large' },
    { status: 400 }
  );
}
```

### 6. Environment Variables Security

```bash
# Ensure .env files are not committed
echo ".env*" >> .gitignore

# Use strong passwords
# Rotate secrets regularly
# Never expose .env files in production
```

### 7. Process Isolation

Run your application as a non-root user:
```bash
# Create dedicated user
sudo adduser --system --group --home /var/www/hos/hoshop nodejs

# Change ownership
sudo chown -R nodejs:nodejs /var/www/hos/hoshop

# Run as non-root user
sudo -u nodejs npm start
```

### 8. Monitoring & Logging

```bash
# Install log monitoring
sudo apt-get install logwatch

# Monitor application logs
tail -f /var/www/hos/hoshop/.next/trace
```

### 9. Regular Security Updates

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade

# Update Node.js (if using nvm)
nvm install --lts
nvm use --lts

# Check for npm vulnerabilities weekly
npm audit
```

## Code-Specific Fixes

### Fix JSON.parse() Vulnerability
In `app/api/live/import/route.ts` line 16, add error handling:

```typescript
try {
  const parsed = JSON.parse(row.column_names);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid column_names format');
  }
  mappings.set(row.field_name, {
    columnNames: parsed,
    isRequired: row.is_required,
  });
} catch (error) {
  console.error('Invalid JSON in column_names:', error);
  // Skip invalid entries
}
```

## Testing Security

```bash
# Run security audit
npm audit

# Check for exposed secrets
npx secretlint

# Test with OWASP ZAP or Burp Suite
```

## Emergency Response

If you suspect a breach:
1. **Immediately** change all passwords
2. Rotate API keys and secrets
3. Review access logs
4. Check for unauthorized file changes
5. Restore from clean backup if needed
6. Report to your hosting provider

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [CVE Database](https://cve.mitre.org/)

## Regular Maintenance Schedule

- **Daily**: Monitor logs for suspicious activity
- **Weekly**: Run `npm audit` and update packages
- **Monthly**: Review and rotate credentials
- **Quarterly**: Full security audit and penetration testing

