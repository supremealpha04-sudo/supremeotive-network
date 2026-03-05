function showLogin() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        loginForm.style.display = 'block';
        setTimeout(() => loginForm.classList.add('active'), 10);
    }
    if (signupForm) {
        signupForm.classList.remove('active');
        signupForm.style.display = 'none';
    }
}

function showSignup() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        loginForm.classList.remove('active');
        loginForm.style.display = 'none';
    }
    if (signupForm) {
        signupForm.style.display = 'block';
        setTimeout(() => signupForm.classList.add('active'), 10);
    }
}
