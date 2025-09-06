Have 2 terminals active
In the first:
    cd frontend
    npm install
    npm run dev

In the second (for first timer):
    cd backend
    python -m venv venv
    Activates virtual environment (works for windows):
        .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Seeding the database:
        python seed.py
    python run.py

Otherwise:
    cd backend
    python run.py


For MySQL setup (Type in Mysql Command Line Client, during MySQL setup please use default port 3306):
-- Create your FYP database
CREATE DATABASE sentinel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Create a dedicated user (don't use root in code!)
CREATE USER 'sentinel_user'@'localhost' IDENTIFIED BY 'sentinel_fyp';
-- Give user full access to your database
GRANT ALL PRIVILEGES ON sentinel_db.* TO 'sentinel_user'@'localhost';
-- Refresh permissions
FLUSH PRIVILEGES;
-- Exit
EXIT;

If your MySQL does not start on windows startup:
Windows + R
type services.msc
Find MySQL Service (MySQL80)
If its not running, right click and click start