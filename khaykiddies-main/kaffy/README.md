# Kaffy - Product Management System

## Deployment Guide for Render

### Prerequisites
1. Create a Render account at https://render.com
2. Have your project code in a Git repository

### Deployment Steps

1. **Create a New Web Service**
   - Log in to your Render dashboard
   - Click "New +" and select "Web Service"
   - Connect your Git repository

2. **Configure the Web Service**
   - Name: Choose a name for your service
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn main:app`

3. **Set Environment Variables**
   - `SECRET_KEY`: Set a secure random string
   - `RENDER`: Set to `True`
   - `DATABASE_URL`: Will be automatically set if you create a PostgreSQL database

4. **Add a PostgreSQL Database**
   - In Render dashboard, create a new PostgreSQL database
   - The `DATABASE_URL` will be automatically added to your web service

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your application

### Local Development

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Application**
   ```bash
   python main.py
   ```

3. **Access the Application**
   - Admin Interface: http://localhost:5002
   - Website: http://localhost:5002/website

### Default Admin Credentials
- Username: admin
- Password: admin123

### Features
- Product Management (CRUD operations)
- Bulk Import/Export
- Advanced Filtering and Search
- Responsive Design
- Secure Authentication

### Security Notes
- Change the default admin credentials after first login
- Set a strong SECRET_KEY in production
- Enable HTTPS in production (automatically handled by Render)