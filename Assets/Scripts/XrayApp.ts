import { SIK } from "SpectaclesInteractionKit.lspkg/SIK";
import { BaseButton } from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/BaseButton';
import { Anchor } from 'Spatial Anchors.lspkg/Anchor';
import { AnchorComponent } from 'Spatial Anchors.lspkg/AnchorComponent';
import { AnchorPlacementController } from "Scripts/AnchorPlacementController";
import { SpatialImageFrame } from "SpatialImage/Components/SpatialImageFrame";
import { ContainerFrame } from "SpectaclesInteractionKit.lspkg/Components/UI/ContainerFrame/ContainerFrame";
import { SpatialImage } from 'Spatial Image.lsc/Spatial Image'
import { lerp } from "SpectaclesInteractionKit.lspkg/Utils/mathUtils";
import { RoomMenu } from "Scripts/RoomMenu";
import { MyDatabase } from "Scripts/MyDatabase";
import { cryptoUtil, vec3Util, quatUtil, textureUtil, until } from "Scripts/Utils";
import { TaskManager } from "Scripts/TaskManager";
import Event from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event";
import { OnRelease } from "Scripts/OnRelease";

class XRay {
    private static store = global.persistentStorageSystem.store;
    // private database: MyDatabase;

    private static XRAY_KEY = 'xray-'
    private static XRAY_CRYPTO_KEY = 'key-xray-'
    private static XRAY_CRYPTO_COUNTER = 'counter-xray-'

    public id: string;
    public anchorId: string;
    
    public localPosition: vec3;
    public localRotation: quat;
    public localScale: vec3;

    public texture: Texture;

    private key: Uint8Array;
    private counter: number;

    public sceneObject: SceneObject;

    private onTextureLoadedEvent: Event<Texture> = new Event<Texture>()
    public readonly onTextureLoaded: PublicApi<Texture> = this.onTextureLoadedEvent.publicApi()

    static async loadAll(database: MyDatabase) : Promise<{ [id: string] : XRay }> {
        const xrays = {}
        for (const xrayId of XRay.getAllSavedIds()) {
            try {
                xrays[xrayId] = await XRay.load(xrayId, database)
            } catch(err) {
                print(`error in loading xray ${xrayId}: ${err}`)
            }
        }
        return xrays
    }

    static getAllSavedIds() {
        return XRay.store.getAllKeys().filter(key => key.startsWith(this.XRAY_KEY))
    }

    static create(anchorId: string) {
        const xray = new XRay()
        xray.anchorId = anchorId
        xray.init()
        return xray
    }

    static async load(id, database: MyDatabase) {
        const xray = new XRay()
        await database.isConnected()
        await xray.load(id, database)
        return xray
    }

    private constructor() {}

    private init() {
        this.id = crypto.randomUUID();
        this.key = cryptoUtil.generateKey()
        this.counter = cryptoUtil.getRandomCounter()
    }

    public setLocalTransform(localPosition: vec3, localRotation: quat, localScale: vec3) {
        this.localPosition = localPosition
        this.localRotation = localRotation
        this.localScale = localScale
    }

    public setTexture(texture: Texture) {
        this.texture = texture
    }

    public async save(database: MyDatabase) {
        print("[XRay] start to save")

        const taskManager = TaskManager.getInstance()

        try {
            // print(this.texture)
            const textureString = await textureUtil.toString(this.texture, {
                quality: CompressionQuality.HighQuality,
                encoding: EncodingType.Jpg
            })
            print("textureString: "+textureString.slice(0,10))
            const bytes = Base64.decode(textureString)
            print("bytes: "+bytes.slice(0,10))
            const encryptedBytes = await taskManager.runTask(cryptoUtil.encryptTask(bytes, this.key, this.counter)) as Uint8Array
            print("encryptedBytes: "+encryptedBytes.slice(0,10))
            await database.isConnected()
            await database.uploadFile(this.id+'.jpeg', encryptedBytes)
            
            print("[XRay] texture saved")
        } catch(err) {
            print("impossible to save image: "+err)
            return
        }

        try {
            const object = this.toObject()
            const serialized = JSON.stringify(object)
            XRay.store.putString(XRay.XRAY_KEY+this.id, serialized)
            XRay.store.putUint8Array(XRay.XRAY_CRYPTO_KEY+this.id, this.key)
            XRay.store.putInt(XRay.XRAY_CRYPTO_COUNTER+this.id, this.counter)
            print(`
                [XRay] xray ${this.id} saved:
                - json: ${serialized}
                - crypto key: ${this.key}
                - crypto counter: ${this.counter}
            `)
        } catch(err) {
            print("Error in saving xray"+err)
        }
    }

    public async load(id: string, database: MyDatabase) {
        print(`[XRay] start to load ${id}`)
        
        if (!id.startsWith(XRay.XRAY_KEY)) {
            throw new Error(`need a full id to load: prefix ${XRay.XRAY_KEY} not found in ${id}`)
        }

        try {
            const json = XRay.store.getString(id)
            const object = JSON.parse(json)
            this.fromObject(object)
            
            this.key = XRay.store.getUint8Array(XRay.XRAY_CRYPTO_KEY+this.id)
            this.counter = XRay.store.getInt(XRay.XRAY_CRYPTO_COUNTER+this.id)

            print(`[XRay] loading
                - json: ${json}
                - crypto key: ${this.key}
                - crypto counter: ${this.counter}
            `)

            // don't await here
            this.loadRemoteTexture(database).then(() => {
                this.onTextureLoadedEvent.invoke(this.texture)
            })
        } catch(err) {
            print("Error in loading"+err)
        }
        return this
    }

    public async loadRemoteTexture(database: MyDatabase) {
        const taskManager = TaskManager.getInstance()

        if (this.texture) {
            print("texture already loaded")
            return
        }

        try {
            const encryptedTextureBytes = await database.downloadTextureBytes(this.id+'.jpeg')
            // print("encryptedTextureBytes: "+encryptedTextureBytes.slice(0,10))
            const decryptedBytes = await taskManager.runTask(cryptoUtil.decryptTask(encryptedTextureBytes, this.key, this.counter)) as Uint8Array
            // print("decryptedBytes: "+decryptedBytes.slice(0,10))
            const encodedString = Base64.encode(decryptedBytes)
            // print("encodedString: "+encodedString.slice(0,10))
            const texture = await textureUtil.fromString(encodedString)
            // print(texture)
            this.texture = texture
        } catch(err) {
            print("Impossible to load texture:"+err)
        }
    }

    public toObject() {
        return {
            id: this.id,
            anchorId: this.anchorId,
    
            localPosition: vec3Util.toObject(this.localPosition),
            localRotation: quatUtil.toObject(this.localRotation),
            localScale: vec3Util.toObject(this.localScale),
        }
    }

    public fromObject(obj) {
        this.id = obj.id
        this.anchorId = obj.anchorId

        this.localPosition = vec3Util.fromObject(obj.localPosition)
        this.localRotation = quatUtil.fromObject(obj.localRotation)
        this.localScale = vec3Util.fromObject(obj.localScale)
    }
}

/*
CurrentState
    !currentAnchor => NO_ANCHOR,
    currentAnchor && !currentXray => LINK_ANCHOR,
    currentAnchor && currentXray && !canTakePicture => CREATING_XRAY,
    currentAnchor && currentXray && canTakePicture => TAKING_PICTURE
*/
enum State {
    NO_ANCHOR, // no anchors saved or found in the env
    LINK_ANCHOR, // anchor found, system currently linked to it
    CREATING_XRAY, // create an xray linked to the current anchor
    TAKING_PICTURE // take a picture for (current? selected?) xray
}

@component
export class XrayApp extends BaseScriptComponent {
    private cameraModule = require('LensStudio:CameraModule');
    private static store = global.persistentStorageSystem.store;

    @input database: MyDatabase;
    @input camera: SceneObject;
    @input roomMenu: RoomMenu;
    @input createXrayButton: BaseButton;
    @input createPictureButton: BaseButton;
    @input clearButton: BaseButton;
    // @input image: SceneObject;
    @input prefab: ObjectPrefab;
    @input anchorNotification: Image;

    private rightHand = SIK.HandInputData.getHand("right");
    private leftHand = SIK.HandInputData.getHand("left");

    private currentAnchor?: SceneObject = null;
    private currentAnchorId?: string = null;
    private currentXray?: XRay = null;
    private currentFrame?: SpatialImageFrame;
    
    // private currentState: State = State.NO_ANCHOR;

    // dictionnary of all anchors and xrays in the app
    private anchors: { [id: string] : AnchorComponent } = {};
    private xrays: { [id: string] : XRay } = {};
    /*
    Storage:

    id:rooms
    {
        rooms: [
            {
                roomId: string,
                icon: 'cds/cds/salon.png',
                name: null || 'Salon',
                anchor-id: string,
                xrays: [
                    {
                        // rect of window portal
                        topLeft: vec3,
                        bottomRight: vec3,

                        // relative to the anchor
                        texture: string (base64),
                        position: vec3,
                        orientation: quaternion
                    }
                ]
            }
        ]
    }

    id:xray-id
    */

    @input anchorPlacementController: AnchorPlacementController;

    onAwake() {
        this.createEvent('OnStartEvent').bind(() => {
            this.onStart();
        });
        this.createEvent('UpdateEvent').bind(() => {
            this.update();
        });
    }

    public clear() {
        print('[XRayApp] clear')
        this.anchorPlacementController.clear()
        XrayApp.store.clear()
    }

    private onStart() {
        print(XrayApp.store.getAllKeys())

        // XrayApp.store.clear();
        XrayApp.store.onStoreFull = () => {
            print("store full, sorry...")
        }

        this.anchorPlacementController
            .onAnchor.add((obj) => this.onAnchor(obj))
        this.createXrayButton
            .onTriggerDown.add(() => this.createXray());
        this.createPictureButton
            .onTriggerDown.add(() => this.createPicture());
        this.clearButton
            .onTriggerDown.add(() => {
                this.anchorPlacementController.clear()
                XrayApp.store.clear()
            });

        this.roomMenu.onRoomSelect.add(this.onRoomSelect.bind(this))

        this.loadXRays()
    }

    private async loadXRays() {
        this.xrays = await XRay.loadAll(this.database)
        this.spawnXrays()
    }

    private onRoomSelect(room: string) {
        print('room select '+room)
        this.roomMenu.sceneObject.enabled = false
        this.anchorPlacementController.createAnchor(room)
    }

    private async onAnchor(obj: SceneObject) {
        const anchorComponent = obj.getComponent(AnchorComponent.getTypeName()) as AnchorComponent;
        const anchor = anchorComponent.anchor

        this.anchors[anchor.id] = anchorComponent

        print('set current anchor: ' + anchor.id);
        this.currentAnchorId = anchor.id;
        this.currentAnchor = obj;
        this.showNotifCurrentAnchor()

        this.spawnXrays()
    }

    private spawnXrays() {
        if (!this.currentAnchorId) return

        // spawn all disabled
        for (const xrayId in this.xrays) {
            const xray = this.xrays[xrayId]
            try {
                if (xray.anchorId === this.currentAnchorId && !xray.sceneObject) {
                    this.spawnXray(xray, this.currentAnchor); // TODO enable/disable instead
                }
            } catch(err) {
                print(err)
            }
        }
    }


    private getChildByName(object, name:string) {
        for (const child of object.getChild(0).children) {
            if (child.name === name) {
                return child
            }
        }
    }

    // change loading spinner state
    private toggleLoadingSpinner(object, b) {
        this.getChildByName(object, 'LoadingSpinner').enabled = b
    }

    private spawnXray(xray: XRay, parent: SceneObject) {
        print('should spawn xray')

        const object: SceneObject = this.prefab.instantiate(this.getSceneObject());
        object.setParent(parent)
        object.getTransform().setLocalPosition(xray.localPosition)
        object.getTransform().setLocalRotation(xray.localRotation)
        object.getTransform().setLocalScale(xray.localScale)

        const spatialImageFrame = object.getComponent(SpatialImageFrame.getTypeName()) as SpatialImageFrame;

        this.toggleLoadingSpinner(object, true)
        if (xray.texture) {
            spatialImageFrame.setImage(xray.texture, false)
        } else {
            xray.onTextureLoaded.add(texture => {
                print("on texture loaded!")
                spatialImageFrame.setImage(xray.texture, false)

                this.toggleLoadingSpinner(object, false)
            })
        }

        const containerFrame = object.getComponent(ContainerFrame.getTypeName()) as ContainerFrame;
        containerFrame.enableCloseButton(true)
        containerFrame.closeButton.onTrigger.add(() => {
            print("TODO handle close button on xray")
            //
        })

        const onRelease = this.getChildByName(object, 'PhotoPullButton').getComponent(OnRelease.getTypeName()) as OnRelease;
        onRelease.onButtonPulled.add(() => {
            // TODO check if already loading
            this.createPictureForXray(xray, spatialImageFrame)
        })

        xray.sceneObject = object
    }
    
    private createXray() {
        if (this.currentAnchorId === null) {
            print("no currentAnchorId, unable to create xray")
            return
        }

        print("createXray")
        this.currentXray = XRay.create(this.currentAnchorId) // new XRay(this.currentAnchorId, this.database)
        this.rightHand.onPinchDown.add(this.rightPinchDown);

        // instantiate the prefab and set the anchor as parent
        const object: SceneObject = this.prefab.instantiate(this.getSceneObject());
        object.setParent(this.currentAnchor)

        // get current spatial image frame
        this.currentFrame = object.getComponent(SpatialImageFrame.getTypeName()) as SpatialImageFrame;

        // disable interactions during creation
        const containerFrame = object.getComponent(ContainerFrame.getTypeName()) as ContainerFrame;
        containerFrame.enableInteractionPlane = false
        containerFrame.enableInteractables(false)

        // disable object before first pinch
        object.enabled = false

        const onRelease = this.getChildByName(object, 'PhotoPullButton').getComponent(OnRelease.getTypeName()) as OnRelease;
        onRelease.onButtonPulled.add(() => {
            // TODO check if already loading
            this.createPictureForXray(this.currentXray, this.currentFrame)
        })

        // get object that has AnchorComponent with same anchor id
        // this.image.setParent(this.currentAnchor)
    }

    private stopCreateXray() {
        this.rightHand.onPinchDown.remove(this.rightPinchDown);

        this.startTakingPicture()
    }

    private canTakePicture = false
    private startTakingPicture() {
        this.canTakePicture = true
    }

    // old way of getting high resolution picture
    // for now, I can not encrypt it to the cloud...
    public async __createPicture() {
        if (!this.canTakePicture) return;

        this.canTakePicture = false
        const imageRequest = CameraModule.createImageRequest();

        try {
            const imageFrame = await this.cameraModule.requestImage(imageRequest);
            this.currentFrame.setImage(imageFrame.texture, false)
            
            this.currentXray.setTexture(imageFrame.texture)
            await this.currentXray.save(this.database)
            this.xrays[this.currentXray.id] = this.currentXray
        } catch (error) {
            print(`Still image request failed: ${error}`);
        }
    }

    // TODO util
    async getCameraTexture() {
        const cameraRequest = CameraModule.createCameraRequest();
        cameraRequest.cameraId = CameraModule.CameraId.Default_Color;
        const cameraTexture = this.cameraModule.requestCamera(cameraRequest);
        const cameraTextureProvider = cameraTexture.control as CameraTextureProvider;

        const onNewFrame = cameraTextureProvider.onNewFrame;
        let waitCameraTexture = true
        let camTex
        const registration = onNewFrame.add((cameraFrame) => {
            // cameraFrame.timestampSeconds
            if (waitCameraTexture) {
                camTex = (cameraTexture as Texture).copyFrame()
                waitCameraTexture = false
            }
        });
        await until(() => !waitCameraTexture)
        onNewFrame.remove(registration)

        return camTex
    }

    public async createPictureForXray(xray:XRay, spatialImageFrame:SpatialImageFrame) {
        const camTex = await this.getCameraTexture()

        try {
            spatialImageFrame.setImage(camTex, false)
            xray.setTexture(camTex)
            await xray.save(this.database)
        } catch (error) {
            print(`Still image request failed: ${error}`);
        }
    }

    public async createPicture() {
        if (!this.canTakePicture) return;

        this.canTakePicture = false
        
        const camTex = await this.getCameraTexture()

        try {
            //const imageFrame = await this.cameraModule.requestImage(imageRequest);
            this.currentFrame.setImage(camTex, false)
            this.currentXray.setTexture(camTex)
            await this.currentXray.save(this.database)
            this.xrays[this.currentXray.id] = this.currentXray
        } catch (error) {
            print(`Still image request failed: ${error}`);
        }
    } 

    private firstPinchPosition: vec3 | null = null;
    private secondPinchPosition: vec3 | null = null;
    
    private rightPinchDown = async () => {
        if (this.firstPinchPosition === null) {
            print("set first pinch position")
            this.firstPinchPosition = this.rightHand.indexTip.position
            
            // re-enable object after first pinch
            this.currentFrame.sceneObject.enabled = true
        } else if (this.secondPinchPosition === null) {
            print("set second pinch position")
            this.secondPinchPosition = this.rightHand.indexTip.position
            
            this.computeTransform(
                this.currentFrame.sceneObject.getTransform(),
                this.firstPinchPosition,
                this.secondPinchPosition
            )
            this.currentXray.setLocalTransform(
                this.currentFrame.sceneObject.getTransform().getLocalPosition(),
                this.currentFrame.sceneObject.getTransform().getLocalRotation(),
                this.currentFrame.sceneObject.getTransform().getLocalScale()
            )
            // await this.currentXray.save()
            
            const containerFrame = this.currentFrame.sceneObject.getComponent(ContainerFrame.getTypeName()) as ContainerFrame;
            containerFrame.enableCloseButton(true)
            // containerFrame.enableInteractables(true)
            // containerFrame.enableInteractionPlane = true
            containerFrame.closeButton.onTrigger.add(() => {
                print("TODO closing xray")
                // TODO delete xray from local storage
                // if texture uploaded, delete remote texture
            })

            this.stopCreateXray()
        }
    }

    private computeTransform(transform: Transform, pos1: vec3, pos2: vec3) {
        const centerPos = pos1.add(pos2).uniformScale(0.5);
        transform.setWorldPosition(centerPos);

        // inspired from https://github.com/Snapchat/Spectacles-Sample/blob/main/Crop/Assets/Scripts/PictureBehavior.ts

        const _diff = pos1.sub(pos2)
        this.diff.y = Math.abs(_diff.y)
        
        _diff.y = 0
        const xVec = _diff.normalize()
        const dir = pos1.sub(pos2)
        
        this.diff.x = Math.abs(dir.project(xVec).length)
        
        // because spatial frame width and height 80 (1/80 = 0.0125)
        transform.setLocalScale(this.diff.uniformScale(0.0125))

        const right = _diff.normalize()
        const forward = vec3.up().cross(right)
        transform.setWorldRotation(quat.lookAt(forward, vec3.up()))
    }

    private showNotifCurrentAnchor() {
        const notif = this.anchorNotification.sceneObject.getParent()
        if (!notif.enabled) {
            notif.enabled = true
        }
        this.anchorNotification.mainMaterial = this.currentAnchor.getChild(0).getChild(0).getComponent("Image").mainMaterial
    }

    private diff: vec3 = new vec3(0,0,1);
    private quat: quat = new quat(1,0,0,0)
    update() {
        // check for current anchor
        // foreach anchor, check the nearest one, display the current room
        if (Object.keys(this.anchors).length > 0) {
            const headPosition = this.camera.getTransform().getWorldPosition()
            let currentAnchor = this.currentAnchor
            for (const anchor of Object.values(this.anchors)) {
                if (headPosition.distance(anchor.sceneObject.getTransform().getWorldPosition())
                    < headPosition.distance(this.currentAnchor.getTransform().getWorldPosition())) {
                        currentAnchor = anchor.sceneObject
                }
            }

            if (this.currentAnchor != currentAnchor) {
                print("anchor changed!")
                this.currentAnchor = currentAnchor
                this.showNotifCurrentAnchor()
            }
        }


        if (this.firstPinchPosition) {
            const secondPos = this.secondPinchPosition ?? this.rightHand.indexTip.position

            this.computeTransform(
                this.currentFrame.sceneObject.getTransform(),
                this.firstPinchPosition,
                secondPos
            )
        }
    }


    // ignore since no spatial image for now
    public setFrameSize(val: number) {
        const containerFrame = this.currentFrame.sceneObject.getComponent(ContainerFrame.getTypeName()) as ContainerFrame;
        const lerpedValue = lerp(20, 140, val)
        containerFrame.innerSize = new vec2(lerpedValue, lerpedValue)
    }

    public setFocalPoint(val: number) {
        const spatialImage = this.currentFrame.sceneObject.getChild(0).getChild(0).getChild(1).getComponent(SpatialImage.getTypeName()) as SpatialImage;
        spatialImage.frameOffset = -lerp(10, 300, val)
    }
}
