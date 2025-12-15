@echo off
echo Starting Local NAS Simulation...

:: 1. Start Backend Server
echo Starting Backend Server on port 3000...
start "Badminton Backend" cmd /k "cd server && npm run dev"

:: 2. Start Frontend with Local Server Flag
echo Starting Frontend on port 5173...
echo Note: This will connect to the local backend instead of Supabase.
start "Badminton Frontend" cmd /k "cd frontend && set VITE_USE_LOCAL_SERVER=true&& npm run dev"

echo Services started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000
pause
