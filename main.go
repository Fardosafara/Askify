package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"encoding/gob"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/ledongthuc/pdf"
	_ "modernc.org/sqlite" // Pure-Go SQLite driver (no CGO required)
	"github.com/nguyenthenguyen/docx"
	"golang.org/x/crypto/bcrypt"
)

// ============================================================================
// DATA STRUCTURES - How we organize information in the app
// ============================================================================

// When frontend asks to create a quiz, it sends this structure
type QuizRequest struct {
	Topic         string `json:"topic"`          // What the quiz should be about (e.g., "Python programming")
	Difficulty    string `json:"difficulty"`     // How hard: Easy, Medium, or Hard
	QuestionCount int    `json:"questionCount"`  // How many questions: 5, 10, 15, etc.
	QuizType      string `json:"quizType"`       // What kind: Multiple Choice, True/False, etc.
}

// Single message in conversation with OpenAI
type OpenAIMessage struct {
	Role    string `json:"role"`    // Who's speaking: "system" (instructions), "user" (our request)
	Content string `json:"content"` // What they're saying
}

// Full request we send to OpenAI
type OpenAIRequest struct {
	Model    string          `json:"model"`    // Which AI to use: "gpt-4o"
	Messages []OpenAIMessage `json:"messages"` // Conversation history
}

// Response we get back from OpenAI
type OpenAIResponse struct {
	Choices []struct {
		Message OpenAIMessage `json:"message"` // AI's generated response
	} `json:"choices"`
	Error struct {
		Message string `json:"message"` // If something went wrong
	} `json:"error"`
}

// When user creates an account
type SignupRequest struct {
	Email    string `json:"email"`    // User's email address
	Password string `json:"password"` // Their chosen password
	Name     string `json:"name"`     // What to call them (optional)
}

// When user logs in
type LoginRequest struct {
	Email    string `json:"email"`    // Their email
	Password string `json:"password"` // Their password
}

// Basic user information
type User struct {
	ID    int    `json:"id"`    // Unique number identifying user
	Email string `json:"email"` // Their email
	Name  string `json:"name"`  // Their display name
}

// When saving quiz results
type SaveQuizAttemptRequest struct {
	QuizID     int    `json:"quiz_id"`      // Which quiz they took
	Answers    string `json:"answers_json"` // Their answers as JSON
	Score      int    `json:"score"`        // How many they got right
	IsComplete bool   `json:"is_complete"`  // Did they finish the quiz?
}

// Item shown in quiz history list
type QuizHistoryItem struct {
	QuizID         int    `json:"quiz_id"`     // Quiz identifier
	Prompt         string `json:"prompt"`      // What the quiz was about
	Score          int    `json:"score"`       // Their score
	Date           string `json:"date"`        // When they took it
	IsComplete     bool   `json:"is_complete"` // Completed or in progress
	TotalQuestions int    `json:"total_questions"` // Total number of questions in the quiz
	QuestionsJSON  string `json:"questions_json"`  // Raw questions JSON to calculate total
}

// Detailed view of a specific quiz
type QuizDetail struct {
	QuizID     int         `json:"quiz_id"`     // Quiz identifier
	Prompt     string      `json:"prompt"`      // Quiz topic
	Questions  interface{} `json:"questions"`   // All the questions
	Answers    interface{} `json:"user_answers"` // User's answers
	Score      int         `json:"score"`       // Their score
	IsComplete bool        `json:"is_complete"` // Completion status
	Date       string      `json:"date"`        // When created
}

// When saving a newly generated quiz
type SaveQuizRequest struct {
	Prompt    string      `json:"prompt"`    // What the quiz is about
	Questions interface{} `json:"questions"` // The actual quiz content
}

// ============================================================================
// APPLICATION SETUP AND CONFIGURATION
// ============================================================================

// Where we store our data
const dbPath = "askify.db"

// Track logged-in users: session_id -> user_id
var sessions = map[string]int{}
const sessionCookieName = "askify_session"

// Tell Go how to store complex data in sessions
func init() {
	gob.Register(map[string]interface{}{})
}

// ============================================================================
// SECURITY FUNCTIONS - Keeping passwords safe
// ============================================================================

// Turn plain text password into secure hash
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// Check if entered password matches stored hash
func checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE - Protecting routes
// ============================================================================

// Wrap handlers that require login - checks if user is logged in first
func requireAuth(handler func(http.ResponseWriter, *http.Request, *User)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, ok := getSessionUser(r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		handler(w, r, user)
	}
}

// Get user info from session cookie
func getSessionUser(r *http.Request) (*User, bool) {
	// Look for our session cookie
	c, err := r.Cookie(sessionCookieName)
	if err != nil {
		return nil, false // No cookie = not logged in
	}
	
	// Find user ID for this session
	sessionID := c.Value
	userID, ok := sessions[sessionID]
	if !ok {
		return nil, false // Invalid session
	}
	
	// Get user details from database
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, false
	}
	defer db.Close()
	
	var user User
	row := db.QueryRow("SELECT id, email, name FROM users WHERE id=?", userID)
	if err := row.Scan(&user.ID, &user.Email, &user.Name); err != nil {
		return nil, false // User not found in database
	}
	
	return &user, true
}

// ============================================================================
// USER MANAGEMENT HANDLERS - Signup, login, logout
// ============================================================================

// Create new user account
func handleSignup(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		// Read signup data from request
		var req SignupRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		
		// Check required fields
		if req.Email == "" || req.Password == "" {
			http.Error(w, "Email and password are required", http.StatusBadRequest)
			return
		}
		
		// Secure the password
		hash, err := hashPassword(req.Password)
		if err != nil {
			http.Error(w, "Error hashing password", http.StatusInternalServerError)
			return
		}
		
		// Use email username as default name if none provided
		if req.Name == "" {
			req.Name = strings.Split(req.Email, "@")[0]
		}
		
		// Save user to database
		res, err := db.Exec("INSERT INTO users(email, password_hash, name) VALUES(?, ?, ?)", req.Email, hash, req.Name)
		if err != nil {
			log.Printf("Error creating user: %v", err)
			http.Error(w, "User already exists or error saving user", http.StatusBadRequest)
			return
		}
		
		// Get the new user's ID
		userID, _ := res.LastInsertId()
		
		// Create session so they stay logged in
		sessionID := uuid.New().String()
		sessions[sessionID] = int(userID)
		
		// Set session cookie in browser
		http.SetCookie(w, &http.Cookie{
			Name:     sessionCookieName,
			Value:    sessionID,
			HttpOnly: true, // Prevent JavaScript access (security)
			Path:     "/",
			MaxAge:   86400 * 30, // Expires in 30 days
		})
		
		// Send success response with user info
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "ok",
			"user": User{
				ID:    int(userID),
				Email: req.Email,
				Name:  req.Name,
			},
		})
	}
}

// Log user in
func handleLogin(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		// Read login data
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		
		// Look up user in database
		var id int
		var hash, name string
		row := db.QueryRow("SELECT id, password_hash, name FROM users WHERE email=?", req.Email)
		if err := row.Scan(&id, &hash, &name); err != nil {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}
		
		// Check if password is correct
		if !checkPasswordHash(req.Password, hash) {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}
		
		// Create session
		sessionID := uuid.New().String()
		sessions[sessionID] = id
		
		// Set session cookie
		http.SetCookie(w, &http.Cookie{
			Name:     sessionCookieName,
			Value:    sessionID,
			HttpOnly: true,
			Path:     "/",
			MaxAge:   86400 * 30,
		})
		
		// Send success response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "ok",
			"user": User{
				ID:    id,
				Email: req.Email,
				Name:  name,
			},
		})
	}
}

// Log user out
func handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	
	// Remove session from memory
	c, err := r.Cookie(sessionCookieName)
	if err == nil {
		delete(sessions, c.Value)
	}
	
	// Expire the cookie in browser
	http.SetCookie(w, &http.Cookie{
		Name: sessionCookieName, Value: "", Path: "/", MaxAge: -1})
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// Get current user's profile
func handleUserProfile(w http.ResponseWriter, r *http.Request) {
	user, ok := getSessionUser(r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

// ============================================================================
// DATABASE SETUP - Creating tables and structure
// ============================================================================

// Initialize database and create tables if they don't exist
func mustInitDB() *sql.DB {
	// Connect to SQLite database
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Failed to open DB: %v", err)
	}
	
	// Test connection works
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping DB: %v", err)
	}
	
	// Create users table
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL DEFAULT '',
                created_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )`)
	if err != nil {
		log.Fatalf("Failed to create users table: %v", err)
	}
	
	// If we added the name column later, check if it exists and add it
	var nameColumnExists bool
	err = db.QueryRow(`SELECT COUNT(*) FROM pragma_table_info('users') WHERE name='name'`).Scan(&nameColumnExists)
	if err == nil && !nameColumnExists {
		log.Println("Adding name column to users table...")
		_, err = db.Exec(`ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT ''`)
		if err != nil {
			log.Printf("Warning: Could not add name column: %v", err)
		}
	}
	
	// Create table for storing generated quizzes
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS quizzes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                prompt TEXT NOT NULL,
                questions_json TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY(user_id) REFERENCES users(id)
        )`)
	if err != nil {
		log.Fatalf("Failed to create quizzes table: %v", err)
	}
	
	// Create table for tracking quiz attempts and scores
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS quiz_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                quiz_id INTEGER NOT NULL,
                answers_json TEXT,
                score INTEGER,
                is_complete BOOLEAN NOT NULL DEFAULT 0,
                started_at DATETIME NOT NULL DEFAULT (datetime('now')),
                completed_at DATETIME,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
        )`)
	if err != nil {
		log.Fatalf("Failed to create quiz_attempts table: %v", err)
	}
	
	log.Println("Database initialized successfully")
	return db
}

// ============================================================================
// QUIZ MANAGEMENT HANDLERS - Saving, history, details
// ============================================================================

// Save or update quiz attempt results
func handleSaveQuizAttempt(db *sql.DB) http.HandlerFunc {
	return requireAuth(func(w http.ResponseWriter, r *http.Request, user *User) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		var req SaveQuizAttemptRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		
		// Check if user already attempted this quiz
		var attemptID int
		row := db.QueryRow("SELECT id FROM quiz_attempts WHERE quiz_id=? AND user_id=?", req.QuizID, user.ID)
		if err := row.Scan(&attemptID); err == nil {
			// Update existing attempt
			_, err := db.Exec("UPDATE quiz_attempts SET answers_json=?, score=?, is_complete=?, completed_at=CASE WHEN ? THEN datetime('now') ELSE completed_at END WHERE id=?", 
				req.Answers, req.Score, req.IsComplete, req.IsComplete, attemptID)
			if err != nil {
				http.Error(w, "Failed to update attempt", http.StatusInternalServerError)
				return
			}
		} else {
			// Create new attempt record
			_, err := db.Exec("INSERT INTO quiz_attempts (user_id,quiz_id,answers_json,score,is_complete) VALUES (?,?,?,?,?)", 
				user.ID, req.QuizID, req.Answers, req.Score, req.IsComplete)
			if err != nil {
				http.Error(w, "Failed to save attempt", http.StatusInternalServerError)
				return
			}
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
}

// Get user's quiz history
func handleQuizHistory(db *sql.DB) http.HandlerFunc {
	return requireAuth(func(w http.ResponseWriter, r *http.Request, user *User) {
		// Get all quizzes for this user with their attempt data and questions_json
		rows, err := db.Query(`SELECT q.id, q.prompt, IFNULL(a.score,0), q.created_at, IFNULL(a.is_complete,0), q.questions_json
            FROM quizzes q
            LEFT JOIN quiz_attempts a ON q.id=a.quiz_id AND a.user_id=?
            WHERE q.user_id=? ORDER BY q.created_at DESC`, user.ID, user.ID)
		if err != nil {
			http.Error(w, "Failed to query history", http.StatusInternalServerError)
			return
		}
		defer rows.Close()
		
		var result []QuizHistoryItem
		for rows.Next() {
			var it QuizHistoryItem
			var questionsJSON string
			if err := rows.Scan(&it.QuizID, &it.Prompt, &it.Score, &it.Date, &it.IsComplete, &questionsJSON); err == nil {
				// Calculate total questions by parsing the questions_json
				var questions []interface{}
				if err := json.Unmarshal([]byte(questionsJSON), &questions); err == nil {
					it.TotalQuestions = len(questions)
				} else {
					// If parsing fails, set to 0
					it.TotalQuestions = 0
				}
				it.QuestionsJSON = questionsJSON
				result = append(result, it)
			}
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	})
}

// Get detailed information about a specific quiz
func handleQuizDetail(db *sql.DB) http.HandlerFunc {
	return requireAuth(func(w http.ResponseWriter, r *http.Request, user *User) {
		quizIDStr := r.URL.Query().Get("id")
		if quizIDStr == "" {
			http.Error(w, "Missing id", http.StatusBadRequest)
			return
		}
		
		var (
			quizID                int
			prompt, questionsJSON string
			created               string
		)
		
		// Get basic quiz info
		row := db.QueryRow("SELECT id, prompt, questions_json, created_at FROM quizzes WHERE id=? AND user_id=?", quizIDStr, user.ID)
		if err := row.Scan(&quizID, &prompt, &questionsJSON, &created); err != nil {
			http.Error(w, "Quiz not found", http.StatusNotFound)
			return
		}
		
		// Parse questions from JSON
		var questions interface{}
		json.Unmarshal([]byte(questionsJSON), &questions)
		
		// Get attempt data if exists
		var answersJSON string
		var score int
		var isComplete bool
		var completedAt string
		row = db.QueryRow("SELECT answers_json, score, is_complete, completed_at FROM quiz_attempts WHERE quiz_id=? AND user_id=?", quizID, user.ID)
		_ = row.Scan(&answersJSON, &score, &isComplete, &completedAt)
		
		var answers interface{}
		json.Unmarshal([]byte(answersJSON), &answers)
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(QuizDetail{
			QuizID: quizID, Prompt: prompt, Questions: questions, Answers: answers, 
			Score: score, IsComplete: isComplete, Date: created,
		})
	})
}

// Save a newly generated quiz to database
func handleSaveQuiz(db *sql.DB) http.HandlerFunc {
	return requireAuth(func(w http.ResponseWriter, r *http.Request, user *User) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		
		var req SaveQuizRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		
		// Convert questions to JSON for storage
		questionsJSON, _ := json.Marshal(req.Questions)
		
		// Save to database
		res, err := db.Exec("INSERT INTO quizzes (user_id, prompt, questions_json) VALUES (?, ?, ?)", 
			user.ID, req.Prompt, string(questionsJSON))
		if err != nil {
			http.Error(w, "Failed to save quiz", http.StatusInternalServerError)
			return
		}
		
		quizID, _ := res.LastInsertId()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]int64{"quiz_id": quizID})
	})
}

// ============================================================================
// MAIN APPLICATION SETUP AND ROUTING
// ============================================================================

// Application entry point - this runs when we start the server
func main() {
	godotenv.Load() // Load environment variables from .env file
	db := mustInitDB()
	defer db.Close()

	// Create directories we need
	os.MkdirAll("uploads", 0755)    // For uploaded files
	os.MkdirAll("templates", 0755)  // For HTML pages
	os.MkdirAll("static/js", 0755)  // For JavaScript
	os.MkdirAll("static/img", 0755) // For images

	// Set up all the URL routes and what functions handle them
	http.HandleFunc("/", serveHome) // Main page
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static")))) // CSS, JS, images
	http.HandleFunc("/api/upload", handleUpload) // File uploads
	http.HandleFunc("/api/generate-quiz", handleGenerateQuiz) // Create new quizzes
	http.HandleFunc("/api/save-quiz", handleSaveQuiz(db)) // Save quizzes
	http.HandleFunc("/api/signup", handleSignup(db)) // Create account
	http.HandleFunc("/api/login", handleLogin(db)) // Log in
	http.HandleFunc("/api/logout", handleLogout) // Log out
	http.HandleFunc("/api/user-profile", handleUserProfile) // Get user info
	http.HandleFunc("/api/save-quiz-attempt", handleSaveQuizAttempt(db)) // Save quiz results
	http.HandleFunc("/api/quiz-history", handleQuizHistory(db)) // Get quiz history
	http.HandleFunc("/api/quiz-detail", handleQuizDetail(db)) // Get quiz details

	// Start the web server
	port := "5000"
	log.Printf("Server starting on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// Serve the main HTML page
func serveHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	
	// Load and display the main page template
	tmpl, err := template.ParseFiles("templates/index.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

// ============================================================================
// FILE UPLOAD AND PROCESSING
// ============================================================================

// Handle file uploads and extract text from documents
func handleUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the uploaded file (max 10MB)
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	// Get the uploaded file
	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Figure out file type from extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	var text string

	// Make filename safe
	safeName := filepath.Base(header.Filename)
	if strings.Contains(safeName, "..") || safeName == "" {
		safeName = "upload" + ext
	}

	// Save file temporarily
	tempPath := filepath.Join("uploads", safeName)
	out, err := os.Create(tempPath)
	if err != nil {
		http.Error(w, "Error saving file", http.StatusInternalServerError)
		return
	}
	defer out.Close()
	defer os.Remove(tempPath) // Clean up when done

	io.Copy(out, file)

	// Extract text based on file type
	switch ext {
	case ".pdf":
		text, err = extractPDFText(tempPath)
	case ".docx":
		text, err = extractDocxText(tempPath)
	case ".txt":
		content, _ := os.ReadFile(tempPath)
		text = string(content)
	default:
		text = "File uploaded: " + header.Filename + ". Please describe the content or topic for the quiz."
	}

	if err != nil {
		http.Error(w, "Error extracting text: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Send extracted text back to frontend
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"text": text})
}

// Extract text from PDF files
func extractPDFText(path string) (string, error) {
	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	var text strings.Builder
	totalPages := r.NumPage()

	// Read text from each page (limit to 10 pages for performance)
	for pageIndex := 1; pageIndex <= totalPages && pageIndex <= 10; pageIndex++ {
		p := r.Page(pageIndex)
		if p.V.IsNull() {
			continue
		}
		pageText, err := p.GetPlainText(nil)
		if err == nil {
			text.WriteString(pageText)
			text.WriteString("\n")
		}
	}

	return text.String(), nil
}

// Extract text from Word documents
func extractDocxText(path string) (string, error) {
	r, err := docx.ReadDocxFile(path)
	if err != nil {
		return "", err
	}
	defer r.Close()

	doc := r.Editable()
	return doc.GetContent(), nil
}

// ============================================================================
// AI QUIZ GENERATION - The magic happens here!
// ============================================================================

// Generate quizzes using OpenAI's AI
func handleGenerateQuiz(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read quiz request from frontend
	var req QuizRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Get OpenAI API key from environment
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		http.Error(w, "OpenAI API key not configured", http.StatusInternalServerError)
		return
	}

	// Create the prompt that tells AI what kind of quiz to make
	prompt := fmt.Sprintf(`Create a %d-question %s quiz on the following topic with %s difficulty level.

Topic: %s

Please format the response as a JSON array with the following structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Brief explanation why this is correct"
  }
]

IMPORTANT: Return ONLY the JSON array, no additional text, no code blocks, no explanations.`,
		req.QuestionCount, req.QuizType, req.Difficulty, req.Topic)

	// Prepare request to OpenAI
	openAIReq := OpenAIRequest{
		Model: "gpt-4o",
		Messages: []OpenAIMessage{
			{Role: "system", Content: "You are an expert educational quiz creator. Always respond with valid JSON only, no additional text."},
			{Role: "user", Content: prompt},
		},
	}

	// Send request to OpenAI
	reqBody, _ := json.Marshal(openAIReq)
	httpReq, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		http.Error(w, "Error calling OpenAI API: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Check if OpenAI responded successfully
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		http.Error(w, fmt.Sprintf("OpenAI API error (status %d): %s", resp.StatusCode, string(body)), http.StatusInternalServerError)
		return
	}

	// Parse OpenAI's response
	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		http.Error(w, "Failed to parse OpenAI response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Check for OpenAI errors
	if openAIResp.Error.Message != "" {
			http.Error(w, "OpenAI Error: "+openAIResp.Error.Message, http.StatusInternalServerError)
			return
	}

	if len(openAIResp.Choices) == 0 {
		http.Error(w, "No response from OpenAI", http.StatusInternalServerError)
		return
	}

	// Get the generated quiz content
	quizContent := openAIResp.Choices[0].Message.Content
	
	// Clean up the response
	quizContent = strings.TrimSpace(quizContent)
	
	// Remove markdown code blocks if AI added them
	quizContent = strings.TrimPrefix(quizContent, "```json")
	quizContent = strings.TrimPrefix(quizContent, "```")
	quizContent = strings.TrimSuffix(quizContent, "```")
	quizContent = strings.TrimSpace(quizContent)

	// Validate that we got proper JSON
	var quizData interface{}
	if err := json.Unmarshal([]byte(quizContent), &quizData); err != nil {
		// Log the problematic response for debugging
		log.Printf("Raw OpenAI response: %s", quizContent)
		http.Error(w, "OpenAI returned invalid JSON. Please try again. Error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Send the generated quiz back to frontend
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(quizContent))
}