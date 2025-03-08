# Eternal Narratives

A modern web application for managing your personal book collection with features for reading, tracking progress, and organizing your library.

## Features

- User authentication and authorization
- Book management system
- File upload support for book covers and PDF files
- Reading progress tracking
- Private/public book settings
- Favorite books feature
- Custom tagging system
- Advanced search functionality

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT, bcryptjs
- File Handling: multer

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3000
```

3. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Directory Structure

```
├── public/
│   ├── css/
│   └── js/
├── uploads/
│   ├── covers/
│   └── pdfs/
├── server.js
├── index.html
└── styles.css
```

## File Upload Limits

- Cover images: Images only (jpg, png, gif)
- PDF files: PDF format only
- Maximum file size: 10MB