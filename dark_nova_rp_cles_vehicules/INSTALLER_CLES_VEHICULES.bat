@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (py -3 installer_cles_vehicules.py) else (python installer_cles_vehicules.py)
