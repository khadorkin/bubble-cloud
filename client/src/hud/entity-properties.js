var hud_1 = require("../hud");
var Matrix = BABYLON.Matrix;
var EditorState_1 = require("../components/EditorState");
var EntityProperties = (function () {
    function EntityProperties() {
        this.lastChangeTimeMillis = 0;
        this.engine = hud_1.getClientEngine();
        this.state = this.engine.state;
        this.state.addClientStateListener(this);
    }
    EntityProperties.prototype.selectParent = function () {
        this.state.editorState = EditorState_1.EditorState.PARENT_SET;
        document.body.style.cursor = 'crosshair';
    };
    EntityProperties.prototype.clearParent = function () {
        if (this.currentEditedEntity.pid) {
            var mesh = this.engine.renderer.scene.getMeshByName(this.currentEditedEntity.pid);
            if (mesh) {
                var worldMatrix = mesh.getWorldMatrix();
                var worldMatrixInverted = new Matrix();
                worldMatrix.invertToRef(worldMatrixInverted);
                var entityWorldPosition = BABYLON.Vector3.TransformCoordinates(this.currentEditedEntity.position, worldMatrix);
                this.currentEditedEntity.position = entityWorldPosition;
                var localRotationMatrix = new Matrix();
                this.currentEditedEntity.rotationQuaternion.toRotationMatrix(localRotationMatrix);
                this.currentEditedEntity.rotationQuaternion.fromRotationMatrix(localRotationMatrix.multiply(worldMatrix));
                this.currentEditedEntity.rotationQuaternion.normalize();
            }
        }
        this.currentEditedEntity.pid = null;
        this.currentEditedEntity.prid = null;
        this.engine.ws.sendObject(this.currentEditedEntity);
    };
    EntityProperties.prototype.stateChange = function () {
        var editedEntity = this.state.getEditedEntity();
        if (!editedEntity || (this.currentEditedEntity && editedEntity.id !== this.currentEditedEntity.id)) {
            this.lastChangeTimeMillis = 0;
        }
        if (editedEntity) {
            if (Date.now() - this.lastChangeTimeMillis < 1000) {
                return;
            }
            this.name = editedEntity.name;
            this.type = editedEntity.type;
            this.id = editedEntity.id;
            this.rid = editedEntity.rid;
            this.pid = editedEntity.pid;
            this.prid = editedEntity.prid;
            if (this.pid && this.engine.model.remoteIdLocalIdMap[this.pid] && this.engine.model.entities[this.engine.model.remoteIdLocalIdMap[this.pid]]) {
                this.parent = this.engine.model.entities[this.engine.model.remoteIdLocalIdMap[this.pid]].name;
            }
            else {
                this.parent = null;
            }
            this.dynamic = editedEntity.dynamic;
            this.external = editedEntity.external;
            this.removed = editedEntity.removed;
            this.core = editedEntity.core;
            this.px = editedEntity.position.x;
            this.py = editedEntity.position.y;
            this.pz = editedEntity.position.z;
            this.rx = editedEntity.rotationQuaternion.x;
            this.ry = editedEntity.rotationQuaternion.y;
            this.rz = editedEntity.rotationQuaternion.z;
            this.rw = editedEntity.rotationQuaternion.w;
            this.sx = editedEntity.scaling.x;
            this.sy = editedEntity.scaling.y;
            this.sz = editedEntity.scaling.z;
            this.currentEditedEntity = editedEntity;
        }
        else {
            this.name = null;
            this.type = null;
            this.id = null;
            this.rid = null;
            this.pid = null;
            this.prid = null;
            this.parent = null;
            this.dynamic = null;
            this.external = null;
            this.removed = null;
            this.core = null;
            this.px = null;
            this.py = null;
            this.pz = null;
            this.rx = null;
            this.ry = null;
            this.rz = null;
            this.rw = null;
            this.sx = null;
            this.sy = null;
            this.sz = null;
            this.currentEditedEntity = null;
        }
    };
    EntityProperties.prototype.onBlur = function () {
        if (this.currentEditedEntity) {
            this.currentEditedEntity.name = this.name;
            this.currentEditedEntity.position.x = Number('' + this.px);
            this.currentEditedEntity.position.y = Number('' + this.py);
            this.currentEditedEntity.position.z = Number('' + this.pz);
            this.currentEditedEntity.scaling.x = Number('' + this.sx);
            this.currentEditedEntity.scaling.y = Number('' + this.sy);
            this.currentEditedEntity.scaling.z = Number('' + this.sz);
            this.lastChangeTimeMillis = Date.now();
            this.engine.ws.sendObject(this.currentEditedEntity);
        }
    };
    return EntityProperties;
})();
exports.EntityProperties = EntityProperties;
