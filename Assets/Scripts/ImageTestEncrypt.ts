import { cryptoUtil, textureUtil, until } from "Scripts/Utils";
import { MyDatabase } from "Scripts/MyDatabase";
import { TaskManager } from "Scripts/TaskManager";

const remoteMediaModule = require('LensStudio:RemoteMediaModule');
const internetModule = require('LensStudio:InternetModule');

@component
export class ImageTestEncrypt extends BaseScriptComponent {
    private store = global.persistentStorageSystem.store;
    private cameraModule = require('LensStudio:CameraModule');
    @input database: MyDatabase;
    @input waitingTexture: Texture;
    @input testInEditor = false

    onAwake() {
        this.createEvent('OnStartEvent').bind(() => {
            this.onStart();
        });
    }

    async onStart() {
        if (global.deviceInfoSystem.isEditor() && !this.testInEditor) {
            print("[ImageTestEncrypt] do not test in editor...")
            return
        }

        print("[ImageTestEncrypt] start")
        
        // await this.tryEncryptImageTexture()
        // await this.tryEncryptImageTextureAndDatabase()
        // await this.tryEncryptImageTextureAndDatabaseAndStorage()
        
        // this.tryWithImageRequest()
        // this.tryWithCameraRequest()
        this.tryWithCoroutine()
    }

    // successful 🎉
    async tryEncryptImageTexture() {
        try {
            const image = this.sceneObject.getComponent('Image')
            const texture = image.mainMaterial.mainPass.baseTex

            const key = cryptoUtil.generateKey()
            const counter = 5

            print("[ImageTestEncrypt] texture to string")
            const textureString = await textureUtil.toString(texture, {
                quality: CompressionQuality.HighQuality,
                encoding: EncodingType.Jpg
            })

            print("[ImageTestEncrypt] texture string to bytes")
            const bytes = Base64.decode(textureString)

            print("[ImageTestEncrypt] bytes encryption")
            const encryptedBytes = cryptoUtil.encrypt(bytes, key, counter)

            print("[ImageTestEncrypt] bytes decryption")
            const decryptedBytes = cryptoUtil.decrypt(encryptedBytes, key, counter)

            print("[ImageTestEncrypt] bytes to string")
            const encodedString = Base64.encode(decryptedBytes)

            print("[ImageTestEncrypt] string to texture")
            const newTexture = await textureUtil.fromString(encodedString)

            print("[ImageTestEncrypt] set material texture")
            image.mainMaterial.mainPass.baseTex = newTexture
        } catch(err) {
            print("[ImageTestEncrypt] error:"+err)
        }
    }

    // successful 🎉
    async tryEncryptImageTextureAndDatabase() {
        try {
            const image = this.sceneObject.getComponent('Image')
            const texture = image.mainMaterial.mainPass.baseTex
            image.mainMaterial.mainPass.baseTex = this.waitingTexture

            const fileName = 'test.jpeg'
            const key = cryptoUtil.generateKey()
            const counter = 5

            print("[ImageTestEncrypt] texture to string")
            const textureString = await textureUtil.toString(texture, {
                quality: CompressionQuality.HighQuality,
                encoding: EncodingType.Jpg
            })

            print("[ImageTestEncrypt] texture string to bytes")
            const bytes = Base64.decode(textureString)

            print("[ImageTestEncrypt] bytes encryption")
            const encryptedBytes = cryptoUtil.encrypt(bytes, key, counter)

            print("[ImageTestEncrypt] wait database connected")
            await this.database.isConnected()

            print("[ImageTestEncrypt] send encrypted file")
            await this.database.uploadFile(fileName, encryptedBytes)

            print("[ImageTestEncrypt] download encrypted file")
            const encryptedTextureBytes = await this.database.downloadTextureBytes(fileName)

            print("[ImageTestEncrypt] bytes decryption")
            const decryptedBytes = cryptoUtil.decrypt(encryptedTextureBytes, key, counter)

            print("[ImageTestEncrypt] bytes to string")
            const encodedString = Base64.encode(decryptedBytes)

            print("[ImageTestEncrypt] string to texture")
            const newTexture = await textureUtil.fromString(encodedString)

            print("[ImageTestEncrypt] set material texture")
            image.mainMaterial.mainPass.baseTex = newTexture
        } catch(err) {
            print("[ImageTestEncrypt] error:"+err)
        }
    }

    // successful 🎉
    async tryEncryptImageTextureAndDatabaseAndStorage() {
        try {
            const image = this.sceneObject.getComponent('Image')
            const texture = image.mainMaterial.mainPass.baseTex
            image.mainMaterial.mainPass.baseTex = this.waitingTexture

            const fileName = 'test.jpeg'

            let key
            if (this.store.has('cryptoKey')) {
                this.log("load key from local store")
                key = this.store.getUint8Array('cryptoKey')
            } else {
                this.log("create key in local store")
                key = cryptoUtil.generateKey()
                this.store.putUint8Array('cryptoKey', key)
            }

            let counter
            if (this.store.has('cryptoCounter')) {
                this.log("load counter from local store")
                counter = this.store.getInt('cryptoCounter')
            } else {
                this.log("create counter in local store")
                counter = 5
                this.store.putInt('cryptoCounter', counter)
            }

            this.log("texture to string")
            const textureString = await textureUtil.toString(texture, {
                quality: CompressionQuality.HighQuality,
                encoding: EncodingType.Jpg
            })

            this.log("texture string to bytes")
            const bytes = Base64.decode(textureString)

            this.log("bytes encryption")
            const encryptedBytes = cryptoUtil.encrypt(bytes, key, counter)

            this.log("wait database connected")
            await this.database.isConnected()

            this.log("send encrypted file")
            await this.database.uploadFile(fileName, encryptedBytes)

            this.log("download encrypted file")
            const encryptedTextureBytes = await this.database.downloadTextureBytes(fileName)

            this.log("get key and counter in local store")
            const cryptoKey = this.store.getUint8Array('cryptoKey')
            const cryptoCounter = this.store.getInt('cryptoCounter')

            this.log("bytes decryption")
            const decryptedBytes = cryptoUtil.decrypt(encryptedTextureBytes, cryptoKey, cryptoCounter)

            this.log("bytes to string")
            const encodedString = Base64.encode(decryptedBytes)

            this.log("string to texture")
            const newTexture = await textureUtil.fromString(encodedString)

            this.log("set material texture")
            image.mainMaterial.mainPass.baseTex = newTexture
        } catch(err) {
            this.log("error:"+err)
        }
    }

    // 🙅‍♂️ TODO Reddit open thread about image request
    // seems to not work also with remoteMediaModule.loadResourceAsBytes
    /* high resolution 3200x2400 */
    async tryWithImageRequest() {
        this.log("create image request")
        const imageRequest = CameraModule.createImageRequest();

        this.log("capture image")
        const imageFrame = await this.cameraModule.requestImage(imageRequest);
        const camTex = imageFrame.texture

        this.tryWithCameraModule(camTex)
    }

    // successful 🎉
    // low resolution: 1008x756 by default
    async tryWithCameraRequest() {

        if (global.deviceInfoSystem.isEditor()) {
            print("stop trying in editor...")
            return
        }

        const cameraRequest = CameraModule.createCameraRequest();
        cameraRequest.cameraId = CameraModule.CameraId.Default_Color;
        // global.deviceInfoSystem.isEditor() ? 352 : 756
        // cameraRequest.imageSmallerDimension = 1512

        const cameraTexture = this.cameraModule.requestCamera(cameraRequest);
        const cameraTextureProvider = cameraTexture.control as CameraTextureProvider;

        // do not get directly cameraTexture as its not loaded (dimensions: 0x0)
        // const camTex = cameraTexture as Texture
        
        const onNewFrame = cameraTextureProvider.onNewFrame;
        let waitCameraTexture = true
        let camTex
        const registration = onNewFrame.add((cameraFrame) => {
            // cameraFrame.timestampSeconds
            if (waitCameraTexture) {
                camTex = cameraTexture
                waitCameraTexture = false
            }
        });
        await until(() => !waitCameraTexture)
        onNewFrame.remove(registration)

        print(`${camTex.getWidth()}x${camTex.getHeight()}`)

        this.tryWithCameraModule(camTex)
    }

    async tryWithCameraModule(camTex: Texture) {
        try {
            const image = this.sceneObject.getComponent('Image')
            const texture = camTex//image.mainMaterial.mainPass.baseTex
            image.mainMaterial.mainPass.baseTex = this.waitingTexture

            const fileName = 'cameraFrame.jpeg'

            let key
            if (this.store.has('cryptoKey')) {
                this.log("load key from local store")
                key = this.store.getUint8Array('cryptoKey')
            } else {
                this.log("create key in local store")
                key = cryptoUtil.generateKey()
                this.store.putUint8Array('cryptoKey', key)
            }

            let counter
            if (this.store.has('cryptoCounter')) {
                this.log("load counter from local store")
                counter = this.store.getInt('cryptoCounter')
            } else {
                this.log("create counter in local store")
                counter = 5
                this.store.putInt('cryptoCounter', counter)
            }

            this.log("texture to string")
            const textureString = await textureUtil.toString(texture, {
                quality: CompressionQuality.HighQuality,
                encoding: EncodingType.Jpg
            })

            this.log("texture string to bytes")
            const bytes = Base64.decode(textureString)

            this.log("bytes encryption")
            const encryptedBytes = cryptoUtil.encrypt(bytes, key, counter)

            this.log("wait database connected")
            await this.database.isConnected()

            this.log("send encrypted file")
            await this.database.uploadFile(fileName, encryptedBytes)

            this.log("download encrypted file")
            const encryptedTextureBytes = await this.database.downloadTextureBytes(fileName)

            this.log("get key and counter in local store")
            const cryptoKey = this.store.getUint8Array('cryptoKey')
            const cryptoCounter = this.store.getInt('cryptoCounter')

            this.log("bytes decryption")
            const decryptedBytes = cryptoUtil.decrypt(encryptedTextureBytes, cryptoKey, cryptoCounter)

            this.log("bytes to string")
            const encodedString = Base64.encode(decryptedBytes)

            this.log("string to texture")
            const newTexture = await textureUtil.fromString(encodedString)

            this.log("set material texture")
            image.mainMaterial.mainPass.baseTex = newTexture
        } catch(err) {
            this.log("error:"+err)
        }
    }

    // TODO try with key/counter in json


    async tryWithCoroutine() {
        const taskManager = TaskManager.getInstance()

        const cameraRequest = CameraModule.createCameraRequest();
        cameraRequest.cameraId = CameraModule.CameraId.Default_Color;
        // global.deviceInfoSystem.isEditor() ? 352 : 756
        // cameraRequest.imageSmallerDimension = 1512

        const cameraTexture = this.cameraModule.requestCamera(cameraRequest);
        const cameraTextureProvider = cameraTexture.control as CameraTextureProvider;

        // do not get directly cameraTexture as its not loaded (dimensions: 0x0)
        // const camTex = cameraTexture as Texture
        
        const onNewFrame = cameraTextureProvider.onNewFrame;
        let waitCameraTexture = true
        let camTex
        const registration = onNewFrame.add((cameraFrame) => {
            // cameraFrame.timestampSeconds
            if (waitCameraTexture) {
                camTex = cameraTexture
                waitCameraTexture = false
            }
        });
        await until(() => !waitCameraTexture)
        onNewFrame.remove(registration)

        print(`${camTex.getWidth()}x${camTex.getHeight()}`)

        try {
            const image = this.sceneObject.getComponent('Image')
            const texture = camTex//image.mainMaterial.mainPass.baseTex
            image.mainMaterial.mainPass.baseTex = this.waitingTexture

            const fileName = 'cameraFrame.jpeg'

            let key
            if (this.store.has('cryptoKey')) {
                this.log("load key from local store")
                key = this.store.getUint8Array('cryptoKey')
            } else {
                this.log("create key in local store")
                key = cryptoUtil.generateKey()
                this.store.putUint8Array('cryptoKey', key)
            }

            let counter
            if (this.store.has('cryptoCounter')) {
                this.log("load counter from local store")
                counter = this.store.getInt('cryptoCounter')
            } else {
                this.log("create counter in local store")
                counter = 5
                this.store.putInt('cryptoCounter', counter)
            }

            this.log("texture to string")
            const textureString = await textureUtil.toString(texture, {
                quality: CompressionQuality.HighQuality,
                encoding: EncodingType.Jpg
            })

            this.log("texture string to bytes")
            const bytes = Base64.decode(textureString)

            this.log("task bytes encryption")
            const encryptedBytes = await taskManager.runTask(cryptoUtil.encryptTask(bytes, key, counter))

            // this.log("bytes encryption")
            // const encryptedBytes = cryptoUtil.encrypt(bytes, key, counter)

            this.log("wait database connected")
            await this.database.isConnected()

            this.log("send encrypted file")
            await this.database.uploadFile(fileName, encryptedBytes)

            this.log("download encrypted file")
            const encryptedTextureBytes = await this.database.downloadTextureBytes(fileName)

            this.log("task bytes decryption")
            const decryptedBytes = await taskManager.runTask(cryptoUtil.decryptTask(encryptedTextureBytes, key, counter)) as Uint8Array

            // this.log("bytes decryption")
            // const decryptedBytes = cryptoUtil.decrypt(encryptedTextureBytes, cryptoKey, cryptoCounter)

            this.log("bytes to string")
            const encodedString = Base64.encode(decryptedBytes)

            this.log("string to texture")
            const newTexture = await textureUtil.fromString(encodedString)

            this.log("set material texture")
            image.mainMaterial.mainPass.baseTex = newTexture
        } catch(err) {
            this.log("error:"+err)
        }
    }

    private log(msg) {
        print('[ITE] '+msg)
    }
}
