Memecap
=======

Memecap is a tiny, serverless meme generator written in Javascript. All of the meme generation is performed client-side and can be served as a set of static files on S3, Github Pages, etc. Once the meme is generated, it can be uploaded to imgur for sharing and storage.


Building
--------
The Javascript core and CSS styling of Memecap is vanilla, 100% organic, and functional as-is. The HTML comprising the frontend, however, is written and assembled with the Jinja2 templating engine (Python) and must be compiled.

First order of business: clone the repository.

    $ git clone https://github.com/kuyan/memecap.git

Now, assuming that you already have Python, you'll need to install a few packages. If you're a Python developer, this is the part where you create a virtualenv.

    $ pip install -r requirements.txt
    # This might take a few minutes.

Once you have everything installed, you're set to build the application. There are two modes that you can build the application in:

* **Development mode.** In development mode, page templates will be watched for changes and the application will be rebuilt as necessary. Also, the stylesheets and Javascript source will be left as-is.

        $ python build.py devel

* **Production mode.** In production mode, the application will be built once and then the build script will exit. In the process of building the application, Javascript and CSS files will be compressed/minified.

        $ python build.py production

The built application will be stored in `build/`. You can view the application by opening `build/index.html` in a web browser. Or, if you insist, you can serve it like so:

    $ python -m SimpleHTTPServer

Note: Memecap will be unable to upload memes to imgur if used locally (i.e. sans-SimpleHTTPServer) as Chrome blocks such Ajax requests.
The app will then be available through http://localhost:8000.

Origins
-------
Memecap is a ~~shameless ripoff~~ fork of [rlemon/lememe](https://github.com/rlemon/lememe).


