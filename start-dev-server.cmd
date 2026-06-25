@echo off
set "PATH=C:\Users\L\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
cd /d "%~dp0"
"C:\Users\L\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".\node_modules\next\dist\bin\next" dev --hostname 127.0.0.1 --port 3000 > dev-server.log 2> dev-server-error.log
