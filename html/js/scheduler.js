
Vue.component('sched-trh', {
    template: '\
        <tr>\
            <th></th>\
            <sched-th\
                v-for="day in days"\
                v-bind:key="day.name"\
                v-bind:dayname="day.name"\
            ></sched-th>\
        </tr>\
        ',
    props: [ 'days'],
    computed: {
    },
    methods: {
    },
    });

Vue.component('sched-trd', {
    template: '\
        <tr>\
            <td class="small-font">{{ humanTime }}</td>\
            <sched-td\
                v-for="day in days"\
                v-bind:key="day.name"\
                v-bind:dayname="day.name"\
                v-bind:time="time"\
                v-bind:tableid="tableid"\
            ></sched-td>\
        </tr>\
        ',
    props: ['time', 'days', 'tableid'],
    computed: {
        humanTime: function() {
            var timeStr = (this.time >= 1300) ? 
                (this.time - 1200).toString() + 'pm' : this.time.toString() + 'am';
            
            return timeStr.toString().slice(0,-4) + 
                    ':' + timeStr.toString().slice(-4);
        },
    },
    methods: {
    },
    });


Vue.component('sched-td', {
    template: '\
        <td><input-check\
                v-bind:inputid="inputid"\
                ></input-check></td>\
        ',
    props: ['dayname', 'time', 'tableid'],
    computed: {
        inputid: function() {
            return { tableid: this.tableid, dayname: this.dayname, time: this.time }
        },
    },
    methods: {
    },
    });

Vue.component('input-check', {
    template: '\
        <input type="checkbox" v-model="boolState" v-on:change="emit">\
        ',
    props: ['daytime', 'inputid'],
    data: function() {
        return { boolState: false }
    },
    methods: {
        emit: function() {
            console.log("checked " + JSON.stringify(this.inputid) + this.boolState);
            this.$emit('checked', JSON.stringify(this.inputid) + this.boolState);
        }
    },

    });
Vue.component('sched-th', {
    template: '\
        <th>{{ dayname }}</th>\
        ',
    props: ['dayname'],
    computed: {
    },
    methods: {
    },
    });


/*
Vue.component('timeslot', {
    template: '\
        <div class="time-slot">\
            {{ humanTime }}\
        </div>\
        ',
    props: ['time'],
    computed: {
        humanTime: function() {
            var timeStr = (this.time >= 1300) ? 
                (this.time - 1200).toString() + 'pm' : this.time.toString() + 'am';
            
            return timeStr.toString().slice(0,-4) + 
                    ':' + timeStr.toString().slice(-4);
        },
    },
    methods: {
    },
    });
*/
/*
Vue.component('day-column', {
    template: '\
        <div class="flex-item">\
            <span> {{ dayname }} </span>\
            <timeslot\
                v-if="showtimes"\
                v-for="t in Times"\
                v-bind:key="t.time"\
                v-bind:time="t.time"\
            ></timeslot>\
            <div class="talldiv">\
                <textarea class="filltextbox"\
                    v-if="!showtimes"\
                    v-model="textBoxComment"\
                    v-on:keyup.enter="setTextBoxComment"\
                    placeholder="add comment (optional)"\
                \></textarea>\
            </div>\
        </div>\
        ',
    data: function() {
        T = []
        for (i=700; i< 2000; i=i+100) {
            T.push({ time: i });
            T.push({ time: i+30 });
        }
        return { Times : T, textBoxComment : '' };

    },
    props: ['dayname','showtimes'],
    methods: {
        setTextBoxComment: function() {
            console.log("component.day-column() start");
            this.$emit('enter', this.textBoxComment);
            console.log("component.day-column() " + this.textBoxComment);
        },
    },
    });
*/

Vue.component('schedule-listing', {
    template: '\
        <div>\
            <span class="schedule" v-on:click="goto_"> {{ title }} </span>\
            <button v-on:click="edit_">edit</button>\
            <button v-on:click="remove_">remove</button>\
        </div>\
        ',
    props: ['title'],
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
        displayScheduleName: {
            id: false,
            name: false,
        },
        editRealName: false,
        addNewScheduleDialog: 'add a new schedule',
        textBoxComment: '',
        Schedules: [],
        Availabilities: [],
        CheckedBoxes: [],
        //Days: ['sun','mon','tue','wed','thu','fri','sat'],

        
        Days: [
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
                ],


        Times: [],

    },
    computed: {
        DaysIndented: function() {
            return [{ name: this.realName, color: '#FFFFFF', showtimes: 0}].concat(this.Days);
        },
    },

    methods: {
        //
        // methods LOGIN start
        //
        isUserIdValid: function() {
            console.log("isUserIdValid() start");
            httpGet('http://127.0.0.1:5000/validateUser?id=' + this.userId,
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
                sched.schedid + '&id=' + this.userId, 
                this.updateSchedules);

        },

        editSchedule: function(sched) {
            console.log("editSchedule() " + sched.schedid);
        },

        gotoSchedule: function(sched) {
            console.log("gotoSchedule() " + sched);
            this.displaySchedule = sched;
            this.loginVisible = false;
            this.homeVisible = false;
            this.scheduleVisible = true;
        },

        emptySchedule: function() {
            console.log("emptySchedule()");
            this.displayScheduleName = false;
            this.loginVisible = false;
            this.homeVisible = true;
            this.scheduleVisible = false;
        },

        addNewSchedule: function() {
            console.log("addNewSchedule() " + this.newScheduleName);
            httpGet('http://127.0.0.1:5000/addSchedule?name=' + 
                this.newScheduleName + '&id=' + this.userId, 
                this.updateSchedules);
            document.activeElement.blur();
            this.newScheduleName = '';
        },

        updateSchedules: function() {
            console.log("updateSchedules()");
            httpGet('http://127.0.0.1:5000/getSchedules?id=' + this.userId,
                this.setSchedules);
        },
        
        setSchedules: function(data) {
            console.log("setSchedules() " + data);
            data = JSON.parse(data);
            console.log("setSchedules() " + data);
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
                this.realName+ '&id=' + this.userId, this.updateRealNameCallback);
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

        addAvailability: function() {
            console.log("addAvailability() start");
            this.Availabilities.push({});
        }
        //
        // methods SCHEDULE end
        //
    },

    components: {
        //
        // components HOMEPAGE start
        //

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
            this.Times.push({ time: i });
            this.Times.push({ time: i+30 });
        }

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
