@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 installer_bouton_bail.py
) else (
  python installer_bouton_bail.py
)
pause
