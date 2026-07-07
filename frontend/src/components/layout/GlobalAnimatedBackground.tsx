import { Leaf } from "lucide-react";
import { projectPhotos } from "../../data/visuals";

/**
 * A deliberately lightweight, fixed decorative layer for the product surface.
 * It never receives pointer events and honors reduced-motion preferences.
 */
export function GlobalAnimatedBackground() {
  return (
    <div className="global-animated-background" aria-hidden="true">
      <div className="global-earth-orbit">
        <span className="global-orbit-leaf global-orbit-leaf-a"><Leaf size={15} /></span>
        <span className="global-earth-core"><img src={projectPhotos.earth} alt="" /></span>
        <span className="global-orbit-leaf global-orbit-leaf-b"><Leaf size={13} /></span>
      </div>
    </div>
  );
}
