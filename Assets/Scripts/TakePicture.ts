import { SIK } from "SpectaclesInteractionKit.lspkg/SIK";
import { SpatialImageFrame } from "SpatialImage/Components/SpatialImageFrame";

@component
export class TakePicture extends BaseScriptComponent {
    private cameraModule = require('LensStudio:CameraModule');

    @input frame: SpatialImageFrame;

    private rightHand = SIK.HandInputData.getHand("right");
    // private leftHand = SIK.HandInputData.getHand("left");

    private isTakingPicture = false;

    onAwake() {
        // this.rightHand.onPinchUp.add(this.rightPinchUp);
        this.rightHand.onPinchDown.add(this.rightPinchDown);
        // this.leftHand.onPinchUp.add(this.leftPinchUp);
        // this.leftHand.onPinchDown.add(this.leftPinchDown);
    }

    private leftPinchDown = () => {
        print("LEFT Pinch down");
        // this.leftDown = true;
    };

    private leftPinchUp = () => {
        print("LEFT Pinch up");
        // this.leftDown = false;
        // if (!this.rightDown) {
        // this.processImage();
        // }
    };

    private rightPinchDown = () => {
        print("RIGHT Pinch down");
        // this.rightDown = true;

        if (!this.isTakingPicture) {
            this.takePicture();
        }
    };

    private rightPinchUp = () => {
        print("RIGHT Pinch up");
        // this.rightDown = false;
        // if (!this.leftDown) {
        // this.processImage();
        // }
    };

    async takePicture() {
        this.isTakingPicture = true
        const imageRequest = CameraModule.createImageRequest();

        try {
            const timeBeforeCapture = getTime()
            const imageFrame = await this.cameraModule.requestImage(imageRequest);
            const timeAfterCapture = getTime()

            print(timeBeforeCapture + " ; capture ; " + timeAfterCapture)
            print(imageFrame.texture.getWidth() + " x " + imageFrame.texture.getHeight())

            this.frame.setImage(imageFrame.texture, true)

            // E.g, use the texture in some visual
            // script.image.mainPass.baseTex = imageFrame.texture;
            // let timestamp = imageFrame.timestampMillis; // scene-relative time

            // use 
            // getAbsoluteStartTime() // The start time of the Lens since UNIX Epoch.
            // getTime() // Returns the time in seconds since the lens was started.
        } catch (error) {
            print(`Still image request failed: ${error}`);
        }

        this.isTakingPicture = false
  }
}
