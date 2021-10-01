const Projectile = require("./Projectile");
const Character = require("../characters/Character");
const MagicEffects = require("../../../../../gameplay/MagicEffects");

class ProjPacify extends Projectile {
    handleCollision(collidee) {
        // Check any of the conditions that should always be checked.
        super.mandatoryCollideeChecks(collidee);

        // If it is a character, apply the pacify effect.
        if (collidee instanceof Character) {
            if (collidee === this.source) return;

            new MagicEffects.Pacify({ character: collidee });

            this.destroy();
        }
    }
}
module.exports = ProjPacify;
