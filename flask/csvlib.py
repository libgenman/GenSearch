#
# -*- coding: utf-8 -*-
#
# ToDo:
#   - fix NUL byte in CSV reader (Python bug)
#

import os
import os.path
import csv

class LibGenDialect(csv.Dialect):
    delimiter = ','
    quotechar = '"'
    escapechar = '\\'
    doublequote = True
    skipinitialspace = False
    lineterminator = '\n'
    quoting = csv.QUOTE_NONNUMERIC


def open_csvfile(fpath,fext='.csv'):
    fname = os.path.basename(fpath)
    name,ext = os.path.splitext(fname)
    ext = ext.lower()
    if ext == fext:
        if os.path.isfile(fpath):
            return open(fpath,'rb')
    return None


def sort_listdir(dir):
    list = os.listdir(dir)
    list.sort()
    return [os.path.join(dir,file) for file in list]

