#!/bin/sh
# Zrzut ekranu z podglądu: narzedzia/zrzut.sh '#/epoki' nazwa [szer] [wys]
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
OUT="${TMPDIR:-/tmp}"
"$E" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=${3:-500},${4:-900} --virtual-time-budget=5000 --screenshot="$5$2.png" "http://localhost:8780/$1" >/dev/null 2>&1
