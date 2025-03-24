// Firebase Configuration
// This file contains the Firebase configuration and initialization

// Initialize Firebase with your app's configuration
const firebaseConfig = {
    apiKey: "AIzaSyAZkJBYT1QjYk0ZoBm-oRqr7PcNQ5Pj3gc",
    authDomain: "blogvid-60246.firebaseapp.com",
    projectId: "blogvid-60246",
    storageBucket: "blogvid-60246.appspot.com",
    appId: "1:155711089559:web:d46ac51d79e0649a07fcc5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Firebase references
const blogsRef = db.collection('blogs');
const videosRef = db.collection('videos');
const usersRef = db.collection('users');
const commentsRef = db.collection('comments');
const statsRef = db.collection('stats');
const settingsRef = db.collection('settings');

// Check if we need to use local persistence for development
// Note: For GitHub Pages, we'll use local storage as a backup
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Enable offline persistence when available
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time
            console.log('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the features required for persistence
            console.log('Persistence not available in this browser');
        }
    });

// Setup local storage as a fallback (for GitHub Pages where Firebase might not be fully functional)
const localDB = {
    // Local storage keys
    BLOGS_KEY: 'blogvid_blogs',
    VIDEOS_KEY: 'blogvid_videos',
    USERS_KEY: 'blogvid_users',
    COMMENTS_KEY: 'blogvid_comments',
    STATS_KEY: 'blogvid_stats',
    SETTINGS_KEY: 'blogvid_settings',
    CURRENT_USER_KEY: 'blogvid_current_user',
    
    // Initialize local storage with default data if empty
    init() {
        if (!localStorage.getItem(this.BLOGS_KEY)) {
            localStorage.setItem(this.BLOGS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.VIDEOS_KEY)) {
            localStorage.setItem(this.VIDEOS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.USERS_KEY)) {
            localStorage.setItem(this.USERS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.COMMENTS_KEY)) {
            localStorage.setItem(this.COMMENTS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.STATS_KEY)) {
            localStorage.setItem(this.STATS_KEY, JSON.stringify({
                visits: 0,
                blogs: 0,
                videos: 0,
                users: 0
            }));
        }
        if (!localStorage.getItem(this.SETTINGS_KEY)) {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify({
                websiteTitle: 'BlogVid',
                websiteDescription: 'Your one-stop platform for informative blogs and engaging videos',
                featuredBlogsCount: 3,
                featuredVideosCount: 3
            }));
        }
    },
    
    // Get data from local storage
    get(key) {
        return JSON.parse(localStorage.getItem(key));
    },
    
    // Set data in local storage
    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    // Get all items from a collection
    getAll(collectionKey) {
        return this.get(collectionKey) || [];
    },
    
    // Get a single item by ID from a collection
    getById(collectionKey, id) {
        const collection = this.getAll(collectionKey);
        return collection.find(item => item.id === id);
    },
    
    // Add an item to a collection
    add(collectionKey, item) {
        const collection = this.getAll(collectionKey);
        const newItem = {
            ...item,
            id: this.generateId(),
            createdAt: new Date().toISOString()
        };
        collection.push(newItem);
        this.set(collectionKey, collection);
        return newItem;
    },
    
    // Update an item in a collection
    update(collectionKey, id, updates) {
        const collection = this.getAll(collectionKey);
        const index = collection.findIndex(item => item.id === id);
        if (index !== -1) {
            collection[index] = {
                ...collection[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.set(collectionKey, collection);
            return collection[index];
        }
        return null;
    },
    
    // Remove an item from a collection
    remove(collectionKey, id) {
        const collection = this.getAll(collectionKey);
        const filtered = collection.filter(item => item.id !== id);
        this.set(collectionKey, filtered);
        return filtered;
    },
    
    // Generate a unique ID
    generateId() {
        return Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    },
    
    // Increment stats counter
    incrementStat(statName) {
        const stats = this.get(this.STATS_KEY);
        if (stats && stats[statName] !== undefined) {
            stats[statName]++;
            this.set(this.STATS_KEY, stats);
        }
    },
    
    // Set current user
    setCurrentUser(user) {
        if (user) {
            this.set(this.CURRENT_USER_KEY, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                isAdmin: user.email === 'faizanmaliks888@gmail.com'
            });
        } else {
            localStorage.removeItem(this.CURRENT_USER_KEY);
        }
    },
    
    // Get current user
    getCurrentUser() {
        return this.get(this.CURRENT_USER_KEY);
    }
};

// Initialize local storage
localDB.init();

// Check if the current user is an admin
function isAdmin(user) {
    return user && user.email === 'faizanmaliks888@gmail.com';
}

// Function to record a site visit
function recordVisit() {
    // Try to update Firebase stats
    statsRef.doc('general').get()
        .then((doc) => {
            if (doc.exists) {
                statsRef.doc('general').update({
                    visits: firebase.firestore.FieldValue.increment(1)
                });
            } else {
                statsRef.doc('general').set({
                    visits: 1,
                    blogs: 0,
                    videos: 0,
                    users: 0
                });
            }
        })
        .catch((error) => {
            console.log('Error recording visit in Firebase:', error);
            // Fallback to local storage
            const stats = localDB.get(localDB.STATS_KEY);
            stats.visits++;
            localDB.set(localDB.STATS_KEY, stats);
        });
}

// Record a visit when the page loads
recordVisit();
