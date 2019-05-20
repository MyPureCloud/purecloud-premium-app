# PureCloud Premium Front-End App

This projects contains a sample premium app and an automated on-boarding flow in setting up the app for the PureCloud organization.

## Sample
The quick sample is hosted in GH-Pages:
https://mypurecloud.github.io/purecloud-premium-app/

### Requirements to run sample:
1. A working PureCloud Org with the 'premium-app-example' integration enabled.
2. A user to log in with who has permissions for role/group/integration creation/deletion.

## What are Premium Client Applications?
 https://developer.mypurecloud.com/appfoundry/premium-client-applications.html

 TL;DR: Premium Client Applications are a type of Custom Client Applications that streamline and automate monetization through PureCloud.


## Summary of File and Code Structure

- Local Assets are contained inside the /docs folder. This is also the exact files that are hosted in the GitHub Pages link above.

The docs/index.js script is for testing your own modifications with NodeJS (using Express).
The 'redirectUriBase' values need to be updated from docs/config/config.js before being able to run locally. (ie. https://localhost/)

If you'll be running the sample from a different host, then you'll also need to change the 'clientIds' from the config file to one that you've created(Implicit Grant Type) in your test PureCloud environment. This is for setting the valid redirectUri.

Read More: https://help.mypurecloud.com/articles/create-an-oauth-client/

## Developer Tutorial 

For a more in-depth look into the wizard sample codebase please go to:

https://developer.mypurecloud.com/api/tutorials/premium-app-example-wizard/

## Installation Wizard Features
1. Includes checking the organization if the Premium App is enabled.
2. Step-by-step procedure of informing the user what the wizard is going to create in the org.
3. Provides a one-step uninstallation that will undo everything the wizard has created/configured.

![Step 1](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/step-1.png "Step 1")

![Step 2](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/step-2.png "Step 2")

![Step 3](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/step-3.png "Step 3")

![Finish](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/finish.png "Finish")

## Sample Premium App Features
1.	The web page will use an implicit grant to authenticate with PureCloud. 

1. The agent view subscribes to the user’s conversation notifications. 

![Agent View](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/agent-view.png "Agent View")

3. The supervisor view will allow supervisors to get a real-time look at a specific queue's activity.

![Supervisor View](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/supervisor-view.png "Supervisor View")



