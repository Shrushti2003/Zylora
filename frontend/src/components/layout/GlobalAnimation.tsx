import { Leaf } from "lucide-react";
import { projectPhotos } from "../../data/visuals";

/** Mounted once at the app root so route transitions never restart it. */
export function GlobalAnimation() {
  return (
    <div className="global-animation" aria-hidden="true">
      <div className="global-animation-orbit">
        <span className="global-animation-leaf global-animation-leaf-a"><Leaf size={16} /></span>
        <span className="global-animation-planet"><img src={projectPhotos.earth} alt="" /></span>
        <span className="global-animation-leaf global-animation-leaf-b"><Leaf size={13} /></span>
      </div>
    </div>
  );
}
