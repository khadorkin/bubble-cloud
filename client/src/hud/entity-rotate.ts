import {ConsoleController} from "../components/ConsoleController";
import {getClientEngine} from "../hud";
import {ClientEngine} from "../components/ClientEngine";
import Matrix = BABYLON.Matrix;
import Vector3 = BABYLON.Vector3;
import Quaternion = BABYLON.Quaternion;

export class EntityRotate {
    engine: ClientEngine;

    constructor() {
        this.engine = getClientEngine();
    }

    rotate(rotationAxis: Vector3) {
        var entity = this.engine.state.getEditedEntity();
        if (entity) {

            var avatarRotationMatrix = new Matrix();
            this.engine.avatarController.avatar.rotationQuaternion.toRotationMatrix(avatarRotationMatrix);

            /*var stepDirection = Vector3.TransformCoordinates(translation.scale(this.engine.grid.positionStep * 1.4), rotationMatrix);
             entity.position.copyFrom(this.engine.grid.positionSnap(entity.position.add(stepDirection)));*/

            var avatarRotationAxis = Vector3.TransformCoordinates(rotationAxis, avatarRotationMatrix);

            var localRotationAxis: Vector3;
            if (entity.pid) {
                var mesh = this.engine.renderer.scene.getMeshByName(entity.pid);
                var worldMatrix = mesh.getWorldMatrix();
                var worldMatrixInverted = new Matrix();
                worldMatrix.invertToRef(worldMatrixInverted);

                var entityWorldPosition = BABYLON.Vector3.TransformCoordinates(new Vector3(0,0,0), worldMatrix);
                entityWorldPosition = entityWorldPosition.add(avatarRotationAxis);
                localRotationAxis = BABYLON.Vector3.TransformCoordinates(entityWorldPosition, worldMatrixInverted);
            } else {
                localRotationAxis = avatarRotationAxis;
            }

            var currentRotationMatrix = new Matrix();
            entity.rotationQuaternion.toRotationMatrix(currentRotationMatrix);

            var rotationQuaternion = Quaternion.RotationAxis(localRotationAxis, Math.PI * this.engine.grid.rotationStep / 180);
            var rotationMatrix = new Matrix();
            rotationQuaternion.toRotationMatrix(rotationMatrix);
            entity.rotationQuaternion.fromRotationMatrix(currentRotationMatrix.multiply(rotationMatrix));
            entity.rotationQuaternion.normalize();
            this.engine.ws.sendObject(entity);
        }

    }

    reset(): void {
        var entity = this.engine.state.getEditedEntity();
        if (entity) {
            entity.rotationQuaternion = new Quaternion();
            this.engine.ws.sendObject(entity);
        }
    }

    pitchUp(): void {
        this.rotate(new Vector3(-1, 0, 0));
    }

    pitchDown(): void {
        this.rotate(new Vector3(1, 0, 0));
    }

    yawLeft(): void {
        this.rotate(new Vector3(0, -1, 0));
    }

    yawRight(): void {
        this.rotate(new Vector3(0, 1, 0));
    }

    rollRight(): void {
        this.rotate(new Vector3(0, 0, -1));
    }

    rollLeft(): void {
        this.rotate(new Vector3(0, 0, 1));
    }

}