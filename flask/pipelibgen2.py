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

CSV_DIR = 'delta'

CSV_FIELDS=[
    "ID","Title","VolumeInfo","Series","Periodical","Author","Year","Edition","Publisher","City","Pages","Language",
    "Topic","Library","Issue","Identifier","ISSN","ASIN","UDC","LBC","DDC","LCC","Doi","Googlebookid","OpenLibraryID",
    "Commentary","DPI","Color","Cleaned","Orientation","Paginated","Scanned","Bookmarked","Searchable","Filesize","Extension",
    "MD5","CRC32","eDonkey","AICH","SHA1","TTH","Generic","Filename","Visible","Locator","Local","TimeAdded","TimeLastModified","Coverurl"
]

SPHINX_VISIBLE_ENUM={ '':0, 'no':1, 'ban': 2 }
SPHINX_ATTR_DUPLICATE=["MD5","Series","Periodical","Author","Title","Year","VolumeInfo","Publisher","Language","Identifier","Extension"]
SPHINX_ATTR_SUFFIX="Attr"
SPHINX_FIELDS=[
    "ID",

    "MD5",
        
    "Series",
    "Periodical",
    "Author",
    "Title",
    "Year",
    "VolumeInfo",
    "Publisher",
    "Language",
    "Identifier",
    "Extension",

    "MD5Attr",

    "SeriesAttr",
    "PeriodicalAttr",

    "AuthorAttr",
    "TitleAttr",
    "YearAttr",

    "VolumeInfoAttr",

    "Edition",

    "PublisherAttr",
    "City",

    "Pages",

    "LanguageAttr",

#    "Topic",

#    "Library",
#    "Issue",
#    "Commentary",

#    "DPI",              # uint
#    "Color",
#    "Cleaned",
#    "Orientation",
#    "Paginated",
#    "Scanned",
#    "Bookmarked",
#    "Searchable",

    "IdentifierAttr",
#    "ISSN",
#    "ASIN",
#    "Doi",
#    "Googlebookid",
#    "OpenLibraryID",

#    "UDC",
#    "LBC",
#    "DDC",
#    "LCC",
#
#    "CRC32",
#    "eDonkey",
#    "AICH",
#    "SHA1",
#    "TTH",
    
    "Filesize",         # bigint   
    "ExtensionAttr",

#    "Filename",
    "Coverurl",

    "Generic",
    "Visible",

#    "Locator",

    #"Local",

    "TimeAdded",        # timestamp
    "TimeLastModified", # timestamp

]

def maindb_maxid(indexname='libgenmain'):
    mysql = MySQL(app)
    mysql.connect()
    cursor = mysql.cursor()
    cursor.execute("SELECT MAX(ID) FROM %s"%indexname)
    maxid = cursor.fetchone()[0]
    return maxid

def main():

    xmlfields=SPHINX_FIELDS[2:] # skip ID
    
    maxid = maindb_maxid()
    killlist = {}
    linelist = {}
        
    xmlout = codecs.getwriter('utf-8')(sys.stdout) # stdout: '\n' -> '\r\n'    
    
    xmlout.write('<?xml version="1.0" encoding="utf-8"?>\n')
    xmlout.write('<sphinx:docset>\n')
    xmlout.write('\n')
    
    flist = csvlib.sort_listdir(os.path.join(PROJECT_ROOT,CSV_DIR))

    for fpath in flist:
        fd = csvlib.open_csvfile(fpath)
        if fd:

            reader=csv.DictReader(fd,CSV_FIELDS,dialect=csvlib.LibGenDialect)

            for linenum,row in enumerate(reader):
                id = int(row['ID'])
                linelist[id] = linenum # remember last occurrence
            
            fd.close()
            
            # reopen file
            
            fd = csvlib.open_csvfile(fpath)
            reader=csv.DictReader(fd,CSV_FIELDS,dialect=csvlib.LibGenDialect)
            
            for linenum,row in enumerate(reader):
                data=dict(row)

                id = int(row['ID'])
                if id <= maxid:
                    killlist[id] = id
                if linenum != linelist[id]:
                    continue # skip doubles except last
                data['ID'] = id
                                
                data['Visible']=SPHINX_VISIBLE_ENUM[row['Visible']]

                # Add backing attrs
                for field in SPHINX_ATTR_DUPLICATE:
                    data[field+SPHINX_ATTR_SUFFIX]=row[field]

                # Preprocess ISBN
                data['Identifier']=data['Identifier'].replace('-','') # remove slashes from ISBN in fulltext

                # Convert dates to timestamps
                data['TimeAdded']=datetime2timestamp(row['TimeAdded'])
                data['TimeLastModified']=datetime2timestamp(row['TimeLastModified'])

                xmlout.write('<sphinx:document id="%d">\n'%data['ID'])
                for fieldname in xmlfields:
                    xmlout.write(u'<%s>%s</%s>\n'%(fieldname.lower(),escape(str(data[fieldname]).decode('utf-8')),fieldname.lower()))
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
    main()
