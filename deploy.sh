#!/bin/bash
echo "Deploying to Railway..."
git add .
git commit -m "Fix cron paths and warnings"
git push origin main
echo "Check Railway dashboard for deployment status"
