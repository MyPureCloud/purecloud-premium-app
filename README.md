# PureCloud Premium Front-End App

Local Assets are contained inside the /docs folder. 

The index.js is for testing with Node because the PureCloud Authentication would require a valid HTTP URL 
and Github pages takes a while to load updated html files.

Page Link: https://mypurecloud.github.io/purecloud-premium-app/

### Features
1.	The web page will use an implicit grant to authenticate with PureCloud. Once authenticated, it will subscribe to notifications for user’s conversations to be kept up to date in real time.

2.	The web page will display basic information about the caller (e.g. name, phone number) and will also display the state assoicated with the phone number.

3.	The web page will process notifications to determine when a new call has arrived and will use the client app sdk to send a toast to the user indicating what state they have a call from.

![alt text](https://github.com/mypurecloud/purecloud-premium-app/blob/master/screenshot.png "Screenshot")
