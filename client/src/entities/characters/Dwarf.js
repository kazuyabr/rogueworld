import Character from "./Character";

class Entity extends Character {
    constructor(x, y, config){
        super(x, y, config);
        
        this.displayName.setText(dungeonz.getTextDef("Mob name: Dwarf"));
    }
}

Entity.prototype.animationSetName = "dwarf";

export default Entity;