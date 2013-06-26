#!/usr/bin/env python
# -*- coding: utf-8 -*-
import distutils.dir_util
import glob
import os.path
import sys

from staticjinja import Renderer

BUILD_DIR = './build'
STATIC_DIR = './static'


def _init_renderer():
    distutils.dir_util.mkpath(BUILD_DIR)  # Create build directory
    distutils.dir_util.copy_tree(STATIC_DIR, BUILD_DIR, update=True)  # Copy static files to build directory
    renderer = Renderer(outpath=BUILD_DIR)  # Render HTML

    return renderer


def build_devel(renderer):
    """Build Memecap for development in BUILD_DIR."""
    renderer.run(debug=True, use_reloader=True)


def build_production(renderer):
    """Build Memecap for production and hosting on Github Pages."""
    renderer.run()
    compress_js(os.path.join(BUILD_DIR, 'js'))
    compress_css(os.path.join(BUILD_DIR, 'css'))


def compress_js(path):
    """Compress javascript files in `path` with Slimit."""
    import slimit
    files = glob.iglob(os.path.join(path, '*.js'))

    for js in files:
        with open(js, 'r+') as source:
            compressed = slimit.minify(source.read(), mangle=True, mangle_toplevel=False)
            source.seek(0)
            source.write(compressed)
            source.truncate()


def compress_css(path):
    """Compress CSS files in `path` with cssmin."""
    import cssmin
    files = glob.iglob(os.path.join(path, '*.css'))

    for css in files:
        with open(css, 'r+') as source:
            compressed = cssmin.cssmin(source.read())
            source.seek(0)
            source.write(compressed)
            source.truncate()

cmd_routes = {
    'devel': build_devel,
    'production': build_production
}

if __name__ == '__main__':
    # If the build folder exists, kill it.
    #if os.path.exists(BUILD_DIR) and os.path.isdir(BUILD_DIR):
    #    shutil.rmtree(BUILD_DIR)

    renderer = _init_renderer()
    cmd_routes[sys.argv[-1].lower()](renderer)
