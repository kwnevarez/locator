# Introduction
This example demonstrates how to visuallize your Photon locator results using Node.js in a Google App Engine Flexible Environment and the Google Maps Javascript API. This sample also the Express web framework, Websockets, and the Particle Javascript API. 

## Run Locally

1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/), including the [gcloud tool](https://cloud.google.com/sdk/gcloud/), and [gcloud app component](https://cloud.google.com/sdk/gcloud-app).
1. Setup the gcloud tool. This provides authentication to Google Cloud APIs and services.

        gcloud init

1. Acquire local credentials for autheticating with Google Cloud Platform APIs:

        gcloud beta auth application-default login

1. Clone this repo:

        git clone https://github.com/rickkas7/locator.git
1. Open a sample folder:

        cd locator/appengine

1. Install depedencies using `npm`:

        npm install

1. Run the sample with `npm`:

        npm start

1. Visit the application at [http://localhost:8080](http://localhost:8080).

## Deploying

1. Use the [Google Developers Console](https://console.developer.google.com) to create a project/app id. (App id and project id are identical.)
1. Setup the gcloud tool, if you haven't already.

        gcloud init

1. Use gcloud to deploy your app.

        gcloud app deploy

1. Awesome! Your application is now live at `https://YOUR_PROJECT_ID.appspot.com`.