import {forwardRef, HTMLAttributes} from "react";
import {Card, CardNames, CardTooltips} from "../../../../server/shared/card";

interface CardComponentProps {
  card: Card;
  showTooltips: boolean;
}

/**
 * Purely visual rendering of a given card
 */

const CardComponent = forwardRef<HTMLDivElement, CardComponentProps & HTMLAttributes<HTMLDivElement>>(({card, showTooltips, ...props}, ref) => {
  return (
    <div ref={ref} {...props} className={"md:w-36 w-24 rounded-md text-center " + props.className} title={showTooltips ? CardTooltips.get(card) : ""}>
      <img alt={CardNames.get(card)} src={"/cards/" + card + ".png"}/>
    </div>
  )
});

export default CardComponent;