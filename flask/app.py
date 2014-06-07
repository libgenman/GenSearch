#
# -*- coding: utf-8 -*-

import re
import sys
import time
import os.path

from flask import Flask

if hasattr(sys, "frozen"):
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.realpath(sys.executable)))
else:
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

app = Flask(__name__, static_folder=os.path.join(PROJECT_ROOT, 'backbone'), static_url_path='')

CONFIG_FILE=os.path.join(PROJECT_ROOT, 'flask.cfg')
app.config.from_pyfile(CONFIG_FILE)

