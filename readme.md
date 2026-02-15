# 🔒 Secure The Data

**AES-256 Encryption & Decryption Web Application**

A secure, user-friendly web-based platform for encrypting and decrypting files with military-grade AES-256 encryption and zero data storage.

---

## 🌟 Key Features

- 🔐 **AES-256 Encryption** - Military-grade security
- 📁 **Multi-Format Support** - TXT, PDF, DOCX (up to 10MB)
- 🚫 **Zero Data Storage** - No localStorage/cookies
- ⚡ **Instant Processing** - <1 second encryption
- 🔄 **Cross-User Sharing** - Decrypt from any account
- 🎨 **Modern UI** - Responsive & mobile-friendly
- 🔒 **3-Attempt Lock** - Brute force protection
- 🌐 **Google OAuth** - Quick sign-in

---


## 💻 Technologies

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Encryption | CryptoJS 4.1.1 (AES-256) |
| Auth | Google OAuth 2.0 |
| Storage | None (Memory only) |
| Hosting | GitHub Pages (Free) |

---

## 📦 Quick Start

```bash
# Clone repository
git clone https://github.com/spyhacker444/secure-the-data.git

# Open in browser
# No installation required!
```

---

## 🔧 Setup Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable Google+ API
3. Create OAuth Client ID
4. Update `login.html` with your Client ID

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for details.

---

## 🎯 How It Works

### Encryption
```
File → Password → SALT → KEY → AES-256 → Encrypted Text
```

### Decryption
```
Encrypted Text → Extract SALT → Password → KEY → Original File
```

### Security
```
✅ No localStorage
✅ No sessionStorage
✅ No permanent storage
✅ Memory-only (RAM)
✅ Auto-clear on logout
```

---

## 👥 Team

- **Shashikant** (24-CSE-CS-026)

**Course:** Computer Science Engineering  
**Year:** 2025-2026

---



---

## ⭐ Support

Give a ⭐ if you like this project!

