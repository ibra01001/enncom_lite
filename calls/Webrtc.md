### why we will use webrtc in the chat app

* for peer to peer voice and video calls between users
* it use encrypted audio and video streams 
* it use udp protocol for fast data transfer


### how webrtc work in nutshell

* well basically user A open the app and wants to call user B 
the app of user A will send a message to the server to notify user B that user A wants to call him 

* then user B will get a notification and will accept the call 

* connection between user A and user B will be established romantic ;}

* you may think its just 3 steps but it is not that simple :P
 
#### deeper look into the process

* MEDIA CAPTURE : the app will ask you to access to the hardware (microphon and camera) and this process is called media capture 

* SIGNALING(التعارف): Devices cant just connect together they need a way to know about each other , because Webrtc does not provide signaling itself , this process is done via signaling server (using our chat app server) which is flask socketio 







### how we will use webrtc in the chat app

