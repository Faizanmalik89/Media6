// Blog Handler
// This file handles all blog-related functionality

// DOM elements
const blogsContainer = document.getElementById('blogs-container');
const blogDetail = document.getElementById('blog-detail');
const blogDetailContent = document.getElementById('blog-detail-content');
const blogCommentsContainer = document.getElementById('blog-comments-container');
const backToBlogsBtn = document.getElementById('back-to-blogs-btn');
const blogForm = document.getElementById('blog-form');
const newBlogBtn = document.getElementById('new-blog-btn');
const cancelBlogBtn = document.getElementById('cancel-blog-btn');
const blogFormContainer = document.getElementById('blog-form-container');
const adminNewBlogBtn = document.getElementById('admin-new-blog-btn');
const submitBlogComment = document.getElementById('submit-blog-comment');
const blogCommentText = document.getElementById('blog-comment-text');
const adminBlogsTable = document.getElementById('admin-blogs-table');
const featuredBlogsContainer = document.getElementById('featured-blogs-container');
const blogCountElement = document.getElementById('blog-count');
// const adminBlogCount = document.getElementById('admin-blog-count'); // Defined in admin.js

// Variables
let blogs = [];
let currentBlogId = null;

// Initialize blogs
function initBlogs() {
    loadBlogs();
    setupBlogEventListeners();
    
    // Add sample blogs if there are none
    blogsRef.get().then((snapshot) => {
        if (snapshot.empty) {
            console.log('No blogs found, adding sample blogs');
            addSampleBlogs();
        }
    }).catch((error) => {
        console.error('Error checking for blogs:', error);
        
        // Check local storage as fallback
        const localBlogs = localDB.getAll(localDB.BLOGS_KEY);
        if (localBlogs.length === 0) {
            console.log('No local blogs found, adding sample blogs');
            addSampleBlogs();
        }
    });
}

// Load blogs from Firebase
function loadBlogs() {
    // Show loading state
    blogsContainer.innerHTML = '<p class="loading">Loading blogs</p>';
    featuredBlogsContainer.innerHTML = '<p class="loading">Loading blogs</p>';
    
    blogsRef.orderBy('createdAt', 'desc').get()
        .then((querySnapshot) => {
            blogs = [];
            querySnapshot.forEach((doc) => {
                const blog = {
                    id: doc.id,
                    ...doc.data()
                };
                blogs.push(blog);
            });
            
            // Update counters
            updateBlogCounters(blogs.length);
            
            // Render blogs
            renderBlogs();
            renderFeaturedBlogs();
            renderAdminBlogsTable();
        })
        .catch((error) => {
            console.error('Error loading blogs from Firebase:', error);
            
            // Fallback to local storage
            blogs = localDB.getAll(localDB.BLOGS_KEY);
            
            // Update counters
            updateBlogCounters(blogs.length);
            
            // Render blogs
            renderBlogs();
            renderFeaturedBlogs();
            renderAdminBlogsTable();
        });
}

// Update blog counters
function updateBlogCounters(count) {
    if (blogCountElement) blogCountElement.textContent = count;
    
    // Get the admin blog count element (might be defined in admin.js)
    const adminBlogCountEl = document.getElementById('admin-blog-count');
    if (adminBlogCountEl) adminBlogCountEl.textContent = count;
}

// Render blogs in the blogs container
function renderBlogs() {
    if (blogs.length === 0) {
        blogsContainer.innerHTML = '<p class="empty-state">No blogs available yet</p>';
        return;
    }
    
    blogsContainer.innerHTML = '';
    
    blogs.forEach(blog => {
        const blogCard = document.createElement('div');
        blogCard.className = 'blog-card';
        blogCard.setAttribute('data-id', blog.id);
        
        // Create blog image (if available)
        let blogImage = '';
        if (blog.imageUrl) {
            blogImage = `
                <div class="blog-image">
                    <img src="${blog.imageUrl}" alt="${blog.title}">
                </div>
            `;
        }
        
        // Format date
        const blogDate = new Date(blog.createdAt).toLocaleDateString();
        
        // Truncate content for excerpt
        const excerpt = blog.content.length > 150 ? 
            blog.content.substring(0, 150) + '...' : 
            blog.content;
        
        // Create blog HTML
        blogCard.innerHTML = `
            ${blogImage}
            <div class="blog-content">
                <h3>${blog.title}</h3>
                <div class="blog-meta">
                    <span class="blog-author">By ${blog.author}</span>
                    <span class="blog-date">${blogDate}</span>
                </div>
                <p class="blog-excerpt">${excerpt}</p>
                <button class="read-more">Read More</button>
            </div>
        `;
        
        blogsContainer.appendChild(blogCard);
    });
}

// Render featured blogs on the home page
function renderFeaturedBlogs() {
    if (blogs.length === 0) {
        featuredBlogsContainer.innerHTML = '<p class="empty-state">No blogs available yet</p>';
        return;
    }
    
    featuredBlogsContainer.innerHTML = '';
    
    // Get the settings
    const settings = localDB.get(localDB.SETTINGS_KEY);
    const featuredCount = settings ? settings.featuredBlogsCount : 3;
    
    // Take the newest blogs based on featured count
    const featuredBlogs = blogs.slice(0, featuredCount);
    
    featuredBlogs.forEach(blog => {
        const blogItem = document.createElement('div');
        blogItem.className = 'featured-item';
        blogItem.setAttribute('data-id', blog.id);
        
        // Format date
        const blogDate = new Date(blog.createdAt).toLocaleDateString();
        
        // Create blog HTML
        blogItem.innerHTML = `
            <h4>${blog.title}</h4>
            <div class="meta">
                <span class="author">By ${blog.author}</span> | 
                <span class="date">${blogDate}</span>
            </div>
        `;
        
        featuredBlogsContainer.appendChild(blogItem);
    });
}

// Render admin blogs table
function renderAdminBlogsTable() {
    if (blogs.length === 0) {
        adminBlogsTable.innerHTML = '<tr><td colspan="5" class="empty-state">No blogs available</td></tr>';
        return;
    }
    
    adminBlogsTable.innerHTML = '';
    
    blogs.forEach(blog => {
        // Format date
        const blogDate = new Date(blog.createdAt).toLocaleDateString();
        
        // Get comment count
        let commentCount = 0;
        
        // Create table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${blog.title}</td>
            <td>${blog.author}</td>
            <td>${blogDate}</td>
            <td>${commentCount}</td>
            <td class="table-actions">
                <button class="edit-btn" data-id="${blog.id}">Edit</button>
                <button class="delete-btn" data-id="${blog.id}">Delete</button>
            </td>
        `;
        
        adminBlogsTable.appendChild(row);
    });
}

// Show blog detail
function showBlogDetail(blogId) {
    const blog = blogs.find(b => b.id === blogId);
    if (!blog) return;
    
    currentBlogId = blogId;
    
    // Format date
    const blogDate = new Date(blog.createdAt).toLocaleDateString();
    
    // Create blog detail HTML
    blogDetailContent.innerHTML = `
        <div class="blog-full-content">
            <h2>${blog.title}</h2>
            <div class="blog-full-meta">
                <span class="blog-author">By ${blog.author}</span>
                <span class="blog-date">${blogDate}</span>
            </div>
            ${blog.imageUrl ? `<div class="blog-image-full"><img src="${blog.imageUrl}" alt="${blog.title}"></div>` : ''}
            <div class="blog-text">${formatBlogContent(blog.content)}</div>
        </div>
    `;
    
    // Hide blogs container and show blog detail
    blogsContainer.style.display = 'none';
    document.getElementById('admin-blog-controls').style.display = 'none';
    blogDetail.style.display = 'block';
    
    // Load comments
    loadBlogComments(blogId);
}

// Format blog content for HTML display
function formatBlogContent(content) {
    // Split content by newlines and wrap paragraphs
    const paragraphs = content.split('\n\n');
    return paragraphs.map(p => `<p>${p}</p>`).join('');
}

// Load blog comments
function loadBlogComments(blogId) {
    // Clear comments container
    blogCommentsContainer.innerHTML = '<p class="loading">Loading comments</p>';
    
    // Get comments from Firebase
    commentsRef.where('blogId', '==', blogId).orderBy('createdAt', 'desc').get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                blogCommentsContainer.innerHTML = '<p class="empty-state">No comments yet. Be the first to comment!</p>';
                return;
            }
            
            blogCommentsContainer.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const comment = {
                    id: doc.id,
                    ...doc.data()
                };
                
                renderBlogComment(comment);
            });
        })
        .catch((error) => {
            console.error('Error loading comments from Firebase:', error);
            blogCommentsContainer.innerHTML = '<p class="empty-state">Failed to load comments. Please try again later.</p>';
        });
}

// Render a single blog comment
function renderBlogComment(comment) {
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
    
    blogCommentsContainer.appendChild(commentItem);
}

// Add a new blog
function addBlog(blogData) {
    // Create a new blog object
    const newBlog = {
        title: blogData.title,
        author: blogData.author,
        content: blogData.content,
        imageUrl: blogData.imageUrl || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Add blog to Firebase
    return blogsRef.add(newBlog)
        .then((docRef) => {
            console.log('Blog added with ID:', docRef.id);
            
            // Update local blog array
            newBlog.id = docRef.id;
            newBlog.createdAt = new Date().toISOString(); // Use current date until server timestamp arrives
            blogs.unshift(newBlog);
            
            // Update counters
            updateBlogCounters(blogs.length);
            
            // Update stats
            updateBlogStats();
            
            // Render blogs
            renderBlogs();
            renderFeaturedBlogs();
            renderAdminBlogsTable();
            
            return docRef.id;
        })
        .catch((error) => {
            console.error('Error adding blog to Firebase:', error);
            
            // Fallback to local storage
            const localBlog = {
                ...newBlog,
                createdAt: new Date().toISOString()
            };
            
            const addedBlog = localDB.add(localDB.BLOGS_KEY, localBlog);
            
            // Update local blog array
            blogs.unshift(addedBlog);
            
            // Update counters
            updateBlogCounters(blogs.length);
            
            // Update stats
            updateBlogStats();
            
            // Render blogs
            renderBlogs();
            renderFeaturedBlogs();
            renderAdminBlogsTable();
            
            return addedBlog.id;
        });
}

// Update blog stats
function updateBlogStats() {
    // Try to update Firebase stats
    statsRef.doc('general').get()
        .then((doc) => {
            if (doc.exists) {
                // Update the stats
                statsRef.doc('general').update({
                    blogs: firebase.firestore.FieldValue.increment(1)
                });
            }
        })
        .catch((error) => {
            console.log('Error updating blog stats in Firebase:', error);
            // Fallback to local storage
            const stats = localDB.get(localDB.STATS_KEY);
            stats.blogs++;
            localDB.set(localDB.STATS_KEY, stats);
        });
}

// Delete a blog
function deleteBlog(blogId) {
    if (!confirm('Are you sure you want to delete this blog?')) {
        return Promise.reject('Delete cancelled');
    }
    
    // Delete blog from Firebase
    return blogsRef.doc(blogId).delete()
        .then(() => {
            console.log('Blog deleted:', blogId);
            
            // Remove from local array
            blogs = blogs.filter(blog => blog.id !== blogId);
            
            // Update counters
            updateBlogCounters(blogs.length);
            
            // Render blogs
            renderBlogs();
            renderFeaturedBlogs();
            renderAdminBlogsTable();
            
            return blogId;
        })
        .catch((error) => {
            console.error('Error deleting blog from Firebase:', error);
            
            // Fallback to local storage
            localDB.remove(localDB.BLOGS_KEY, blogId);
            
            // Remove from local array
            blogs = blogs.filter(blog => blog.id !== blogId);
            
            // Update counters
            updateBlogCounters(blogs.length);
            
            // Render blogs
            renderBlogs();
            renderFeaturedBlogs();
            renderAdminBlogsTable();
            
            return blogId;
        });
}

// Add a comment to a blog
function addBlogComment(blogId, commentText) {
    // Get current user
    const user = auth.currentUser || localDB.getCurrentUser();
    
    // Create comment object
    const newComment = {
        blogId: blogId,
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
            renderBlogComment(newComment);
            
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
            renderBlogComment(addedComment);
            
            return addedComment.id;
        });
}

// Setup blog event listeners
function setupBlogEventListeners() {
    // Event delegation for blog cards
    blogsContainer.addEventListener('click', function(e) {
        // Check if read more button was clicked
        if (e.target.classList.contains('read-more')) {
            const blogCard = e.target.closest('.blog-card');
            if (blogCard) {
                const blogId = blogCard.getAttribute('data-id');
                showBlogDetail(blogId);
            }
        }
    });
    
    // Event delegation for featured blogs
    featuredBlogsContainer.addEventListener('click', function(e) {
        const featuredItem = e.target.closest('.featured-item');
        if (featuredItem) {
            const blogId = featuredItem.getAttribute('data-id');
            showPage('blogs');
            setTimeout(() => {
                showBlogDetail(blogId);
            }, 100);
        }
    });
    
    // Back to blogs button
    backToBlogsBtn.addEventListener('click', function() {
        blogDetail.style.display = 'none';
        blogsContainer.style.display = 'grid';
        document.getElementById('admin-blog-controls').style.display = currentUser && isAdmin(currentUser) ? 'block' : 'none';
        currentBlogId = null;
    });
    
    // New blog button
    newBlogBtn.addEventListener('click', function() {
        blogFormContainer.style.display = 'block';
        blogForm.reset();
    });
    
    // Admin new blog button
    if (adminNewBlogBtn) {
        adminNewBlogBtn.addEventListener('click', function() {
            showPage('blogs');
            setTimeout(() => {
                blogFormContainer.style.display = 'block';
                blogForm.reset();
            }, 100);
        });
    }
    
    // Cancel blog button
    cancelBlogBtn.addEventListener('click', function() {
        blogFormContainer.style.display = 'none';
    });
    
    // Blog form submission
    blogForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const blogData = {
            title: document.getElementById('blog-title').value,
            author: document.getElementById('blog-author').value,
            content: document.getElementById('blog-content').value,
            imageUrl: document.getElementById('blog-image-url').value
        };
        
        addBlog(blogData)
            .then(() => {
                blogFormContainer.style.display = 'none';
                blogForm.reset();
            })
            .catch(error => {
                console.error('Error adding blog:', error);
                alert('Failed to add blog. Please try again.');
            });
    });
    
    // Submit blog comment
    submitBlogComment.addEventListener('click', function() {
        const commentText = blogCommentText.value.trim();
        if (!commentText) {
            alert('Please enter a comment');
            return;
        }
        
        if (currentBlogId) {
            addBlogComment(currentBlogId, commentText)
                .then(() => {
                    blogCommentText.value = '';
                })
                .catch(error => {
                    console.error('Error adding comment:', error);
                    alert('Failed to add comment. Please try again.');
                });
        }
    });
    
    // Admin blogs table actions
    adminBlogsTable.addEventListener('click', function(e) {
        // Check if delete button was clicked
        if (e.target.classList.contains('delete-btn')) {
            const blogId = e.target.getAttribute('data-id');
            deleteBlog(blogId)
                .catch(error => {
                    console.error('Error deleting blog:', error);
                    if (error !== 'Delete cancelled') {
                        alert('Failed to delete blog. Please try again.');
                    }
                });
        }
        
        // Check if edit button was clicked
        if (e.target.classList.contains('edit-btn')) {
            const blogId = e.target.getAttribute('data-id');
            // TODO: Implement edit functionality
            alert('Edit functionality will be implemented in a future update.');
        }
    });
}

// Sample blogs data for initial setup
const sampleBlogs = [
    {
        title: 'Getting Started with Web Development',
        author: 'John Doe',
        content: 'Web development is an exciting field that combines creativity with technical skills. Whether you\'re just starting out or looking to expand your knowledge, there are numerous resources available to help you on your journey.\n\nHTML, CSS, and JavaScript form the foundation of web development. HTML provides the structure, CSS handles the styling, and JavaScript adds interactivity. By mastering these three technologies, you\'ll be well on your way to building impressive websites and web applications.\n\nIn addition to these core technologies, there are numerous frameworks and libraries that can streamline your development process. React, Angular, and Vue.js are popular choices for front-end development, while Node.js, Django, and Ruby on Rails are commonly used for back-end development.\n\nAs you progress in your web development journey, it\'s important to stay up-to-date with the latest trends and best practices. Follow blogs, join communities, and participate in online forums to connect with other developers and continue learning.',
        imageUrl: 'https://cdn.pixabay.com/photo/2016/11/19/14/00/code-1839406_1280.jpg',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    },
    {
        title: 'The Importance of Responsive Design',
        author: 'Jane Smith',
        content: 'In today\'s digital landscape, responsive design is no longer a luxury—it\'s a necessity. With the increasing variety of devices used to access the internet, ensuring your website looks and functions well on all screen sizes is crucial for providing a positive user experience.\n\nResponsive design is an approach to web design that makes web pages render well on a variety of devices and window or screen sizes. It involves using HTML and CSS to automatically resize, hide, shrink, or enlarge a website, to make it look good on all devices (desktops, tablets, and phones).\n\nImplementing responsive design offers numerous benefits. It improves user experience, increases reach across different devices, and even positively impacts your search engine rankings, as Google prioritizes mobile-friendly websites in its search results.\n\nTo create a responsive website, you can use CSS media queries to apply different styles based on the device\'s screen size. Additionally, frameworks like Bootstrap and Foundation provide pre-built responsive components that make implementing responsive design easier.',
        imageUrl: 'https://cdn.pixabay.com/photo/2018/05/08/08/44/artificial-intelligence-3382507_1280.jpg',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    },
    {
        title: 'Introduction to JavaScript Frameworks',
        author: 'Michael Johnson',
        content: 'JavaScript frameworks have revolutionized web development by providing structured and efficient ways to build web applications. These frameworks offer pre-written JavaScript code that helps developers streamline their workflow and create more maintainable code.\n\nSome of the most popular JavaScript frameworks include:\n\nReact: Developed by Facebook, React is a library for building user interfaces. It allows developers to create reusable UI components and manage state efficiently.\n\nAngular: Created by Google, Angular is a complete framework for building single-page applications. It offers features like two-way data binding, dependency injection, and declarative templates.\n\nVue.js: Known for its simplicity and flexibility, Vue.js combines the best aspects of other frameworks. It\'s approachable for beginners but powerful enough for complex applications.\n\nWhich framework you choose depends on your specific project requirements, team expertise, and personal preference. Each has its own strengths and learning curve, so it\'s worth exploring multiple options before making a decision.',
        imageUrl: 'https://cdn.pixabay.com/photo/2016/11/19/22/52/coding-1841550_1280.jpg',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    }
];

// Add sample blogs if none exist in local storage
function addSampleBlogs() {
    const sampleBlogs = [
        {
            title: "The Future of Web Development in 2025",
            author: "Faizan Malik",
            content: "The web development landscape continues to evolve at a rapid pace. As we move through 2025, several key trends are reshaping how developers build and users experience the web.\n\nFirst, WebAssembly has become mainstream, allowing high-performance applications to run directly in browsers. This has blurred the line between web and native applications, with complex tools like video editors and 3D modeling software now running smoothly on the web.\n\nSecond, AI-assisted development has transformed productivity. Developers now work alongside AI tools that can generate code, suggest optimizations, and even debug issues. This collaboration between human creativity and machine efficiency has accelerated development cycles dramatically.\n\nThird, edge computing has decentralized where code runs. Applications now distribute their processing across a network of edge nodes, reducing latency and improving reliability. Users experience faster load times and more responsive interfaces as a result.\n\nFourth, design systems and component libraries have matured. Most organizations now maintain comprehensive design systems that ensure consistency across products while accelerating development. These systems often include not just visual components but also accessibility guidelines, content patterns, and interaction models.\n\nFinally, privacy-focused development has become standard. With stricter regulations worldwide, developers must prioritize user privacy from the beginning of the development process. This includes minimizing data collection, implementing proper consent mechanisms, and ensuring transparent data practices.\n\nAs we look ahead, the web will continue to be the most accessible and versatile platform for applications. The developers who thrive will be those who balance technical excellence with user-centered design and ethical considerations.",
            imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1172&q=80",
            createdAt: new Date().toISOString()
        },
        {
            title: "Understanding Artificial Intelligence: A Beginner's Guide",
            author: "Faizan Malik",
            content: "Artificial Intelligence (AI) has become one of the most transformative technologies of our time, yet many still find it mysterious or intimidating. This guide aims to demystify AI and provide a clear understanding of its fundamentals.\n\nAt its core, AI is about creating systems that can perform tasks typically requiring human intelligence. These include recognizing patterns, learning from experience, making decisions, and understanding language. While science fiction often portrays AI as sentient robots, today's AI is primarily focused on solving specific problems rather than replicating human consciousness.\n\nMachine Learning (ML), a subset of AI, has driven many recent advances. Unlike traditional programming where developers write explicit instructions, ML systems learn patterns from data. For example, instead of programming rules to identify cats in images, developers show an ML system thousands of cat pictures, allowing it to recognize patterns that define 'catness.'\n\nDeep Learning, a specialized form of ML using neural networks, has enabled breakthroughs in image recognition, language processing, and game playing. These networks, inspired by the human brain, consist of layers of interconnected nodes that process information in increasingly abstract ways.\n\nAI applications now surround us daily: voice assistants on our phones, recommendation systems on streaming platforms, fraud detection for credit cards, and even the predictive text as you type an email. Healthcare, transportation, education, and virtually every industry is being transformed by AI capabilities.\n\nHowever, AI comes with challenges. Systems can inherit biases present in their training data, leading to unfair outcomes. Privacy concerns arise as AI often requires vast amounts of data. Additionally, as AI automates tasks, workforce disruption becomes a social concern.\n\nAs AI continues to evolve, understanding its capabilities, limitations, and implications becomes increasingly important. Whether you're a student, professional, or simply curious, developing AI literacy helps you navigate a world where these technologies play an ever-expanding role.",
            imageUrl: "https://images.unsplash.com/photo-1488228469209-c141f8bcd723?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        },
        {
            title: "Sustainable Technology: Building a Greener Digital Future",
            author: "Faizan Malik",
            content: "As our reliance on technology grows, so does its environmental impact. The digital revolution has brought unprecedented connectivity and convenience, but it comes with significant energy consumption, electronic waste, and carbon emissions. Fortunately, a movement toward sustainable technology is gaining momentum, offering pathways to a greener digital future.\n\nData centers, the backbone of our digital lives, consume massive amounts of electricity. However, companies like Google and Microsoft are leading the way in powering these facilities with renewable energy. Google has been carbon neutral since 2007 and aims to operate on 24/7 carbon-free energy by 2030. Microsoft has pledged to be carbon negative by 2030, removing more carbon than it emits.\n\nHardware design is evolving with sustainability in mind. Manufacturers are creating devices that last longer, use less energy, and are easier to repair and recycle. Frameworks laptop, for instance, allows users to easily replace components, extending the device's lifespan and reducing waste. Apple now uses recycled materials in many of its products and has committed to carbon neutrality across its entire business by 2030.\n\nSoftware efficiency also plays a crucial role. Optimized code requires less processing power and therefore less energy. Some developers are adopting 'green coding' practices, creating software that accomplishes the same tasks with fewer resources. Even small efficiency improvements, when scaled across millions of devices, can significantly reduce energy consumption.\n\nBlockchain technology, despite its energy-intensive reputation, is exploring more sustainable consensus mechanisms. Ethereum's transition to proof-of-stake from the energy-hungry proof-of-work represents a 99.95% reduction in energy consumption.\n\nIndividuals can contribute to this movement by keeping devices longer, choosing energy-efficient products, supporting companies with strong environmental commitments, and properly recycling electronic waste.\n\nThe path to sustainable technology requires collaboration between companies, governments, and consumers. By prioritizing environmental considerations alongside technological advancement, we can continue to innovate while minimizing our impact on the planet. The digital revolution doesn't have to come at the Earth's expense—with conscious choices, we can build a technological future that's both cutting-edge and sustainable.",
            imageUrl: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        },
        {
            title: "Cybersecurity Essentials Everyone Should Know",
            author: "Faizan Malik",
            content: "In our increasingly connected world, cybersecurity has become essential knowledge for everyone, not just IT professionals. As daily activities—from banking to shopping to healthcare—move online, understanding how to protect your digital presence is crucial.\n\nStrong passwords remain your first line of defense. Create unique, complex passwords for each account using a mix of letters, numbers, and symbols. Even better, use a password manager to generate and store these credentials securely. Enable two-factor authentication (2FA) whenever possible, adding an extra layer of security beyond just your password.\n\nKeep your devices updated. Those seemingly annoying software updates often contain critical security patches. Delaying updates leaves vulnerabilities open for exploitation. This applies to your operating system, applications, and even IoT devices like smart thermostats and security cameras.\n\nPhishing attacks continue to evolve in sophistication. Be wary of unexpected emails, messages, or calls asking for personal information or immediate action. Legitimate organizations rarely request sensitive information via email or create artificial urgency. When in doubt, contact the purported sender directly through official channels.\n\nPublic Wi-Fi networks pose significant risks. Avoid accessing sensitive accounts or conducting financial transactions when connected to public Wi-Fi. If necessary, use a VPN (Virtual Private Network) to encrypt your connection and protect your data from potential eavesdroppers.\n\nRegularly back up important data following the 3-2-1 rule: maintain at least three copies of your data on two different types of storage media with one copy stored off-site or in the cloud. This protects against both hardware failure and ransomware attacks.\n\nPractice safe browsing habits by verifying website security (look for HTTPS and the padlock icon), being cautious about downloads, and using privacy-focused browser extensions. Regularly check and adjust privacy settings on social media platforms to control what information you share publicly.\n\nTeach children about digital citizenship and online safety from an early age. Set clear guidelines, maintain open communication, and use parental controls appropriately based on their age and maturity.\n\nCybersecurity is not about paranoia but preparedness. By implementing these fundamental practices, you significantly reduce your vulnerability to common cyber threats while maintaining the convenience and benefits of our digital world.",
            imageUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        },
        {
            title: "The Rise of Remote Work: Reshaping Our Professional Lives",
            author: "Faizan Malik",
            content: "The global shift to remote work, accelerated by the COVID-19 pandemic, has fundamentally transformed how we think about work. What began as a temporary adaptation has evolved into a permanent fixture of the professional landscape, with profound implications for individuals, organizations, and society.\n\nFor individuals, remote work offers unprecedented flexibility. The elimination of commuting not only saves time—an average of 40 minutes daily in the US—but also reduces stress and carbon emissions. Geographic freedom allows professionals to choose where they live based on lifestyle preferences rather than proximity to an office. Many report improved work-life balance, though the boundary between professional and personal spheres has become increasingly blurred.\n\nOrganizations have experienced both challenges and opportunities. Distributed teams require new management approaches focused on outcomes rather than hours visible at a desk. Companies gain access to global talent pools, potentially increasing diversity and specialized expertise. Many have reduced real estate costs significantly, though these savings must be balanced against investments in technology and security infrastructure.\n\nCollaboration has been reimagined through digital tools. While spontaneous in-person interactions have declined, asynchronous communication has enabled more thoughtful exchanges and documentation. Many companies have adopted hybrid approaches, combining remote work with strategic in-person gatherings for relationship building and complex problem-solving.\n\nThe shift has sparked innovation across industries. Education technologies have flourished, healthcare has embraced telemedicine, and virtual events have become sophisticated alternatives to traditional conferences. Even sectors previously considered impossible to operate remotely have found creative solutions for at least partial remote work.\n\nChallenges persist, including digital equity issues, as effective remote work requires reliable internet access and appropriate technology. Mental health concerns like isolation and burnout require attention and new support structures. Career development pathways need reimagining when visibility to leadership is no longer tied to physical presence.\n\nAs we move forward, organizations are creating intentional remote work strategies rather than reacting to necessity. The most successful approaches recognize that remote work isn't merely a location change but a comprehensive rethinking of how work happens. By thoughtfully addressing both challenges and opportunities, remote work has the potential to create more inclusive, sustainable, and effective work environments for the future.",
            imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
            createdAt: new Date(Date.now() - 345600000).toISOString() // 4 days ago
        }
    ];

    // Try to add to Firebase first
    try {
        // Add sample blogs one by one to Firebase
        const addBlogPromises = sampleBlogs.map(blog => {
            const newBlog = {
                title: blog.title,
                author: blog.author,
                content: blog.content,
                imageUrl: blog.imageUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            return blogsRef.add(newBlog)
                .then(docRef => {
                    console.log('Sample blog added to Firebase:', docRef.id);
                    return docRef.id;
                });
        });
        
        // Wait for all blogs to be added
        Promise.all(addBlogPromises)
            .then(blogIds => {
                console.log(`${blogIds.length} sample blogs added successfully to Firebase!`);
                // Reload blogs to show new content
                loadBlogs();
            })
            .catch(error => {
                console.error('Error adding sample blogs to Firebase:', error);
                // Fall back to local storage
                addSampleBlogsLocally();
            });
    } catch (error) {
        console.error('Error with Firebase, falling back to local storage:', error);
        addSampleBlogsLocally();
    }
    
    // Function to add sample blogs to local storage as fallback
    function addSampleBlogsLocally() {
        const localBlogs = localDB.getAll(localDB.BLOGS_KEY);
        if (localBlogs.length === 0) {
            console.log('Adding sample blogs to local storage');
            sampleBlogs.forEach(blog => {
                localDB.add(localDB.BLOGS_KEY, blog);
            });
            // Reload blogs to show new content
            loadBlogs();
        }
    }
}

// Add sample blogs to local storage
addSampleBlogs();

// Initialize blogs when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initBlogs();
});
