#!/bin/bash
# Double-click this file to open the website editor.
cd "$(dirname "$0")"
lsof -ti tcp:5180 | xargs kill 2>/dev/null
python3 edit.py
