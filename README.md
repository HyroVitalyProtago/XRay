<img src="./XRay-low-SD-480p.gif"/>

> *in the video upon, you will see how to use the app. The video is cut after the picture of the fridge is taken because the Snapchat Spectacles are not able to capture textures from camera using the internal tool.*

# XRay <img src="./icon.png" width="72" style="float:right;"/>
XRay is a snapchat spectacles app that enables you to snap photo of what's inside things. Later on, you don't need to open them again to see what's inside!

## How can I use it?
- Create an anchor and choose the according room in which you are
- When you are linked to a room (a little icon of the room appears in the right up corner of your view), you can spawn xray frames around by clicking on the button
    - First pinch to place the upper left corner
    - Second pinch to place the bottom right corner
- You can take a picture or update it in a frame by pinch and pull the photo button

## How does it works?

You need to be connected to Snap Cloud through Internet. This is required to store your pictures as the storage of a spectacles app is only around 125mb.

**All your pictures are encrypted using AES CTR algorithm with unique keys/counter stored on device => so even the admin of the Snap Cloud database cannot view anything**

Anchors are used to set your xrays in the same space when you will run again the app.

## Encryption
Feel free to reuse the way a encrypt/decrypt images before sending them to Snap Cloud to ensure maximum security and data privacy in your apps!

You can check the [ImageTestEncrypt](./Assets/Scripts/ImageTestEncrypt.ts) file that show how to use the code.

## Licence
- The encrypting algorithm use aes-js@3.1.2 library customized with coroutine to not block the main thread during encryption
- Some icons are from the great [Kenney.nl](Kenney.nl)
