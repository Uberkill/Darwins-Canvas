@echo off
echo Starting Darwin's Canvas local development server...
cd web
start http://localhost:5180
call npm run dev
