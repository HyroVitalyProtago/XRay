# XRay

This app enable everyone to add xrays around.

## How can I use it?
- Create an anchor and choose the according room in which you are
- When you are linked to a room, you can spawn xray frames around by clicking on the button
    - First pinch to place the upper left corner
    - Second pinch to place the bottom right corner
- You can take a picture or update it in a frame by pinch and pull the button

## How it works?
- You need to be connected to the internet (more exactly the Snap Cloud Supabase)
    - this is required to store your pictures as the storage of a spectacles app is only around 125mb
    - all your pictures are encrypted using AES CTR algorithm with unique keys/counter stored on device
    - so even the admin of the Snap Cloud database cannot view anything
- Anchors are used to set your xrays in the same space when you will run again the app

## TODO
- [ ] check if internet available (let user choose between no saving)
- [ ] display if user logged to snap cloud
- [ ] display when anchor validated
- [ ] enable or show button to add xray only when anchor found
- [ ] disable or hide button to add xray when creating xray
- [ ] btn to delete xray
- [ ] display when xray successfully uploaded
- [ ] display tutorial: hand that go from facing down to facing up
- [ ] only show menu for 5-10 seconds since last interaction
- [ ] hands occlusions?
- [ ] to spatialize images to regular images
- [ ] use crop sample to get the right image

- think about what happens if user don't follow the app flow
- min/max size limit about xrays?
- way to move/resize xrays?
- what happen if I start an xray (I still need to do 2nd pinch) then move and another anchor is detected
- what happen if I click on a button during xray creation?
- I should not be able to spawn multiples anchors too close to others
- which affordances should I add to support interaction => notably for the push to act button
- gestures shortcuts (reveal/hide all xrays)
- see images even when outside so you can remember what you have at home

## Future
- Maybe make spatial images?
    - probably by using camera left+right for tiny depth reconstruction without any remote AI as the data are sensitive and should be keeped confidential
- 

## Notes
- aes-js@3.1.2 library customized with coroutine to not block the main thread
```ts
ModeOfOperationCTR.prototype.encryptTask = function*(plaintext) {
    var encrypted = coerceArray(plaintext, true);

    for (var i = 0; i < encrypted.length; i++) {
        if (this._remainingCounterIndex === 16) {
            this._remainingCounter = this._aes.encrypt(this._counter._counter);
            this._remainingCounterIndex = 0;
            this._counter.increment();
        }
        encrypted[i] ^= this._remainingCounter[this._remainingCounterIndex++];
        
        // as data is big, make sure you make not so long for
        if (i % Math.floor(encrypted.length / 200) === 0) {
            yield i / encrypted.length
        }
    }

    return encrypted;
}

// Decryption is symetric
ModeOfOperationCTR.prototype.decryptTask = ModeOfOperationCTR.prototype.encryptTask;
```
- when snap will add crypto encrypt/decrypt, this should be replaced by the native APIs