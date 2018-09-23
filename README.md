# PartyCards

Created with create-react-app

A simple web application to enjoy all your favourite card games!

# Dependencies

Node.js and npm package installer are required.

cd ./ReactJS/

```npm init``` 
+ Just follow through the stuff as instructed

Then you're ready to install dependencies!
```npm install create-react-app socket.io socket.io-client express babel-preset-env babel-register```

Which basically installs these dependencies:
+ create-react-app
+ express
+ socket.io
+ socket.io-client
+ babel-preset-env
+ babel-register

# Using the development build

Server side:
+ ```node start.js```

Client side:
+ ```npm run-script start```

# Compiling for an actual website

Server side:
+ Change port number in ```index.js``` by changing ```portNum``` variable (people will access your website with this port number, default should be 80.)
+ ```npm start.js``` to run server

Client side:
+ Inside ./ReactJS/src/App.js
+ Change ```this.socket = io("localhost:1521");``` to ```this.socket = io();```
+  ```npm run-script build``` to build a compiled version of the client side website. The compiled build will be saved into a folder called ```build```

# Now, on the computer that you're hosting the server on (needs node.js)

In the main directory:
```npm install express babel-preset-env babel-register socket.io```
Which installs these server side dependencies:
  + express
  + babel-preset-env
  + babel-register
  + socket.io

Copy these files over to the main directory:
+ start.js
+ index.js
+ ```constructors``` folder
+ ```build``` folder (from the compiled version) and rename it to public

```node start.js``` to start the server, and now people should be able to connect(and play with each other) to your PartyCards website! (Don't forget to do your portforwarding etc etc)
