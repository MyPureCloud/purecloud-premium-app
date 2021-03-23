# Genesys Cloud Premium Front-End App

This projects contains a sample premium app and an automated on-boarding flow for setting up the app in a Genesys Cloud organization.

## Table of Contents

- [Genesys Cloud Premium Front-End App](#genesys-cloud-premium-front-end-app)
  - [Table of Contents](#table-of-contents)
  - [What are Premium Client Applications?](#what-are-premium-client-applications)
  - [Github Pages](#github-pages)
  - [Requirements to run](#requirements-to-run)
  - [File Structure](#file-structure)
  - [Running Locally](#running-locally)
  - [Developer Tutorial](#developer-tutorial)
  - [Installation Wizard Features](#installation-wizard-features)
    - [Installed Data Summary](#installed-data-summary)
  - [Uninstalling / Deprovisioning the Premium App](#uninstalling--deprovisioning-the-premium-app)
  - [Sample Premium App Features](#sample-premium-app-features)
- [Modifying the Wizard for your Premium App](#modifying-the-wizard-for-your-premium-app)
  - [Technologies](#technologies)
  - [Configuration File](#configuration-file)
  - [Styles and Branding](#styles-and-branding)
  - [Extending the Functionality](#extending-the-functionality)
    - [Additional Genesys Cloud Objects](#additional-genesys-cloud-objects)

## What are Premium Client Applications?

 https://developer.mypurecloud.com/appfoundry/premium-client-applications.html

 TL;DR: Premium Client Applications are a type of Custom Client Applications that streamline and automate monetization through Genesys Cloud.

## Github Pages

The Premium App sample is hosted in GH-Pages:
https://mypurecloud.github.io/purecloud-premium-app/

The wizard or provisioning tool is located at:
https://mypurecloud.github.io/purecloud-premium-app/wizard/

## Requirements to run

1. A working Genesys Cloud Org with the 'premium-app-example' integration enabled.
2. An admin user that will run the wizard and access the premium app. 

## File Structure

The entire web app is hosted in Github pages with the root directory being the docs folder.

There are two folders inside /docs.

1. premium-app-sample
   - Contains the sample Premium App.
2. wizard
   - Contains the provisioning tool for the Premium App. This is the tool that is required for all Premium Apps.

## Running Locally

Run

```
node index
```

It should run in localhost:8080

If you're running the sample in a different host or port, then you'll also need to change the 'clientID' from the config file to one that you've created(Implicit Grant Type) in your Genesys Cloud environment. This is so you could add your testing URL in the Authorized Redirect URIs for that OAuth Client.

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

![Step 4](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/step-4.png "Step 4")

![Finish](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/finish.png "Finish")

### Installed Data Summary

After the wizard installation, you can get the summary of the provisioned objects (id and name) in the Notes section of the original Intergration instance. 

![Installed Data](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/installed-data.png "Installed Data")

## Uninstalling / Deprovisioning the Premium App

Going to the page docs/wizard/uninstall.html will run the deprovisioning of the Premium App. This means deleting all the Genesys Cloud objects (groups, roles, etc.) that were initially created by the tool.

![Uninstall](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/uninstall.png "Uninstall")

## Sample Premium App Features

1. The web page will use an implicit grant to authenticate with Genesys Cloud.

2. Upon installing, an app instance of the Partner Enablement Tool will also be provisioned. This tool is an automated way to provision telephony to your Genesys Cloud developer org. 

![Apps Menu](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/menu-item.PNG "Apps Menu")

![Partner Enablement Tool](https://raw.githubusercontent.com/MyPureCloud/purecloud-premium-app/master/screenshots/partner-enablement-tool.PNG "Partner Enablement Tool")

---

# Modifying the Wizard for your Premium App

By default the wizard app allows you to automatically provision the following Genesys Cloud objects:

- Roles
- Groups
- Additional Integration Instances
- Oauth Client
- Data Tables

Depending on the Premium App's needs it may need any number of those objects. The only object that is almost always required is a role. At least one role should be created that has the permission for your app. This role will grant users access to to view and use the premium app fom within Genesys Cloud.

## Technologies

The Wizard app is mostly built with vanilla HTML, CSS and JS. This makes it independent from any particular libraries.

## Configuration File

The configuration file is the SSOT for the entire operation and also contains the details on what items are to be provisioned by the wizard.

```
./docs/wizard/config/config.js
```

The following values should be modified for production:

- Regional client ids for your app to be provided by AppFoundry.
- wizardUriBase
  - Uri for the wizard tool.
- premiumAppURL
  - the landing page of the actual Premium App.
- appName
  - This is the unique id that is generated for your integration.
- prefix
  - A string that will be prefixed to all the names of the provisioned Genesys Cloud Objects. It is up to the discretion of the vendor but a good rule of thumb is just use the name of the Premium App itself.
- provisioningInfo
  - An object containing the definition of objects to be created. Please consult the default config file and the sample-provisioning-info.js for examples on how it should be formatted.

## Styles and Branding

While the default layout is sufficient for the provisioning process, you are free and encouraged to change elements and styling to reflect your branding.

At the very least, Premium Apps are expected to replace the default logo with a logo of their app or company.

Image assets

```
docs/wizard/assets/img/
```

CSS

```
docs/wizard/styles/style.css
```

## Extending the Functionality

Some apps are simple to set up while some apps may require configuration not natively supported by the wizard tool. For feature requests for the wizard, feel free to open an issue in this Github repo. It would be the discretion of the developers (DevFoundry) whether to approve or reject feature requests.

### Additional Genesys Cloud Objects

Aside from the Genesys Cloud Objects listed [here](#modifying-the-wizard-for-your-premium-app) you can create additional modules for other Genesys Cloud object types. All of these modules are defined here:

```
./docs/wizard/scripts/modules/
```

Consult the folder README for creating new modules.
