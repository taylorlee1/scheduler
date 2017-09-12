import uuid
import os
import binascii
import string
import pprint
from flask import Flask
from flask import request
from flask_cors import CORS
import base64
import pymongo
import json
from bson.objectid import ObjectId

import logging
fmt = '%(asctime)s %(name)s.%(funcName)s +%(lineno)s: ' + \
    '%(levelname)-8s [%(process)d] %(message)s'
logging.basicConfig(
    level=logging.DEBUG,
    #format=fmt,
    )

app = Flask(__name__)
CORS(app)

def randomString():
    x = binascii.hexlify(os.urandom(16)).decode('utf8')
    return x

class DB():
    def __init__(self):
        self.client = pymongo.MongoClient()
        self.db = self.client.scheduler
        self.users = self.db.users
        self.schedules = self.db.schedules
        logging.info("DB: db initialized")

    def newUser(self):
        user = {
            'userId' : randomString(),
            'realName' : 'DEFAULT_USER_NAME',
            'schedules' : [],
            }
        userDbId = self.users.insert_one(user).inserted_id
        newuser = self.users.find_one({'userId' : user['userId']})
        logging.info("DB: newUser %s" % pprint.pprint(newuser))
        return newuser['userId']

    def getUser(self, userId):
        tmp = {'userId' : userId}
        faf = self.users.find_one(tmp)
        return faf

    def userExists(self, userId):
        u = self.getUser(userId)
        logging.info("DB: userExists() %s" % (u))
        if u:
            return { 'valid' : True, 'realName': u['realName'] };
        else:
            return { 'valid' : False, 'realName': 'dont_care' };
  
    def updateRealName(self, userId, name):
        user = {
            'userId' : userId,
        }
        result = self.users.update_one(
            {"userId" : userId},
            {"$set" : { 'realName' : name } },
            )
        logging.info("DB: updateRealName() %s %s" % (
            result.matched_count,
            result.modified_count,
            )) 
        tmp = {'userId' : userId}
        faf = self.users.find_one(tmp)
        logging.info("DB: updateRealName() %s" % (faf))
        return faf['realName']

    def addSchedule(self, userId, sname):
        schedule = {
            'name' : sname,
            'owner' : userId,
            'schedid' : randomString(),
        }
        scheduleDbId = self.schedules.insert_one(schedule).inserted_id
        result = self.users.update_one(
            {"userId" : userId},
            {"$push" : { 'schedules' : { 'name' : schedule['name'], 'schedid' : schedule['schedid'] } } },
            )
        logging.info("DB: addSchedule() %s %s" % (
            result.matched_count, 
            result.modified_count,
            ))
        
        return str(scheduleDbId);
  
    def rmSchedule(self, userId, schedid):
        # try to rm assuming you're the owner
        schedule = {
            'schedid' : schedid,
            'owner' : userId,
        }
        logging.info("DB: rmSchedule() %s" % (schedule))
        result0 = self.schedules.delete_one(schedule)
        logging.info("DB: rmSchedule() %s" % (
            result0.deleted_count,
            ))
        
        # then remove from your own schedule list
        result1 = self.users.update_one(
            {"userId" : userId},
            {"$pull" : { 'schedules' : { 'schedid' : schedid } } },
            )

        logging.info("DB: rmSchedule() %s %s" % (
            result1.matched_count, 
            result1.modified_count,
            ))
        
        return 'ok'
#(result0.deleted_count * result1.modified_count)

    def getSchedules(self, userId):
        result = self.users.find_one({'userId' : userId})
        logging.info("DB: getSchedules() %s" % (result))
        return result['schedules']


class User():
    db = DB()

    def __init__(self,userId=None):
        if userId == None:
            self.userId = User.db.newUser()
            self.schedules = []
        else:
            self.userId = userId 
        
    def isValid(self):
        return User.db.userExists(self.userId)
        
    def addSchedule(self, sname):
        return User.db.addSchedule(self.userId, sname)

    def rmSchedule(self, schedid):
        return User.db.rmSchedule(self.userId, schedid)

    def getSchedules(self):
        return User.db.getSchedules(self.userId)

    def updateRealName(self, name):
        return User.db.updateRealName(self.userId, name);

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/generateNewUser')
def newAcct():
    newUser = User()
    return newUser.userId

@app.route('/validateUser')
def validateUser():
    id_ = request.args.get('id')
    u = User(id_)
    resp = u.isValid()
    logging.info("validateUser() %s" % (resp))
    return json.dumps(resp)

@app.route('/updateRealName')
def updateRealName():
    id_ = request.args.get('id')
    realName = request.args.get('name')
    u = User(id_)
    resp = u.updateRealName(realName)
    logging.info("updateRealName() %s" % (resp))
    return resp


@app.route('/addSchedule')
def addSchedule():
    name = request.args.get('name')
    id_ = request.args.get('id')
    u = User(id_)
    return u.addSchedule(name)

@app.route('/getSchedules')
def getSchedules():
    id_ = request.args.get('id')
    u = User(id_)
    return json.dumps(u.getSchedules())

@app.route('/rmSchedule')
def rmSchedule():
    id_ = request.args.get('id')
    schedid = request.args.get('schedid')
    u = User(id_)
    return u.rmSchedule(schedid)
