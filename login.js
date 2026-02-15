// ===========================
// Google OAuth Configuration
// ===========================
// IMPORTANT: Replace 'YOUR_GOOGLE_CLIENT_ID' in login.html with your actual Client ID
// Get it from: https://console.cloud.google.com/apis/credentials

// ===========================
// Check for Account Freeze on Page Load
// ===========================
window.addEventListener('DOMContentLoaded', () => {
    // Check if redirected with freeze parameter
    const urlParams = new URLSearchParams(window.location.search);
    const freezeTimestamp = urlParams.get('freeze');
    const frozenEmail = urlParams.get('email');
    
    if (freezeTimestamp && frozenEmail) {
        const now = Date.now();
        const freeze = parseInt(freezeTimestamp);
        
        if (now < freeze) {
            // Account is frozen - show alert
            const remaining = freeze - now;
            const minutes = Math.floor(remaining / 60000);
            
            alert(`🔒 Account Frozen!\n\nEmail: ${frozenEmail}\nReason: 3 failed decryption attempts\nTime remaining: ${minutes} minutes\n\nPlease try again later.`);
            
            // Store temporarily to block login attempts
            window.frozenAccount = {
                email: frozenEmail,
                until: freeze
            };
        }
    }
});

// Google Sign-In Callback
function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    
    // Decode the JWT token to get user info
    const responsePayload = decodeJwtResponse(response.credential);
    
    console.log("ID: " + responsePayload.sub);
    console.log("Full Name: " + responsePayload.name);
    console.log("Email: " + responsePayload.email);
    console.log("Picture URL: " + responsePayload.picture);
    
    // Save user data to sessionStorage (not permanent)
    const userData = {
        name: responsePayload.name,
        email: responsePayload.email,
        picture: responsePayload.picture,
        id: responsePayload.sub
    };
    sessionStorage.setItem('userData', JSON.stringify(userData));
    
    // Show success message
    showSuccessMessage(`Welcome, ${responsePayload.name}! Redirecting to dashboard...`);
    
    // Redirect to dashboard with user data in URL
    setTimeout(() => {
        const params = new URLSearchParams({
            name: responsePayload.name,
            email: responsePayload.email,
            picture: responsePayload.picture || '',
            password: 'google_oauth_' + responsePayload.sub // Google login password
        });
        window.location.href = 'dashboard.html?' + params.toString();
    }, 1500);
}

// Decode JWT Token
function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}

// ===========================
// Form Elements
// ===========================
const signupForm = document.getElementById('signupForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const termsCheckbox = document.getElementById('terms');
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordStrength = document.getElementById('passwordStrength');

// ===========================
// Password Toggle Visibility
// ===========================
togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Change icon
    if (type === 'text') {
        togglePasswordBtn.innerHTML = `
            <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
        `;
    } else {
        togglePasswordBtn.innerHTML = `
            <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `;
    }
});

// ===========================
// Password Strength Checker
// ===========================
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = checkPasswordStrength(password);
    
    if (password.length === 0) {
        passwordStrength.className = 'password-strength';
        return;
    }
    
    passwordStrength.className = `password-strength active ${strength}`;
});

function checkPasswordStrength(password) {
    let strength = 0;
    
    // Check length
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Check for lowercase and uppercase
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    
    // Check for numbers
    if (/\d/.test(password)) strength++;
    
    // Check for special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
}

// ===========================
// Email Validation
// ===========================
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===========================
// Form Validation
// ===========================
function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(msg => {
        msg.classList.remove('active');
    });
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
    
    // Validate Full Name
    if (fullNameInput.value.trim().length < 2) {
        showError(fullNameInput, 'Please enter your full name');
        isValid = false;
    }
    
    // Validate Email
    if (!validateEmail(emailInput.value)) {
        showError(emailInput, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate Password
    if (passwordInput.value.length < 8) {
        showError(passwordInput, 'Password must be at least 8 characters long');
        isValid = false;
    }
    
    const strength = checkPasswordStrength(passwordInput.value);
    if (strength === 'weak') {
        showError(passwordInput, 'Please use a stronger password');
        isValid = false;
    }
    
    // Validate Terms
    if (!termsCheckbox.checked) {
        showError(termsCheckbox, 'You must accept the Terms of Service');
        isValid = false;
    }
    
    return isValid;
}

function showError(input, message) {
    const formGroup = input.closest('.form-group') || input.parentElement;
    formGroup.classList.add('error');
    
    // Create or update error message
    let errorMsg = formGroup.querySelector('.error-message');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        formGroup.appendChild(errorMsg);
    }
    errorMsg.textContent = message;
    errorMsg.classList.add('active');
}

// ===========================
// Form Submission
// ===========================
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const submitBtn = signupForm.querySelector('.btn-submit');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Collect form data
    const formData = {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        termsAccepted: termsCheckbox.checked
    };
    
    console.log('Form Data:', formData);
    
    // Save user data to sessionStorage (not permanent)
    const userData = {
        name: formData.fullName,
        email: formData.email,
        picture: null
    };
    sessionStorage.setItem('userData', JSON.stringify(userData));
    
    // Check if this account is frozen
    if (window.frozenAccount && window.frozenAccount.email === formData.email) {
        const now = Date.now();
        if (now < window.frozenAccount.until) {
            const remaining = window.frozenAccount.until - now;
            const minutes = Math.floor(remaining / 60000);
            alert(`🔒 This account is frozen!\n\nTime remaining: ${minutes} minutes\n\nPlease try again later.`);
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            return;
        }
    }
    
    // Simulate API call
    try {
        await simulateSignup(formData);
        
        // Show success message
        showSuccessMessage('Account created successfully! Redirecting to dashboard...');
        
        // Reset form
        signupForm.reset();
        passwordStrength.className = 'password-strength';
        
        // Redirect to dashboard with user data in URL
        setTimeout(() => {
            const params = new URLSearchParams({
                name: formData.fullName,
                email: formData.email,
                picture: '',
                password: formData.password // User's actual password
            });
            
            // Check if account was frozen - pass freeze time if still valid
            if (window.frozenAccount && window.frozenAccount.email === formData.email) {
                const now = Date.now();
                if (now < window.frozenAccount.until) {
                    params.append('freeze', window.frozenAccount.until.toString());
                }
            }
            
            window.location.href = 'dashboard.html?' + params.toString();
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

// ===========================
// Simulate Signup API Call
// ===========================
function simulateSignup(data) {
    return new Promise((resolve, reject) => {
        // Simulate network delay
        setTimeout(() => {
            // Here you would make an actual API call to your backend
            // Example:
            // fetch('/api/signup', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(data)
            // })
            
            console.log('Signup successful!', data);
            resolve({ success: true });
        }, 1500);
    });
}

// ===========================
// Success Message
// ===========================
function showSuccessMessage(message) {
    let successMsg = document.querySelector('.success-message');
    
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        signupForm.parentElement.insertBefore(successMsg, signupForm);
    }
    
    successMsg.textContent = message;
    successMsg.classList.add('active');
    
    setTimeout(() => {
        successMsg.classList.remove('active');
    }, 5000);
}

// ===========================
// Real-time Input Validation
// ===========================
emailInput.addEventListener('blur', () => {
    if (emailInput.value && !validateEmail(emailInput.value)) {
        showError(emailInput, 'Please enter a valid email address');
    }
});

fullNameInput.addEventListener('blur', () => {
    if (fullNameInput.value && fullNameInput.value.trim().length < 2) {
        showError(fullNameInput, 'Please enter your full name');
    }
});

// ===========================
// Auto-focus on page load
// ===========================
window.addEventListener('load', () => {
    fullNameInput.focus();
});

// ===========================
// Console Info
// ===========================
console.log('%c🔒 Secure The Data - Signup Page', 'color: #2563EB; font-size: 20px; font-weight: bold;');
console.log('%c⚠️ IMPORTANT: Replace Google Client ID in login.html', 'color: #F59E0B; font-size: 14px; font-weight: bold;');
console.log('%cGet your Client ID from: https://console.cloud.google.com/apis/credentials', 'color: #525252; font-size: 12px;');
console.log('%c\nSteps to get Google OAuth Client ID:', 'color: #10B981; font-size: 14px; font-weight: bold;');
console.log('1. Go to Google Cloud Console');
console.log('2. Create a new project or select existing');
console.log('3. Enable Google+ API');
console.log('4. Go to Credentials → Create OAuth 2.0 Client ID');
console.log('5. Add authorized JavaScript origins (e.g., http://localhost:5500)');
console.log('6. Copy the Client ID and replace in login.html');