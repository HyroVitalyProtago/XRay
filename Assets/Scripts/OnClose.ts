import { Frame } from "SpectaclesUIKit.lspkg/Scripts/Components/Frame/Frame";

@component
export class OnClose extends BaseScriptComponent {
    @input camera?: Camera;

    async onAwake() {
        this.createEvent('OnStartEvent').bind(() => {
            this.onStart();
        });
    }

    getFrame() {
        return this.sceneObject.getComponent(Frame.getTypeName()) as Frame;
    }

    public show() {
        this.sceneObject.enabled = true
        if (this.camera) {
            this.sceneObject.getTransform().setWorldPosition(
                this.camera.getTransform().getWorldPosition()
                .add(this.camera.getTransform().back.uniformScale(100))
            )
            const frame = this.getFrame()
            frame.billboardComponent.resetPivotPoint()
        }
    }

    private onStart() {
        const frame = this.getFrame()
        frame.closeButton.onTriggerDown(() => {
            this.sceneObject.enabled = false
        })
    }
}