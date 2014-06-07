#
# -*- coding: utf-8 -*-

import re
import sys
import time
import os.path

from flask import Flask, request
from flask.ext import restful
from connmysql import MySQL
from MySQLdb import OperationalError,ProgrammingError

from app import *

api = restful.Api(app)

mysql = MySQL(app)

@app.route('/')
def send_index():
    if hasattr(sys, "frozen"):
        return app.send_static_file('index-combined.html')
    else:
        return app.send_static_file('index.html')
        #return app.send_static_file('index-combined.html')

class Search(restful.Resource):
    def get(self):
        query=request.args.get('query','')
        sortmode=request.args.get('sort','')
        showstr=request.args.get('show','')
        fieldstr=request.args.get('fields','')
        fields=[]        
        field_list=app.config['FIELD_LIST']
        for ch in fieldstr:
            if ch in field_list:
                fields.append(field_list[ch])
            else:
                pass #! show warining
        if query.strip(' ')=='*':
            query=''
        elif len(fields)>0:
            query='@('+','.join(fields)+') '+query
        show=[]
        visible_list=app.config['VISIBLE_LIST']
        for ch in showstr:
            if ch in visible_list:
                show.append(visible_list[ch])
            else:
                pass #! show warning
        if len(show)==len(visible_list):
            visible='' # show all without filtering (optimization)
        else:
            show.insert(0,'0')
            visible='AND Visible IN (%s)'%(','.join(show))
        
        sort_list=app.config['SORT_LIST']
        sort_default=app.config['SORT_DEFAULT']
        sort=sort_list.get(sortmode,sort_default)
        table=app.config['INDEX_TABLE']
        select=app.config['SEARCH_QUERY']
        
        try:
            mysql.connect()
            try:
                cursor = mysql.dict_cursor()
                cursor.execute(select%{'table':table,'visible':visible,'sort':sort},{'query':query,})
                rows=cursor.fetchall()
                
                # if Sphinx
                cursor = mysql.cursor()
                cursor.execute("SHOW META LIKE 't%'")
                meta=cursor.fetchall()
                total_found=[row[1] for row in meta if row[0]=='total_found']
                query_time=[row[1] for row in meta if row[0]=='time']
                # endif                
                
                meta={
                    'total_found': total_found,
                    'query_time': query_time,
                    'view_url': app.config['VIEW_URL'],
                    'edit_url': app.config['EDIT_URL'],
                    'mirror_list': app.config['MIRROR_LIST'],
                }
                data={
                    'meta': meta,
                    'items': rows,
                }
                return data
                #return list(rows) # not tuple!
            finally:
                mysql.close()
        except (OperationalError,ProgrammingError) as e:
            errno, msg = e
            data = {
                'error': "%d: %s"%(errno,msg),
            }
            return (data,400,{})

api.add_resource(Search, '/api/search')

if __name__ == '__main__':
    port = app.config.setdefault('FLASK_PORT',5000)
    if hasattr(sys, "frozen"):
        app.run(port=port)
    else:
        app.run(debug=True,port=port,extra_files=[CONFIG_FILE])
        
