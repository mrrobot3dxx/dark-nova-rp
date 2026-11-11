@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (py -3 installer_marco_armurerie.py) else (python installer_marco_armurerie.py)
pause
