// https://developers.snap.com/spectacles/about-spectacles-features/apis/spatial-anchors
import {
  AnchorSession,
  AnchorSessionOptions,
} from 'Spatial Anchors.lspkg/AnchorSession';

import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { Anchor } from 'Spatial Anchors.lspkg/Anchor';
import { AnchorComponent } from 'Spatial Anchors.lspkg/AnchorComponent';
import { AnchorModule } from 'Spatial Anchors.lspkg/AnchorModule';
// import { PinchButton } from 'SpectaclesInteractionKit.lspkg/Components/UI/PinchButton/PinchButton';
import { BaseButton } from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/BaseButton';

const ANCHOR_KEY = 'anchor-'

@component
export class AnchorPlacementController extends BaseScriptComponent {
  private store = global.persistentStorageSystem.store;

  @input anchorModule: AnchorModule;
  @input createAnchorButton: BaseButton;

  @input camera: SceneObject;
  @input prefab: ObjectPrefab;

  @input materialNames: string[];
  @input materials: Material[];

  public anchorSession?: AnchorSession;

  private onAnchorEvent: Event<SceneObject> = new Event<SceneObject>()
  public readonly onAnchor: PublicApi<SceneObject> = this.onAnchorEvent.publicApi()

  async onAwake() {
    this.createEvent('OnStartEvent').bind(() => {
      this.onStart();
    });
  }

  async onStart() {
    this.log('start')

    // Set up the AnchorSession options to scan for World Anchors
    const anchorSessionOptions = new AnchorSessionOptions();
    anchorSessionOptions.scanForWorldAnchors = true;

    // Start scanning for anchors
    this.anchorSession = await this.anchorModule.openSession(anchorSessionOptions);
    // this.anchorSession.reset()

    // Listen for nearby anchors
    this.anchorSession.onAnchorNearby.add(this.onAnchorNearby.bind(this));
  }

  public onAnchorNearby(anchor: Anchor) {
    this.log('Anchor found: ' + anchor.id);

    const room = this.store.getString(ANCHOR_KEY + anchor.id)
    // print(room)

    const obj = this.attachNewObjectToAnchor(anchor, room);
    this.onAnchorEvent.invoke(obj)
  }

  public async createAnchor(room: string) {
    this.log('create anchor '+room)
    // TODO don't create anchors near other detected anchors

    // Compute the anchor position 50 centimeters in front of user
    let toWorldFromDevice = this.camera.getTransform().getWorldTransform();
    let anchorPosition = toWorldFromDevice.mult(mat4.fromTranslation(new vec3(0, 0, -50)));

    // Create the anchor
    let anchor = await this.anchorSession.createWorldAnchor(anchorPosition);

    // Create the object and attach it to the anchor
    const obj = this.attachNewObjectToAnchor(anchor, room);

    // Save the anchor so it's loaded in future sessions
    try {
        await this.anchorSession.saveAnchor(anchor);
        this.store.putString(ANCHOR_KEY + anchor.id, room)
        this.onAnchorEvent.invoke(obj)
        this.log('anchor event emited')
    } catch (error) {
      this.log('Error saving anchor: ' + error);
    }
  }

  public getTextureByRoomName(room:string) {
    const materialIndex = this.materialNames.findIndex(name => name === room)
    if (materialIndex >= 0) {
      return this.materials[materialIndex].mainPass.baseTex
    }
    return null
  }

  private attachNewObjectToAnchor(anchor: Anchor, room:string) {
    // Create a new object from the prefab
    let object: SceneObject = this.prefab.instantiate(this.getSceneObject());
    object.setParent(this.getSceneObject());

    // Associate the anchor with the object by adding an AnchorComponent to the
    // object and setting the anchor in the AnchorComponent.
    let anchorComponent = object.createComponent(AnchorComponent.getTypeName()) as AnchorComponent;
    anchorComponent.anchor = anchor;

    // TODO put that somewhere else....
    try {
        const render = object.getChild(0).getChild(0).getComponent("Image");// as RenderMeshVisual;
        // print(render.sceneObject.name)

        const materialIndex = this.materialNames.findIndex(name => name === room)
        if (materialIndex >= 0) {
            // print(materialIndex)
            render.mainMaterial = this.materials[materialIndex]
        }
    } catch(err) {
        this.log(err)
    }

    return object
  }

  private log(msg) {
    print('[APC] '+msg)
  }

  public clear() {
    this.anchorSession.reset()
  }
}