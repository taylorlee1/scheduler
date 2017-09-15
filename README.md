vue.js + flask + mongodb

My intent was to help owners schedule their part time workers. My most important priority was low entry barrier to help with worker adoption.

The first step with any web application is creating a user account. I decided to keep this process as anonymous as possible, so each new user is assigned a randomly generated alphanumeric string (RGAS). This serves as both the userid as well as password. This RGAS should not be shared.

Once the user logs in, they can create a new schedule or add an existing schedule. New schedules are assigned a RGAS that can be shared with workers.

Both owners of a schedule or contributors of a schedule can create Availabilities (see pictures below). Only the owner of an Availability can edit/delete the Availability. I need to enhance this to allow owners to delete availabilities.

Owners of the schedule will see a table of all the aggregated Availabilities and can use the checkbox inputs to mark which workers can work in which timeslots.
