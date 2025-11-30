<img src="./XRay-low-SD-480p.gif"/>

> *in the video upon, you will see how to use the app. The video is cut after the picture of the fridge is taken because the Snapchat Spectacles are not able to capture textures from camera using the internal tool.*

# XRay <img src="./icon.png" width="72" style="float:right;"/>
XRay is a snapchat spectacles app that enables you to snap photo of what's inside things. Later on, you don't need to open them again to see what's inside!

## How can I use it?
Create an anchor and choose the according room in which you are
<img width="130" height="140" alt="Screenshot 2025-11-30 at 20 57 50" src="https://github.com/user-attachments/assets/9aa959c6-22a9-4aa2-8e2b-fc8e2dbb19d7" />
<img width="212" height="260" alt="Screenshot 2025-11-30 at 20 58 04" src="https://github.com/user-attachments/assets/40d54667-faee-414b-9a13-8cf57062d2be" />

When you are linked to a room, a little icon of the room appears in the right up corner of your view
<img width="515" height="883" alt="Screenshot 2025-11-30 at 20 58 15" src="https://github.com/user-attachments/assets/1fbe345f-75eb-44cf-809c-7237a2f056f1" />

You can bring back the menu from anywhere by just putting your hand (either left or right) facing up
<img width="440" height="349" alt="Screenshot 2025-11-30 at 20 58 45" src="https://github.com/user-attachments/assets/3934b6b9-67e5-4702-a66a-dab1f33821ce" />

You can spawn xray frames around by clicking on the frame button
<img width="148" height="156" alt="Screenshot 2025-11-30 at 20 58 59" src="https://github.com/user-attachments/assets/cad5063f-312a-4269-a1e2-8186e061c3e3" />

First pinch (with your right hand for now) to place the upper left corner
<img width="507" height="564" alt="Screenshot 2025-11-30 at 20 59 05" src="https://github.com/user-attachments/assets/ed566686-8a54-4e0c-9981-76c9065e2946" />

Second pinch (with your right hand for now) to place the bottom right corner. You will see the image growing up.
<img width="1171" height="939" alt="Screenshot 2025-11-30 at 20 59 18" src="https://github.com/user-attachments/assets/493c73cb-1097-4f8a-b183-34f5fae294f6" />

You can take a picture (or update it) in a frame by pinch and pull the photo button
<img width="954" height="977" alt="Screenshot 2025-11-30 at 20 59 32" src="https://github.com/user-attachments/assets/4acfdf8f-bd58-4ee6-8950-fcc340bd7d2a" />

After that, you will see the picture even when the object is closed, for example here, the fridge.
<img width="818" height="782" alt="Screenshot 2025-11-30 at 20 59 44" src="https://github.com/user-attachments/assets/562b3beb-31cb-41c5-94c9-3a93b4502460" />

You can create other rooms (anchors) and other xray frames in the rooms.

### Additional infos
- the question button is here to open again the beginning frame with the video to help users understand what to do: a more detailed tutorial will be there in future versions.
- the anti-clockwise arrow enable the user to erase all local data (lost everything).

## How does it works?
You need to be connected to Snap Cloud through Internet. This is required to store your pictures as the storage of a spectacles app is only around 125mb.

**All your pictures are encrypted using AES CTR algorithm with unique keys/counter stored on device => so even the admin of the Snap Cloud database cannot view anything**

Anchors are used to set your xrays in the same space when you will run again the app.

## Encryption
Feel free to reuse the way a encrypt/decrypt images before sending them to Snap Cloud to ensure maximum security and data privacy in your apps!

You can check the [ImageTestEncrypt](./Assets/Scripts/ImageTestEncrypt.ts) file that show how to use the code.

## Design considerations
- More apps should be design to be usable with one hand. Here, you can summon the menu by putting your hand face up. Then use the same hand to pinch the button.
- Data privacy implied to encrypt data before they're sent to the database (Snap Cloud). You can follow all the recommandations from [OWASP](https://owasp.org/).
    - At the beginning, the app was using AI to spatialize pictures. It's fun, but nobody should share sensible pictures with AI... So for now the feature is disabled and will probably be reintroduced later by just taking stereoscopic pictures.
- Why pinch and pull buttons? This way, you can take full pictures without your hands in the field of view.
- Why not using the crop gestures (two hands pinch)? You don't want this gesture for big areas or furnitures on the ground as it is not comfortable. Simple pinch twice do the trick. Actually, the app sadly lack of a feedback for telling the user what to do, but it will be included in future versions.

## Next features
- Integrated tutorial
- Better feedbacks (palm face up to summon menu, creating frame, picture uploaded, ...)
- Close button on xray delete it (local and remote data)
- Button+Gesture to show/hide all xrays
- And some other surprises...

## Licence
- The encrypting algorithm use aes-js@3.1.2 library customized with coroutine to not block the main thread during encryption
- Some icons are from the great [Kenney.nl](Kenney.nl)
