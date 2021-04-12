import React, { useEffect, useState } from "react";
import PubSub from "pubsub-js";
import hitpointIcon from "../../../../assets/images/gui/hud/hitpoint-icon.png";
import hitpointCounter from "../../../../assets/images/gui/hud/hitpoint-counter.png";
import energyIcon from "../../../../assets/images/gui/hud/energy-icon.png";
import energyCounter from "../../../../assets/images/gui/hud/energy-counter.png";
import emptyCounter from "../../../../assets/images/gui/hud/empty-counter.png";
import "./Meters.scss";
import {
    HITPOINTS_VALUE, MAX_HITPOINTS_VALUE, ENERGY_VALUE, MAX_ENERGY_VALUE,
} from "../../../../shared/EventTypes";
import { GUIState } from "../../../../shared/state/States";
import Utils from "../../../../shared/Utils";
import inventoryIcon from "../../../../assets/images/gui/hud/inventory-icon.png";
import PanelButton from "../panel_button/PanelButton";
import Panels from "../panels/PanelsEnum";

// How many of the little circle counters to show on each meter bar.
const maxCounters = 20;

function Counters({ stat, maxStat, counterImage }) {
    // The value might be in 0.5s as well as whole numbers, so round down to only count each full counter.
    stat = Math.floor(stat);
    // Get the % of the stat this player has. i.e.
    const filledCount = Math.floor((stat / maxStat) * maxCounters);
    // Add some counters, up to the max amount, and show them filled in
    // if they are within the amount of HP/energy that the player has.
    return Array.from({ length: maxCounters }, (v, i) => {
        if (i < filledCount) {
            return <img key={i} src={counterImage} draggable={false} className="meter-counter" />;
        }
        return <img key={i} src={emptyCounter} draggable={false} className="meter-counter" />;
    });
}

const Tooltip = (content) => (
    <div style={{ width: "500px" }}>{content}</div>
);

function Meters() {
    const [hitPoints, setHitPoints] = useState(0);
    const [maxHitPoints, setMaxHitPoints] = useState(0);

    const [energy, setEnergy] = useState(0);
    const [maxEnergy, setMaxEnergy] = useState(0);

    useEffect(() => {
        const subs = [
            PubSub.subscribe(HITPOINTS_VALUE, (msg, data) => {
                setHitPoints(data.new);
            }),
            PubSub.subscribe(MAX_HITPOINTS_VALUE, (msg, data) => {
                setMaxHitPoints(data.new);
            }),
            PubSub.subscribe(ENERGY_VALUE, (msg, data) => {
                setEnergy(data.new);
            }),
            PubSub.subscribe(MAX_ENERGY_VALUE, (msg, data) => {
                setMaxEnergy(data.new);
            }),
        ];

        // Cleanup.
        return () => {
            subs.forEach((sub) => {
                PubSub.unsubscribe(sub);
            });
        };
    }, []);

    return (
        <div className="meters gui-scalable">
            <div className="inventory-button">
                <PanelButton
                  icon={inventoryIcon}
                  onClick={() => {
                      GUIState.setActivePanel(Panels.Inventory);
                  }}
                  tooltipText={`${Utils.getTextDef("Inventory tooltip")} ( C, I, right-click, spacebar )`}
                />
            </div>
            <div className="meter">
                <img
                  className="gui-icon"
                  src={hitpointIcon}
                  draggable={false}
                  onMouseEnter={() => {
                      GUIState.setTooltipContent(
                          Tooltip(Utils.getTextDef("Hitpoint tooltip")),
                      );
                  }}
                  onMouseLeave={() => {
                      GUIState.setTooltipContent(null);
                  }}
                />
                <div>
                    <Counters
                      stat={hitPoints}
                      maxStat={maxHitPoints}
                      counterImage={hitpointCounter}
                    />
                </div>
            </div>
            <div className="meter">
                <img
                  className="gui-icon"
                  src={energyIcon}
                  draggable={false}
                  onMouseEnter={() => {
                      GUIState.setTooltipContent(
                          Tooltip(Utils.getTextDef("Energy tooltip")),
                      );
                  }}
                  onMouseLeave={() => {
                      GUIState.setTooltipContent(null);
                  }}
                />
                <div id="energy-counters">
                    <Counters
                      stat={energy}
                      maxStat={maxEnergy}
                      counterImage={energyCounter}
                    />
                </div>
            </div>
        </div>
    );
}

export default Meters;
