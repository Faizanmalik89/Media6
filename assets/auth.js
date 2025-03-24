// Authentication Handler
// This file handles user authentication, signup, and login

// DOM elements
const authText = document.getElementById('auth-text');
const authPage = document.getElementById('auth');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const signinBtn = document.getElementById('signin-btn');
const signupBtn = document.getElementById('signup-btn');
const authTabs = document.querySelectorAll('.auth-tabs .tab');
const authForms = document.querySelectorAll('.auth-form');
const logoutBtn = document.getElementById('logout-btn');
const userWelcome = document.getElementById('user-welcome');
// adminMenuItem is already declared in admin.js
// const adminMenuItem = document.getElementById('admin-menu-item');
const signinMessage = document.getElementById('signin-message');
const signupMessage = document.getElementById('signup-message');

// Variables to track authentication state
let currentUser = null;

// Initialize authentication state
function initAuth() {
    // Listen for authentication state changes
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            updateUIOnAuth(user);
            
            // Check if user is an admin
            checkAdminStatus(user);
            
            // Save user to local storage as fallback
            localDB.setCurrentUser(user);
            
            // Update stats
            updateUserStats();
        } else {
            // User is signed out
            currentUser = null;
            updateUIOnSignOut();
            
            // Clear local user
            localDB.setCurrentUser(null);
        }
    });
    
    // Check for saved user in local storage (in case Firebase auth fails)
    const localUser = localDB.getCurrentUser();
    if (localUser && !currentUser) {
        currentUser = localUser;
        updateUIOnAuth(localUser);
        
        // Check admin status
        if (localUser.isAdmin) {
            enableAdminFeatures();
        }
    }
}

// Update UI when user is authenticated
function updateUIOnAuth(user) {
    authText.textContent = 'Account';
    userWelcome.textContent = `Welcome, ${user.displayName || user.email}`;
    logoutBtn.style.display = 'inline-block';
}

// Update UI when user is signed out
function updateUIOnSignOut() {
    authText.textContent = 'Sign In';
    userWelcome.textContent = 'Welcome, Guest';
    logoutBtn.style.display = 'none';
    
    // Hide admin menu
    const adminMenuEl = document.getElementById('admin-menu-item');
    if (adminMenuEl) adminMenuEl.style.display = 'none';
    
    // Hide admin controls
    const adminBlogControls = document.getElementById('admin-blog-controls');
    if (adminBlogControls) adminBlogControls.style.display = 'none';
    
    const adminVideoControls = document.getElementById('admin-video-controls');
    if (adminVideoControls) adminVideoControls.style.display = 'none';
}

// Check if user is an admin
function checkAdminStatus(user) {
    if (isAdmin(user)) {
        enableAdminFeatures();
    }
}

// Enable admin features in the UI
function enableAdminFeatures() {
    // Get admin menu item and show it
    const adminMenuEl = document.getElementById('admin-menu-item');
    if (adminMenuEl) adminMenuEl.style.display = 'block';
    
    // Show admin controls on blogs and videos pages
    const adminBlogControls = document.getElementById('admin-blog-controls');
    if (adminBlogControls) adminBlogControls.style.display = 'block';
    
    const adminVideoControls = document.getElementById('admin-video-controls');
    if (adminVideoControls) adminVideoControls.style.display = 'block';
}

// Update user stats
function updateUserStats() {
    // Try to update Firebase stats
    statsRef.doc('general').get()
        .then((doc) => {
            if (doc.exists) {
                // Update the stats
                statsRef.doc('general').update({
                    users: firebase.firestore.FieldValue.increment(1)
                });
            }
        })
        .catch((error) => {
            console.log('Error updating user stats in Firebase:', error);
            // Fallback to local storage
            const stats = localDB.get(localDB.STATS_KEY);
            stats.users++;
            localDB.set(localDB.STATS_KEY, stats);
        });
}

// Sign in with email and password
function signInWithEmail(email, password) {
    signinBtn.disabled = true;
    signinBtn.textContent = 'Signing In...';
    signinMessage.textContent = '';
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            console.log('User signed in:', user);
            
            // Close auth page and show home page
            showPage('home');
            
            // Reset form
            document.getElementById('signin-email').value = '';
            document.getElementById('signin-password').value = '';
            
            // Show success message
            signinMessage.textContent = 'Sign in successful!';
            signinMessage.style.color = 'green';
        })
        .catch((error) => {
            console.error('Sign in error:', error);
            signinMessage.textContent = error.message;
            signinMessage.style.color = 'red';
        })
        .finally(() => {
            signinBtn.disabled = false;
            signinBtn.textContent = 'Sign In';
        });
}

// Sign up with email and password
function signUpWithEmail(username, email, password) {
    signupBtn.disabled = true;
    signupBtn.textContent = 'Signing Up...';
    signupMessage.textContent = '';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed up
            const user = userCredential.user;
            console.log('User signed up:', user);
            
            // Update user profile with username
            return user.updateProfile({
                displayName: username
            }).then(() => {
                // Profile updated, add user to users collection
                return usersRef.doc(user.uid).set({
                    uid: user.uid,
                    email: user.email,
                    displayName: username,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(error => {
                    console.error('Error adding user to Firestore:', error);
                    
                    // Fallback to local storage
                    localDB.add(localDB.USERS_KEY, {
                        uid: user.uid,
                        email: user.email,
                        displayName: username,
                        createdAt: new Date().toISOString()
                    });
                });
            });
        })
        .then(() => {
            // Close auth page and show home page
            showPage('home');
            
            // Reset form
            document.getElementById('signup-username').value = '';
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
            document.getElementById('signup-confirm').value = '';
            
            // Show success message
            signupMessage.textContent = 'Sign up successful! You are now logged in.';
            signupMessage.style.color = 'green';
        })
        .catch((error) => {
            console.error('Sign up error:', error);
            signupMessage.textContent = error.message;
            signupMessage.style.color = 'red';
        })
        .finally(() => {
            signupBtn.disabled = false;
            signupBtn.textContent = 'Sign Up';
        });
}

// Sign out
function signOut() {
    auth.signOut()
        .then(() => {
            console.log('User signed out');
            showPage('home');
        })
        .catch((error) => {
            console.error('Sign out error:', error);
        });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication
    initAuth();
    
    // Sign in form submission
    signinForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;
        signInWithEmail(email, password);
    });
    
    // Sign up form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            signupMessage.textContent = 'Passwords do not match!';
            signupMessage.style.color = 'red';
            return;
        }
        
        signUpWithEmail(username, email, password);
    });
    
    // Logout button
    logoutBtn.addEventListener('click', function() {
        signOut();
    });
    
    // Auth tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and forms
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding form
            const tabType = this.getAttribute('data-tab');
            this.classList.add('active');
            document.getElementById(`${tabType}-form`).classList.add('active');
            
            // Clear any error messages
            signinMessage.textContent = '';
            signupMessage.textContent = '';
        });
    });
});
