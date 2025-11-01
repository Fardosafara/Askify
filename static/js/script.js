// Global state variables for the application
let uploadedText = ''; // Stores text extracted from uploaded files
let currentQuizId = null; // Tracks the currently active quiz ID
let currentUser = null; // Stores current user information

// DOM Elements - Quiz Functionality
const uploadZone = document.getElementById('uploadZone'); // File upload area
const fileInput = document.getElementById('fileInput'); // Hidden file input element
const topicInput = document.getElementById('topicInput'); // Text input for quiz topics
const pasteBtn = document.getElementById('pasteBtn'); // Paste from clipboard button
const generateBtn = document.getElementById('generateBtn'); // Generate quiz button
const loadingSpinner = document.getElementById('loadingSpinner'); // Loading indicator
const resultsSection = document.getElementById('resultsSection'); // Quiz results container
const quizContainer = document.getElementById('quizContainer'); // Container for quiz questions
const copyBtn = document.getElementById('copyBtn'); // Copy quiz button
const downloadBtn = document.getElementById('downloadBtn'); // Download quiz button

// Celebration Screen Elements
const celebrationScreen = document.getElementById('celebrationScreen');
const celebrationBadge = document.getElementById('celebrationBadge');
const celebrationScore = document.getElementById('celebrationScore');
const celebrationMessage = document.getElementById('celebrationMessage');
const celebrationQuote = document.getElementById('celebrationQuote');
const celebrationReviewBtn = document.getElementById('celebrationReviewBtn');
const celebrationNewQuizBtn = document.getElementById('celebrationNewQuizBtn');

// ----------- Sidebar Elements -----------
const sidebar = document.getElementById('sidebar'); // Quiz history sidebar
const sidebarOverlay = document.getElementById('sidebarOverlay'); // Mobile overlay for sidebar
const mobileMenuBtn = document.getElementById('mobileMenuBtn'); // Mobile menu toggle button
const closeSidebar = document.getElementById('closeSidebar'); // Close sidebar button

// ----------- Authentication & Profile UI Elements -----------
const guestControls = document.getElementById('guestControls'); // Login/signup buttons (logged out state)
const userControls = document.getElementById('userControls'); // User profile (logged in state)
const mobileAuthControls = document.getElementById('mobileAuthControls'); // Mobile auth buttons
const loginBtn = document.getElementById('loginBtn'); // Desktop login button
const signupBtn = document.getElementById('signupBtn'); // Desktop signup button
const loginBtnMobile = document.getElementById('loginBtnMobile'); // Mobile login button
const signupBtnMobile = document.getElementById('signupBtnMobile'); // Mobile signup button
const profileBtn = document.getElementById('profileBtn'); // User profile button
const profileDropdown = document.getElementById('profileDropdown'); // Profile dropdown menu
const dropdownLogout = document.getElementById('dropdownLogout'); // Logout button in dropdown
const userAvatar = document.getElementById('userAvatar'); // User avatar with initials
const userName = document.getElementById('userName'); // User display name
const userEmail = document.getElementById('userEmail'); // User email address
const dropdownUserName = document.getElementById('dropdownUserName'); // Name in dropdown
const dropdownUserEmail = document.getElementById('dropdownUserEmail'); // Email in dropdown

// Authentication Modal Elements
const authModal = document.getElementById('authModal'); // Login/signup modal
const authForm = document.getElementById('authForm'); // Authentication form
const authName = document.getElementById('authName'); // Name input (signup only)
const authEmail = document.getElementById('authEmail'); // Email input
const authPassword = document.getElementById('authPassword'); // Password input
const authCancel = document.getElementById('authCancel'); // Cancel auth button
const authError = document.getElementById('authError'); // Error message display
const authSpinner = document.getElementById('authSpinner'); // Loading spinner for auth
const authSubmitText = document.getElementById('authSubmitText'); // Submit button text
const authModalTitle = document.getElementById('authModalTitle'); // Modal title
const authModalSubtitle = document.getElementById('authModalSubtitle'); // Modal subtitle
const showLoginBtn = document.getElementById('showLogin'); // Switch to login tab
const showSignupBtn = document.getElementById('showSignup'); // Switch to signup tab
const nameField = document.getElementById('nameField'); // Name field container

const quizHistoryList = document.getElementById('quizHistoryList'); // Container for quiz history items

let loginMode = true; // Tracks whether we're in login or signup mode

// ----------- Celebration Screen Functions -----------

/**
 * Shows the celebration screen with user's score
 * @param {number} score - User's quiz score
 * @param {number} total - Total number of questions
 */
function showCelebrationScreen(score, total) {
    // Update celebration elements
    celebrationScore.textContent = score;
    
    // Set celebration message based on score percentage
    const percentage = (score / total) * 100;
    let message = '';
    let quote = '';
    
    if (percentage >= 90) {
        message = 'Outstanding! You absolutely crushed it!';
        quote = '"The expert in anything was once a beginner." - Helen Hayes';
    } else if (percentage >= 80) {
        message = 'Excellent work! You really know your stuff!';
        quote = '"Success is the sum of small efforts, repeated day in and day out." - Robert Collier';
    } else if (percentage >= 70) {
        message = 'Great job! You have a solid understanding!';
        quote = '"The beautiful thing about learning is that no one can take it away from you." - B.B. King';
    } else if (percentage >= 60) {
        message = 'Good effort! Keep learning and improving!';
        quote = '"It does not matter how slowly you go as long as you do not stop." - Confucius';
    } else {
        message = 'Nice try! Every attempt is a step forward!';
        quote = '"Failure is simply the opportunity to begin again, this time more intelligently." - Henry Ford';
    }
    
    celebrationMessage.textContent = message;
    celebrationQuote.textContent = quote;
    
    // Show celebration screen
    celebrationScreen.classList.add('show');
    
    // Create confetti effect
    createConfetti();
}

/**
 * Creates a confetti effect for celebration
 */
function createConfetti() {
    const confettiCount = 100;
    const container = celebrationScreen;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.opacity = Math.random();
        confetti.style.transform = `scale(${Math.random()})`;
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        
        container.appendChild(confetti);
        
        // Animate confetti
        const animation = confetti.animate([
            { transform: 'translateY(-100px)', opacity: 1 },
            { transform: `translateY(${window.innerHeight}px)`, opacity: 0 }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'cubic-bezier(0.1, 0.2, 0.8, 1)'
        });
        
        // Remove confetti after animation completes
        animation.onfinish = () => confetti.remove();
    }
}

/**
 * Hides the celebration screen
 */
function hideCelebrationScreen() {
    celebrationScreen.classList.remove('show');
    
    // Remove all confetti elements
    const confettiElements = document.querySelectorAll('.confetti');
    confettiElements.forEach(confetti => confetti.remove());
}

// ----------- Profile Dropdown Functionality -----------

// Toggle profile dropdown visibility when profile button is clicked
profileBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling up to document
    profileDropdown.classList.toggle('open'); // Toggle dropdown visibility
});

// Close dropdown when clicking anywhere outside of it
document.addEventListener('click', () => {
    profileDropdown?.classList.remove('open');
});

// Prevent dropdown from closing when clicking inside it
profileDropdown?.addEventListener('click', (e) => {
    e.stopPropagation(); // Stop event propagation to document
});

// Handle logout when logout button is clicked
dropdownLogout?.addEventListener('click', async () => {
    await logoutUser();
});

// ----------- Sidebar Functionality -----------

// Open sidebar on mobile when menu button is clicked
mobileMenuBtn?.addEventListener('click', () => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
});

// Close sidebar when close button is clicked
closeSidebar?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

// Close sidebar when overlay is clicked
sidebarOverlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

// Close sidebar when a history item is clicked on mobile
quizHistoryList?.addEventListener('click', (e) => {
    if (e.target.closest('.history-item')) {
        if (window.innerWidth < 768) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('open');
        }
    }
});

// ----------- Authentication Functions -----------

/**
 * Shows the authentication modal in either login or signup mode
 * @param {boolean} asLogin - True for login mode, false for signup mode
 */
function showLoginModal(asLogin = true) {
    loginMode = asLogin;
    authModal.style.display = 'flex'; // Show the modal
    
    // Reset form fields
    authEmail.value = '';
    authPassword.value = '';
    authName.value = '';
    authError.textContent = '';
    authError.classList.add('hidden');
    authSpinner.classList.add('hidden');
    
    updateAuthTabs(asLogin); // Update tab styling
    
    if (asLogin) {
        // Login mode configuration
        authModalTitle.textContent = 'Welcome Back';
        authModalSubtitle.textContent = 'Sign in to your account to continue';
        authSubmitText.textContent = 'Sign In';
        nameField.classList.add('hidden'); // Hide name field for login
    } else {
        // Signup mode configuration
        authModalTitle.textContent = 'Create Account';
        authModalSubtitle.textContent = 'Sign up to start creating quizzes';
        authSubmitText.textContent = 'Create Account';
        nameField.classList.remove('hidden'); // Show name field for signup
    }
}

/**
 * Updates the visual state of authentication tabs
 * @param {boolean} isLogin - True if login tab should be active
 */
function updateAuthTabs(isLogin) {
    const loginTab = document.getElementById('showLogin');
    const signupTab = document.getElementById('showSignup');
    
    if (isLogin) {
        // Activate login tab, deactivate signup tab
        loginTab.classList.add('active');
        loginTab.classList.remove('text-gray-500', 'hover:text-gray-700');
        signupTab.classList.remove('active');
        signupTab.classList.add('text-gray-500', 'hover:text-gray-700');
    } else {
        // Activate signup tab, deactivate login tab
        signupTab.classList.add('active');
        signupTab.classList.remove('text-gray-500', 'hover:text-gray-700');
        loginTab.classList.remove('active');
        loginTab.classList.add('text-gray-500', 'hover:text-gray-700');
    }
}

// Show signup modal (convenience function)
function showSignupModal() {
    showLoginModal(false);
}

// Hide authentication modal
function hideAuthModal() {
    authModal.style.display = 'none';
}

// Event listeners for authentication buttons
loginBtn?.addEventListener('click', () => showLoginModal(true));
signupBtn?.addEventListener('click', () => showSignupModal());
loginBtnMobile?.addEventListener('click', () => showLoginModal(true));
signupBtnMobile?.addEventListener('click', () => showSignupModal());

// Tab switching and modal cancellation
showLoginBtn?.addEventListener('click', () => showLoginModal(true));
showSignupBtn?.addEventListener('click', () => showSignupModal());
authCancel?.addEventListener('click', hideAuthModal);

/**
 * Handles authentication form submission (login or signup)
 */
authForm?.addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevent default form submission
    
    // Determine endpoint and request body based on mode
    const endpoint = loginMode ? '/api/login' : '/api/signup';
    const body = loginMode 
        ? { email: authEmail.value, password: authPassword.value }
        : { 
            email: authEmail.value, 
            password: authPassword.value, 
            name: authName.value || authEmail.value.split('@')[0] // Use email prefix as default name
        };
    
    // Reset error state and show loading
    authError.textContent = '';
    authError.classList.add('hidden');
    authSpinner.classList.remove('hidden');
    authSubmitText.textContent = loginMode ? 'Signing In...' : 'Creating Account...';
    
    try {
        // Send authentication request
        const resp = await fetch(endpoint, {
            method: 'POST', 
            headers: {'Content-Type':'application/json'}, 
            body: JSON.stringify(body)
        });
        
        const data = await resp.json();
        
        if (!resp.ok) {
            throw new Error(data.error || 'Failed to authenticate');
        }
        
        // Authentication successful
        currentUser = data.user;
        hideAuthModal();
        await refreshSessionAndHistory(); // Update UI with user data
        
    } catch (err) {
        // Authentication failed - show error
        authError.textContent = err.message || 'Authentication failed';
        authError.classList.remove('hidden');
    } finally {
        // Reset loading state
        authSpinner.classList.add('hidden');
        authSubmitText.textContent = loginMode ? 'Sign In' : 'Create Account';
    }
});

/**
 * Handles user logout
 */
async function logoutUser() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        await refreshSessionAndHistory(); // Update UI to logged out state
        profileDropdown?.classList.remove('open'); // Close profile dropdown
    } catch (err) {
        console.error('Logout failed:', err);
    }
}

/**
 * Refreshes user session and quiz history
 */
async function refreshSessionAndHistory() {
    try {
        // Fetch current user profile
        const resp = await fetch('/api/user-profile');
        if (resp.status === 401) {
            throw new Error('Not logged in');
        }
        
        if (!resp.ok) {
            throw new Error('Failed to fetch user profile');
        }
        
        const userData = await resp.json();
        currentUser = userData;
        showUserLoggedIn(true); // Update UI for logged in state
        
        // Fetch and display quiz history
        const historyResp = await fetch('/api/quiz-history');
        if (historyResp.ok) {
            const history = await historyResp.json();
            renderQuizHistory(history);
        }
    } catch (err) {
        // User is not logged in or error occurred
        showUserLoggedIn(false);
        if (quizHistoryList) {
            quizHistoryList.innerHTML = `
                <div class="empty-history">
                    <div class="empty-history-icon">📚</div>
                    <p class="text-gray-600 mb-2">Login to see your quiz history</p>
                    <button onclick="showLoginModal(true)" class="celebration-btn celebration-btn-primary" style="padding: 8px 16px; font-size: 14px;">
                        Sign In
                    </button>
                </div>
            `;
        }
    }
}

/**
 * Updates UI based on login state
 * @param {boolean} loggedIn - True if user is logged in
 */
function showUserLoggedIn(loggedIn) {
    if (loggedIn && currentUser) {
        // User is logged in - show user controls
        if (guestControls) guestControls.style.display = 'none';
        if (userControls) userControls.style.display = 'flex';
        if (mobileAuthControls) mobileAuthControls.style.display = 'none';
        
        // Update user information in UI
        const displayName = currentUser.name || currentUser.email.split('@')[0];
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        if (userAvatar) userAvatar.textContent = initials;
        if (userName) userName.textContent = displayName;
        if (userEmail) userEmail.textContent = currentUser.email;
        if (dropdownUserName) dropdownUserName.textContent = displayName;
        if (dropdownUserEmail) dropdownUserEmail.textContent = currentUser.email;
        
    } else {
        // User is logged out - show guest controls
        if (guestControls) guestControls.style.display = 'flex';
        if (userControls) userControls.style.display = 'none';
        if (mobileAuthControls) mobileAuthControls.style.display = 'flex';
    }
}

/**
 * Renders quiz history list with updated color scheme
 * @param {Array} list - Array of quiz history items
 */
function renderQuizHistory(list) {
    if (!quizHistoryList) return;
    
    quizHistoryList.innerHTML = ''; // Clear existing content
    
    if (!list || !Array.isArray(list) || list.length === 0) {
        // Show empty state message with color scheme
        quizHistoryList.innerHTML = `
            <div class="empty-history">
                <div class="empty-history-icon">📝</div>
                <p class="text-gray-600">No quizzes created yet</p>
                <p class="text-gray-500 text-sm mt-1">Create your first quiz to see it here!</p>
            </div>
        `;
        return;
    }
    
    // Create and append history items with new styling
    list.forEach(q => {
        const el = document.createElement('div');
        const isComplete = q.is_complete;
        const statusClass = isComplete ? '' : 'history-item-incomplete';
        
        // Get total questions - this is the key fix
        const totalQuestions = q.total_questions || (q.questions_json ? JSON.parse(q.questions_json).length : '?');
        
        el.className = `history-item ${statusClass}`;
        el.innerHTML = `
            <div class="history-title">${q.prompt.length > 60 ? q.prompt.slice(0, 57) + '...' : q.prompt}</div>
            <div class="history-meta">
                <div class="history-date">${formatDate(q.date)}</div>
                <div class="history-status">
                    ${isComplete ? 
                        `<span class="status-complete">
                            <span class="history-icon">🏆</span>
                            <span class="history-score">${q.score}/${totalQuestions}</span>
                        </span>` : 
                        `<span class="status-incomplete">
                            <span class="history-icon">⏳</span>
                            <span>In Progress</span>
                        </span>`
                    }
                </div>
            </div>
        `;
        el.onclick = () => loadPastQuiz(q.quiz_id);
        quizHistoryList.appendChild(el);
    });
}

/**
 * Formats date for display in history
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

/**
 * Loads and displays a past quiz
 * @param {number} quizID - ID of the quiz to load
 */
async function loadPastQuiz(quizID) {
    try {
        const resp = await fetch(`/api/quiz-detail?id=${quizID}`);
        if (!resp.ok) throw new Error('Failed to load quiz');
        
        const detail = await resp.json();
        displayQuizWithAnswers(detail.questions, detail.user_answers, detail.is_complete, detail.score, detail.quiz_id);
    } catch (err) {
        alert('Could not load quiz detail: ' + err.message);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    refreshSessionAndHistory();
    
    // Celebration screen event listeners
    celebrationReviewBtn?.addEventListener('click', () => {
        hideCelebrationScreen();
        // Scroll to results section
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    });
    
    celebrationNewQuizBtn?.addEventListener('click', () => {
        hideCelebrationScreen();
        // Reset the quiz interface for a new quiz
        resetQuizInterface();
    });
});

// ----------- File Upload Functionality -----------

// Trigger file input when upload zone is clicked
uploadZone?.addEventListener('click', () => fileInput.click());

// Handle drag over event for file upload
uploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over'); // Visual feedback
});

// Handle drag leave event
uploadZone?.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

// Handle file drop event
uploadZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleFileUpload(e.dataTransfer.files[0]);
    }
});

// Handle file input change
fileInput?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

/**
 * Handles file upload and text extraction
 * @param {File} file - The file to upload
 */
async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Show loading state
        uploadZone.innerHTML = `
            <div class="flex flex-col items-center">
                <div class="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mb-2"></div>
                <p class="text-gray-600">Processing ${file.name}...</p>
            </div>
        `;

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        uploadedText = data.text; // Store extracted text
        
        // Show success state
        uploadZone.innerHTML = `
            <div class="flex flex-col items-center">
                <svg class="w-12 h-12 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p class="text-gray-700 font-medium">${file.name}</p>
                <p class="text-gray-500 text-sm">File uploaded successfully</p>
                <button onclick="resetUpload()" class="mt-3 text-orange-500 text-sm hover:text-orange-600">Upload different file</button>
            </div>
        `;

        // Pre-fill topic input with extracted text
        if (data.text && data.text.length > 50) {
            topicInput.value = `[Uploaded from ${file.name}]\n\n` + data.text.substring(0, 300) + (data.text.length > 300 ? '...' : '');
        }
    } catch (error) {
        // Show error state
        uploadZone.innerHTML = `
            <div class="flex flex-col items-center">
                <svg class="w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <p class="text-red-600">Upload failed. Please try again.</p>
                <button onclick="resetUpload()" class="mt-3 text-orange-500 text-sm hover:text-orange-600">Try again</button>
            </div>
        `;
    }
}

/**
 * Resets upload zone to initial state
 */
function resetUpload() {
    uploadZone.innerHTML = `
        <div class="flex flex-col items-center">
            <svg class="w-16 h-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-gray-700 mb-1">
                <span>Upload </span>
                <span class="text-orange-500 font-medium">PDF</span>
                <span> or </span>
                <span class="text-orange-500 font-medium">Document</span>
                <span> to create quiz</span>
            </p>
            <p class="text-gray-400 text-sm">Supports PDF, Word (DOCX), and TXT files</p>
        </div>
    `;
    uploadedText = '';
    fileInput.value = '';
}

// Handle paste from clipboard
pasteBtn?.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        topicInput.value = text;
    } catch (error) {
        alert('Unable to access clipboard. Please paste manually.');
    }
});

// ----------- Quiz Generation Functionality -----------

/**
 * Handles quiz generation when generate button is clicked
 */
generateBtn?.addEventListener('click', async () => {
    let topic = uploadedText || topicInput.value.trim();
    
    if (!topic) {
        alert('Please enter a topic or upload a file to create a quiz.');
        return;
    }

    // Get quiz configuration from UI
    const difficulty = document.getElementById('difficulty').value;
    const questionCount = parseInt(document.getElementById('questionCount').value);
    const quizType = document.getElementById('quizType').value;

    // Show loading state
    loadingSpinner.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    generateBtn.disabled = true;
    generateBtn.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        // Generate quiz via API
        const response = await fetch('/api/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                topic,
                difficulty,
                questionCount,
                quizType
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to generate quiz');
        }

        const quiz = await response.json();
        
        // Save quiz to database if user is logged in
        if (await isUserLoggedIn()) {
            try {
                const saveResponse = await fetch('/api/save-quiz', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: topic.substring(0, 200), // Truncate for display
                        questions: quiz
                    })
                });
                
                if (saveResponse.ok) {
                    const saveResult = await saveResponse.json();
                    currentQuizId = saveResult.quiz_id;
                    
                    // Refresh history to show the new quiz
                    refreshSessionAndHistory();
                }
            } catch (saveError) {
                console.error('Failed to save quiz:', saveError);
            }
        }
        
        displayQuiz(quiz); // Display the generated quiz
    } catch (error) {
        alert('Error generating quiz: ' + error.message);
    } finally {
        // Reset loading state
        loadingSpinner.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});

/**
 * Checks if user is logged in
 * @returns {boolean} True if user is logged in
 */
async function isUserLoggedIn() {
    return currentUser !== null;
}

/**
 * Displays generated quiz in the UI
 * @param {Array} quiz - Array of quiz questions
 */
function displayQuiz(quiz) {
    quizContainer.innerHTML = ''; // Clear previous quiz
    let answers = new Array(quiz.length).fill(null); // Track user answers

    // Create question cards for each quiz question
    quiz.forEach((item, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'bg-white border border-gray-200 rounded-xl p-6 shadow-sm';

        let optionsHTML = '';
        if (item.options && item.options.length > 0) {
            // Generate options buttons
            optionsHTML = `
                <div class="mt-4 space-y-2" id="options-${index}">
                    ${item.options.map((option, i) => `
                        <button data-q="${index}" data-opt="${option.replace(/&/g, '&amp;').replace(/'/g, '\'').replace(/\"/g, '&quot;')}" type="button"
                            class="option-btn w-full text-left flex items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-orange-50 transition-colors focus:outline-none"
                            style="cursor:pointer;">
                            <span class="font-medium">${String.fromCharCode(65 + i)}.</span>
                            <span>${option}</span>
                        </button>
                    `).join('')}
                </div>
                <div id="feedback-${index}"></div>
            `;
        }

        // Build question card HTML
        questionCard.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="bg-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">${index + 1}</span>
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${item.question}</h3>
                    ${optionsHTML}
                </div>
            </div>
        `;
        quizContainer.appendChild(questionCard);
    });

    // Add event listeners for answer selection
    quiz.forEach((item, index) => {
        const optionsDiv = document.getElementById(`options-${index}`);
        const feedbackDiv = document.getElementById(`feedback-${index}`);
        if (!optionsDiv) return;
        
        let answered = false; // Track if question has been answered
        
        optionsDiv.querySelectorAll('button.option-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                if (answered) return; // Prevent multiple answers
                answered = true;
                
                // Disable all buttons in this question
                optionsDiv.querySelectorAll('button.option-btn').forEach(optBtn => {
                    optBtn.disabled = true;
                    optBtn.classList.add('cursor-not-allowed','opacity-75');
                });
                
                const selected = this.getAttribute('data-opt');
                const correct = item.correctAnswer;
                
                // Highlight correct option in green
                optionsDiv.querySelectorAll('button.option-btn').forEach(optBtn => {
                    const optText = optBtn.getAttribute('data-opt');
                    if (optText === correct) {
                        optBtn.classList.remove('border-gray-200', 'bg-gray-50', 'hover:bg-orange-50');
                        optBtn.classList.add('bg-green-100', 'border-green-400', 'text-green-900', 'font-semibold');
                    }
                });
                
                if (selected === correct) {
                    // Correct answer
                    this.classList.remove('bg-gray-50','border-gray-200');
                    this.classList.add('bg-green-100','border-green-400','text-green-900', 'font-semibold');
                    
                    // Create explanation with requested color scheme
                    const explanationHTML = item.explanation ? `
                        <div class="explanation-container">
                            <div class="explanation-title">Explanation</div>
                            <div class="explanation-content">${item.explanation}</div>
                        </div>
                    ` : '';
                    
                    feedbackDiv.innerHTML = `
                        <div class="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-900 flex items-center gap-3">
                            <span class="text-2xl">✅</span> <span class="font-bold">Correct!</span>
                        </div>
                        ${explanationHTML}
                    `;
                    answers[index] = 'correct';
                } else {
                    // Incorrect answer
                    this.classList.remove('bg-gray-50','border-gray-200');
                    this.classList.add('bg-red-100','border-red-400','text-red-900','font-semibold');
                    
                    // Create explanation with requested color scheme
                    const explanationHTML = item.explanation ? `
                        <div class="explanation-container">
                            <div class="explanation-title">Explanation</div>
                            <div class="explanation-content">${item.explanation}</div>
                        </div>
                    ` : '';
                    
                    feedbackDiv.innerHTML = `
                        <div class="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-center gap-3">
                            <span class="text-2xl">❌</span> <span class="font-bold">Wrong!</span>
                        </div>
                        ${explanationHTML}
                    `;
                    answers[index] = 'wrong';
                }
                
                // If all questions have been answered, show result summary
                if (answers.every(a => a !== null)) {
                    const correctCount = answers.filter(a => a === 'correct').length;
                    showResultSummary(correctCount, answers.length);
                }
            });
        });
    });
    
    // Show results section
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Remove any previous summary
    let existingSummary = document.getElementById('quiz-summary-score');
    if (existingSummary) existingSummary.remove();
}

/**
 * Shows quiz result summary
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total number of questions
 */
function showResultSummary(correct, total) {
    // Remove any previous summary to prevent duplicates
    let existingSummary = document.getElementById('quiz-summary-score');
    if (existingSummary) existingSummary.remove();
    
    const resultDiv = document.createElement('div');
    resultDiv.id = 'quiz-summary-score';
    resultDiv.className = 'mt-8 mb-6 p-6 text-center bg-gray-100 rounded-xl border border-gray-300 text-2xl font-bold shadow';
    resultDiv.innerHTML = `You got <span class="text-green-600">${correct}</span> out of <span class="text-blue-700">${total}</span> correct!`;
    quizContainer.appendChild(resultDiv);
    
    // Show celebration screen
    showCelebrationScreen(correct, total);
    
    // Save quiz attempt
    sendQuizAttempt(correct, total);
}

/**
 * Sends quiz attempt to server
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total number of questions
 */
async function sendQuizAttempt(correct, total) {
    if (!currentQuizId) return;
    
    try {
        await fetch('/api/save-quiz-attempt', {
            method: 'POST', 
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                quiz_id: currentQuizId, 
                score: correct, 
                is_complete: true
            })
        });
        // Refresh history to show updated score
        refreshSessionAndHistory();
    } catch (err) {
        console.error('Failed to save quiz attempt:', err);
    }
}

/**
 * Displays a completed quiz with user answers
 * @param {Array} questions - Quiz questions
 * @param {Array} userAnswers - User's answers
 * @param {boolean} isComplete - Whether quiz is complete
 * @param {number} score - User's score
 * @param {number} quizId - Quiz ID
 */
function displayQuizWithAnswers(questions, userAnswers, isComplete, score, quizId) {
    currentQuizId = quizId;
    quizContainer.innerHTML = '';
    
    questions.forEach((item, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'bg-white border border-gray-200 rounded-xl p-6 shadow-sm';

        let optionsHTML = '';
        if (item.options && item.options.length > 0) {
            const userAnswer = userAnswers ? userAnswers[index] : null;
            const correctAnswer = item.correctAnswer;
            
            optionsHTML = `
                <div class="mt-4 space-y-2">
                    ${item.options.map((option, i) => {
                        const isUserAnswer = userAnswer === option;
                        const isCorrectAnswer = option === correctAnswer;
                        let bgClass = 'bg-gray-50 border-gray-200';
                        
                        // Apply appropriate styling based on answer correctness
                        if (isCorrectAnswer) {
                            bgClass = 'bg-green-100 border-green-400 text-green-900 font-semibold';
                        } else if (isUserAnswer && !isCorrectAnswer) {
                            bgClass = 'bg-red-100 border-red-400 text-red-900 font-semibold';
                        }
                        
                        return `
                            <div class="w-full text-left flex items-center gap-2 p-3 rounded-lg border ${bgClass}">
                                <span class="font-medium">${String.fromCharCode(65 + i)}.</span>
                                <span>${option}</span>
                                ${isUserAnswer && isCorrectAnswer ? '<span class="ml-2 text-green-600">✓ Your answer</span>' : ''}
                                ${isUserAnswer && !isCorrectAnswer ? '<span class="ml-2 text-red-600">✗ Your answer</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                ${item.explanation ? `
                    <div class="explanation-container">
                        <div class="explanation-title">Explanation</div>
                        <div class="explanation-content">${item.explanation}</div>
                    </div>
                ` : ''}
            `;
        }

        questionCard.innerHTML = `
            <div class="flex items-start gap-3">
                <span class="bg-orange-500 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">${index + 1}</span>
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${item.question}</h3>
                    ${optionsHTML}
                </div>
            </div>
        `;
        quizContainer.appendChild(questionCard);
    });

    // Show score for completed quiz
    if (isComplete) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'mt-8 mb-6 p-6 text-center bg-gray-100 rounded-xl border border-gray-300 text-2xl font-bold shadow';
        resultDiv.innerHTML = `Score: <span class="text-green-600">${score}</span> out of <span class="text-blue-700">${questions.length}</span> correct!`;
        quizContainer.appendChild(resultDiv);
    }
    
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Resets the quiz interface for a new quiz
 */
function resetQuizInterface() {
    // Clear quiz container
    quizContainer.innerHTML = '';
    
    // Hide results section
    resultsSection.classList.add('hidden');
    
    // Reset topic input
    topicInput.value = '';
    
    // Reset upload zone
    resetUpload();
    
    // Reset current quiz ID
    currentQuizId = null;
}

// ----------- Quiz Export Functionality -----------

// Copy quiz to clipboard
copyBtn?.addEventListener('click', () => {
    const quizText = Array.from(document.querySelectorAll('#quizContainer > div')).map((card, index) => {
        return card.innerText;
    }).join('\n\n');

    navigator.clipboard.writeText(quizText).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        setTimeout(() => {
            copyBtn.innerText = originalText;
        }, 2000);
    }).catch(() => {
        alert('Failed to copy to clipboard');
    });
});

// Download quiz as text file
downloadBtn?.addEventListener('click', () => {
    const quizText = Array.from(document.querySelectorAll('#quizContainer > div')).map((card, index) => {
        return card.innerText;
    }).join('\n\n');

    const blob = new Blob([quizText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});