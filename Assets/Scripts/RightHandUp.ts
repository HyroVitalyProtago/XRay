import { AllHandTypes } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandType";
import TrackedHand, { PalmState } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/TrackedHand";
import { SIK } from "SpectaclesInteractionKit.lspkg/SIK";
import { easingFunctions } from "SpectaclesInteractionKit.lspkg/Utils/animate"

// todo rename handup
@component
export class RightHandUp extends BaseScriptComponent {
    private rightHand = SIK.HandInputData.getHand("right");
    private leftHand = SIK.HandInputData.getHand("left");

    @input
    @widget(new ComboBoxWidget([
        new ComboBoxItem("Left", "left"),
        new ComboBoxItem("Right", "right"),
        new ComboBoxItem("Both", "both")
    ]))
    private handType: string = "both"

    @input object: SceneObject;

    private activated = false;
    private target?: vec3 = null;
    private targetDir?: vec3 = null;

    onAwake() {
        this.createEvent('UpdateEvent').bind(() => {
            this.update();
        });
    }

    /**
     * 1. Create a right vector between the index and middle distals
     * 2. Create a forward vector between the wrist and middle distal
     * 3. Derive an up vector from the previous two vectors
     */
    private getHandOrientation(hand: TrackedHand) {
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

    private getHands() : TrackedHand[] {
        switch (this.handType) {
            case 'left': return [this.leftHand]
            case 'right': return [this.rightHand]
            case 'both': return [this.leftHand, this.rightHand]
            default: throw new Error('impossible hand type')
        }
    }

    private update() {
        const objTransform = this.object.getTransform()

        const hands = this.getHands()
        for (const hand of hands) {
            if (this.isFacingUp(hand)) {
                this.target = hand.getPalmCenter().add(vec3.up().uniformScale(13))
                this.targetDir = this.getHandOrientation(hand).forward
            }

            if (this.target && this.target.distance(objTransform.getWorldPosition()) > 0.1) {
                // https://www.construct.net/en/blogs/ashleys-blog-2/using-lerp-delta-time-924
                const newPos = vec3.lerp(
                    objTransform.getWorldPosition(),
                    this.target,
                    1 - Math.pow(0.025, getDeltaTime())
                )
                objTransform.setWorldPosition(newPos)

                // const quat = objTransform.getWorldRotation()
                const newRotation = quat.lerp(
                    objTransform.getWorldRotation(),
                    quat.lookAt(this.targetDir.uniformScale(-1), vec3.up()),
                    1 - Math.pow(0.025, getDeltaTime())
                )
                objTransform.setWorldRotation(newRotation)
            }
        }
    }
}
