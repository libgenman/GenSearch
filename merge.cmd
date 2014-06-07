@echo off
cd /d %~dp0
echo(
taskkill /IM flaskapi.exe > nul
echo(
echo === Stopping searchd
echo(
bin\searchd --stop
ping -n 3 127.0.0.1 > nul
echo(
echo === Running merge
echo(
bin\indexer.exe --merge libgenmain libgendelta
if %ERRORLEVEL% NEQ 0 goto fail
echo(
echo --- Clearing delta CSV
echo(
copy /y nul: delta\libgenupdate.csv > nul
echo(
echo --- Running searchd
echo(
run.vbs
ping -n 1 127.0.0.1 > nul
echo(
echo === Fixing delta index
echo(
bin\indexer.exe --rotate libgendelta
echo(
echo === DONE
goto exit
:fail
echo(
echo FAILED!!!
:exit
echo(
pause

