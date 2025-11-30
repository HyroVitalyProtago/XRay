import {
  createClient,
  SupabaseClient,
} from 'SupabaseClient.lspkg/supabase-snapcloud';
import { setTimeout } from "SpectaclesInteractionKit.lspkg/Utils/FunctionTimingUtils";
import { until, textureUtil } from 'Scripts/Utils'

const remoteMediaModule = require('LensStudio:RemoteMediaModule');
const internetModule = require('LensStudio:InternetModule');

@component
export class MyDatabase extends BaseScriptComponent {
  @input
  @hint('Supabase Project asset from Asset Browser')
  supabaseProject: SupabaseProject;

  @input
  @hint('Storage bucket name')
  bucketName: string = 'pics';

  // @input
  // @hint("Image file path in bucket (e.g., 'images/spectacles.jpg')")
  // imageFilePath: string = 'image.png';

  // @input
  // @hint("3D model file path in bucket (e.g., 'models/rabbit.glb')")
  // modelFilePath: string = 'model.glb';

  // @input
  // @hint("Audio file path in bucket (e.g., 'audio/chill.mp3')")
  // audioFilePath: string = 'audio.mp3';

  // @input
  // @hint('Image component to display downloaded texture')
  // image: Image;

  // @input
  // @allowUndefined
  // @hint('Optional: Parent scene object for the loaded 3D model')
  // modelParent: SceneObject;

  // @input
  // @allowUndefined
  // @hint('Optional: Scene object with AudioComponent to play loaded audio')
  // audioPlayer: SceneObject;

  // @input
  // @allowUndefined
  // @hint('Optional: Material to use for 3D models')
  // defaultMaterial: Material;

  private client: SupabaseClient;
  private uid: string;

  onAwake() {
    this.createEvent('OnStartEvent').bind(() => {
      this.onStart();
    });
  }

  onStart() {
    this.initSupabase();
  }

  async initSupabase() {
    this.log('Initializing Supabase client...');

    const options = {
      realtime: {
        heartbeatIntervalMs: 2500,
      },
    };

    this.client = createClient(
      this.supabaseProject.url,
      this.supabaseProject.publicToken,
      options
    );

    if (this.client) {
      this.log('Client created successfully');
      await this.signInUser();

    //   if (this.uid) {
    // //     this.log('Running storage examples...');
    // //     await this.runStorageExamples();
    //     await this.testUpload()
    //   }
    }
  }

  public isConnected() {
    // print("isConnected?")
    return until(() => !(!this.uid))
  }

  // async testUpload() {
  //   try {
  //       const myTexture = requireAsset("./Icons/arrow_clockwise.png") as Texture;
  //       const textureString = await textureUtil.toString(myTexture, {
  //           quality: CompressionQuality.LowQuality,
  //           encoding: EncodingType.Png
  //       })
  //       this.testUploadFile('test.png', Base64.decode(textureString))
  //   } catch(err) {
  //       print(err)
  //   }
  // }

  async signInUser() {
    this.log('Signing in user...');

    const { data, error } = await this.client.auth.signInWithIdToken({
      provider: 'snapchat',
      token: '',
    });

    if (error) {
      this.log('Sign in error: ' + JSON.stringify(error));
    } else {
      const { user, session } = data;
      this.uid = JSON.stringify(user.id).replace(/^"(.*)"$/, '$1');
      this.log('User authenticated');
    }
  }

  // TODO
  // pic set/get/update/delete
  async downloadPic() {}
  async uploadPic() {}

  // async runStorageExamples() {
  //   this.log('--- STORAGE EXAMPLES START ---');

  //   await this.testListFiles();

  //   await this.delay(500);
  //   await this.testDownloadImage();

  //   if (this.modelParent && this.modelFilePath) {
  //     await this.delay(500);
  //     await this.testDownload3DModel();
  //   }

  //   if (this.audioPlayer && this.audioFilePath) {
  //     await this.delay(500);
  //     await this.testDownloadAudio();
  //   }

  //   this.log('--- STORAGE EXAMPLES COMPLETE ---');
  // }

  // async testListFiles() {
  //   this.log('Listing files in bucket: ' + this.bucketName);

  //   const { data, error } = await this.client.storage
  //     .from(this.bucketName)
  //     .list('', {
  //       limit: 10,
  //       offset: 0,
  //     });

  //   if (error) {
  //     this.log('List files failed: ' + JSON.stringify(error));
  //     return;
  //   }

  //   if (data && data.length > 0) {
  //     this.log('Found ' + data.length + ' files:');
  //     data.forEach((file, index) => {
  //       this.log(
  //         '  ' +
  //           (index + 1) +
  //           '. ' +
  //           file.name +
  //           ' (' +
  //           file.metadata.size +
  //           ' bytes)'
  //       );
  //     });
  //   } else {
  //     this.log('No files found in bucket');
  //   }
  // }

  // async testDownloadImage() {
  //   this.log('Downloading image: ' + this.imageFilePath);
  //   this.log('From bucket: ' + this.bucketName);

  //   const { data, error } = await this.client.storage
  //     .from(this.bucketName)
  //     .download(this.imageFilePath);

  //   if (error) {
  //     this.log('Download failed: ' + JSON.stringify(error));
  //     return;
  //   }

  //   if (data) {
  //     this.log('Download successful');
  //     this.log('File size: ' + data.size + ' bytes');
  //     this.log('File type: ' + data.type);

  //     this.convertBlobToTexture(data);
  //   } else {
  //     this.log('Download failed: No data returned');
  //   }
  // }

  // async testDownload3DModel() {
  //   this.log('Downloading 3D model: ' + this.modelFilePath);
  //   this.log('From bucket: ' + this.bucketName);

  //   const publicUrl = this.client.storage
  //     .from(this.bucketName)
  //     .getPublicUrl(this.modelFilePath);

  //   if (!publicUrl || !publicUrl.data || !publicUrl.data.publicUrl) {
  //     this.log('Failed to get public URL for model');
  //     return;
  //   }

  //   const modelUrl = publicUrl.data.publicUrl;
  //   this.log('Model URL: ' + modelUrl);

  //   try {
  //     const resource = (internetModule as any).makeResourceFromUrl(modelUrl);

  //     if (!resource) {
  //       this.log('Failed to create resource from URL');
  //       return;
  //     }

  //     remoteMediaModule.loadResourceAsGltfAsset(
  //       resource,
  //       (gltfAsset) => {
  //         this.log('GLTF asset loaded successfully');

  //         const gltfSettings = GltfSettings.create();
  //         gltfSettings.convertMetersToCentimeters = true;

  //         gltfAsset.tryInstantiateAsync(
  //           this.sceneObject,
  //           this.defaultMaterial,
  //           (sceneObj) => {
  //             this.log('GLTF model instantiated successfully');
  //             this.finalizeModelInstantiation(sceneObj);
  //           },
  //           (error) => {
  //             this.log('Error instantiating GLTF: ' + error);
  //           },
  //           (progress) => {
  //             if (progress === 0 || progress === 1) {
  //               this.log(
  //                 'Model load progress: ' + Math.round(progress * 100) + '%'
  //               );
  //             }
  //           },
  //           gltfSettings
  //         );
  //       },
  //       (error) => {
  //         this.log('Error loading GLTF asset: ' + error);
  //       }
  //     );
  //   } catch (err) {
  //     this.log('Error downloading 3D model: ' + err);
  //   }
  // }

  // async testDownloadAudio() {
  //   this.log('Downloading audio: ' + this.audioFilePath);
  //   this.log('From bucket: ' + this.bucketName);

  //   const publicUrl = this.client.storage
  //     .from(this.bucketName)
  //     .getPublicUrl(this.audioFilePath);

  //   if (!publicUrl || !publicUrl.data || !publicUrl.data.publicUrl) {
  //     this.log('Failed to get public URL for audio');
  //     return;
  //   }

  //   const audioUrl = publicUrl.data.publicUrl;
  //   this.log('Audio URL: ' + audioUrl);

  //   try {
  //     const resource = (internetModule as any).makeResourceFromUrl(audioUrl);

  //     if (!resource) {
  //       this.log('Failed to create resource from URL');
  //       return;
  //     }

  //     remoteMediaModule.loadResourceAsAudioTrackAsset(
  //       resource,
  //       (audioAsset) => {
  //         this.log('Audio asset loaded successfully');
  //         this.applyAudioToObject(audioAsset);
  //       },
  //       (error) => {
  //         this.log('Error loading audio asset: ' + error);
  //       }
  //     );
  //   } catch (err) {
  //     this.log('Error downloading audio: ' + err);
  //   }
  // }

  // finalizeModelInstantiation(sceneObj: SceneObject) {
  //   try {
  //     const transform = sceneObj.getTransform();

  //     if (this.modelParent) {
  //       sceneObj.setParent(this.modelParent);
  //       this.log('Model parented to: ' + this.modelParent.name);
  //       transform.setLocalPosition(vec3.zero());
  //       transform.setLocalScale(vec3.one());
  //     }

  //     this.log('3D model loaded and positioned successfully');
  //   } catch (error) {
  //     this.log('Error finalizing model: ' + error);
  //   }
  // }

  // applyAudioToObject(audioAsset: AudioTrackAsset) {
  //   try {
  //     if (!this.audioPlayer) {
  //       this.log('No audio player assigned');
  //       return;
  //     }

  //     let audioComponent = this.audioPlayer.getComponent(
  //       'Component.AudioComponent'
  //     );

  //     if (!audioComponent) {
  //       audioComponent = this.audioPlayer.createComponent(
  //         'Component.AudioComponent'
  //       );
  //       this.log('Created AudioComponent');
  //     }

  //     audioComponent.audioTrack = audioAsset;
  //     audioComponent.volume = 0.8;
  //     audioComponent.play(1);

  //     this.log('Audio applied and playing');
  //   } catch (error) {
  //     this.log('Error applying audio: ' + error);
  //   }
  // }

  // convertBlobToTexture(blob: Blob) {
  //   this.log('Converting blob to texture...');

  //   try {
  //     const dynamicResource = internetModule.makeResourceFromBlob(blob);

  //     remoteMediaModule.loadResourceAsImageTexture(
  //       dynamicResource,
  //       (texture) => {
  //         this.log('Texture created successfully');
  //         this.applyTextureToImage(texture);
  //       },
  //       (error) => {
  //         this.log('Failed to create texture: ' + error);
  //       }
  //     );
  //   } catch (err) {
  //     this.log('Error converting blob: ' + err);
  //   }
  // }

  public async downloadTextureAsBytes(filePath: string) {
    this.log('Downloading image: ' + this.uid+"/"+filePath);
    this.log('From bucket: ' + this.bucketName);

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .download(this.uid+"/"+filePath);

    if (error || !data) {
      this.log('Download failed: ' + JSON.stringify(error));
      return;
    }

    this.log('Converting blob to texture...');
    const blob = data;

    return new Promise((resolve: (bytes: Uint8Array) => void, reject) => {
      const dynamicResource = internetModule.makeResourceFromBlob(blob);
      remoteMediaModule.loadResourceAsBytes(dynamicResource, resolve, reject);
    })
  }

  public async downloadTexture(filePath: string) {
    this.log('Downloading image: ' + this.uid+"/"+filePath);
    this.log('From bucket: ' + this.bucketName);

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .download(this.uid+"/"+filePath);

    if (error || !data) {
      this.log('Download failed: ' + JSON.stringify(error));
      return;
    }

    this.log('Converting blob to texture...');
    const blob = data;

    // const encryptedBytes = blob.bytes()
    // const decryptedBytes = aesCtr.decrypt(encryptedBytes);
    // const b64_string = Base64.encode(decryptedBytes)
    // Base64.decodeTextureAsync(value: string, onSuccess: (decodedTexture: Texture) => void, onFailure: () => void): void

    return new Promise((resolve: (texture: Texture) => void, reject) => {
      const dynamicResource = internetModule.makeResourceFromBlob(blob);
      remoteMediaModule.loadResourceAsImageTexture(dynamicResource, resolve, reject);
    })
  }

  public async downloadTextureBytes(filePath:string) {
    this.log('Downloading image: ' + this.uid+"/"+filePath);
    this.log('From bucket: ' + this.bucketName);

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .download(this.uid+"/"+filePath);

    if (error || !data) {
      this.log('Download failed: ' + JSON.stringify(error));
      return;
    }

    return data.bytes()
  }

  // applyTextureToImage(texture: Texture) {
  //   if (!this.image) {
  //     this.log('No image component assigned');
  //     return;
  //   }

  //   this.log('Applying texture to image component');

  //   try {
  //     this.image.mainPass.baseTex = texture;
  //     this.log('Texture applied successfully');
  //   } catch (err) {
  //     this.log('Error applying texture: ' + err);
  //   }
  // }

  // async testGetPublicUrl(filePath: string) {
  //   this.log('Getting public URL for: ' + filePath);

  //   const { data } = this.client.storage
  //     .from(this.bucketName)
  //     .getPublicUrl(filePath);

  //   if (data && data.publicUrl) {
  //     this.log('Public URL: ' + data.publicUrl);
  //     return data.publicUrl;
  //   } else {
  //     this.log('Failed to get public URL');
  //     return null;
  //   }
  // }

  // TODO contentType, upsert
  public async uploadFile(fileName: string, fileData: any) {
    this.log('Uploading file: ' + this.uid+"/"+fileName);

    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .upload(this.uid+"/"+fileName, fileData, {
        cacheControl: '3600',
        upsert: true,//false,
        contentType: 'image/jpeg'
      });

    if (error) {
      this.log('Upload failed: ' + JSON.stringify(error));
      return;
    }

    if (data) {
      this.log('Upload successful');
      this.log('Path: ' + data.path);
    }
  }

  // async testDeleteFile(fileName: string) {
  //   this.log('Deleting file: ' + fileName);

  //   const { data, error } = await this.client.storage
  //     .from(this.bucketName)
  //     .remove([fileName]);

  //   if (error) {
  //     this.log('Delete failed: ' + JSON.stringify(error));
  //     return;
  //   }

  //   if (data) {
  //     this.log('Delete successful');
  //   }
  // }

  // private delay(ms: number): Promise<void> {
  //   return new Promise((resolve) => {
  //     const delayedEvent = this.createEvent('DelayedCallbackEvent');
  //     delayedEvent.bind(() => {
  //       resolve();
  //     });
  //     delayedEvent.reset(ms / 1000);
  //   });
  // }

  onDestroy() {
    if (this.client) {
      this.client.removeAllChannels();
    }
  }

  private log(message: string) {
    print('[StorageExample] ' + message);
  }
}