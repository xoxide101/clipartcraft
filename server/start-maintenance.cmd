@echo off
rem Craft clip-art server maintenance: make sure every picture is sorted by the AI on this computer.
rem Ctrl+C stops it at any time; run it again and it carries on with the rest (the done ones are marked).
rem Options go after it, e.g.  start-maintenance.cmd --model gemma3:latest   (see the top of clipart-maintain.js)
cd /d "%~dp0"
node clipart-maintain.js status %*
echo.
node clipart-maintain.js sort %*
echo.
pause
