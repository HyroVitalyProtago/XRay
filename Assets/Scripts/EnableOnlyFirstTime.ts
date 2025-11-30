@component
export class EnableOnlyFirstTime extends BaseScriptComponent {
    private KEY_PREFIX = 'OFT-'
    private store = global.persistentStorageSystem.store;

    onAwake() {
        const key = this.KEY_PREFIX + this.getSceneObject().name
        if (this.store.has(key)) {
            this.sceneObject.enabled = false
        }
        this.store.putBool(key, true)
    }
}