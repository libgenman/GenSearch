#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import os
import json
import time
import random
import urllib2
from urllib import quote_plus
from urllib2 import urlopen, HTTPError, URLError

import csv
import csvlib

import subprocess

from connmysql import MySQL, timestamp2datetime

from app import *

UPDATE_DIR='delta'
UPDATE_FILENAME='libgenupdate.csv'
DATA_DIR='data'

from gzip import GzipFile
from StringIO import StringIO
class ContentEncodingProcessor(urllib2.BaseHandler):
  """A handler to add gzip capabilities to urllib2 requests """

  # add headers to requests
  def http_request(self, req):
    req.add_header("Accept-Encoding", "gzip, deflate")
    return req

  # decode
  def http_response(self, req, resp):
    old_resp = resp
    # gzip
    if resp.headers.get("content-encoding") == "gzip":
        gz = GzipFile(
                    fileobj=StringIO(resp.read()),
                    mode="r"
                  )
        resp = urllib2.addinfourl(gz, old_resp.headers, old_resp.url, old_resp.code)
        resp.msg = old_resp.msg
    # deflate
    if resp.headers.get("content-encoding") == "deflate":
        gz = StringIO( deflate(resp.read()) )
        resp = urllib2.addinfourl(gz, old_resp.headers, old_resp.url, old_resp.code)  # 'class to add info() and
        resp.msg = old_resp.msg
    return resp

# deflate support
import zlib
def deflate(data):   # zlib only provides the zlib compress format, not the deflate format;
  try:               # so on top of all there's this workaround:
    return zlib.decompress(data, -zlib.MAX_WBITS)
  except zlib.error:
    return zlib.decompress(data)



def parse_csvfile_timeid(fpath):

    csv_fields=app.config['CSV_FIELDS']
    id_pos = csv_fields.index('ID')
    time_pos = csv_fields.index('TimeLastModified')

    timeid_first = None
    timeid_last = None
    rec_num = 0
    try:
        csvfile=open(fpath,'r+b')
        try:
            reader = csv.reader(csvfile,dialect=csvlib.LibGenDialect)
            for row in reader:
                if timeid_first == None:
                    timeid_first = (row[time_pos],row[id_pos])
                timeid_last = (row[time_pos],row[id_pos])
                rec_num = rec_num + 1
            csvfile.close()
            return timeid_first, timeid_last, rec_num
        except Exception as e:
            print('Bad update file, clearing it')
            csvfile.seek(0)
            csvfile.truncate(0)
            csvfile.close()
            return None, None, 0
    except IOError:
        return None, None, 0


def json_update(fpath,timeid,jsonapiurl):

    csv_fields=app.config['CSV_FIELDS']
    id_pos = csv_fields.index('ID')
    time_pos = csv_fields.index('TimeLastModified')

    jsonapi_retry_count = app.config['JSONAPI_RETRY_COUNT']
    jsonapi_retry_delay = app.config['JSONAPI_RETRY_DELAY']

    updatednum = 0

    with open(fpath,'a+b') as csvfile:
        writer = csv.writer(csvfile,dialect=csvlib.LibGenDialect)

        #fields='*'
        fields = ','.join(csv_fields)

        while True:
            url = jsonapiurl + "?fields=%s&timenewer=%s&idnewer=%s&mode=newer" % (quote_plus(fields,','),quote_plus(timeid[0]),quote_plus(timeid[1]))
            retry = 0
            while True:
                try:
                    retry = retry + 1
                    datarows = json.load(urlopen(url))
                    break
                except (HTTPError, URLError) as e:
                    if retry > jsonapi_retry_count:
                        return False,0
                    print('Retry %s'%(str(e)))
                    time.sleep(jsonapi_retry_delay)

            for data in datarows:
                row=[]
                for field in csv_fields:
                    row.append(data[field.lower()].replace('\0','\\0').encode('utf-8')) # avoid NUL otherwise csv.writer.writerow() will truncate the field

                timeid = (row[time_pos],row[id_pos])
                updatednum = updatednum + 1

                writer.writerow(row)

            if len(datarows)!=0:
                print('JSON %s %s'%(timeid[0],timeid[1]))

            if len(datarows)==0:
                print('All done, no more new rows')
                break

    return timeid,updatednum

def maindb_timeid(indexname='libgenmain'):
    mysql = MySQL(app)
    mysql.connect()
    cursor = mysql.cursor()
    cursor.execute("SELECT MAX(TimeLastModified) FROM %s"%indexname)
    res = cursor.fetchone()
    timestamp = 0 if res==None else res[0]
    cursor.execute("SELECT MAX(ID) FROM %s WHERE TimeLastModified=%s"%(indexname,timestamp))
    res = cursor.fetchone()
    maxid = 0 if res==None else res[0]
    last_id = str(maxid)
    last_datetime = timestamp2datetime(timestamp)
    return last_datetime,last_id

def json_delta():
    timeid_main = maindb_timeid()

    print('Main DB Last  %s %s'%(timeid_main[0],timeid_main[1]))

    csvfpath=os.path.join(PROJECT_ROOT,UPDATE_DIR,UPDATE_FILENAME)

    timeid_first, timeid_last, prevnum = parse_csvfile_timeid(csvfpath)
    if timeid_first:
        print('Delta First   %s %s'%(timeid_first[0],timeid_first[1]))
    if timeid_last:
        print('Delta Last    %s %s'%(timeid_last[0],timeid_last[1]))

    if not timeid_last or not timeid_first:
        timeid_last = timeid_main
    else:
        if timeid_first < timeid_main: # without overlap
            print('Mismatched dates, clearing update file')
            with open(csvfpath,'wb') as csvfile:
                csvfile.truncate(0)
            timeid_last = timeid_main

    print('Updating from %s %s'%(timeid_last[0],timeid_last[1]))

    updatednum = 0
    somesuccess = False
    mirrorgroups = app.config['JSONAPI_URL_LIST']
    for num,mirrorlist in enumerate(mirrorgroups):
        print('')
        print('Server group %d:'%(num+1))
        random.shuffle(mirrorlist)
        groupsuccess = False
        for mirrorurl in mirrorlist:
            print('')
            print('Updating from server %s'%(mirrorurl))
            timeid,mirrorupdated = json_update(csvfpath,timeid_last,mirrorurl)
            if timeid==False:
                print('Updating from server %s FAILED!'%(mirrorurl))
                continue # proceeding to next server in this mirror group
            timeid_last = timeid
            updatednum = updatednum + mirrorupdated
            somesuccess = True
            groupsuccess = True
            break
        if num==len(mirrorgroups)-1:
            if not groupsuccess:
                print('')
                print('Update from last server group FAILED!!')
    if not somesuccess:
        print('')
        print('ALL SERVERS FAILED!!!')
    return somesuccess,updatednum,prevnum

def error_exit(msg):
    print(msg)
    #print('')
    #raw_input('Press any key to continue...')
    sys.exit(1)

def main():

    proxy = app.config.setdefault('HTTP_PROXY', None)
    if proxy:
        proxy_handler = urllib2.ProxyHandler({'http': proxy})
        opener = urllib2.build_opener(proxy_handler, ContentEncodingProcessor)
    else:
        opener = urllib2.build_opener(ContentEncodingProcessor)
    urllib2.install_opener(opener)

    print('Updating delta')
    print('')

    updated,updatednum,prevnum = json_delta()

    print('')

    indexer = os.path.join('bin','indexer')

    data_dir = os.path.join(PROJECT_ROOT,DATA_DIR)

    if not updated:
        error_exit('JSON update failed!!!')

    if updated:
        print('Delta records after update %d, retrieved %d'%(prevnum+updatednum, updatednum))
        print('')

        merge_threshold = app.config.setdefault('DELTA_MERGE_THRESHOLD',50000)
        if prevnum+updatednum < merge_threshold:

            if updatednum>0:
                status = subprocess.call([indexer,'--rotate','libgendelta'])
                if status!=0:
                    error_exit('Delta indexing FAILED!!!')

        else:
            status = subprocess.call([indexer,'--rotate','libgendelta'])
            if status!=0:
                error_exit('Delta indexing FAILED!!!')

            print('')
            print('Number of records %d is bigger than threshold value %d, running index merge'%(prevnum+updatednum,merge_threshold))
            print('')

            # wait searchd rotates after SIGHUP
            while os.path.exists(os.path.join(data_dir,'lgdelta.new.spe')) or os.path.exists(os.path.join(data_dir,'lgdelta.old.spe')):
                time.sleep(1)

            status = subprocess.call([indexer,'--rotate','--merge','libgenmain','libgendelta'])
            print('')
            if status!=0:
                error_exit('Index merge FAILED!!!')

            print('Clearing delta CSV')
            print('')
            csvfpath=os.path.join(PROJECT_ROOT,UPDATE_DIR,UPDATE_FILENAME)
            with open(csvfpath,'wb') as csvfile:
                csvfile.truncate(0)

            # wait searchd rotates after SIGHUP
            while os.path.exists(os.path.join(data_dir,'lgmain.new.spe')) or os.path.exists(os.path.join(data_dir,'lgmain.old.spe')):
                time.sleep(1)

            print('Fixing delta index')
            print('')
            status = subprocess.call([indexer,'--rotate','libgendelta'])
            print('')
            if status!=0:
                error_exit('Delta indexing FAILED!!!')

if __name__ == '__main__':
    main()
