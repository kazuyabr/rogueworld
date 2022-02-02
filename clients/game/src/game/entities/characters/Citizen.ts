import Mob from "./Mob";

class Entity extends Mob {
    constructor(x: number, y: number, config: any) {
        config.displayName = "Citizen";
        super(x, y, config);
    }
}

Entity.prototype.animationSetName = "human";

export default Entity;
