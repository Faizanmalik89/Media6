// Main JavaScript File
// This file handles page navigation, UI interactions, and general functionality

// DOM elements for navigation
const menuToggle = document.getElementById('menu-toggle');
const dropdownMenu = document.getElementById('dropdown-menu');
const menuItems = document.querySelectorAll('.dropdown-menu li');
const pages = document.querySelectorAll('.page');

// DOM elements for the admin panel
const adminTabs = document.querySelectorAll('.admin-sidebar li');
const adminTabContents = document.querySelectorAll('.admin-tab');

// DOM elements for auth tabs
// const authTabs = document.querySelectorAll('.auth-tabs .tab'); // Defined in auth.js
// const authForms = document.querySelectorAll('.auth-form'); // Defined in auth.js

// DOM elements for stats
const visitCountElement = document.getElementById('visit-count');
const userCountElement = document.getElementById('user-count');

// Variable to track the current page
let currentPage = 'home';

// Initialize the application
function init() {
    // Set up event listeners
    setupEventListeners();
    
    // Load stats
    loadStats();
    
    // Check for page in URL hash
    checkUrlHash();
    
    // Add hash change listener for navigation
    window.addEventListener('hashchange', checkUrlHash);
}

// Set up event listeners
function setupEventListeners() {
    // Menu toggle
    menuToggle.addEventListener('click', toggleMenu);
    
    // Menu items
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            showPage(page);
            toggleMenu(); // Close the menu after selection
        });
    });
    
    // Admin tabs
    adminTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-admin-tab');
            showAdminTab(tabName);
        });
    });
    
    // Auth tabs - Using direct query selector instead of stored reference
    document.querySelectorAll('.auth-tabs .tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.getAttribute('data-tab');
            showAuthTab(tabType);
        });
    });
    
    // Footer navigation links
    document.querySelectorAll('.footer-links a[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Contact form submission
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmission);
    }
    
    // Website settings form submission
    const websiteSettingsForm = document.getElementById('website-settings-form');
    if (websiteSettingsForm) {
        websiteSettingsForm.addEventListener('submit', handleWebsiteSettingsSubmission);
    }
}

// Toggle the dropdown menu
function toggleMenu() {
    dropdownMenu.classList.toggle('active');
}

// Show a specific page
function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));
    
    // Show the selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Update navigation menu highlights
    menuItems.forEach(item => {
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update current page
    currentPage = pageId;
    
    // Update URL hash
    window.location.hash = pageId;
}

// Show admin tab content
function showAdminTab(tabName) {
    // Hide all tab contents
    adminTabContents.forEach(tab => tab.classList.remove('active'));
    
    // Show the selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Update tab highlights
    adminTabs.forEach(tab => {
        if (tab.getAttribute('data-admin-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Show auth tab
function showAuthTab(tabType) {
    // Hide all auth forms
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    // Show the selected auth form
    const selectedForm = document.getElementById(`${tabType}-form`);
    if (selectedForm) {
        selectedForm.classList.add('active');
    }
    
    // Update auth tab highlights
    document.querySelectorAll('.auth-tabs .tab').forEach(tab => {
        if (tab.getAttribute('data-tab') === tabType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Check URL hash for navigation
function checkUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        showPage(hash);
    } else if (currentPage) {
        showPage(currentPage);
    } else {
        showPage('home');
    }
}

// Handle contact form submission
function handleContactFormSubmission(e) {
    e.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value;
    
    const responseElement = document.getElementById('contact-response');
    
    // Validate form
    if (!name || !email || !subject || !message) {
        responseElement.textContent = 'Please fill in all fields.';
        responseElement.style.color = 'red';
        return;
    }
    
    // Normally we would send this to a server, but for GitHub Pages we'll just show a success message
    responseElement.textContent = 'Thank you for your message! We will get back to you soon.';
    responseElement.style.color = 'green';
    
    // Clear form
    document.getElementById('contact-form').reset();
    
    // Log the form data for debugging
    console.log('Contact form submitted:', { name, email, subject, message });
    
    // Add to activity log in admin panel
    addActivityLog(`New contact message from ${name} (${email}): ${subject}`);
}

// Handle website settings form submission
function handleWebsiteSettingsSubmission(e) {
    e.preventDefault();
    
    const websiteTitle = document.getElementById('website-title').value;
    const websiteDescription = document.getElementById('website-description').value;
    const featuredBlogsCount = parseInt(document.getElementById('featured-blogs-count').value);
    const featuredVideosCount = parseInt(document.getElementById('featured-videos-count').value);
    
    // Validate form
    if (!websiteTitle || !websiteDescription || isNaN(featuredBlogsCount) || isNaN(featuredVideosCount)) {
        alert('Please fill in all fields correctly.');
        return;
    }
    
    // Save settings to local storage
    const settings = {
        websiteTitle,
        websiteDescription,
        featuredBlogsCount,
        featuredVideosCount
    };
    
    localDB.set(localDB.SETTINGS_KEY, settings);
    
    // Update UI
    document.querySelector('.logo h1').textContent = websiteTitle;
    document.querySelector('.hero p').textContent = websiteDescription;
    document.querySelector('.footer-logo h2').textContent = websiteTitle;
    document.querySelector('.footer-logo p').textContent = websiteDescription;
    
    // Show success message
    alert('Website settings updated successfully!');
    
    // Add to activity log
    addActivityLog('Website settings updated');
    
    // Refresh featured content
    if (typeof renderFeaturedBlogs === 'function') {
        renderFeaturedBlogs();
    }
    if (typeof renderFeaturedVideos === 'function') {
        renderFeaturedVideos();
    }
}

// Load stats from Firebase or local storage
function loadStats() {
    // Try to get stats from Firebase
    statsRef.doc('general').get()
        .then((doc) => {
            if (doc.exists) {
                const stats = doc.data();
                updateStatsUI(stats);
            } else {
                // Create stats document if it doesn't exist
                const initialStats = {
                    visits: 1,
                    blogs: 0,
                    videos: 0,
                    users: 0
                };
                statsRef.doc('general').set(initialStats);
                updateStatsUI(initialStats);
            }
        })
        .catch((error) => {
            console.error('Error loading stats from Firebase:', error);
            
            // Fallback to local storage
            const stats = localDB.get(localDB.STATS_KEY);
            updateStatsUI(stats);
        });
}

// Update stats UI elements
function updateStatsUI(stats) {
    if (visitCountElement) visitCountElement.textContent = stats.visits || 0;
    if (userCountElement) userCountElement.textContent = stats.users || 0;
    
    // We don't update blog and video counts here because they're updated in their respective JS files
}

// Add activity to the admin log
function addActivityLog(activity) {
    const activityLog = document.getElementById('activity-log');
    if (!activityLog) return;
    
    // Check if the empty state message exists
    const emptyState = activityLog.querySelector('.empty-state');
    if (emptyState) {
        activityLog.innerHTML = ''; // Clear the empty state
    }
    
    // Create activity item
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    // Format timestamp
    const timestamp = new Date().toLocaleString();
    
    // Create activity HTML
    activityItem.innerHTML = `
        <div class="activity-content">${activity}</div>
        <div class="activity-timestamp">${timestamp}</div>
    `;
    
    // Add to activity log
    activityLog.insertBefore(activityItem, activityLog.firstChild);
}

// Global function to check if the current user is an admin
window.isUserAdmin = function() {
    const user = auth.currentUser || localDB.getCurrentUser();
    return isAdmin(user);
};

// Make showPage function available globally
window.showPage = showPage;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
