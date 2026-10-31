@echo off
rem Starts the Craft clip-art server (needs Node 22.5 or newer: https://nodejs.org). Close this window to stop it.
cd /d "%~dp0"
node clipart-server.js %*
pause
