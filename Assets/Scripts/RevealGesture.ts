import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { AllHandTypes } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandType";
import TrackedHand, { PalmState } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/TrackedHand";
import { SIK } from "SpectaclesInteractionKit.lspkg/SIK";
import { easingFunctions } from "SpectaclesInteractionKit.lspkg/Utils/animate"

// todo rename handup
@component
export class RevealGesture extends BaseScriptComponent {
    private worldCamera: WorldCameraFinderProvider = WorldCameraFinderProvider.getInstance()
    private rightHand = SIK.HandInputData.getHand("right");
    private leftHand = SIK.HandInputData.getHand("left");

    @input
    @widget(new ComboBoxWidget([
        new ComboBoxItem("Left", "left"),
        new ComboBoxItem("Right", "right"),
        new ComboBoxItem("Both", "both")
    ]))
    private handType: string = "both"

    // todo event

    onAwake() {
        this.createEvent('UpdateEvent').bind(() => {
            this.update();
        });
    }

    private getHandOrientation(hand: TrackedHand) {
        /**
         * 1. Create a right vector between the index and middle distals
         * 2. Create a forward vector between the wrist and middle distal
         * 3. Derive an up vector from the previous two vectors
         */
        const handRightVector = hand.indexMidJoint.position.sub(hand.middleMidJoint.position).normalize()
        const handForwardVector = hand.middleMidJoint.position.sub(hand.wrist.position).normalize()
        const handUpVector = handRightVector.cross(handForwardVector)

        // const handToCameraVector = this.worldCamera.getWorldPosition().sub(this.wrist.position).normalize()

        return {
            forward: handForwardVector,
            right: handRightVector,
            up: handUpVector.uniformScale(hand.handType === 'left' ? -1 : 1),
        // cameraForward: handToCameraVector
        }
    }

    private isFacingUp(hand: TrackedHand) {
        const handOrientation = this.getHandOrientation(hand)
        return hand.isTracked() && handOrientation.up.dot(vec3.up()) > 0.95
    }

    private isFacingDown(hand: TrackedHand) {
        const handOrientation = this.getHandOrientation(hand)
        return hand.isTracked() && handOrientation.up.dot(vec3.up()) < -0.95
    }

    private getHand() : TrackedHand {
        switch (this.handType) {
            case 'left': return this.leftHand
            case 'right': return this.rightHand
            default: throw new Error('impossible hand type')
        }
    }

    private isFingerExtended() {
        // const v = this.leftHand.indexFinger[0]. this.leftHand.indexFinger[0]
    }

    private lastAction = 0
    private lastFacingWorld = 0
    private lastFacingHead = 0
    private update() {
        // maybe TODO only do it if hand in view???
        // TODO parameterize speed

        const hand = this.leftHand

        if (!hand.isTracked()) return

        const p = this.getHandOrientation(hand).up.dot(this.worldCamera.back())

        // TODO hand extended

        const timing = 2 // seconds
        const minTimingSinceLastAction = 2
        const currentTime = getTime()
        if (p > 0.9 /*&& hand.*/) {
            // print('hand facing world')

            if (currentTime - this.lastFacingHead < timing && currentTime - this.lastAction > minTimingSinceLastAction) {
                print("HIDE")
                this.lastAction = currentTime
            }

            this.lastFacingWorld = currentTime
        } else if (p < -0.9) {
            // print('hand facing head')

            if (currentTime - this.lastFacingWorld < timing && currentTime - this.lastAction > minTimingSinceLastAction) {
                print("SHOW")
                this.lastAction = currentTime
            }

            this.lastFacingHead = currentTime
        }


        // const objTransform = this.object.getTransform()

        // const hand = this.getHand()
        

        // if (this.isFacingUp(hand)) {
        //     this.target = hand.getPalmCenter().add(vec3.up().uniformScale(13))
        // }

        // if (this.target && this.target.distance(objTransform.getWorldPosition()) > 0.1) {
        //     // https://www.construct.net/en/blogs/ashleys-blog-2/using-lerp-delta-time-924
        //     const newPos = vec3.lerp(
        //         objTransform.getWorldPosition(),
        //         this.target,
        //         1 - Math.pow(0.025, getDeltaTime())
        //     )
        //     objTransform.setWorldPosition(newPos)
        // }
    }
}
