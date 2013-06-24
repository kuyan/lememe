#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import shutil
import sys

from staticjinja import Renderer

BUILD_FOLDER = './build'
IGNORE_PATTERN = shutil.ignore_patterns('.*')

if __name__ == '__main__':
    # If the build folder exists, kill it.
    if os.path.exists(BUILD_FOLDER) and os.path.isdir(BUILD_FOLDER):
        shutil.rmtree(BUILD_FOLDER)

    # If the build folder doesn't exist, make it.
    os.makedirs(BUILD_FOLDER)

    # Copy the static files to the build folder.
    for f in os.listdir('static'):
        if f.startswith('.'):
            continue

        src = os.path.join('static', f)
        dst = os.path.join(BUILD_FOLDER, os.path.basename(src))

        shutil.copytree(src, dst, ignore=IGNORE_PATTERN)

    # Render the HTML.
    renderer = Renderer(outpath=BUILD_FOLDER)

    if len(sys.argv) > 1:
        if sys.argv[1] == 'debug':
            renderer.run(debug=True, use_reloader=True)
    else:
        renderer.run()
