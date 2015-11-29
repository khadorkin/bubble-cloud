import Vector3 = BABYLON.Vector3;
import Quaternion = BABYLON.Quaternion;
var entityIdCounter = 0;

/**
 * Entity value object.
 */
export class ClientEntity {
    id: string;
    oid: string; // original ID
    _id: string; // unique persistent ID

    type: string; // The entity type
    repo: string; // The repository of the entity type

    position: Vector3 = new Vector3(0,0,0);
    rotationQuaternion: Quaternion = new Quaternion();
    scaling: Vector3 = new Vector3(0,0,0);

    interpolatedPosition: Vector3;
    interpolatorPosition: Vector3;
    interpolatorRotationQuaternion: Quaternion;
    interpolatedRotationQuaternion: Quaternion;

    core: boolean = false;
    removed: boolean = false;
    external: boolean = false;
    dynamic: boolean = false;

    newId() {
        entityIdCounter++;
        this.id = '' + entityIdCounter;
    }
}

export class CoreEntity extends ClientEntity {
    private roleMembers: {[key: string]: string[]} = {};

    grantRole(role : string, userId: string): void {
        if (!this.roleMembers[role]) {
            this.roleMembers[role] = [];
        }
        this.roleMembers[role].push(userId);
    }

    hasRole(role: string, userId: string): boolean {
        if (role == 'admin' && !this.roleMembers['admin']) {
            return true;
        }
        if (!this.roleMembers[role]) {
            return false;
        }
        for (var userIdCandidate of this.roleMembers[role]) {
            if (userIdCandidate == userId) {
                return true;
            }
        }
        return false;
    }

    revokeRole(role: string, userId: string): void {
        if (!this.roleMembers[role]) {
            return;
        }
        this.roleMembers[role].splice(this.roleMembers[role].indexOf(userId), 1);
    }

}