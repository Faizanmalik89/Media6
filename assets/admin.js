// Admin Panel Handler
// This file handles all admin panel functionality

// DOM elements
const adminBlogCount = document.getElementById('admin-blog-count');
const adminVideoCount = document.getElementById('admin-video-count');
const adminCommentCount = document.getElementById('admin-comment-count');
const adminUserCount = document.getElementById('admin-user-count');
const activityLog = document.getElementById('activity-log');
const adminTabs = document.querySelectorAll('.admin-sidebar li');
const adminTabContents = document.querySelectorAll('.admin-tab');
const websiteSettingsForm = document.getElementById('website-settings-form');
const resetSettingsBtn = document.querySelector('.reset-btn');
const adminMenuItem = document.getElementById('admin-menu-item');
const adminPageTab = document.querySelector('li[data-page="admin"]');

// Variables
let activityLogs = [];

// Initialize admin panel
function initAdminPanel() {
    setupAdminEventListeners();
    loadAdminStats();
    loadActivityLog();
    updateAdminAccess();
}

// Setup admin event listeners
function setupAdminEventListeners() {
    // Admin tab navigation
    adminTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-admin-tab');
            showAdminTab(tabName);
        });
    });
    
    // Reset settings button
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', resetWebsiteSettings);
    }
    
    // Website settings form submission
    if (websiteSettingsForm) {
        websiteSettingsForm.addEventListener('submit', handleWebsiteSettingsSubmission);
    }
}

// Show admin tab
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

// Load admin statistics
function loadAdminStats() {
    // Try to get stats from Firebase
    statsRef.doc('general').get()
        .then((doc) => {
            if (doc.exists) {
                const stats = doc.data();
                updateAdminStatsUI(stats);
            }
        })
        .catch((error) => {
            console.error('Error loading admin stats from Firebase:', error);
            
            // Fallback to local storage
            const stats = localDB.get(localDB.STATS_KEY);
            updateAdminStatsUI(stats);
        });
    
    // Fetch comment count
    commentsRef.get()
        .then((querySnapshot) => {
            if (adminCommentCount) {
                adminCommentCount.textContent = querySnapshot.size;
            }
        })
        .catch((error) => {
            console.error('Error getting comment count:', error);
            
            // Fallback to local storage
            const comments = localDB.getAll(localDB.COMMENTS_KEY);
            if (adminCommentCount) {
                adminCommentCount.textContent = comments.length;
            }
        });
}

// Update admin stats UI
function updateAdminStatsUI(stats) {
    if (adminBlogCount) adminBlogCount.textContent = stats.blogs || 0;
    if (adminVideoCount) adminVideoCount.textContent = stats.videos || 0;
    if (adminUserCount) adminUserCount.textContent = stats.users || 0;
}

// Load activity log
function loadActivityLog() {
    if (!activityLog) return;
    
    // Initialize with empty state if no activities
    if (activityLogs.length === 0) {
        activityLog.innerHTML = '<p class="empty-state">No recent activity</p>';
    } else {
        activityLog.innerHTML = '';
        
        // Display activity logs
        activityLogs.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            activityItem.innerHTML = `
                <div class="activity-content">${activity.content}</div>
                <div class="activity-timestamp">${activity.timestamp}</div>
            `;
            
            activityLog.appendChild(activityItem);
        });
    }
}

// Add activity to log
function addActivityToLog(content) {
    // Create new activity
    const newActivity = {
        content: content,
        timestamp: new Date().toLocaleString()
    };
    
    // Add to activities array
    activityLogs.unshift(newActivity);
    
    // Limit to 20 recent activities
    if (activityLogs.length > 20) {
        activityLogs.pop();
    }
    
    // Update UI
    loadActivityLog();
}

// Handle website settings form submission
function handleWebsiteSettingsSubmission(e) {
    e.preventDefault();
    
    // Get form values
    const websiteTitle = document.getElementById('website-title').value;
    const websiteDescription = document.getElementById('website-description').value;
    const featuredBlogsCount = parseInt(document.getElementById('featured-blogs-count').value);
    const featuredVideosCount = parseInt(document.getElementById('featured-videos-count').value);
    
    // Validate form
    if (!websiteTitle || !websiteDescription || isNaN(featuredBlogsCount) || isNaN(featuredVideosCount)) {
        alert('Please fill in all fields correctly.');
        return;
    }
    
    // Save settings
    const settings = {
        websiteTitle,
        websiteDescription,
        featuredBlogsCount,
        featuredVideosCount
    };
    
    // Update Firebase
    settingsRef.doc('general').set(settings)
        .then(() => {
            console.log('Settings updated successfully!');
        })
        .catch((error) => {
            console.error('Error updating settings:', error);
            
            // Fallback to local storage
            localDB.set(localDB.SETTINGS_KEY, settings);
        });
    
    // Update UI elements
    document.querySelector('.logo h1').textContent = websiteTitle;
    document.querySelector('.hero p').textContent = websiteDescription;
    document.querySelector('.footer-logo h2').textContent = websiteTitle;
    document.querySelector('.footer-logo p').textContent = websiteDescription;
    
    // Add to activity log
    addActivityToLog('Website settings updated');
    
    // Show success message
    alert('Settings updated successfully!');
    
    // Refresh content if needed
    if (typeof renderFeaturedBlogs === 'function') {
        renderFeaturedBlogs();
    }
    if (typeof renderFeaturedVideos === 'function') {
        renderFeaturedVideos();
    }
}

// Reset website settings to defaults
function resetWebsiteSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
        return;
    }
    
    // Default settings
    const defaultSettings = {
        websiteTitle: 'BlogVid',
        websiteDescription: 'Your one-stop platform for informative blogs and engaging videos',
        featuredBlogsCount: 3,
        featuredVideosCount: 3
    };
    
    // Update form fields
    document.getElementById('website-title').value = defaultSettings.websiteTitle;
    document.getElementById('website-description').value = defaultSettings.websiteDescription;
    document.getElementById('featured-blogs-count').value = defaultSettings.featuredBlogsCount;
    document.getElementById('featured-videos-count').value = defaultSettings.featuredVideosCount;
    
    // Save settings
    settingsRef.doc('general').set(defaultSettings)
        .then(() => {
            console.log('Settings reset to defaults!');
        })
        .catch((error) => {
            console.error('Error resetting settings:', error);
            
            // Fallback to local storage
            localDB.set(localDB.SETTINGS_KEY, defaultSettings);
        });
    
    // Update UI elements
    document.querySelector('.logo h1').textContent = defaultSettings.websiteTitle;
    document.querySelector('.hero p').textContent = defaultSettings.websiteDescription;
    document.querySelector('.footer-logo h2').textContent = defaultSettings.websiteTitle;
    document.querySelector('.footer-logo p').textContent = defaultSettings.websiteDescription;
    
    // Add to activity log
    addActivityToLog('Website settings reset to defaults');
    
    // Show success message
    alert('Settings reset to defaults!');
    
    // Refresh content if needed
    if (typeof renderFeaturedBlogs === 'function') {
        renderFeaturedBlogs();
    }
    if (typeof renderFeaturedVideos === 'function') {
        renderFeaturedVideos();
    }
}

// Check and update admin access
function updateAdminAccess() {
    // Check if current user is an admin
    const user = auth.currentUser || localDB.getCurrentUser();
    
    if (user && isAdmin(user)) {
        // Show admin menu item
        if (adminMenuItem) {
            adminMenuItem.style.display = 'block';
        }
        
        // Add admin badge to header
        const userWelcome = document.getElementById('user-welcome');
        if (userWelcome && !userWelcome.textContent.includes('(Admin)')) {
            userWelcome.textContent += ' (Admin)';
        }
    } else {
        // Hide admin menu item
        if (adminMenuItem) {
            adminMenuItem.style.display = 'none';
        }
        
        // If user somehow reached admin page, redirect to home
        if (window.location.hash === '#admin') {
            window.location.hash = '#home';
        }
    }
}

// Global function to add to activity log
window.addActivityLog = function(content) {
    addActivityToLog(content);
};

// Global function to update admin access
window.updateAdminAccess = updateAdminAccess;

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup admin access check on auth state change
    auth.onAuthStateChanged(updateAdminAccess);
    
    // Initialize admin panel
    initAdminPanel();
});
