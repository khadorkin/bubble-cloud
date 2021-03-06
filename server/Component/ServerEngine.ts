import {InConnection} from "./InConnection";
import {ServerModel} from "./ServerModel";
import {ServerEntity} from "./ServerEntity";
import {OutConnection} from "./OutConnection";
import dao = require('./EntityDao');

export class ServerEngine {

    remoteServers: {key: string, any}[];
    inConnections : InConnection[] = [];
    outConnections : OutConnection[] = [];
    model: ServerModel = new ServerModel();
    coreEntity: ServerEntity;

    constructor(remoteServers: {key: string, any}[]) {
        this.remoteServers = remoteServers;

        dao.getEntity('0').then((loadedEntity : ServerEntity) => {
            if (!loadedEntity) {
                this.coreEntity = new ServerEntity();
                this.coreEntity.core = true;
                this.coreEntity.id = '' + 0;
                this.coreEntity.dynamic = false;
                this.coreEntity.repo = 'default';
                this.coreEntity.type = 'water-world-core';
                dao.insertEntity(this.coreEntity);

                var skyEntity = new ServerEntity();
                skyEntity.id = '' + 1;
                skyEntity.dynamic = false;
                skyEntity.repo = 'default';
                skyEntity.type = 'water-world-sky';
                dao.insertEntity(skyEntity);
            } else {
                this.coreEntity = loadedEntity;
            }
            this.initialize();
        }).catch((error: Error) => {
            console.error(error);
        });

    }

    initialize() {
        dao.getEntities().then((loadedEntities : ServerEntity[]) => {
            console.log("loaded " + loadedEntities.length + " from database.");
            for (var loadedEntity of loadedEntities) {
                this.model.idRegister.reserveId(loadedEntity.id);
                this.model.put(loadedEntity);
            }
            this.coreEntity = this.model.entities['0'];

            for (var remoteServer of this.remoteServers) {
                this.outConnections.push(new OutConnection(remoteServer['url'], remoteServer['x'], remoteServer['y'], remoteServer['z'], this));
            }

            this.model.onAdd = (entity: ServerEntity) => {
                for (var inConnection of this.inConnections) {
                    inConnection.send(entity);
                };
                for (var outConnection of this.outConnections) {
                    if (!entity.external) { // Send to other servers only objects which belong to this server
                        outConnection.send(entity);
                    }
                };
                if (!entity.external && entity.dynamic === false) {
                    dao.insertEntity(entity);
                }
            }
            this.model.onUpdate = (entity: ServerEntity) => {
                for (var inConnection of this.inConnections) {
                    inConnection.send(entity);
                };
                for (var outConnection of this.outConnections) {
                    if (!entity.external) { // Send to other servers only objects which belong to this server
                        outConnection.send(entity);
                    }
                };
                if (!entity.external && entity.dynamic === false) {
                    dao.updateEntity(entity);
                }
            }
            this.model.onRemove = (entity: ServerEntity) => {
                for (var inConnection of this.inConnections) {
                    inConnection.send(entity);
                };
                for (var outConnection of this.outConnections) {
                    if (!entity.external) { // Send to other servers only objects which belong to this server
                        outConnection.send(entity);
                    }
                };
                if (!entity.external && entity.dynamic === false) {
                    dao.removeEntity(entity.id);
                }
            }
        }).catch((error: Error) => {
            console.error(error);
        });
    }

    loop() {
        var time:number = new Date().getTime();
        for (var inConnection of this.inConnections) {
            if (time - inConnection.receivedTime > 5000) {
                inConnection.disconnect();
                this.inConnections.splice(this.inConnections.indexOf(inConnection), 1);
            }
            if (inConnection.remoteIsServer) {
                inConnection.send(this.coreEntity);
            }
        }
        for (var outConnection of this.outConnections) {
            if (outConnection.disconnected()) {
                outConnection.connect();
            } else {
                if (time - outConnection.receivedTime > 5000) {
                    outConnection.disconnect();
                }
            }
            outConnection.send(this.coreEntity);
        }
        //console.log('in:' + this.inConnections.length + " out: " + this.outConnections.length);
    }

    hasRole(role: string, userId: string): boolean {
        var core: ServerEntity = this.model.entities[0];
        if (!userId) {
            return false;
        }
        if (!core || !core.core) {
            console.log('Error. Role check failed due to core not available. Role: ' + role + ' User ID: ' + userId);
            return false;
        }
        if (role == 'admin') {
            if (!core.roleMembers['admin']) {
                console.log('Server not secure as no admins defined. User ID granted temporary admin role: ' + userId);
                return true;
            }
            for (var candidateUserId of core.roleMembers['admin']) {
                if (candidateUserId == userId) {
                    return true;
                }
            }
            return false;
        }
        if (role == 'member') {
            if (!core.roleMembers['member']) {
                return false;
            }
            for (var candidateUserId of core.roleMembers['member']) {
                if (candidateUserId == userId) {
                    return true;
                }
            }
            return false;
        }
        return false;
    }

}