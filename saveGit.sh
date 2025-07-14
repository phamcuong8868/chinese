#!/bin/bash
THONGBAO="$1"
if [ -z "$THONGBAO" ]; then
 THONGBAO="Editing"
fi
git add .
git commit -m "$THONGBAO"
git push
