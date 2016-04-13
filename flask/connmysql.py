#
# -*- coding: utf-8 -*-

import MySQLdb

from calendar import timegm
from datetime import datetime

def datetime2timestamp(str):
    if str == '0000-00-00 00:00:00':
        return 0 #?
    return timegm(datetime.strptime(str,'%Y-%m-%d %H:%M:%S').utctimetuple())

def timestamp2datetime(str):
    return datetime.utcfromtimestamp(int(str)).strftime('%Y-%m-%d %H:%M:%S')

class MySQL(object):
    def __init__(self, app=None):
        self.conn = None
        if app is not None:
            self.app = app
            self.init_app(self.app)
        else:
            self.app = None

    def init_app(self, app):
        self.app = app
        self.app.config.setdefault('MYSQL_DATABASE_HOST', 'localhost')
        self.app.config.setdefault('MYSQL_DATABASE_PORT', 3306)
        self.app.config.setdefault('MYSQL_DATABASE_USER', None)
        self.app.config.setdefault('MYSQL_DATABASE_PASSWORD', None)
        self.app.config.setdefault('MYSQL_DATABASE_DB', None)
        self.app.config.setdefault('MYSQL_DATABASE_CHARSET', 'utf8')

    def connect(self):
        kwargs = {}
        if self.app.config['MYSQL_DATABASE_HOST']:
            kwargs['host'] = self.app.config['MYSQL_DATABASE_HOST']
        if self.app.config['MYSQL_DATABASE_PORT']:
            kwargs['port'] = self.app.config['MYSQL_DATABASE_PORT']
        if self.app.config['MYSQL_DATABASE_USER']:
            kwargs['user'] = self.app.config['MYSQL_DATABASE_USER']
        if self.app.config['MYSQL_DATABASE_PASSWORD']:
            kwargs['passwd'] = self.app.config['MYSQL_DATABASE_PASSWORD']
        if self.app.config['MYSQL_DATABASE_DB']:
            kwargs['db'] = self.app.config['MYSQL_DATABASE_DB']
        if self.app.config['MYSQL_DATABASE_CHARSET']:
            kwargs['charset'] = self.app.config['MYSQL_DATABASE_CHARSET']
        self.conn=MySQLdb.connect(**kwargs)
        return self.conn
    
    def tryconnect(self):
        try:
            self.connect()
        except MySQLdb.OperationalError:
            return False
        return True

    def close(self):
        if self.conn is not None:
            self.conn.close()

    def cursor(self):
        return self.conn.cursor()
    
    def dict_cursor(self):
        return self.conn.cursor(MySQLdb.cursors.DictCursor)

