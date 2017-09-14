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
import urllib

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
        self.avails = self.db.avails
        logging.info("DB: db initialized")

    def newUser(self):
        user = {
            'userid' : randomString(),
            'realName' : 'DEFAULT_USER_NAME',
            'schedules' : [],
            }
        userDbId = self.users.insert_one(user).inserted_id
        newuser = self.users.find_one({'userid' : user['userid']})
        logging.info("DB: newUser %s" % pprint.pprint(newuser))
        return newuser['userid']

    def getUser(self, userid):
        tmp = {'userid' : userid}
        faf = self.users.find_one(tmp)
        return faf

    def userExists(self, userid):
        u = self.getUser(userid)
        logging.info("DB: userExists() %s" % (u))
        if u:
            return { 'valid' : True, 'realName': u['realName'] };
        else:
            return { 'valid' : False, 'realName': 'dont_care' };
  
    def updateRealName(self, userid, name):
        user = {
            'userid' : userid,
        }
        result = self.users.update_one(
            {"userid" : userid},
            {"$set" : { 'realName' : name } },
            )
        logging.info("DB: updateRealName() %s %s" % (
            result.matched_count,
            result.modified_count,
            )) 
        tmp = {'userid' : userid}
        faf = self.users.find_one(tmp)
        logging.info("DB: updateRealName() %s" % (faf))
        return faf['realName']

    def addNewSchedule(self, userid, sname):
        schedule = {
            'name' : sname,
            'owner' : userid,
            'schedid' : randomString(),
            'avails' : [],
        }

        if not self.schedules.insert_one(schedule):
            return False

        result = self.users.update_one(
            {"userid" : userid},
            {"$push" : { 'schedules' : { 'name' : schedule['name'], 'schedid' : schedule['schedid'] } } },
            )
        logging.info("DB: addNewSchedule() %s %s" % (
            result.matched_count, 
            result.modified_count,
            ))
        
        if result.matched_count and result.modified_count:
            return True
        
        return False 

    def addExistingSchedule(self, userid, schedid):
        schedule = {
            'schedid' : schedid,
        }
        logging.info("DB: addExistingSchedule() schedule{} = %s" % (schedule,))

        result = self.schedules.find_one(schedule)
        logging.info("DB: addExistingSchedule() result = %s" % (result,))
        if result:
            result2 = self.users.update_one(
                {"userid" : userid},
                {"$push" : { 'schedules' : { 'name' : result['name'], 'schedid' : result['schedid'] } } },
                )
            logging.info("DB: addExistingSchedule() %s %s" % (
                result2.matched_count, 
                result2.modified_count,
                ))
            if result2.matched_count and result2.modified_count:
                return True
            
        return False
  
    def rmSchedule(self, userid, schedid):
        # try to rm assuming you're the owner
        schedule = {
            'schedid' : schedid,
            'owner' : userid,
        }
        logging.info("DB: rmSchedule() %s" % (schedule))
        result0 = self.schedules.delete_one(schedule)
        logging.info("DB: rmSchedule() %s" % (
            result0.deleted_count,
            ))
        
        # then remove from your own schedule list
        result1 = self.users.update_one(
            {"userid" : userid},
            {"$pull" : { 'schedules' : { 'schedid' : schedid } } },
            )

        logging.info("DB: rmSchedule() %s %s" % (
            result1.matched_count, 
            result1.modified_count,
            ))
        
        return 'ok'

    def getSchedules(self, userid):
        result = self.users.find_one({'userid' : userid})
        logging.info("DB: getSchedules() %s" % (result))
        return result['schedules']

    def getScheduleInfo(self, userid, schedid):
        scheduleInfo = self.schedules.find_one({'schedid' : schedid})
        logging.info("DB: getScheduleInfo() %s" % (scheduleInfo,))
        if not scheduleInfo:
            return False

        if scheduleInfo['owner'] == userid:
            scheduleInfo['isOwner'] = True
            logging.info("DB: getScheduleInfo() I am the owner")
        else:
            scheduleInfo['isOwner'] = False
            logging.info("DB: getScheduleInfo() I am a peon")

        del scheduleInfo['_id']   #delete sensitive info
        del scheduleInfo['owner'] #delete sensitive info

        avails = self.getAvailabilities(userid, schedid);
        scheduleInfo['avails'] = avails

        logging.info("DB: getScheduleInfo() return = %s" % (scheduleInfo,))
        return scheduleInfo

    def addNewAvailability(self, userid, schedid):
        avail = {
            'availid' : randomString(),
            'owner' : userid,
            'name' : 'John Adams',
            'data' : [],
        }

        if not self.avails.insert_one(avail).inserted_id:
            return False

        newAvail = self.avails.find_one({'availid' : avail['availid']})
        logging.info("DB: addNewAvailability() newAvail = %s" % (newAvail,))

        if not newAvail:
            return False

        result = self.schedules.update_one(
            {"schedid" : schedid},
            {"$push" : { 'avails' : avail['availid'] } },
            )

        logging.info("DB: addNewAvailability() update results %s %s" % (
            result.matched_count, 
            result.modified_count,
            ))
        if result.matched_count == 0 or result.modified_count == 0:
            return False


        avails = self.getAvailabilities(userid, schedid);

        return avails

    def getAvailabilities(self, userid, schedid):
        sched = self.schedules.find_one(
            {"schedid" : schedid}
            )
        
        if not sched:
            return False

        availData = list(self.avails.find({'availid' : { '$in' : sched['avails']} }))
        for a in availData:
            del a['_id']

        logging.info("getAvailabilities() %s" % (availData,))
        return availData

    def updateAvailName(self, userid, availid, name):
        avail = self.avails.find_one({'availid' : availid})
        logging.info("DB: updateAvailName() avail = %s" % (avail,))
        if avail and avail['owner'] == userid:
            result = self.avails.update_one({'availid' : availid},  { '$set': { 'name' : name} })


            logging.info("DB: updateAvailName() %s %s" % (
                result.matched_count, 
                result.modified_count,
                ))

            if result.matched_count == 1 and result.modified_count == 1:
                return True
        return False

    '''
    remove availability
    0) check db.avails and remove if you are avail owner
    1) check db.schedules and remove avail if you are schedule owner
    '''
    def rmAvail(self, userid, schedid, availid):
        result = self.avails.delete_one({
            'owner' : userid,
            'availid' : availid,
            })
        logging.info("DB: rmAvail() %s %s" % (result.deleted_count, result.acknowledged))

        if result.deleted_count > 0:
            result1 = self.schedules.update_one(
                {"schedid" : schedid},
                {"$pull" : { 'avails' : availid } },
                )
            logging.info("DB: rmAvail() %s %s" % (result1.matched_count, result1.modified_count,))
            return True

        return False
       
    def saveAvail(self, userid, availid, data):
        logging.info("DB: saveAvail() %s %s %s" % (userid, availid, data))
        res = self.avails.update_one(
            {
                "availid" : availid,
                "owner"   : userid,
                },
            {
                "$set" : { 'data' : data } 
                },
            )
        logging.info("DB: saveAvail() %s %s" % (res.matched_count, res.modified_count,))

        if res.matched_count == 1 and res.modified_count == 1:
            return True
        
        return False


class User():
    db = DB()

    def __init__(self,userid=None):
        if userid == None:
            self.userid = User.db.newUser()
            self.schedules = []
        else:
            self.userid = userid 
        
    def isValid(self):
        return User.db.userExists(self.userid)
        
    def addNewSchedule(self, sname):
        return User.db.addNewSchedule(self.userid, sname)

    def addNewAvailability(self, schedid):
        return User.db.addNewAvailability(self.userid, schedid)

    def addExistingSchedule(self, schedid):
        return User.db.addExistingSchedule(self.userid, schedid)

    def rmSchedule(self, schedid):
        return User.db.rmSchedule(self.userid, schedid)

    def getSchedules(self):
        return User.db.getSchedules(self.userid)

    def getScheduleInfo(self, schedid):
        return User.db.getScheduleInfo(self.userid, schedid)

    def updateRealName(self, name):
        return User.db.updateRealName(self.userid, name)

    def updateAvailName(self, availid, name):
        return User.db.updateAvailName(self.userid, availid, name)

    def rmAvail(self, schedid, availid):
        return User.db.rmAvail(self.userid, schedid, availid)

    def saveAvail(self, availid, data):
        return User.db.saveAvail(self.userid, availid, data)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/generateNewUser')
def newAcct():
    newUser = User()
    return newUser.userid

@app.route('/validateUser')
def validateUser():
    userid = request.args.get('userid')
    u = User(userid)
    resp = u.isValid()
    logging.info("validateUser() %s" % (resp))
    return json.dumps(resp)

@app.route('/updateRealName')
def updateRealName():
    userid = request.args.get('userid')
    realName = request.args.get('name')
    u = User(userid)
    resp = u.updateRealName(realName)
    logging.info("updateRealName() %s" % (resp))
    return resp


@app.route('/addNewSchedule')
def addNewSchedule():
    name = request.args.get('name')
    userid = request.args.get('userid')
    u = User(userid)
    return str(u.addNewSchedule(name))

@app.route('/getSchedules')
def getSchedules():
    userid = request.args.get('userid')
    u = User(userid)
    return json.dumps(u.getSchedules())

@app.route('/rmSchedule')
def rmSchedule():
    userid = request.args.get('userid')
    schedid = request.args.get('schedid')
    u = User(userid)
    return u.rmSchedule(schedid)

@app.route('/rmAvail')
def rmAvail():
    userid = request.args.get('userid')
    schedid = request.args.get('schedid')
    availid = request.args.get('availid')
    u = User(userid)
    return json.dumps(u.rmAvail(schedid, availid))

@app.route('/saveAvail')
def saveAvail():
    userid = request.args.get('userid')
    data = json.loads(urllib.parse.unquote(request.args.get('data')))
    availid = request.args.get('availid')
    u = User(userid)
    return json.dumps(u.saveAvail(availid, data))


@app.route('/addExistingSchedule')
def addExistingSchedule():
    userid = request.args.get('userid')
    schedid = request.args.get('schedid')
    u = User(userid)
    return str(u.addExistingSchedule(schedid))

@app.route('/getScheduleInfo')
def getScheduleInfo():
    userid = request.args.get('userid')
    schedid = request.args.get('schedid')
    u = User(userid)
    return json.dumps(u.getScheduleInfo(schedid))

@app.route('/addNewAvailability')
def addNewAvailability():
    userid = request.args.get('userid')
    schedid = request.args.get('schedid')
    u = User(userid)
    return json.dumps(u.addNewAvailability(schedid))

@app.route('/updateAvailName')
def updateAvailName():
    userid = request.args.get('userid')
    availid = request.args.get('availid')
    name = request.args.get('name')
    u = User(userid)
    return json.dumps(u.updateAvailName(availid, name))

