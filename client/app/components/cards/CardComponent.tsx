import {forwardRef, HTMLAttributes} from "react";
import {Card, CardNames} from "../../../../server/shared/card";

interface CardComponentProps {
  card: Card
}

/**
 * Purely visual rendering of a given card
 */
const CardComponent = forwardRef<HTMLDivElement, CardComponentProps & HTMLAttributes<HTMLDivElement>>(({card, ...props}, ref) => {
  return (
    <div ref={ref} {...props} className={"w-36 h-[200px] rounded-md text-center " + props.className}>
      <img alt={CardNames.get(card)} src={"/cards/" + card + ".png"}/>
    </div>
  )
});

export default CardComponent;