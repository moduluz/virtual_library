# Virtual Library

A mobile-friendly virtual library application that allows users to manage and track their book collection.

## Features

- Mobile-first design
- Book management (Add, Edit, Delete)
- Search functionality
- Reading progress tracking
- Favorites system
- Responsive UI with animations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file with:
```
MONGODB_URI=your_mongodb_connection_string
DB_NAME=your_database_name
PORT=3000
```

3. Run the application:
```bash
npm start
```

## Deployment

### Deploy to Render.com:

1. Create a free account on [Render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables:
   - `MONGODB_URI`
   - `DB_NAME`

### Deploy to MongoDB Atlas:

1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Add it to your environment variables

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Technologies Used

- Node.js
- Express
- MongoDB
- Bootstrap 5
- CSS3 Animations 