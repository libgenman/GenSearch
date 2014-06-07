@echo off
cd /d %~dp0
taskkill /IM flaskapi.exe
echo(
bin\searchd --stop
echo(
pause
