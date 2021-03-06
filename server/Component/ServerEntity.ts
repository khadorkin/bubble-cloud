import {Entity} from "../../client/src/components/Entity";
/**
 * Vector3 value object.
 */
export class Vector3 {
    x:number = 0;
    y:number = 0;
    z:number = 0;
}

/**
 * Quaternion value object.
 */
export class Quaternion {
    x:number = 0;
    y:number = 0;
    z:number = 0;
    w:number = 1;
}

/**
 * Entity value object.
 */
export class ServerEntity implements Entity {
    id: string; // current ID
    rid: string; // remote ID received
    pid: string; // parent ID
    prid: string; // parent remote ID
    _id: string; // unique persistent ID

    name: string;
    type: string; // The entity type
    repo: string; // The repository of the entity type

    core: boolean = false;
    removed: boolean = false;
    external: boolean = false;
    dynamic: boolean = false;

    owner: string;

    position: Vector3 = new Vector3();
    rotationQuaternion: Quaternion = new Quaternion();
    scaling: Vector3 = new Vector3();

    roleMembers: {[key: string]: string[]} = {};

    constructor() {
        this.scaling.x = 1;
        this.scaling.y = 1;
        this.scaling.z = 1;
    }
}
