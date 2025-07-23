# Start Script for QuantView AI React Version

# Start Backend (Run this in first terminal)
Write-Host "Starting FastAPI Backend..." -ForegroundColor Green
cd backend
if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Write-Host "Backend starting on http://localhost:8000" -ForegroundColor Cyan
python main.py
