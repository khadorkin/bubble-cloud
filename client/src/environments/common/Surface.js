var ClientEntity_1 = require("../../components/ClientEntity");
var Surface = (function () {
    function Surface() {
        this.repository = 'default';
        this.environment = 'common';
        this.type = 'surface';
    }
    Surface.prototype.construct = function () {
        var newEntity = new ClientEntity_1.PrimitiveEntity();
        newEntity.newId();
        newEntity.repo = this.repository;
        newEntity.type = this.type;
        newEntity.dynamic = true;
        return newEntity;
    };
    Surface.prototype.add = function (engine, entity) {
        var scene = engine.renderer.scene;
        var mesh = this.createSurface(entity.id, scene);
        mesh.renderingGroupId = 1;
        mesh.material = engine.materialRegister.get("default", "rock");
    };
    Surface.prototype.remove = function (engine, entity) {
        var scene = engine.renderer.scene;
        var mesh = scene.getMeshByName(entity.id);
        if (mesh) {
            scene.removeMesh(mesh);
        }
    };
    Surface.prototype.update = function (engine, entity) {
    };
    Surface.prototype.createSurface = function (name, scene) {
        var ni = 20;
        var nj = 20;
        var li = 4;
        var lj = 4;
        var paths = [];
        for (var jj = 0; jj < nj; jj++) {
            var path = [];
            for (var ii = 0; ii < ni; ii++) {
                var i = ii / ni;
                var j = jj / nj;
                var x = li * i;
                var y = lj * j;
                var z = Math.cos(2 * Math.PI * (i - j)) / 5;
                path.push(new BABYLON.Vector3(x, y, z));
            }
            paths.push(path);
        }
        return BABYLON.Mesh.CreateRibbon(name, paths, false, false, 0, scene, false, BABYLON.Mesh.FRONTSIDE);
    };
    return Surface;
})();
exports.Surface = Surface;
