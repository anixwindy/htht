@echo off
chcp 65001 >nul
cd /d D:\Cthis\web
py "D:\Cthis\Pythis\gen_posts.py"
if errorlevel 1 (
  echo.
  echo [ERROR] gen_posts.py failed. See message above.
  pause
  exit /b 1
)
echo.
echo ----------------------------------------------------------
echo posts.json done. Next, run these to publish:
echo    git add .
echo    git commit -m "update"
echo    git push
echo ----------------------------------------------------------
pause
