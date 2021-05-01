import Projectile from "./Projectile";

class Entity extends Projectile {
    constructor(x, y, config) {
        super(x, y, config, "proj-noctis-pickaxe");
    }
}
Entity.prototype.spinDuration = 1000;

export default Entity;