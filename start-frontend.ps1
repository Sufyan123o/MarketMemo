# Start Script for React Frontend

# Start Frontend (Run this in second terminal)
Write-Host "Starting React Frontend..." -ForegroundColor Green
cd frontend
if (!(Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}
Write-Host "Frontend starting on http://localhost:3000" -ForegroundColor Cyan
npm start
