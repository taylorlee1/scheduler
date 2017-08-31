
var app = new Vue({
    el: '#app',
    data: {
        loginVisible: false,
        homeVisible: false,
        scheduleVisible: false,
        userId: '',
    },
    methods: {
        isUserIdValid: function() {
            console.log("isUserIdValid() start");
            return false;
        },

        loginUser: function() {
            if (this.isUserIdValid()) {
                localStorage.setItem('userId', this.userId);
                console.log("loginUser() userId: " + 
                    localStorage.getItem('userId'));
            } else {
                console.log("loginUser() userId " + " not valid");
            }
        },

        getNewId: function() {
        },
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
            console.log("created() userId: " + localStorage.getItem('userId'));
            this.loginVisible = false;
        }
        console.log("created() done");
        document.getElementById('appWrapper').style.visibility = 'visible';
        
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
