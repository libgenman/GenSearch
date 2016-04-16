#
# -*- coding: utf-8 -*-
#
# ToDo:
#   - fix NUL byte in CSV reader and writer (Python bug)
#

import os
import os.path
import csv

class LibGenDialect(csv.Dialect):
    delimiter = ','
    quotechar = '"'
    escapechar = None
    doublequote = True
    skipinitialspace = False
    lineterminator = '\n'   # instead of \r\n
    quoting = csv.QUOTE_ALL
    
# Compatible with Excel
# https://tools.ietf.org/html/rfc4180 
class CSVStandardDialect(csv.Dialect):  
    delimiter = ','
    quotechar = '"'
    escapechar = None
    doublequote = True
    skipinitialspace = False
    lineterminator = '\r\n' # according to specs
    quoting = csv.QUOTE_ALL # safest approach

# Compatible with MySQL
#   SELECT * FROM tbl
#   INTO OUTFILE 'export.csv'
#   FIELDS TERMINATED BY ','
#   ENCLOSED BY '"'
#   ESCAPED BY '\\'
#   LINES TERMINATED BY '\r\n';
class MySQLDialect(csv.Dialect):        
    delimiter = ','
    quotechar = '"'
    escapechar = '\\'
    doublequote = False
    skipinitialspace = False
    lineterminator = '\r\n' # MySQL docs provides an example: mysqldump --tab=/tmp --fields-terminated-by=, --fields-enclosed-by='"' --lines-terminated-by=0x0d0a db1
    quoting = csv.QUOTE_ALL # Using csv.QUOTE_NONNUMERIC is a bad idea because it instructs the reader to convert all non-quoted fields to type float

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

