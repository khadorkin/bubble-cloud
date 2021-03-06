import {ClientEntity} from "./ClientEntity";
import {ClientStateListener} from "./ClientStateListener";
import {EditorState} from "./EditorState";

export class ClientState {
    private clientStateListeners: ClientStateListener[] = [];
    private editedEntity: ClientEntity = null;

    hudVisible: boolean = true;
    editorState: EditorState = EditorState.NONE;

    getEditedEntity(): ClientEntity {
        return this.editedEntity;
    }

    setEditedEntity(entity: ClientEntity): void {
        this.editedEntity = entity;
        this.stateChanged();
    }

    stateChanged(): void {
        for (var clientStateListener of this.clientStateListeners) {
            clientStateListener.stateChange();
        }
    }

    addClientStateListener(clientStateListener: ClientStateListener): void {
        this.clientStateListeners.push(clientStateListener);
    }

}
