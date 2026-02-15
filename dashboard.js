// ===========================
// Global Variables (MEMORY ONLY)
// ===========================
let encryptFileData = null;
let decryptFileData = null;
let decryptAttempts = 0;
let freezeUntil = null;
let currentUserData = null;
let userAccountPassword = null;
let accountIdentifier = null; // Hash of email for freeze tracking

// Freeze data stored temporarily in URL during login
const FREEZE_DURATION = 60 * 60 * 1000; // 1 hour

// ===========================
// Load User Data
// ===========================
window.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    setupEventListeners();
    setupDragAndDrop();
    checkFreezeStatus();
});

function loadUserData() {
    // Get data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userName = urlParams.get('name') || 'User';
    const userEmail = urlParams.get('email') || 'user@example.com';
    const userPicture = urlParams.get('picture');
    const accountPassword = urlParams.get('password');
    const freezeData = urlParams.get('freeze'); // Check if account is frozen
    
    // Create account identifier (hash of email - unique per account)
    accountIdentifier = btoa(userEmail); // Simple encoding for identifier
    
    // Check if this account is frozen
    if (freezeData) {
        const freezeTimestamp = parseInt(freezeData);
        const now = Date.now();
        
        if (now < freezeTimestamp) {
            // Still frozen!
            freezeUntil = freezeTimestamp;
            
            // Show freeze message immediately
            const remaining = freezeUntil - now;
            const minutes = Math.floor(remaining / 60000);
            
            showToast(`Account frozen! ${minutes} minutes remaining due to failed login attempts.`, 'error');
            
            // Disable decryption
            setTimeout(() => {
                disableDecryption();
                startFreezeTimer();
            }, 100);
            
            console.log('🔒 Account is frozen until:', new Date(freezeTimestamp));
        } else {
            // Freeze expired - allow login
            console.log('✅ Freeze expired. Account unlocked.');
        }
    }
    
    // Store in MEMORY only
    currentUserData = {
        name: userName,
        email: userEmail,
        picture: userPicture
    };
    
    userAccountPassword = accountPassword;
    
    // Display user info
    document.getElementById('userName').textContent = userName;
    document.getElementById('userEmail').textContent = userEmail;
    
    const avatar = document.getElementById('userAvatar');
    if (userPicture) {
        avatar.src = userPicture;
    } else {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563EB&color=fff`;
    }
    
    console.log('👤 User loaded:', userName);
    console.log('🔑 Account ID:', accountIdentifier);
}

// ===========================
// Freeze Check
// ===========================
function checkFreezeStatus() {
    if (freezeUntil && Date.now() < freezeUntil) {
        disableDecryption();
        startFreezeTimer();
    }
}

function disableDecryption() {
    const decryptBtn = document.getElementById('decryptBtn');
    const decryptPassword = document.getElementById('decryptPassword');
    
    decryptBtn.disabled = true;
    decryptPassword.disabled = true;
    decryptBtn.style.opacity = '0.5';
    decryptBtn.style.cursor = 'not-allowed';
}

function enableDecryption() {
    const decryptBtn = document.getElementById('decryptBtn');
    const decryptPassword = document.getElementById('decryptPassword');
    
    decryptBtn.disabled = false;
    decryptPassword.disabled = false;
    decryptBtn.style.opacity = '1';
    decryptBtn.style.cursor = 'pointer';
    
    freezeUntil = null;
    decryptAttempts = 0;
}

function startFreezeTimer() {
    const interval = setInterval(() => {
        const now = Date.now();
        const remaining = freezeUntil - now;
        
        if (remaining <= 0) {
            clearInterval(interval);
            enableDecryption();
            showToast('Decryption unlocked!', 'success');
        } else {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            
            const decryptBtn = document.getElementById('decryptBtn');
            decryptBtn.textContent = `Locked: ${minutes}m ${seconds}s`;
        }
    }, 1000);
}

// ===========================
// Setup Event Listeners
// ===========================
function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    document.getElementById('encryptFileInput').addEventListener('change', handleEncryptFile);
    document.getElementById('decryptFileInput').addEventListener('change', handleDecryptFile);
    document.getElementById('encryptBtn').addEventListener('click', performEncryption);
    document.getElementById('decryptBtn').addEventListener('click', performDecryption);
    document.getElementById('newChatBtn').addEventListener('click', newSession);
    
    // Logout button
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', handleLogout);
    }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}Tab`).classList.add('active');
}

// ===========================
// LOGOUT WITH PASSWORD VERIFICATION
// ===========================
function handleLogout() {
    // Check if Google OAuth user
    if (userAccountPassword && userAccountPassword.startsWith('google_oauth_')) {
        // Google user - Show confirmation dialog (no password needed)
        showGoogleLogoutConfirm();
    } else {
        // Normal user - Show password modal
        showPasswordModal();
    }
}

function showGoogleLogoutConfirm() {
    const modal = document.createElement('div');
    modal.className = 'logout-modal';
    modal.innerHTML = `
        <div class="logout-modal-content">
            <h2>Confirm Logout</h2>
            <p>You are signed in with Google</p>
            <p style="margin-top: 1rem; color: var(--color-text-secondary);">
                Logging out will clear all encrypted/decrypted data from memory.
            </p>
            <div class="logout-actions" style="margin-top: 2rem;">
                <button class="btn-cancel" onclick="closeLogoutModal()">Cancel</button>
                <button class="btn-logout" onclick="confirmGoogleLogout()">Logout</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function confirmGoogleLogout() {
    clearAllData();
    showToast('Logging out...', 'success');
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

function showPasswordModal() {
    // Create modal for password verification
    const modal = document.createElement('div');
    modal.className = 'logout-modal';
    modal.innerHTML = `
        <div class="logout-modal-content">
            <h2>Confirm Logout</h2>
            <p>Enter your account password to logout and clear all data</p>
            <div class="logout-password-wrapper">
                <input type="password" id="logoutPassword" placeholder="Enter your password" autocomplete="off">
                <button type="button" class="toggle-logout-password" onclick="toggleLogoutPassword()">
                    <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </div>
            <div class="logout-actions">
                <button class="btn-cancel" onclick="closeLogoutModal()">Cancel</button>
                <button class="btn-logout" onclick="verifyAndLogout()">Logout</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on password input
    setTimeout(() => {
        document.getElementById('logoutPassword').focus();
    }, 100);
    
    // Enter key to logout
    document.getElementById('logoutPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyAndLogout();
        }
    });
}

function toggleLogoutPassword() {
    const input = document.getElementById('logoutPassword');
    const button = event.target.closest('.toggle-logout-password');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
            <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
        `;
    } else {
        input.type = 'password';
        button.innerHTML = `
            <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `;
    }
}

function closeLogoutModal() {
    const modal = document.querySelector('.logout-modal');
    if (modal) {
        modal.remove();
    }
}

function verifyAndLogout() {
    const enteredPassword = document.getElementById('logoutPassword').value;
    
    console.log('🔐 Logout verification started');
    console.log('Entered password:', enteredPassword ? '***' : '(empty)');
    console.log('Stored password:', userAccountPassword ? '***' : '(empty)');
    
    // Check if password field has value
    if (!enteredPassword) {
        console.log('❌ No password entered');
        showToast('Please enter your password!', 'error');
        return;
    }
    
    // Verify password
    if (enteredPassword === userAccountPassword) {
        console.log('✅ Password correct! Logging out...');
        // Correct password - Clear EVERYTHING
        closeLogoutModal();
        clearAllData();
        showToast('Logging out...', 'success');
        
        setTimeout(() => {
            // Redirect to login page
            window.location.href = 'login.html';
        }, 1000);
    } else {
        console.log('❌ Wrong password!');
        console.log('Expected:', userAccountPassword);
        console.log('Got:', enteredPassword);
        // Wrong password
        showToast('Incorrect password! Cannot logout.', 'error');
        document.getElementById('logoutPassword').value = '';
        document.getElementById('logoutPassword').focus();
    }
}

function clearAllData() {
    // Clear all global variables
    encryptFileData = null;
    decryptFileData = null;
    decryptAttempts = 0;
    freezeUntil = null;
    currentUserData = null;
    userAccountPassword = null;
    
    // Clear all form inputs
    document.getElementById('encryptText').value = '';
    document.getElementById('decryptText').value = '';
    document.getElementById('encryptPassword').value = '';
    document.getElementById('decryptPassword').value = '';
    
    // Clear file inputs
    document.getElementById('encryptFileInput').value = '';
    document.getElementById('decryptFileInput').value = '';
    
    // Hide results
    document.getElementById('encryptResult').style.display = 'none';
    document.getElementById('decryptResult').style.display = 'none';
    
    // Clear outputs
    document.getElementById('encryptedOutput').textContent = '';
    document.getElementById('decryptedOutput').textContent = '';
    
    // Clear file preview
    clearFilePreview();
    
    console.log('All data cleared from memory!');
}

// ===========================
// Drag and Drop
// ===========================
function setupDragAndDrop() {
    ['encryptUploadArea', 'decryptUploadArea'].forEach(id => {
        const area = document.getElementById(id);
        
        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            area.classList.add('dragover');
        });

        area.addEventListener('dragleave', () => {
            area.classList.remove('dragover');
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            area.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                if (id === 'encryptUploadArea') {
                    handleEncryptFile({ target: { files: files } });
                } else {
                    handleDecryptFile({ target: { files: files } });
                }
            }
        });

        area.addEventListener('click', () => {
            if (id === 'encryptUploadArea') {
                document.getElementById('encryptFileInput').click();
            } else {
                document.getElementById('decryptFileInput').click();
            }
        });
    });
}

// ===========================
// File Preview in Sidebar
// ===========================
function showFilePreview(fileName, fileSize, fileContent, fileType) {
    const previewContent = document.getElementById('filePreviewContent');
    
    previewContent.classList.add('has-content');
    previewContent.innerHTML = `
        <div class="file-preview-box">
            <div class="file-preview-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${fileType === 'pdf' 
                        ? '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'
                        : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'
                    }
                </svg>
                <div class="file-preview-info">
                    <div class="file-preview-name">${fileName}</div>
                    <div class="file-preview-size">${fileSize}</div>
                </div>
            </div>
            <div class="file-preview-text">
                <pre>${fileContent.substring(0, 500)}${fileContent.length > 500 ? '...' : ''}</pre>
            </div>
        </div>
    `;
}

function clearFilePreview() {
    const previewContent = document.getElementById('filePreviewContent');
    previewContent.classList.remove('has-content');
    previewContent.innerHTML = `
        <div class="no-preview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
            </svg>
            <p>Upload a file to see preview</p>
        </div>
    `;
}

// ===========================
// File Handling
// ===========================
function handleEncryptFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        return;
    }

    const allowedTypes = ['.txt', '.pdf', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showToast('Only TXT, PDF, and DOCX files are supported', 'error');
        return;
    }

    encryptFileData = file;
    
    document.getElementById('encryptUploadArea').style.display = 'none';
    document.getElementById('encryptFilePreview').style.display = 'block';
    document.getElementById('encryptFileName').textContent = file.name;
    document.getElementById('encryptFileSize').textContent = formatFileSize(file.size);

    readFileContent(file, 'encrypt');
}

function handleDecryptFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        return;
    }

    decryptFileData = file;
    
    document.getElementById('decryptUploadArea').style.display = 'none';
    document.getElementById('decryptFilePreview').style.display = 'block';
    document.getElementById('decryptFileName').textContent = file.name;
    document.getElementById('decryptFileSize').textContent = formatFileSize(file.size);

    readFileContent(file, 'decrypt');
}

function readFileContent(file, mode) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const content = e.target.result;
        
        if (mode === 'encrypt') {
            document.getElementById('encryptText').value = content;
            showFilePreview(file.name, formatFileSize(file.size), content, file.type);
        } else {
            document.getElementById('decryptText').value = content;
            showFilePreview(file.name, formatFileSize(file.size), content, file.type);
        }
    };

    reader.readAsText(file);
}

function removeEncryptFile() {
    encryptFileData = null;
    document.getElementById('encryptUploadArea').style.display = 'block';
    document.getElementById('encryptFilePreview').style.display = 'none';
    document.getElementById('encryptFileInput').value = '';
    document.getElementById('encryptText').value = '';
    clearFilePreview();
}

function removeDecryptFile() {
    decryptFileData = null;
    document.getElementById('decryptUploadArea').style.display = 'block';
    document.getElementById('decryptFilePreview').style.display = 'none';
    document.getElementById('decryptFileInput').value = '';
    document.getElementById('decryptText').value = '';
    clearFilePreview();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            if (file.type === 'application/pdf') {
                const bytes = new Uint8Array(e.target.result);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);
                resolve(`PDF_BASE64:${base64}`);
            } else {
                resolve(e.target.result);
            }
        };
        
        reader.onerror = reject;
        
        if (file.type === 'application/pdf') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    });
}

// ===========================
// Encryption
// ===========================
async function performEncryption() {
    const text = document.getElementById('encryptText').value.trim();
    const password = document.getElementById('encryptPassword').value.trim();

    if (!password) {
        showToast('Please enter a password for encryption', 'error');
        return;
    }

    if (!text && !encryptFileData) {
        showToast('Please enter text or upload a file to encrypt', 'error');
        return;
    }

    try {
        const btn = document.getElementById('encryptBtn');
        btn.classList.add('loading');
        btn.disabled = true;
        btn.textContent = 'Encrypting...';

        let contentToEncrypt = text;

        if (encryptFileData) {
            contentToEncrypt = await readFileAsText(encryptFileData);
        }

        const encrypted = CryptoJS.AES.encrypt(contentToEncrypt, password).toString();
        
        document.getElementById('encryptedOutput').textContent = encrypted;
        document.getElementById('encryptResult').style.display = 'block';
        
        document.getElementById('encryptResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        showToast('Encrypted successfully! Copy the text.', 'success');
        
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Encrypt Data
        `;
    } catch (error) {
        console.error('Encryption error:', error);
        showToast('Encryption failed. Please try again.', 'error');
        
        const btn = document.getElementById('encryptBtn');
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Encrypt Data
        `;
    }
}

// ===========================
// Decryption (3 Attempts + 1 Hour Freeze)
// ===========================
async function performDecryption() {
    console.log('🔓 Decryption attempt started');
    console.log('Current attempts:', decryptAttempts);
    console.log('Freeze until:', freezeUntil);
    
    // Check freeze status
    if (freezeUntil && Date.now() < freezeUntil) {
        const remaining = freezeUntil - Date.now();
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        console.log('❌ Still frozen for:', minutes, 'min', seconds, 'sec');
        showToast(`Account frozen! ${minutes}m ${seconds}s remaining`, 'error');
        return;
    }

    const encryptedText = document.getElementById('decryptText').value.trim();
    const password = document.getElementById('decryptPassword').value.trim();

    if (!encryptedText && !decryptFileData) {
        showToast('Please enter encrypted text or upload a file', 'error');
        return;
    }

    if (!password) {
        showToast('Please enter the decryption password', 'error');
        return;
    }

    try {
        const btn = document.getElementById('decryptBtn');
        btn.classList.add('loading');
        btn.disabled = true;
        btn.textContent = 'Decrypting...';

        let contentToDecrypt = encryptedText;

        if (decryptFileData) {
            contentToDecrypt = await readFileAsText(decryptFileData);
        }

        console.log('🔐 Attempting decryption...');
        const decrypted = CryptoJS.AES.decrypt(contentToDecrypt, password);
        const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

        // Check if decryption failed (wrong password)
        if (!decryptedText || decryptedText.length === 0) {
            console.log('❌ Wrong password!');
            
            decryptAttempts++;
            console.log('Failed attempts:', decryptAttempts, '/ 3');
            
            if (decryptAttempts >= 3) {
                console.log('🔒 FREEZING ACCOUNT for 1 hour!');
                freezeUntil = Date.now() + FREEZE_DURATION; // 1 hour
                
                // Force logout and redirect to login with freeze parameter
                showToast('3 failed attempts! Account frozen for 1 hour. Logging out...', 'error');
                
                setTimeout(() => {
                    // Redirect to login with freeze timestamp in URL
                    const freezeParams = new URLSearchParams({
                        freeze: freezeUntil.toString(),
                        email: currentUserData.email,
                        reason: 'failed_attempts'
                    });
                    
                    // Clear all data
                    clearAllData();
                    
                    // Redirect
                    window.location.href = 'login.html?' + freezeParams.toString();
                }, 2000);
                
            } else {
                const remaining = 3 - decryptAttempts;
                console.log('⚠️ Attempts remaining:', remaining);
                showToast(`Wrong password! ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`, 'error');
            }
            
            btn.classList.remove('loading');
            btn.disabled = false;
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                </svg>
                Decrypt Data
            `;
            return;
        }

        // SUCCESS!
        console.log('✅ Decryption successful!');
        decryptAttempts = 0; // Reset counter
        console.log('Attempts reset to 0');
        
        let displayText = decryptedText;
        if (decryptedText.startsWith('PDF_BASE64:')) {
            displayText = '[PDF File - Binary Data]\n\n' + 
                         'This was a PDF file. Content has been decrypted.';
        }

        document.getElementById('decryptedOutput').textContent = displayText;
        document.getElementById('decryptResult').style.display = 'block';
        
        document.getElementById('decryptResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        showToast('Decrypted successfully!', 'success');
        
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
            Decrypt Data
        `;
    } catch (error) {
        console.error('❌ Decryption error:', error);
        showToast('Decryption failed. Invalid encrypted text.', 'error');
        
        const btn = document.getElementById('decryptBtn');
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
            Decrypt Data
        `;
    }
}

// ===========================
// Clear Functions
// ===========================
function clearEncrypt() {
    document.getElementById('encryptText').value = '';
    document.getElementById('encryptPassword').value = '';
    document.getElementById('encryptResult').style.display = 'none';
    removeEncryptFile();
    showToast('Cleared', 'success');
}

function clearDecrypt() {
    document.getElementById('decryptText').value = '';
    document.getElementById('decryptPassword').value = '';
    document.getElementById('decryptResult').style.display = 'none';
    removeDecryptFile();
    showToast('Cleared', 'success');
}

// ===========================
// Copy Functions
// ===========================
function copyEncryptedText() {
    const encryptedText = document.getElementById('encryptedOutput').textContent;
    
    if (!encryptedText) {
        showToast('No text to copy!', 'error');
        return;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(encryptedText).then(() => {
        showToast('Encrypted text copied to clipboard! ✓', 'success');
        
        // Visual feedback
        const btn = event.target.closest('.btn-copy');
        btn.classList.add('copied');
        setTimeout(() => {
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Failed to copy text', 'error');
    });
}

function copyDecryptedText() {
    const decryptedText = document.getElementById('decryptedOutput').textContent;
    
    if (!decryptedText) {
        showToast('No text to copy!', 'error');
        return;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(decryptedText).then(() => {
        showToast('Decrypted text copied to clipboard! ✓', 'success');
        
        // Visual feedback
        const btn = event.target.closest('.btn-copy');
        btn.classList.add('copied');
        setTimeout(() => {
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Failed to copy text', 'error');
    });
}

// ===========================
// Password Toggle
// ===========================
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.innerHTML = `
            <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
        `;
    } else {
        input.type = 'password';
        button.innerHTML = `
            <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `;
    }
}

// ===========================
// New Session
// ===========================
function newSession() {
    clearEncrypt();
    clearDecrypt();
    switchTab('encrypt');
    clearFilePreview();
    showToast('New session started', 'success');
}

// ===========================
// Toast Notification
// ===========================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===========================
// Console Info
// ===========================
console.log('%c🔒 Secure The Data', 'color: #2563EB; font-size: 20px; font-weight: bold;');
console.log('%c✅ Zero Storage - Memory Only', 'color: #10B981; font-size: 14px;');
console.log('%c🔐 Logout Password Verification', 'color: #F59E0B; font-size: 14px;');