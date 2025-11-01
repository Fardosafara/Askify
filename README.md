# Askify - AI-Powered Quiz Generator

## Overview

Askify is a modern, full-stack web application that transforms educational content into interactive quizzes using artificial intelligence. Built with Go backend and modern JavaScript frontend, it enables students, educators, and lifelong learners to quickly generate customized quizzes from documents or text topics.

## 🚀 Key Features

### Core Functionality
- **Multi-Format File Support**: Upload PDF, Word documents, TXT files, and extract text for quiz generation
- **AI-Powered Generation**: Leverages OpenAI GPT-4o to create high-quality, educational quizzes
- **Customizable Quizzes**: Adjust difficulty, question count, and quiz types to match learning objectives
- **Real-time Interaction**: Answer questions with immediate feedback and explanations

### User Experience
- **Modern Authentication**: Secure login/signup with user profiles and session management
- **Quiz History**: Track all generated quizzes with scores and completion status
- **Responsive Design**: Optimized for desktop and mobile devices
- **Intuitive Interface**: Clean, orange-themed UI with drag-and-drop file uploads

### Advanced Features
- **Multiple Question Types**: Multiple Choice, True/False, Short Answer, and Mixed formats
- **Progress Tracking**: Save quiz attempts and monitor learning progress
- **Export Options**: Copy quizzes to clipboard or download as text files
- **Sidebar Navigation**: Easy access to quiz history and user controls

## 🛠️ Technology Stack

### Backend
- **Language**: Go 1.24
- **Framework**: Standard library (net/http, html/template)
- **Database**: SQLite with modernc.org/sqlite driver
- **Authentication**: bcrypt password hashing, session-based auth
- **File Processing**: PDF, DOCX text extraction libraries

### Frontend
- **Styling**: TailwindCSS with custom orange (#f97316) theme
- **Font**: Inter font family
- **Icons**: Heroicons SVG icons
- **JavaScript**: Vanilla ES6+ with modern async/await patterns

### External Services
- **AI Model**: OpenAI GPT-4o for quiz generation
- **File Processing**: Integrated document parsing libraries

## 📁 Project Structure

```
askify/
├── main.go                 # Main Go application server
├── go.mod                  # Go module dependencies
├── askify.db               # SQLite database (auto-generated)
├── .env                    # Environment variables
├── uploads/                # Files storage
├── templates/
│   └── index.html          # Main application template
└── static/
    ├── js/
    │   └── script.js       # Frontend application logic
    └── img/
        └── askify.jpg      # Application logo
```

## ⚡ Quick Start

### Prerequisites
- Go 1.24 or later
- OpenAI API key
- Modern web browser

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd askify
   ```

2. **Configure Environment**
   ```bash
   cp .env
   # Add your OpenAI API key to .env:
   OPENAI_API_KEY=your_api_key_here
   ```

3. **Install Dependencies**
   ```bash
   go mod tidy
   ```

4. **Run the Application**
   ```bash
   go run .
   ```
   Server starts on `http://localhost:5000`

### First Use
1. Open your browser to `http://localhost:5000`
2. Create an account or login
3. Upload a document or enter a topic
4. Configure quiz settings and generate
5. Take the quiz and track your progress

## 🎯 Usage Guide

### Creating Quizzes

**Method 1: File Upload**
1. Drag and drop a PDF, Word, or text file onto the upload zone
2. The system automatically extracts text content
3. Adjust quiz settings as needed
4. Click "Generate Quiz"

**Method 2: Manual Input**
1. Type or paste your topic into the text area
2. Use the "Paste Question" button for quick input
3. Customize difficulty and question parameters
4. Generate your quiz

### Quiz Configuration Options

- **Difficulty Levels**: Easy, Medium, Hard
- **Question Count**: 3, 5, 10, 15, or 20 questions
- **Quiz Types**:
  - Multiple Choice (default)
  - True/False
  - Short Answer
  - Mixed (variety of types)

### Taking Quizzes
- Answer questions interactively with immediate feedback
- View explanations for correct answers
- Track your score in real-time
- Completed quizzes are saved to your history

## 🔧 API Endpoints

### Authentication
- `POST /api/signup` - Create new user account
- `POST /api/login` - User authentication
- `POST /api/logout` - End user session
- `GET /api/user-profile` - Get current user data

### Quiz Management
- `POST /api/upload` - File upload and text extraction
- `POST /api/generate-quiz` - AI quiz generation
- `POST /api/save-quiz` - Store generated quiz
- `POST /api/save-quiz-attempt` - Save quiz results
- `GET /api/quiz-history` - User's quiz history
- `GET /api/quiz-detail` - Detailed quiz view

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique user email
- `password_hash` - Securely hashed password
- `name` - User display name
- `created_at` - Account creation timestamp

### Quizzes Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `prompt` - Original quiz topic/text
- `questions_json` - Serialized quiz content
- `created_at` - Generation timestamp

### Quiz Attempts Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `quiz_id` - Foreign key to quizzes
- `answers_json` - User's answers
- `score` - Quiz score
- `is_complete` - Completion status
- `started_at`, `completed_at` - Timestamps

## 🎨 UI/UX Design

### Color Scheme
- **Primary**: Orange-500 (#f97316)
- **Background**: White (#ffffff)
- **Text**: Gray-700 (#374151)
- **Borders**: Gray-200 (#e5e7eb)
- **Success**: Green-500 (#10b981)
- **Error**: Red-500 (#ef4444)

### Responsive Breakpoints
- **Mobile**: < 768px (collapsible sidebar)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Security Features

- Password hashing with bcrypt
- Session-based authentication
- Secure cookie handling
- SQL injection prevention
- File upload validation
- CORS protection

## 🚨 Common Issues & Fixes

### Backend Issues
- **Issue**: 'table users has no column named name'  
  **Fix**: Delete `askify.db` file and restart server

- **Issue**: 'go: command not found'  
  **Fix**: Install Go and restart terminal

- **Issue**: Missing module dependencies  
  **Fix**: Run `go mod tidy`

### Authentication Issues
- **Issue**: Signup form not working  
  **Fix**: Check browser console for errors

- **Issue**: User sessions not persisting  
  **Fix**: Ensure cookies are enabled

### API Issues
- **Issue**: OpenAI API not responding  
  **Fix**: Verify OPENAI_API_KEY environment variable

- **Issue**: Quiz generation failing  
  **Fix**: Check OpenAI API quota and prompt format

## 📈 Performance

- **Fast Response Times**: Optimized Go backend with efficient database queries
- **Scalable Architecture**: Stateless design with session-based auth
- **Efficient File Processing**: Stream-based document parsing
- **Optimized Frontend**: Minimal JavaScript with efficient DOM updates

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the Common Issues section above
2. Review browser console for errors
3. Verify all environment variables are set
4. Ensure required directories have proper permissions

## 🔮 Future Enhancements

- [ ] Image-based quiz generation (OCR)
- [ ] Collaborative quiz creation
- [ ] Advanced analytics and progress tracking
- [ ] Quiz sharing and public galleries
- [ ] Integration with learning management systems
- [ ] Mobile application
- [ ] Additional question types (matching, ordering)
- [ ] Timed quizzes and exam modes

---

**Askify** - Transforming learning materials into engaging quizzes through the power of AI. Perfect for educators, students, and anyone looking to test their knowledge efficiently.#   A s k i f y  
 