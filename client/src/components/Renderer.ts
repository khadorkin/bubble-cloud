import {ClientModel} from "./ClientModel";
import {KeyboardReader} from "./KeyboardReader";
import {ClientEngine} from "./ClientEngine";
import {ClientEntity} from "./ClientEntity";

import Engine = BABYLON.Engine;
import Scene = BABYLON.Scene;
import TargetCamera = BABYLON.TargetCamera;
import Mesh = BABYLON.Mesh;
import Color3 = BABYLON.Color3;
import Vector3 = BABYLON.Vector3;
import HemisphericLight = BABYLON.HemisphericLight;
import Matrix = BABYLON.Matrix;
import {Actuator} from "./Actuator";
import AbstractMesh = BABYLON.AbstractMesh;

export class Renderer {

    model: ClientModel;
    keyboardReader: KeyboardReader;

    clientEngine: ClientEngine;
    engine: Engine;
    scene: Scene;
    camera: TargetCamera;

    avatarShape: AbstractMesh;
    avatarAttachments: ClientEntity[] = [];
    orphans: {[key: string]: string[]} = {};

    lastLoopTimeMillis: number = new Date().getTime();

    constructor(clientEngine: ClientEngine, model: ClientModel, keyboardInputController: KeyboardReader) {
        this.clientEngine = clientEngine;
        this.model = model;
        this.keyboardReader = keyboardInputController;
        this.model.setOnAdd((entity: ClientEntity) => {
            this.onAdd(entity);
        });
        this.model.setOnUpdate((entity: ClientEntity) => {
            this.onUpdate(entity);
        });
        this.model.setOnRemove((entity: ClientEntity) => {
            this.onRemove(entity);
        });
    }

    onAdd(entity: ClientEntity) {
        var actuator: Actuator = this.clientEngine.actuatorRegister.get(entity.repo, entity.type);

        if (actuator) {
            actuator.add(this.clientEngine, entity);
            console.log("entity: " + entity.id + " (" + entity.rid + ") - Added entity type " + entity.repo + " / " + entity.type + " dyn: " + entity.dynamic + " ext: " + entity.external);
        } else {
            var newShape = Mesh.CreateBox(entity.id, 1, this.scene);
            newShape.position = entity.interpolatedPosition;
            newShape.rotationQuaternion = entity.interpolatedRotationQuaternion;
            console.log("entity: " + entity.id + " (" + entity.rid + ") - Unknown entity type " + entity.repo + " / " + entity.type);
        }

        var shape = this.scene.getMeshByName(entity.id);
        if (shape) {
            this.updateParentRelationship(entity, shape);
            shape.position = entity.interpolatedPosition;
            shape.rotationQuaternion = entity.interpolatedRotationQuaternion;
            if (entity.scaling && (entity.scaling.x != 0 || entity.scaling.y != 0 || entity.scaling.z != 0)) {
                shape.scaling = entity.scaling;
            }
        }
        if (entity.id == this.clientEngine.avatarController.avatar.id) {
            this.avatarShape = shape; // Mesh.CreateBox(entity.id, 1, this.scene);
            //shape.visibility = 0;
        }

        // If entity is edited locally then notify state listeners.
        var editedEntity = this.clientEngine.state.getEditedEntity();
        if (editedEntity && editedEntity.id === entity.id) {
            this.clientEngine.state.stateChanged();
        }
    }

    onUpdate(entity: ClientEntity) {
        // Update others than avatar which is locally controlled in render loop to eliminate lag
        if (entity.id == this.clientEngine.avatarController.avatar.id) {
            return;
        }

        // Do not update avatar attachments
        if (this.avatarAttachments.indexOf(entity) >= 0) {
            return;
        }

        var shape = this.scene.getMeshByName(entity.id);
        if (!shape) {
            console.log("entity: " + entity.id + " (" + entity.rid + ") - Updated entity not added yet: " + entity.repo + "/" + entity.type);
            return;
        }

        this.updateParentRelationship(entity, shape);
        shape.position = entity.interpolatedPosition;
        shape.rotationQuaternion = entity.interpolatedRotationQuaternion;
        if (entity.scaling && (entity.scaling.x != 0 || entity.scaling.y != 0 || entity.scaling.z != 0)) {
            shape.scaling = entity.scaling;
        }

        var actuator:Actuator = this.clientEngine.actuatorRegister.get(entity.repo, entity.type);
        if (actuator) {
            actuator.update(this.clientEngine, entity);
        }

        // If entity is edited locally then notify state listeners.
        var editedEntity = this.clientEngine.state.getEditedEntity();
        if (editedEntity && editedEntity.id === entity.id) {
            this.clientEngine.state.stateChanged();
        }
    }

    onRemove(entity: ClientEntity) {
        var actuator:Actuator = this.clientEngine.actuatorRegister.get(entity.repo, entity.type);
        if (actuator) {
            actuator.remove(this.clientEngine, entity);
            console.log("entity: " + entity.id + " (" + entity.rid + ") - Removed entity type " + entity.repo + "/" + entity.type);
        } else {
            var shape = this.scene.getMeshByName(entity.id);
            if (shape) {
                this.scene.removeMesh(shape);
            }
        }

        // If entity is edited locally then notify state listeners.
        var editedEntity = this.clientEngine.state.getEditedEntity();
        if (editedEntity && editedEntity.id === entity.id) {
            this.clientEngine.state.stateChanged();
        }
    }

    updateParentRelationship(entity: ClientEntity, shape:AbstractMesh) {
        if (entity.pid && entity.id != entity.pid) {
            var parentShape = this.scene.getMeshByName(entity.pid);
            if (!parentShape) {
                if (!this.orphans[entity.pid]) {
                    this.orphans[entity.pid] = [];
                }
                this.orphans[entity.pid].push(entity.id);
                console.log('Renderer added orphan: ' + entity.id);
            } else {
                if (!shape.parent) {
                    shape.parent = parentShape;
                    console.log('Renderer set parent: ' + entity.id);
                } else {
                    if (shape.parent !== parentShape) {
                        shape.parent = parentShape;
                        console.log('Renderer changed parent: ' + entity.id);
                    }
                }
            }
        } else {
            if (shape.parent) {
                shape.parent = null;
                console.log('Renderer cleared parent: ' + entity.id);
            }
        }
        if (this.orphans[entity.id] && this.orphans[entity.id].length > 0) {
            for (var childId of this.orphans[entity.id]) {
                var childEntity = this.clientEngine.model.entities[childId];
                if (childEntity) {
                    var childShape = this.scene.getMeshByName(childId);
                    if (childShape) {
                        this.updateParentRelationship(childEntity, childShape);
                        console.log('Renderer set parent for orphan: ' + childId);
                    }
                }
            }
            this.orphans[entity.id] = [];
        }
    }

    startup() {
        // Get the canvas element from our HTML above
        var canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("renderCanvas");

        if (!canvas) {
            return;
        }

        if (Engine.isSupported()) {
            // Load the BABYLON 3D engine
            this.engine = new Engine(canvas, true);
            // This begins the creation of a function that we will 'call' just after it's built
            var createScene = () => {
                this.scene = new Scene(this.engine);
                this.scene.autoClear = false;

                this.camera = new TargetCamera("AvatarCamera", new Vector3(0, 5, -10), this.scene);
                this.camera.setTarget(Vector3.Zero());

                var postProcess = new BABYLON.FxaaPostProcess("fxaa", 2.0, this.camera, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, this.engine, true);

                // The sky
                /*
                var skybox = BABYLON.Mesh.CreateSphere("skyBox", 10.0, 1000.0, this.scene);
                BABYLON.Effect.ShadersStore.gradientVertexShader = "precision mediump float;attribute vec3 position;attribute vec3 normal;attribute vec2 uv;uniform mat4 worldViewProjection;varying vec4 vPosition;varying vec3 vNormal;void main(){vec4 p = vec4(position,1.);vPosition = p;vNormal = normal;gl_Position = worldViewProjection * p;}";
                BABYLON.Effect.ShadersStore.gradientPixelShader = "precision mediump float;uniform mat4 worldView;varying vec4 vPosition;varying vec3 vNormal;uniform float offset;uniform vec3 topColor;uniform vec3 bottomColor;void main(void){float h = normalize(vPosition+offset).y;gl_FragColor = vec4(mix(bottomColor,topColor,max(pow(max(h,0.0),0.6),0.0)),1.0);}";
                var shader = new BABYLON.ShaderMaterial("gradient", this.scene, "gradient", {});
                shader.setFloat("offset", 10);
                shader.setColor3("topColor", BABYLON.Color3.FromInts(0,119,255));
                shader.setColor3("bottomColor", BABYLON.Color3.FromInts(240,240, 255));
                shader.backFaceCulling = false;
                skybox.material = shader;

                // The terrain
                var groundMaterial = new BABYLON.StandardMaterial("ground", this.scene);
                groundMaterial.diffuseTexture = new BABYLON.Texture("images/height-maps/stewart-island.png", this.scene);
                var ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", "images/height-maps/stewart-island.png", 200, 200, 250, 0, 10, this.scene, false);
                ground.material = groundMaterial;
                */

                return this.scene;

            };  // End of createScene function

            // Now, call the createScene function that you just finished creating
            this.scene = createScene();

            // Register a render loop to repeatedly render the scene
            this.engine.runRenderLoop(() => {
                this.model.interpolate();
                this.scene.render();

                var timeMillis = (new Date).getTime();
                var timeDeltaMillis : number = timeMillis - this.lastLoopTimeMillis;

                if (this.clientEngine.running) {
                    this.clientEngine.avatarController.renderLoop(timeMillis, timeDeltaMillis);
                    if (this.avatarShape) {
                        this.avatarShape.position = this.clientEngine.avatarController.avatar.position;
                        this.avatarShape.rotationQuaternion = this.clientEngine.avatarController.avatar.rotationQuaternion;

                        var rotationMatrix = new Matrix();
                        this.avatarShape.rotationQuaternion.toRotationMatrix(rotationMatrix);
                        var cameraDirection = Vector3.TransformCoordinates(new Vector3(0, 2, -10), rotationMatrix);
                        this.camera.position = cameraDirection.add(this.avatarShape.position);
                        this.camera.setTarget(this.avatarShape.position);

                        for (var avatarAttachment of this.avatarAttachments) {
                            var actuator: Actuator = this.clientEngine.actuatorRegister.get(avatarAttachment.repo, avatarAttachment.type);
                            actuator.update(this.clientEngine, avatarAttachment);
                        }
                    }
                }

                this.lastLoopTimeMillis = timeMillis;

            });

            // Watch for browser/canvas resize events
            window.addEventListener("resize", () => {
                this.engine.resize();
            });
        }
    }

    shutdown() {
        this.engine.stopRenderLoop();
    }

}