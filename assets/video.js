// Video Handler
// This file handles all video-related functionality

// DOM elements
const videosContainer = document.getElementById('videos-container');
const videoDetail = document.getElementById('video-detail');
const videoDetailContent = document.getElementById('video-detail-content');
const videoCommentsContainer = document.getElementById('video-comments-container');
const backToVideosBtn = document.getElementById('back-to-videos-btn');
const videoForm = document.getElementById('video-form');
const newVideoBtn = document.getElementById('new-video-btn');
const cancelVideoBtn = document.getElementById('cancel-video-btn');
const videoFormContainer = document.getElementById('video-form-container');
const adminNewVideoBtn = document.getElementById('admin-new-video-btn');
const submitVideoComment = document.getElementById('submit-video-comment');
const videoCommentText = document.getElementById('video-comment-text');
const adminVideosTable = document.getElementById('admin-videos-table');
const featuredVideosContainer = document.getElementById('featured-videos-container');
const videoCountElement = document.getElementById('video-count');
// const adminVideoCount = document.getElementById('admin-video-count'); // Defined in admin.js
const downloadVideoBtn = document.getElementById('download-video-btn');

// Variables
let videos = [];
let currentVideoId = null;

// Initialize videos
function initVideos() {
    loadVideos();
    setupVideoEventListeners();
    
    // Add sample videos if there are none
    videosRef.get().then((snapshot) => {
        if (snapshot.empty) {
            console.log('No videos found, adding sample videos');
            addSampleVideos();
        }
    }).catch((error) => {
        console.error('Error checking for videos:', error);
        
        // Check local storage as fallback
        const localVideos = localDB.getAll(localDB.VIDEOS_KEY);
        if (localVideos.length === 0) {
            console.log('No local videos found, adding sample videos');
            addSampleVideos();
        }
    });
}

// Load videos from Firebase
function loadVideos() {
    // Show loading state
    videosContainer.innerHTML = '<p class="loading">Loading videos</p>';
    featuredVideosContainer.innerHTML = '<p class="loading">Loading videos</p>';
    
    videosRef.orderBy('createdAt', 'desc').get()
        .then((querySnapshot) => {
            videos = [];
            querySnapshot.forEach((doc) => {
                const video = {
                    id: doc.id,
                    ...doc.data()
                };
                videos.push(video);
            });
            
            // Update counters
            updateVideoCounters(videos.length);
            
            // Render videos
            renderVideos();
            renderFeaturedVideos();
            renderAdminVideosTable();
        })
        .catch((error) => {
            console.error('Error loading videos from Firebase:', error);
            
            // Fallback to local storage
            videos = localDB.getAll(localDB.VIDEOS_KEY);
            
            // Update counters
            updateVideoCounters(videos.length);
            
            // Render videos
            renderVideos();
            renderFeaturedVideos();
            renderAdminVideosTable();
        });
}

// Update video counters
function updateVideoCounters(count) {
    if (videoCountElement) videoCountElement.textContent = count;
    
    // Get the admin video count element (might be defined in admin.js)
    const adminVideoCountEl = document.getElementById('admin-video-count');
    if (adminVideoCountEl) adminVideoCountEl.textContent = count;
}

// Render videos in the videos container
function renderVideos() {
    if (videos.length === 0) {
        videosContainer.innerHTML = '<p class="empty-state">No videos available yet</p>';
        return;
    }
    
    videosContainer.innerHTML = '';
    
    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';
        videoCard.setAttribute('data-id', video.id);
        
        // Use thumbnail or fallback image
        const thumbnailUrl = video.thumbnailUrl || 'https://via.placeholder.com/320x180?text=Video+Thumbnail';
        
        // Format date
        const videoDate = new Date(video.createdAt).toLocaleDateString();
        
        // Create video HTML
        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbnailUrl}" alt="${video.title}">
                <div class="play-icon">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-content">
                <h3>${video.title}</h3>
                <div class="video-meta">
                    <span class="video-date">${videoDate}</span>
                </div>
                <p class="video-description">${video.description}</p>
                <button class="watch-btn">Watch Video</button>
            </div>
        `;
        
        videosContainer.appendChild(videoCard);
    });
}

// Render featured videos on the home page
function renderFeaturedVideos() {
    if (videos.length === 0) {
        featuredVideosContainer.innerHTML = '<p class="empty-state">No videos available yet</p>';
        return;
    }
    
    featuredVideosContainer.innerHTML = '';
    
    // Get the settings
    const settings = localDB.get(localDB.SETTINGS_KEY);
    const featuredCount = settings ? settings.featuredVideosCount : 3;
    
    // Take the newest videos based on featured count
    const featuredVideos = videos.slice(0, featuredCount);
    
    featuredVideos.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.className = 'featured-item';
        videoItem.setAttribute('data-id', video.id);
        
        // Format date
        const videoDate = new Date(video.createdAt).toLocaleDateString();
        
        // Create video HTML
        videoItem.innerHTML = `
            <h4>${video.title}</h4>
            <div class="meta">
                <span class="date">${videoDate}</span>
            </div>
        `;
        
        featuredVideosContainer.appendChild(videoItem);
    });
}

// Render admin videos table
function renderAdminVideosTable() {
    if (videos.length === 0) {
        adminVideosTable.innerHTML = '<tr><td colspan="5" class="empty-state">No videos available</td></tr>';
        return;
    }
    
    adminVideosTable.innerHTML = '';
    
    videos.forEach(video => {
        // Format date
        const videoDate = new Date(video.createdAt).toLocaleDateString();
        
        // Get comment count
        let commentCount = 0;
        
        // Views count (would normally come from the database)
        const viewCount = Math.floor(Math.random() * 100); // Just for demonstration
        
        // Create table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${video.title}</td>
            <td>${videoDate}</td>
            <td>${commentCount}</td>
            <td>${viewCount}</td>
            <td class="table-actions">
                <button class="edit-btn" data-id="${video.id}">Edit</button>
                <button class="delete-btn" data-id="${video.id}">Delete</button>
            </td>
        `;
        
        adminVideosTable.appendChild(row);
    });
}

// Show video detail
function showVideoDetail(videoId) {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    
    currentVideoId = videoId;
    
    // Format date
    const videoDate = new Date(video.createdAt).toLocaleDateString();
    
    // Determine if the video is from YouTube or direct link
    let videoPlayerHtml = '';
    if (video.videoUrl.includes('youtube.com/embed/')) {
        // YouTube embed
        videoPlayerHtml = `
            <iframe src="${video.videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        `;
    } else {
        // Direct video link
        videoPlayerHtml = `
            <video controls>
                <source src="${video.videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    }
    
    // Create video detail HTML
    videoDetailContent.innerHTML = `
        <div class="video-player">
            ${videoPlayerHtml}
        </div>
        <div class="video-full-content">
            <h2>${video.title}</h2>
            <div class="video-full-meta">
                <span class="video-date">Posted on ${videoDate}</span>
            </div>
            <div class="video-full-description">${video.description}</div>
        </div>
    `;
    
    // Setup download button
    if (video.videoUrl.includes('youtube.com/embed/')) {
        // YouTube videos can't be directly downloaded
        downloadVideoBtn.style.display = 'none';
    } else {
        // Direct video links can be downloaded
        downloadVideoBtn.style.display = 'inline-block';
        downloadVideoBtn.onclick = function() {
            window.open(video.videoUrl, '_blank');
        };
    }
    
    // Hide videos container and show video detail
    videosContainer.style.display = 'none';
    document.getElementById('admin-video-controls').style.display = 'none';
    videoDetail.style.display = 'block';
    
    // Load comments
    loadVideoComments(videoId);
}

// Load video comments
function loadVideoComments(videoId) {
    // Clear comments container
    videoCommentsContainer.innerHTML = '<p class="loading">Loading comments</p>';
    
    // Get comments from Firebase
    commentsRef.where('videoId', '==', videoId).orderBy('createdAt', 'desc').get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                videoCommentsContainer.innerHTML = '<p class="empty-state">No comments yet. Be the first to comment!</p>';
                return;
            }
            
            videoCommentsContainer.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const comment = {
                    id: doc.id,
                    ...doc.data()
                };
                
                renderVideoComment(comment);
            });
        })
        .catch((error) => {
            console.error('Error loading comments from Firebase:', error);
            videoCommentsContainer.innerHTML = '<p class="empty-state">Failed to load comments. Please try again later.</p>';
        });
}

// Render a single video comment
function renderVideoComment(comment) {
    const commentItem = document.createElement('div');
    commentItem.className = 'comment-item';
    
    // Format date
    const commentDate = new Date(comment.createdAt).toLocaleDateString();
    
    // Create comment HTML
    commentItem.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${comment.author || 'Anonymous'}</span>
            <span class="comment-date">${commentDate}</span>
        </div>
        <div class="comment-text">${comment.text}</div>
    `;
    
    videoCommentsContainer.appendChild(commentItem);
}

// Add a new video
function addVideo(videoData) {
    // Create a new video object
    const newVideo = {
        title: videoData.title,
        description: videoData.description,
        videoUrl: videoData.videoUrl,
        thumbnailUrl: videoData.thumbnailUrl || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Add video to Firebase
    return videosRef.add(newVideo)
        .then((docRef) => {
            console.log('Video added with ID:', docRef.id);
            
            // Update local video array
            newVideo.id = docRef.id;
            newVideo.createdAt = new Date().toISOString(); // Use current date until server timestamp arrives
            videos.unshift(newVideo);
            
            // Update counters
            updateVideoCounters(videos.length);
            
            // Update stats
            updateVideoStats();
            
            // Render videos
            renderVideos();
            renderFeaturedVideos();
            renderAdminVideosTable();
            
            return docRef.id;
        })
        .catch((error) => {
            console.error('Error adding video to Firebase:', error);
            
            // Fallback to local storage
            const localVideo = {
                ...newVideo,
                createdAt: new Date().toISOString()
            };
            
            const addedVideo = localDB.add(localDB.VIDEOS_KEY, localVideo);
            
            // Update local video array
            videos.unshift(addedVideo);
            
            // Update counters
            updateVideoCounters(videos.length);
            
            // Update stats
            updateVideoStats();
            
            // Render videos
            renderVideos();
            renderFeaturedVideos();
            renderAdminVideosTable();
            
            return addedVideo.id;
        });
}

// Update video stats
function updateVideoStats() {
    // Try to update Firebase stats
    statsRef.doc('general').get()
        .then((doc) => {
            if (doc.exists) {
                // Update the stats
                statsRef.doc('general').update({
                    videos: firebase.firestore.FieldValue.increment(1)
                });
            }
        })
        .catch((error) => {
            console.log('Error updating video stats in Firebase:', error);
            // Fallback to local storage
            const stats = localDB.get(localDB.STATS_KEY);
            stats.videos++;
            localDB.set(localDB.STATS_KEY, stats);
        });
}

// Delete a video
function deleteVideo(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) {
        return Promise.reject('Delete cancelled');
    }
    
    // Delete video from Firebase
    return videosRef.doc(videoId).delete()
        .then(() => {
            console.log('Video deleted:', videoId);
            
            // Remove from local array
            videos = videos.filter(video => video.id !== videoId);
            
            // Update counters
            updateVideoCounters(videos.length);
            
            // Render videos
            renderVideos();
            renderFeaturedVideos();
            renderAdminVideosTable();
            
            return videoId;
        })
        .catch((error) => {
            console.error('Error deleting video from Firebase:', error);
            
            // Fallback to local storage
            localDB.remove(localDB.VIDEOS_KEY, videoId);
            
            // Remove from local array
            videos = videos.filter(video => video.id !== videoId);
            
            // Update counters
            updateVideoCounters(videos.length);
            
            // Render videos
            renderVideos();
            renderFeaturedVideos();
            renderAdminVideosTable();
            
            return videoId;
        });
}

// Add a comment to a video
function addVideoComment(videoId, commentText) {
    // Get current user
    const user = auth.currentUser || localDB.getCurrentUser();
    
    // Create comment object
    const newComment = {
        videoId: videoId,
        text: commentText,
        author: user ? (user.displayName || user.email) : 'Guest',
        userId: user ? user.uid : null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Add comment to Firebase
    return commentsRef.add(newComment)
        .then((docRef) => {
            console.log('Comment added with ID:', docRef.id);
            
            // Update local comment
            newComment.id = docRef.id;
            newComment.createdAt = new Date().toISOString(); // Use current date until server timestamp arrives
            
            // Render the new comment
            renderVideoComment(newComment);
            
            return docRef.id;
        })
        .catch((error) => {
            console.error('Error adding comment to Firebase:', error);
            
            // Fallback to local storage
            const localComment = {
                ...newComment,
                createdAt: new Date().toISOString()
            };
            
            const addedComment = localDB.add(localDB.COMMENTS_KEY, localComment);
            
            // Render the new comment
            renderVideoComment(addedComment);
            
            return addedComment.id;
        });
}

// Setup video event listeners
function setupVideoEventListeners() {
    // Event delegation for video cards
    videosContainer.addEventListener('click', function(e) {
        // Check if watch button was clicked
        if (e.target.classList.contains('watch-btn')) {
            const videoCard = e.target.closest('.video-card');
            if (videoCard) {
                const videoId = videoCard.getAttribute('data-id');
                showVideoDetail(videoId);
            }
        }
        
        // Check if play icon was clicked
        if (e.target.closest('.play-icon')) {
            const videoCard = e.target.closest('.video-card');
            if (videoCard) {
                const videoId = videoCard.getAttribute('data-id');
                showVideoDetail(videoId);
            }
        }
    });
    
    // Event delegation for featured videos
    featuredVideosContainer.addEventListener('click', function(e) {
        const featuredItem = e.target.closest('.featured-item');
        if (featuredItem) {
            const videoId = featuredItem.getAttribute('data-id');
            showPage('videos');
            setTimeout(() => {
                showVideoDetail(videoId);
            }, 100);
        }
    });
    
    // Back to videos button
    backToVideosBtn.addEventListener('click', function() {
        videoDetail.style.display = 'none';
        videosContainer.style.display = 'grid';
        document.getElementById('admin-video-controls').style.display = currentUser && isAdmin(currentUser) ? 'block' : 'none';
        currentVideoId = null;
    });
    
    // New video button
    newVideoBtn.addEventListener('click', function() {
        videoFormContainer.style.display = 'block';
        videoForm.reset();
    });
    
    // Admin new video button
    if (adminNewVideoBtn) {
        adminNewVideoBtn.addEventListener('click', function() {
            showPage('videos');
            setTimeout(() => {
                videoFormContainer.style.display = 'block';
                videoForm.reset();
            }, 100);
        });
    }
    
    // Cancel video button
    cancelVideoBtn.addEventListener('click', function() {
        videoFormContainer.style.display = 'none';
    });
    
    // Video form submission
    videoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const videoData = {
            title: document.getElementById('video-title').value,
            description: document.getElementById('video-description').value,
            videoUrl: document.getElementById('video-url').value,
            thumbnailUrl: document.getElementById('video-thumbnail').value
        };
        
        addVideo(videoData)
            .then(() => {
                videoFormContainer.style.display = 'none';
                videoForm.reset();
            })
            .catch(error => {
                console.error('Error adding video:', error);
                alert('Failed to add video. Please try again.');
            });
    });
    
    // Submit video comment
    submitVideoComment.addEventListener('click', function() {
        const commentText = videoCommentText.value.trim();
        if (!commentText) {
            alert('Please enter a comment');
            return;
        }
        
        if (currentVideoId) {
            addVideoComment(currentVideoId, commentText)
                .then(() => {
                    videoCommentText.value = '';
                })
                .catch(error => {
                    console.error('Error adding comment:', error);
                    alert('Failed to add comment. Please try again.');
                });
        }
    });
    
    // Admin videos table actions
    adminVideosTable.addEventListener('click', function(e) {
        // Check if delete button was clicked
        if (e.target.classList.contains('delete-btn')) {
            const videoId = e.target.getAttribute('data-id');
            deleteVideo(videoId)
                .catch(error => {
                    console.error('Error deleting video:', error);
                    if (error !== 'Delete cancelled') {
                        alert('Failed to delete video. Please try again.');
                    }
                });
        }
        
        // Check if edit button was clicked
        if (e.target.classList.contains('edit-btn')) {
            const videoId = e.target.getAttribute('data-id');
            // TODO: Implement edit functionality
            alert('Edit functionality will be implemented in a future update.');
        }
    });
}

// Sample videos section - now defined inside addSampleVideos function

// Add sample videos if none exist
function addSampleVideos() {
    const sampleVideos = [
        {
            title: "Introduction to Web Development",
            description: "This comprehensive introduction covers the fundamental concepts of web development, including HTML, CSS, and JavaScript. Perfect for beginners who want to understand how websites are built and function.",
            videoUrl: "https://www.youtube.com/embed/gQojMIhELvM",
            thumbnailUrl: "https://img.youtube.com/vi/gQojMIhELvM/hqdefault.jpg",
            createdAt: new Date().toISOString()
        },
        {
            title: "Advanced JavaScript Techniques",
            description: "Take your JavaScript skills to the next level with these advanced techniques. Learn about closures, prototypes, async/await, and other concepts that will help you write more efficient and maintainable code.",
            videoUrl: "https://www.youtube.com/embed/W6NZfCO5SIk",
            thumbnailUrl: "https://img.youtube.com/vi/W6NZfCO5SIk/hqdefault.jpg",
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
            title: "Responsive CSS Layout Masterclass",
            description: "Learn how to create responsive layouts that work seamlessly across all device sizes. This tutorial covers flexbox, grid, media queries, and best practices for modern CSS layouts.",
            videoUrl: "https://www.youtube.com/embed/0ohtVzCSHqs",
            thumbnailUrl: "https://img.youtube.com/vi/0ohtVzCSHqs/hqdefault.jpg",
            createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        },
        {
            title: "Building a Full-Stack Application",
            description: "Follow along as we build a complete full-stack application from scratch. This comprehensive tutorial covers frontend, backend, database design, authentication, and deployment.",
            videoUrl: "https://www.youtube.com/embed/mrHNSanmqQ4",
            thumbnailUrl: "https://img.youtube.com/vi/mrHNSanmqQ4/hqdefault.jpg",
            createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        },
        {
            title: "Web Security Fundamentals",
            description: "Security is crucial for any web application. Learn about common vulnerabilities, best practices for secure coding, authentication strategies, and how to protect your users' data.",
            videoUrl: "https://www.youtube.com/embed/F-sFp_AvHc8",
            thumbnailUrl: "https://img.youtube.com/vi/F-sFp_AvHc8/hqdefault.jpg",
            createdAt: new Date(Date.now() - 345600000).toISOString() // 4 days ago
        }
    ];

    // Try to add to Firebase first
    try {
        // Add sample videos one by one to Firebase
        const addVideoPromises = sampleVideos.map(video => {
            const newVideo = {
                title: video.title,
                description: video.description,
                videoUrl: video.videoUrl,
                thumbnailUrl: video.thumbnailUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            return videosRef.add(newVideo)
                .then(docRef => {
                    console.log('Sample video added to Firebase:', docRef.id);
                    return docRef.id;
                });
        });
        
        // Wait for all videos to be added
        Promise.all(addVideoPromises)
            .then(videoIds => {
                console.log(`${videoIds.length} sample videos added successfully to Firebase!`);
                // Reload videos to show new content
                loadVideos();
            })
            .catch(error => {
                console.error('Error adding sample videos to Firebase:', error);
                // Fall back to local storage
                addSampleVideosLocally();
            });
    } catch (error) {
        console.error('Error with Firebase, falling back to local storage:', error);
        addSampleVideosLocally();
    }
    
    // Function to add sample videos to local storage as fallback
    function addSampleVideosLocally() {
        const localVideos = localDB.getAll(localDB.VIDEOS_KEY);
        if (localVideos.length === 0) {
            console.log('Adding sample videos to local storage');
            sampleVideos.forEach(video => {
                localDB.add(localDB.VIDEOS_KEY, video);
            });
            // Reload videos to show new content
            loadVideos();
        }
    }
}

// Add sample videos to local storage
addSampleVideos();

// Initialize videos when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initVideos();
});
