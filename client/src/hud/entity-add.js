var hud_1 = require("../hud");
var EntityAdd = (function () {
    function EntityAdd() {
        this.entityTypes = [
            { type: 'primitive', label: 'Primitive' },
            { type: 'surface', label: 'Surface' },
            { type: 'model', label: 'Model' }
        ];
        this.engine = hud_1.getClientEngine();
    }
    EntityAdd.prototype.addEntity = function () {
        var actuator = this.engine.actuatorRegister.get('default', this.addEntityType);
        var newEntity = actuator.construct();
        newEntity.position = this.engine.avatarController.avatar.position;
        newEntity.rotationQuaternion = this.engine.avatarController.avatar.rotationQuaternion;
        this.engine.ws.sendObject(newEntity);
        this.engine.state.editedEntity = newEntity;
    };
    EntityAdd.prototype.removeEntity = function () {
        alert('remove');
    };
    return EntityAdd;
})();
exports.EntityAdd = EntityAdd;
