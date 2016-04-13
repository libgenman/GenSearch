#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import sys
import os.path
import codecs

import csv
import csvlib
from connmysql import datetime2timestamp

from xml.sax.saxutils import escape

from connmysql import MySQL

from app import *


ESCAPE_ENTITIES={
    '\x00': " ",
    '\x01': " ",
    '\x02': " ",
    '\x03': " ",
    '\x04': " ",
    '\x05': " ",
    '\x06': " ",
    '\x07': " ",
    '\x08': " ",
    #'\x09': "&#x09;",
    #'\x0A': "&#x0A;",
    '\x0B': " ",
    '\x0C': " ",
    #'\x0D': "&#x0D;",
    '\x0E': " ",
    '\x0F': " ",
    '\x10': " ",
    '\x11': " ",
    '\x12': " ",
    '\x13': " ",
    '\x14': " ",
    '\x15': " ",
    '\x16': " ",
    '\x17': " ",
    '\x18': " ",
    '\x19': " ",
    '\x1A': " ",
    '\x1B': " ",
    '\x1C': " ",
    '\x1D': " ",
    '\x1E': " ",
    '\x1F': " ",
}

def maindb_maxid(indexname='libgenmain'):
    mysql = MySQL(app)
    if not mysql.tryconnect():
        return 0
    cursor = mysql.cursor()
    cursor.execute("SELECT MAX(ID) FROM %s"%indexname)
    res = cursor.fetchone()
    maxid  = 0 if res==None else res[0]
    return maxid

def main(csv_dir='delta'):

    csv_fields = app.config['CSV_FIELDS']
    sphinx_visible_enum = app.config['SPHINX_VISIBLE_ENUM']
    sphinx_attr_duplicate = app.config['SPHINX_ATTR_DUPLICATE']
    sphinx_attr_suffix = app.config['SPHINX_ATTR_SUFFIX']
    sphinx_fields = app.config['SPHINX_FIELDS']    

    xmlfields=sphinx_fields[1:] # skip ID
    
    maxid = maindb_maxid()
    killlist = {}
    linelist = {}
        
    xmlout = codecs.getwriter('utf-8')(sys.stdout) # stdout: '\n' -> '\r\n'    
    
    xmlout.write('<?xml version="1.0" encoding="utf-8"?>\n')
    xmlout.write('<sphinx:docset>\n')
    xmlout.write('\n')
    
    flist = csvlib.sort_listdir(os.path.join(PROJECT_ROOT,csv_dir))

    for fpath in flist:
        fd = csvlib.open_csvfile(fpath)
        if fd:

            reader=csv.DictReader(fd,csv_fields,dialect=csvlib.LibGenDialect)

            for linenum,row in enumerate(reader):
                id = int(row['ID'])
                linelist[id] = linenum # remember last occurrence
            
            fd.close()
            
            # reopen file
            
            fd = csvlib.open_csvfile(fpath)
            reader=csv.DictReader(fd,csv_fields,dialect=csvlib.LibGenDialect)
            
            for linenum,row in enumerate(reader):
                data=dict(row)

                id = int(row['ID'])
                if id <= maxid:
                    killlist[id] = id
                if linenum != linelist[id]:
                    continue # skip doubles except last
                data['ID'] = id                
                                
                data['Visible']=sphinx_visible_enum[row['Visible']]

                # Add backing attrs
                for field in sphinx_attr_duplicate:
                    data[field+sphinx_attr_suffix]=row[field]

                # Preprocess ISBN (Not needed anymore because IdentifierWODash is added to DB)
                #data['Identifier']=data['Identifier'].replace('-','') # remove slashes from ISBN in fulltext

                # Convert dates to timestamps
                data['TimeAdded']=datetime2timestamp(row['TimeAdded'])
                data['TimeLastModified']=datetime2timestamp(row['TimeLastModified'])

                xmlout.write('<sphinx:document id="%d">\n'%data['ID'])
                for fieldname in xmlfields:
                    xmlout.write(u'<%s>%s</%s>\n'%(fieldname.lower(),escape(str(data[fieldname]).decode('utf-8'),ESCAPE_ENTITIES),fieldname.lower()))
                xmlout.write('</sphinx:document>\n')
                xmlout.write('\n')
            fd.close()

    killlist=killlist.keys()
    killlist.sort()
    xmlout.write('<sphinx:killlist>\n')
    for killid in killlist:
        xmlout.write('<id>%d</id>\n'%killid)
    xmlout.write('</sphinx:killlist>\n')
    xmlout.write('\n')        
        
    xmlout.write('</sphinx:docset>\n')

if __name__ == '__main__':
    main(*sys.argv[1:])
