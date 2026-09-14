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


* NAT TRAVERSAL and ICE candidates(العبور من خلال الشبكات): nowdays most of the devices are behind nat routers and this can be a problem for direct connection
to solve this WEBrtc use ice (interactive connectivity establishment) to find the best way to connect two devices using STUN and TURN protocols


* STUN protocol : is a protocol that ice call when it need to discover a public IP address and port 


* TURN : when STUN fail TURN server is used to relay the traffic it need a third party server


* CONECTION: Once the best network path is found and verified the connection opens up 


* HandShake : the devices perform a quick cryptographic handshake 

* Media Delivery : the audio and video streams are sent between the two devices      using the Ultra fast UDP protocol






### how we will use webrtc in the chat app

