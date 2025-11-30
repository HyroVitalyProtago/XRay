import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event";

@component
export class OnRelease extends BaseScriptComponent {

    private onButtonPulledEvent: Event<void> = new Event<void>()
    public readonly onButtonPulled: PublicApi<void> = this.onButtonPulledEvent.publicApi()

    private interactable: Interactable | null = null
    private originalPosition: vec3;
    private returnToOrigPos = false;
    private activated = false;

    private onAwake() {
        this.originalPosition = this.getTransform().getLocalPosition()

        this.createEvent("OnStartEvent").bind(this.onStart.bind(this))
        this.createEvent("UpdateEvent").bind(this.update.bind(this))
    }

    private onStart() {
        this.interactable = this.getSceneObject().getComponent(Interactable.getTypeName())
        this.interactable.onTriggerStart.add(() => {
            this.returnToOrigPos = false
            this.activated = false
        })
        this.interactable.onTriggerEnd.add(() => {
            this.reset()
        })
    }

    private update() {
        const origPos = this.originalPosition
        const transform = this.getTransform()
        const currentPos = transform.getLocalPosition()
        
        const origWorldPos = this.sceneObject.getParent().getTransform().getWorldTransform().multiplyPoint(this.originalPosition)
        const currentWorldPos = this.getTransform().getWorldPosition()
        const dist = origWorldPos.distance(currentWorldPos)

        if (dist > 30 && !this.activated && !this.returnToOrigPos) {
            this.onActivate()
        }

        if (this.returnToOrigPos) {
            if (dist < .01) {
                transform.setLocalPosition(this.originalPosition)
                this.returnToOrigPos = false
            }

            const newPos = vec3.lerp(
                currentPos,
                origPos,
                1 - Math.pow(0.025, getDeltaTime())
            )
            transform.setLocalPosition(newPos)
        }
    }

    private onActivate() {
        print("Activated!")
        this.onButtonPulledEvent.invoke()
        this.activated = true
    }

    private reset() {
        this.activated = false;
        this.returnToOrigPos = true
    }
}