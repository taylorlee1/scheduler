

var Days = [
                {   name: 'sun'.toUpperCase(),
                    color: '#7FFF00',
                    showtimes: 1,
                },
                {
                    name: 'mon'.toUpperCase(),
                    color: '#DCDCDC',
                    showtimes: 1,
                },
                {
                    name: 'tue'.toUpperCase(),
                    color: '#D2691E',
                    showtimes: 1,
                },
                {
                    name: 'wed'.toUpperCase(),
                    color: '#FFF8DC',
                    showtimes: 1,
                },
                {
                    name: 'thu'.toUpperCase(),
                    color: '#00FFFF',
                    showtimes: 1,
                },
                {
                    name: 'fri'.toUpperCase(),
                    color: '#008B8B',
                    showtimes: 1,
                },
                {
                    name: 'sat'.toUpperCase(),
                    color: '#8FBC8F',
                    showtimes: 1,
                },
                ];


var Times = [];


String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};

var resetSchedObj = function(obj, avails) {

    // clear obj and retain pointer
    Object.keys(obj).forEach(function(key) { delete obj[key]; });

    for (var i=0; i<Times.length; ++i) {
        obj[Times[i].time] = {};
        for (var j=0; j<Days.length; ++j) {
            obj[Times[i].time][Days[j].name] = [];
        }
    }

    for (var i=0; i<avails.length; ++i) {
        for (var j=0; j<avails[i].data.length; ++j) {
            var T = avails[i].data[j];
            obj[T.time][T.day].push(avails[i].name);
        }
    }

    console.log("resetSchedObj() " + JSON.stringify(obj));
};



var deleteFromArrayByValue = function(ary, value) {
    ary = ary.filter(function(e) { return e !== value });
};

var humanTime = function(t) {
    var timeStr = (t >= 1300) ? 
        (t - 1200).toString() + 'pm' : t.toString() + 'am';
    
    return timeStr.toString().slice(0,-4) + 
            ':' + timeStr.toString().slice(-4);
};

Vue.component('avail-name', {
    template: '<div>' +
        '<div v-if="!isEditMode">{{ availname }}</div>' +
        '<input v-model="newname" v-if="isEditMode" ' +
        '   v-on:keyup.enter="updateName" :placeholder="availname">' +
        '<button v-if="isowner" v-on:click="isEditMode=1">edit name</button>' +
        '</div>',
    props: [ 'availname', 'availid', 'isowner' ],
    data: function() {
        return { isEditMode: false, newname: this.availname }
    },
    methods: {
        updateName: function() {
            console.log("avail-name updateName() %s %s", this.newname, this.availname); 
            if (!this.newname.isEmpty()) {
                this.isEditMode = false;
                this.$emit('editname', { availid: this.availid, name: this.newname } );
            }
        },
    },
    });

Vue.component('master-sched-listing', {
    template: '\
        <div v-if="Persons.length">\
            <div\
                v-for="person in Persons"\
                >\
                <input\
                    id="person"\
                    type="checkbox"\
                    label="person"\
                    >\
                <label for="person">{{ person }}</label>\
            </div>\
        </div>\
        ',
    props: [ 'sched', 'dayname', 'time' ],
    data: function() {
        return { Persons: this.sched[this.time][this.dayname] };
    },
    computed: {
        hasPerson : function() {
            return (this.Persons.length > 0)
        }
    },
    watch: {
    },
    });

Vue.component('sched-table-master', {
    template: '\
        <table>\
            <tr>\
                <th></th>\
                <th\
                    v-for="d in days"\
                    > {{ d.name }} </th>\
                </tr>\
            <tr\
                v-for="t in times"\
                >   <td>{{ t.humanTime }}</td>\
                    <td\
                    v-for="d in days"\
                    >\
                        <master-sched-listing\
                        :sched="mastersched"\
                        :dayname="d.name"\
                        :time="t.time"\
                        ></master-sched-listing>\
                        </td>\
                </tr>\
            <!--\
            <tr>\
                <td colspan="8">\
                    <p>\
                {{ availabilities }}\
                    </p>\
                    <p>\
                {{ JSON.stringify(mastersched) }}\
                    </p>\
                </td>\
            </tr>\
            -->\
        </table>\
        ',
    props: [ 'days', 'times', 'availabilities' ],
    data: {
    },
    computed: {
        mastersched: function() {
            var obj = {};
            resetSchedObj(obj, this.availabilities);
            return obj;
        },
    },
    });


Vue.component('sched-table-worker', {
    template: '\
        <table>\
            <tr>\
                <th></th>\
                <th\
                    v-for="d in days"\
                    > {{ d.name }} </th>\
                </tr>\
            <tr\
                v-for="t in times"\
                >   <td>{{ t.humanTime }}</td>\
                    <td\
                    v-for="d2 in days"\
                    >\
                        <label class="checkbox">\
                            <input\
                                :value="{ day: d2.name, time: t.time}"\
                                checked="savedchecks.indexOf({time: t.time, day: d2.name})"\
                                type="checkbox"\
                                v-model=checks\
                                v-on:change="emitchecked"\
                                :disabled="isnotowner"\
                                >\
                            <span></span>\
                            </label>\
                        </td>\
                </tr>\
            <!--\
            -->\
            <tr>\
                <!--\
                <td colspan="8">{{ JSON.stringify(checks) }}</td>\
                -->\
                {{ isnotowner }}\
            </tr>\
            <!--\
            -->\
        </table>\
        ',
    props: [ 'days', 'times', 'tablename', 'tableid', 'savedchecks', 'isnotowner' ],
    data: function() {
        return { checks: this.savedchecks }
    },
    methods: {
        emitchecked : function(event) {
            this.$emit('emitchecked', { tableid: this.tableid.text, checks: this.checks} );
        },
    },
    });


Vue.component('schedule-listing', {
    template: '\
        <div>\
            <span class="schedule" v-on:click="goto_"> {{ title }} </span>\
            <button v-on:click="edit_">edit</button>\
            <button v-on:click="remove_">remove</button>\
            <span>SHARE: {{ schedid }}</span>\
        </div>\
        ',
    props: ['title', 'schedid'],
    methods: {
        goto_ : function() {
            this.$emit('goto');
        },
        edit_ : function() {
            this.$emit('edit');
        },
        remove_ : function() {
            this.$emit('remove');
        }
    },
    });

function showArray(arr) {
    console.log("showArray()");
    for (var i = 0; i < arr.length; ++i) {
        console.log(i + '=' + JSON.stringify(arr[i]));
    }
};

function httpGet(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open( "GET", theUrl, true);
    xmlHttp.send( null );
};

var app = new Vue({
    el: '#app',
    data: {
        loginVisible: false,
        homeVisible: false,
        scheduleVisible: false,
        userId: '',
        userValid: false,
        realName: 'DEFAULT_USER_NAME',
        newScheduleName: '',
        existingScheduleId: '',
        displaySchedule: {
            id: false,
            name: false,
        },
        editRealName: false,
        addNewScheduleDialog: 'add a new schedule',
        addExistingScheduleDialog: 'add existing schedule',
        ScheduleInfo: { isOwner: false },
        textBoxComment: '',
        Schedules: [],
        Availabilities: [],
        MasterSched: {}, 
        CheckedBoxes: [],
        Days: Days,
        Times: Times,

    },
    computed: {
        DaysIndented: function() {
            return [{ name: this.realName, color: '#FFFFFF', showtimes: 0}].concat(Days);
        },
        AvailsIdToIdx: function() {
            var T = {};
            for (var i=0; i<this.Availabilities.length; ++i) {
                T[this.Availabilities[i].availid] = i;
            }
            return T;
        },
    },

    methods: {
        //
        // methods LOGIN start
        //
        isUserIdValid: function() {
            console.log("isUserIdValid() start");
            httpGet('http://127.0.0.1:5000/validateUser?userid=' + this.userId,
                this.setUserValid
                );
        },
    
        setUserValid: function(data) { //valid, realName) {
            console.log("setUserValid() " + data);
            data = JSON.parse(data);
            console.log("setUserValid() " + data);
            var valid = data.valid;
            var realName = data.realName;
            this.userValid = (valid === true);
            if (this.userValid) {
                localStorage.setItem('userId', this.userId);
                this.realName = realName;
                localStorage.setItem('realName', this.realName);
            } else {
                localStorage.setItem('userId', '');
                this.userId = '';
            }
            console.log("setUserValid() userId: " + 
                localStorage.getItem('userId'));
            this.checkUserStatus();
        },

        setUserId: function(id) {
            this.userId = id;
        },

        loginUser: function() {
            this.isUserIdValid();
        },

        getNewId: function() {
            this.userId = 'generating...';
            httpGet('http://127.0.0.1:5000/generateNewUser', this.setUserId);
        },

        checkUserStatus: function() {
            console.log("checkUserStatus() user valid = " + this.userValid);
            if (this.userValid) {
                this.updateSchedules();
                this.loginVisible = false;
                this.homeVisible = true;
            } else {
                this.loginVisible = true;
                this.homeVisible = false;    
            }
        },

        //
        // methods LOGIN end
        //

        //
        // methods HOMEPAGE start
        //
        removeSchedule: function(sched) {
            console.log("removeSchedule() " + sched.schedid);
            httpGet('http://127.0.0.1:5000/rmSchedule?schedid=' + 
                sched.schedid + '&userid=' + this.userId, 
                this.updateSchedules);

        },

        editSchedule: function(sched) {
            console.log("editSchedule() " + sched.schedid);
        },

        gotoSchedule: function(sched) {
            console.log("gotoSchedule() " + JSON.stringify(sched));

            httpGet('http://127.0.0.1:5000/getScheduleInfo?schedid=' + 
                sched.schedid + '&userid=' + this.userId, 
                this.updateScheduleInfo);

            this.displaySchedule = sched;
            this.loginVisible = false;
            this.homeVisible = false;
            this.scheduleVisible = true;
        },

        updateScheduleInfo: function(data) {
            data = JSON.parse(data);
            console.log("updateScheduleInfo() %s", JSON.stringify(data));
            if (!data) {
                alert("schedule not found, please remove from your list");
            } else {
                this.ScheduleInfo = data;
                this.Availabilities = this.ScheduleInfo['avails'];
            }
        },

        emptySchedule: function() {
            console.log("emptySchedule()");
            this.displaySchedule = false;
            this.loginVisible = false;
            this.homeVisible = true;
            this.scheduleVisible = false;
        },

        addNewSchedule: function() {
            console.log("addNewSchedule() " + this.newScheduleName);
            httpGet('http://127.0.0.1:5000/addNewSchedule?name=' + 
                this.newScheduleName + '&userid=' + this.userId, 
                this.updateSchedules);
            document.activeElement.blur();
            this.newScheduleName = '';
        },

        addExistingSchedule: function() {
            console.log("addExistingSchedule() " + this.existingScheduleId);
            httpGet('http://127.0.0.1:5000/addExistingSchedule?schedid=' + 
                this.existingScheduleId + '&userid=' + this.userId, 
                this.updateSchedules);
            document.activeElement.blur();
            this.existingScheduleId = '';
        },


        updateSchedules: function() {
            console.log("updateSchedules()");
            httpGet('http://127.0.0.1:5000/getSchedules?userid=' + this.userId,
                this.setSchedules);
        },
        
        setSchedules: function(data) {
            data = JSON.parse(data);
            console.log("setSchedules() " + JSON.stringify(data));
            this.Schedules = [];
            for (var i = 0; i < data.length; ++i) {
                this.Schedules.push({ 
                    'name' : data[i].name,
                    'schedid' : data[i].schedid,
                });
            }
            console.log("setSchedules() Schedules length: " + data.length);
            console.log("setSchedules() Schedules:");
            showArray(this.Schedules);
        }, 
        
        setEditRealName: function() {
            this.editRealName = true;
        },

        updateRealName: function() {
            console.log("updateRealName() start");
            this.editRealName = false; 
            httpGet('http://127.0.0.1:5000/updateRealName?name=' + 
                this.realName+ '&userid=' + this.userId, this.updateRealNameCallback);
        },
        
        updateRealNameCallback: function(foo) {
            console.log("updateRealNameCallback " + foo); 
            this.realName = foo;
            console.log("updateRealNameCallback done");
            localStorage.setItem('realName', this.realName);
        },

        clearLocalStorage: function() {
            localStorage.clear();
            location.reload();
        },

        setTextBoxComment: function(comment) {
            console.log("setTextBoxComment() " + comment);
        },
        tebow: function(comment) {
            console.log("tebow() " + comment);
        },

        //
        // methods HOMEPAGE end
        //

        //
        // methods SCHEDULE start
        //

        addNewAvailability: function() {
            console.log("addNewAvailability() start");

            httpGet('http://127.0.0.1:5000/addNewAvailability?userid=' + this.userId +
                '&schedid=' + this.displaySchedule.schedid,
                this.updateAvailabilities);
        },
    
        updateAvailabilities: function(avails) {
            avails = JSON.parse(avails);
            console.log("updateAvailabilities() new availid: %s", JSON.stringify(avails));
            this.Availabilities = avails;
        },

        tellChecked: function(obj) {
            console.log("tellChecked() start " + JSON.stringify(obj.checks) );
            console.log("tellChecked() start " + JSON.stringify(this.Availabilities) );

            if (obj.tableid in this.AvailsIdToIdx) {
                var T = this.Availabilities[this.AvailsIdToIdx[obj.tableid]];
                T.data = obj.checks;
                console.log("tellChecked() updated " + JSON.stringify(T));
            } else {
                alert("Could not find " + obj.tableid);
            }
        },
    
        saveAvailability: function(event) {
            console.log("saveAvailability() %s", JSON.stringify(event.target.name));
            console.log("saveAvailability() %s", JSON.stringify(event.target.id));
            if (event.target.id in this.AvailsIdToIdx) {
                var T = this.Availabilities[this.AvailsIdToIdx[event.target.id]].data;
                console.log("saveAvailability() %s", JSON.stringify(T));
                httpGet('http://127.0.0.1:5000/saveAvail?availid=' + 
                    event.target.id + '&userid=' + this.userId + '&data=' + JSON.stringify(T), 
                    this.saveAvailabilityCB);
            } else {
                alert("Could not find " + event.target.name);
            }
        },

        saveAvailabilityCB: function(data) {
            console.log("saveAvailabilityCB() " + data);
        },

        removeAvailability: function(event) {
            console.log("removeAvailability() %s", JSON.stringify(event.target.name));
            console.log("removeAvailability() %s", JSON.stringify(event.target.id));
            console.log("removeAvailability() %s", JSON.stringify(this.Availabilities));
            this.Availabilities = this.Availabilities.filter(function(e) {
                return e.availid !== event.target.id
            });
            console.log("removeAvailability() %s", JSON.stringify(this.Availabilities));

            httpGet('http://127.0.0.1:5000/rmAvail?availid=' + 
                event.target.id + '&userid=' + this.userId + '&schedid=' + this.displaySchedule.schedid,
                this.removeAvailabilityCB);
        },
    
        removeAvailabilityCB: function(data) {
            console.log("removeAvailabilityCB() %s", data);
        },

        updateAvailName: function(obj) {
            console.log("updateAvailName() " + JSON.stringify(obj));
            
            for (var i=0; i<this.Availabilities.length; ++i) {
                if (this.Availabilities[i].availid === obj.availid) {
                    this.Availabilities[i].name = obj.name
                }
            }

            httpGet('http://127.0.0.1:5000/updateAvailName?availid=' + 
                obj.availid + '&userid=' + this.userId + '&name=' + obj.name, 
                this.updateAvailNameCB);
        },
    
        updateAvailNameCB: function(data) {
            console.log("updateAvailNameCB() " + data);
        },

        //
        // methods SCHEDULE end
        //

        //
        // methods GENERAL start
        //

        initMasterSchedObj: function() {
            this.MasterSched = {};
            for (var i=0; i<Times.length; ++i) {
                this.MasterSched[Times[i].time] = {};
                for (var j=0; j<Days.length; ++j) {
                    this.MasterSched[Times[i].time][Days[j].name] = [];
                }
            }
            //console.log(JSON.stringify(this.MasterSched));
        },

        emptyMasterSchedObj: function() {
            for (var i=0; i<Times.length; ++i) {
                for (var j=0; j<Days.length; ++j) {
                    var a = this.MasterSched[Times[i].time][Days[j].name];
                    while (a.length > 0) {
                        a.pop();
                    }
                }
            }
            //console.log(JSON.stringify(this.MasterSched));
        },


        //
        // methods GENERAL end
        //
    },

    components: {
        //
        // components HOMEPAGE start
        //

    },

    watch: {
    },


    beforeCreate: function() {
        console.log("beforeCreate() start");
        console.log("beforeCreate() end");
    

    },

    created: function() {
        console.log("created() start");
        if (null === localStorage.getItem('userId')) {
            console.log("created(): no userId stored");
            this.loginVisible = true;
        } else {
            this.userId = localStorage.getItem('userId');
            this.realName = localStorage.getItem('realName');
            console.log("created(): userId exists: " + this.userId);
            this.isUserIdValid();
            //this.loginVisible = false;
            //this.homeVisible = true;
        }
        console.log("created() done");
        document.getElementById('appWrapper').style.visibility = 'visible';


        for (i=700; i< 2000; i=i+100) {
            Times.push({ time: i,    humanTime: humanTime(i)});
            Times.push({ time: i+30, humanTime: humanTime(i+30)});
        }

        this.initMasterSchedObj();

    },

});

var foo = new Vue({
    data: {
        a: 1,
    },
    created: function() {
        console.log('created');
    },
    mounted: function() {
        console.log('mounted');
    },
});


