import { BaseButton } from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/BaseButton';
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event";

@component
export class RoomMenu extends BaseScriptComponent {
    @input addRoomButton: SceneObject;

    @input kitchenButton: BaseButton;
    @input bedroomButton: BaseButton;
    @input livingRoomButton: BaseButton;
    @input officeButton: BaseButton;
    @input gardrobeButton: BaseButton;
    @input bathroomButton: BaseButton;

    private onRoomSelectEvent: Event<string> = new Event<string>()
    public readonly onRoomSelect: PublicApi<string> = this.onRoomSelectEvent.publicApi()

    onAwake() {
        this.kitchenButton.onTriggerDown.add(this.onKitchenButtonDown.bind(this))
        this.bedroomButton.onTriggerDown.add(this.onBedroomButtonDown.bind(this))
        this.livingRoomButton.onTriggerDown.add(this.onLivingRoomButtonDown.bind(this))
        this.officeButton.onTriggerDown.add(this.onOfficeButtonDown.bind(this))
        this.gardrobeButton.onTriggerDown.add(this.onGardrobeButtonDown.bind(this))
        this.bathroomButton.onTriggerDown.add(this.onBathroomButtonDown.bind(this))
    }

    private onKitchenButtonDown() {
        this.onRoomSelectEvent.invoke('kitchen')
    }
    private onBedroomButtonDown() {
        this.onRoomSelectEvent.invoke('bedroom')
    }
    private onLivingRoomButtonDown() {
        this.onRoomSelectEvent.invoke('livingRoom')
    }
    private onOfficeButtonDown() {
        this.onRoomSelectEvent.invoke('office')
    }
    private onGardrobeButtonDown() {
        this.onRoomSelectEvent.invoke('gardrobe')
    }
    private onBathroomButtonDown() {
        this.onRoomSelectEvent.invoke('bathroom')
    }

    public open() {
        this.sceneObject.enabled = true
        // TODO + a little head forward on same y
        this.sceneObject.getTransform().setWorldPosition(
            this.addRoomButton.getTransform().getWorldPosition()
                .add(vec3.up().uniformScale(10))
        )
        // this.addRoomButton.enabled = false
    }
}
